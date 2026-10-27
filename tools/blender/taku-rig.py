# ============================================================
# Rig procedural de Taku: esqueleto, pesos y tres animaciones.
#
# Entrada: un .glb de Taku sin esqueleto (simplificado por tools/taku-rig.mjs).
# Salida:  el mismo modelo con esqueleto y los clips "idle", "walk" y "greet",
#          que js/gl/taku-world.js reproduce con AnimationMixer.
#
# Las articulaciones salen de medir la malla (Taku mide 1 unidad, mira a -Y,
# brazos en A): entrepierna z≈0,18, caderas x=±0,075, tobillos z≈0,10,
# hombros x≈0,115 z≈0,38, codos x≈0,205, base de la cabeza z≈0,43.
# La cabeza de hojas es rígida: todo lo que está arriba del cuello va 100 % al hueso "head".
#
# Uso (lo llama tools/taku-rig.mjs):
#   blender -b -P taku-rig.py -- --entrada base.glb --salida rig.glb [--poses dir] [--fbx mixamo.fbx]
# ============================================================
import math
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


ENTRADA = arg('--entrada')
SALIDA = arg('--salida')
POSES = arg('--poses')          # carpeta: renderiza poses de prueba para revisar la deformación
FBX = arg('--fbx')              # opcional: exporta la malla sin rig para subir a Mixamo
FBX_CLIPS = arg('--fbx-clips')  # opcional (pruebas): un FBX por clip, como los que devuelve Mixamo
FPS = 30

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS

bpy.ops.import_scene.gltf(filepath=ENTRADA)
mesh_ob = [o for o in scene.objects if o.type == 'MESH'][0]
mesh_ob.name = 'taku'
# Aplica cualquier transformación de la importación: la malla queda en coordenadas de mundo
bpy.context.view_layer.objects.active = mesh_ob
for o in scene.objects:
    o.select_set(o == mesh_ob)
mesh_ob.parent = None
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(scene.objects):
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o)

if FBX:
    bpy.ops.export_scene.fbx(filepath=FBX, use_selection=True, path_mode='COPY', embed_textures=True, axis_forward='-Z', axis_up='Y')

# ---------- Esqueleto ----------
# (cabeza, cola, padre) en coordenadas de Blender: x = izquierda de Taku, -y = frente, z = arriba
BONES = {
    'root':        ((0, 0.0, 0.0), (0, 0.0, 0.08), None),
    'hips':        ((0, -0.03, 0.20), (0, -0.03, 0.27), 'root'),
    'spine':       ((0, -0.03, 0.27), (0, -0.03, 0.34), 'hips'),
    'chest':       ((0, -0.03, 0.34), (0, -0.02, 0.41), 'spine'),
    'neck':        ((0, -0.02, 0.41), (0, -0.01, 0.45), 'chest'),
    'head':        ((0, -0.01, 0.45), (0, 0.0, 0.95), 'neck'),
}
SIDE = {
    'shoulder': ((0.03, -0.04, 0.39), (0.115, -0.045, 0.375), 'chest'),
    'upperarm': ((0.115, -0.045, 0.375), (0.205, -0.07, 0.338), 'shoulder'),
    'forearm':  ((0.205, -0.07, 0.338), (0.265, -0.085, 0.315), 'upperarm'),
    'hand':     ((0.265, -0.085, 0.315), (0.345, -0.085, 0.31), 'forearm'),
    'thigh':    ((0.075, -0.035, 0.21), (0.095, -0.045, 0.155), 'hips'),
    'shin':     ((0.095, -0.045, 0.155), (0.115, -0.055, 0.10), 'thigh'),
    'foot':     ((0.115, -0.055, 0.10), (0.135, -0.13, 0.035), 'shin'),
    'toe':      ((0.135, -0.13, 0.035), (0.14, -0.2, 0.03), 'foot'),
}
for name, (h, t, parent) in SIDE.items():
    for suffix, sx in (('.L', 1), ('.R', -1)):
        p = parent if parent in ('chest', 'hips') else parent + suffix
        BONES[name + suffix] = ((h[0] * sx, h[1], h[2]), (t[0] * sx, t[1], t[2]), p)

arm_data = bpy.data.armatures.new('esqueleto')
arm_ob = bpy.data.objects.new('esqueleto', arm_data)
scene.collection.objects.link(arm_ob)
bpy.context.view_layer.objects.active = arm_ob
for o in scene.objects:
    o.select_set(o == arm_ob)
bpy.ops.object.mode_set(mode='EDIT')
for name, (h, t, parent) in BONES.items():
    eb = arm_data.edit_bones.new(name)
    eb.head = Vector(h)
    eb.tail = Vector(t)
    eb.roll = 0.0
for name, (h, t, parent) in BONES.items():
    if parent:
        eb = arm_data.edit_bones[name]
        eb.parent = arm_data.edit_bones[parent]
        eb.use_connect = (Vector(arm_data.edit_bones[parent].tail) - Vector(h)).length < 1e-4
arm_data.edit_bones['root'].use_deform = False
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- Pesos ----------
# Distancia a cada segmento de hueso, con regiones que evitan que una pierna
# mueva la otra o que el brazo arrastre el costado del buzo.
me = mesh_ob.data
n = len(me.vertices)
co = np.empty(n * 3, np.float32)
me.vertices.foreach_get('co', co)
co = co.reshape(-1, 3).astype(np.float64)
X, Y, Z = co[:, 0], co[:, 1], co[:, 2]


def seg_dist(name):
    h, t, _ = BONES[name]
    a, b = np.array(h), np.array(t)
    ab = b - a
    tt = np.clip(((co - a) @ ab) / (ab @ ab), 0, 1)
    p = a + tt[:, None] * ab
    return np.linalg.norm(co - p, axis=1)


deform = [b for b in BONES if b != 'root']
D = np.stack([seg_dist(b) for b in deform], 1)
W = 1.0 / np.maximum(D, 0.004) ** 4

idx = {b: i for i, b in enumerate(deform)}
left, right = X > 0.0, X < 0.0
head_zone = Z > 0.445
legs = Z < 0.19
arm_zone_l = (X > 0.125) & (Z > 0.25) & (Z < 0.44)
arm_zone_r = (X < -0.125) & (Z > 0.25) & (Z < 0.44)
for b, i in idx.items():
    if b.endswith('.L'):
        W[right & (np.abs(X) > 0.02), i] = 0
    if b.endswith('.R'):
        W[left & (np.abs(X) > 0.02), i] = 0
    leg_bone = b.split('.')[0] in ('thigh', 'shin', 'foot', 'toe')
    arm_bone = b.split('.')[0] in ('upperarm', 'forearm', 'hand')
    if leg_bone:
        W[Z > 0.24, i] = 0                         # las piernas no tocan el buzo
    if arm_bone:
        W[~(arm_zone_l | arm_zone_r) & (np.abs(X) < 0.13), i] *= 0.15
    if b == 'head':
        W[Z < 0.405, i] = 0
# Cabeza rígida (hojas y cara)
W[head_zone] = 0
W[head_zone, idx['head']] = 1
# Debajo de la entrepierna, solo piernas
for b, i in idx.items():
    if b.split('.')[0] not in ('thigh', 'shin', 'foot', 'toe'):
        W[legs & (Z < 0.165), i] = 0
# Brazos lejos del torso: solo su cadena
for zone, side in ((arm_zone_l & (X > 0.16), '.L'), (arm_zone_r & (X < -0.16), '.R')):
    keep = [idx[f'{p}{side}'] for p in ('upperarm', 'forearm', 'hand')]
    mask = np.zeros(W.shape[1], bool)
    mask[keep] = True
    W[np.ix_(zone, ~mask)] = 0

# Normaliza y se queda con las 4 influencias mayores (lo que admite glTF por defecto)
order = np.argsort(-W, axis=1)[:, :4]
top = np.take_along_axis(W, order, 1)
top = top / np.maximum(top.sum(1, keepdims=True), 1e-9)

groups = {b: mesh_ob.vertex_groups.new(name=b) for b in deform}
for k in range(4):
    for i, b in enumerate(deform):
        sel = np.where((order[:, k] == i) & (top[:, k] > 0.002))[0]
        for v in sel:
            groups[b].add([int(v)], float(top[v, k]), 'REPLACE')

mod = mesh_ob.modifiers.new('esqueleto', 'ARMATURE')
mod.object = arm_ob
mesh_ob.parent = arm_ob

# ---------- Animaciones ----------
pose = arm_ob.pose
rest = {b.name: b.matrix_local.to_3x3() for b in arm_data.bones}


def q(bone, axis, deg):
    """Rotación alrededor de un eje del mundo (en reposo), expresada en el espacio del hueso."""
    m = rest[bone]
    r = Quaternion(Vector(axis), math.radians(deg)).to_matrix()
    return (m.inverted() @ r @ m).to_quaternion()


def qmul(*qs):
    out = Quaternion()
    for x in qs:
        out = out @ x
    return out


def key_pose(frame, rots, locs=None):
    for pb in pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = rots.get(pb.name, Quaternion())
        pb.location = (locs or {}).get(pb.name, Vector())
        pb.keyframe_insert('rotation_quaternion', frame=frame)
        pb.keyframe_insert('location', frame=frame)


def new_action(name):
    act = bpy.data.actions.new(name)
    if arm_ob.animation_data is None:
        arm_ob.animation_data_create()
    arm_ob.animation_data.action = act
    return act


X_AX, Y_AX, Z_AX = (1, 0, 0), (0, 1, 0), (0, 0, 1)
S = {'.L': 1, '.R': -1}


def walk_pose(ph):
    """ph en [0, 1): 0 = pie izquierdo adelante (contacto)."""
    a = 2 * math.pi * ph
    s = math.sin(a + math.pi / 2)          # 1 cuando la pierna izquierda está adelante
    rots, locs = {}, {}
    for side, sign in (('.L', 1), ('.R', -1)):
        fwd = s * sign                      # 1 = esta pierna adelante
        swing = 26 * fwd
        # la rodilla se dobla al pasar la pierna (recogida) y un poco al apoyar
        lift = max(0.0, math.sin(a + (math.pi if sign > 0 else 0)))
        knee = 8 + 42 * lift
        rots['thigh' + side] = q('thigh' + side, X_AX, -swing - 12 * lift)
        rots['shin' + side] = q('shin' + side, X_AX, knee)
        rots['foot' + side] = q('foot' + side, X_AX, -knee * 0.35 + 10 * max(0, -fwd) - 8 * max(0, fwd))
        # brazos al revés de las piernas
        rots['upperarm' + side] = qmul(q('upperarm' + side, X_AX, 26 * fwd), q('upperarm' + side, Y_AX, 12 * sign))
        rots['forearm' + side] = q('forearm' + side, X_AX, -12 - 10 * max(0, -fwd))
    bob = abs(math.cos(a))                  # 1 al apoyar (piernas abiertas), 0 al pasar
    # Con las piernas abiertas la cadera baja, así los dos pies tocan el suelo
    locs['hips'] = Vector((0, -0.014 * bob, 0))  # en espacio del hueso: y = a lo largo (arriba)
    rots['hips'] = qmul(q('hips', Y_AX, 4 * s), q('hips', Z_AX, 7 * s))
    rots['spine'] = q('spine', Z_AX, -5 * s)
    rots['chest'] = qmul(q('chest', Z_AX, -4 * s), q('chest', X_AX, -4))
    rots['head'] = qmul(q('head', Y_AX, -3 * s), q('head', X_AX, 2 * (1 - bob)))
    return rots, locs


def idle_pose(ph):
    a = 2 * math.pi * ph
    br = math.sin(a)
    rots = {
        'hips': q('hips', Y_AX, 1.5 * math.sin(a * 0.5 + 0.3)),
        'spine': q('spine', X_AX, -1.2 * br),
        'chest': q('chest', X_AX, -1.8 * br),
        'neck': q('neck', X_AX, 1.2 * br),
        'head': qmul(q('head', Y_AX, 3.0 * math.sin(a * 0.5)), q('head', X_AX, 1.5 * math.sin(a + 0.8))),
    }
    for side, sign in (('.L', 1), ('.R', -1)):
        rots['upperarm' + side] = q('upperarm' + side, Y_AX, sign * (3 + 2.5 * br))
        rots['forearm' + side] = q('forearm' + side, X_AX, -4 - 2 * br)
        rots['shoulder' + side] = q('shoulder' + side, Y_AX, -sign * 2 * br)
    return rots, {}


def greet_pose(t):
    """t en [0, 1]: levanta la mano derecha, saluda tres veces y vuelve."""
    up = min(1.0, t / 0.22) if t < 0.78 else max(0.0, (1 - t) / 0.22)
    up = up * up * (3 - 2 * up)
    wave = math.sin((t - 0.22) / 0.56 * 3 * 2 * math.pi) if 0.22 <= t <= 0.78 else 0.0
    rots = {
        'upperarm.R': qmul(q('upperarm.R', X_AX, -42 * up), q('upperarm.R', Y_AX, 40 * up)),
        'forearm.R': q('forearm.R', Y_AX, (40 + 28 * wave) * up),
        'hand.R': q('hand.R', Y_AX, 10 * wave * up),
        'shoulder.R': q('shoulder.R', Y_AX, 10 * up),
        'chest': q('chest', Y_AX, 4 * up),
        'head': qmul(q('head', Y_AX, -6 * up), q('head', X_AX, -3 * up)),
        'hips': q('hips', Y_AX, -2 * up),
        'upperarm.L': q('upperarm.L', Y_AX, 3 * up),
    }
    return rots, {}


CLIPS = {
    # nombre: (cuadros, función, cíclico)
    'walk': (20, walk_pose, True),     # 0,67 s por ciclo (dos pasos)
    'idle': (96, idle_pose, True),     # 3,2 s
    'greet': (60, greet_pose, False),  # 2 s
}

if POSES:
    # Poses de prueba para revisar la deformación antes de exportar
    for e in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try:
            scene.render.engine = e
            break
        except TypeError:
            pass
    scene.render.resolution_x, scene.render.resolution_y = 520, 620
    world = bpy.data.worlds.new('w')
    scene.world = world
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.32, 0.33, 0.36, 1)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    scene.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 1.15
    scene.camera = cam
    sun = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN'))
    sun.data.energy = 3
    sun.rotation_euler = (math.radians(50), 0, math.radians(25))
    scene.collection.objects.link(sun)
    tests = [('reposo', {}, {}), ('paso', *walk_pose(0.0)), ('cruce', *walk_pose(0.25)), ('saludo', *greet_pose(0.42))]
    for label, rots, locs in tests:
        for pb in pose.bones:
            pb.rotation_mode = 'QUATERNION'
            pb.rotation_quaternion = rots.get(pb.name, Quaternion())
            pb.location = locs.get(pb.name, Vector())
        bpy.context.view_layer.update()
        for view, d in (('frente', Vector((0, -1, 0))), ('perfil', Vector((1, -0.15, 0)).normalized()), ('mapa', Vector((-0.45, -1, 0.55)).normalized())):
            cam.location = Vector((0, 0, 0.5)) + d * 3
            cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = f'{POSES}/pose-{label}-{view}.png'
            bpy.ops.render.render(write_still=True)

if SALIDA:
    arm_ob.animation_data_create()
    tracks = arm_ob.animation_data.nla_tracks
    for name, (frames, fn, cyclic) in CLIPS.items():
        act = new_action(name)
        for f in range(frames + 1):
            ph = f / frames
            rots, locs = fn(ph if cyclic else min(ph, 1.0))
            key_pose(f, rots, locs)
        track = tracks.new()
        track.name = name
        strip = track.strips.new(name, 0, act)
        try:
            strip.action_slot = act.slots[0]
        except (AttributeError, IndexError):
            pass
        arm_ob.animation_data.action = None
        track.mute = False
    if FBX_CLIPS:
        # Simula las descargas de Mixamo ("With Skin", una animación por archivo) para probar mixamo-taku.py
        for o in scene.objects:
            o.select_set(o in (arm_ob, mesh_ob))
        for track in tracks:
            track.mute = True
        for name in CLIPS:
            arm_ob.animation_data.action = bpy.data.actions[name]
            bpy.ops.export_scene.fbx(filepath=f'{FBX_CLIPS}/{name}.fbx', use_selection=True, bake_anim=True,
                                     bake_anim_use_nla_strips=False, bake_anim_use_all_actions=False,
                                     add_leaf_bones=False, path_mode='COPY', embed_textures=True)
        arm_ob.animation_data.action = None
        for track in tracks:
            track.mute = False
    for pb in pose.bones:
        pb.rotation_quaternion = Quaternion()
        pb.location = Vector()
    bpy.context.view_layer.objects.active = arm_ob
    for o in scene.objects:
        o.select_set(o in (arm_ob, mesh_ob))
    bpy.ops.export_scene.gltf(
        filepath=SALIDA,
        export_format='GLB',
        use_selection=True,
        export_animations=True,
        export_animation_mode='NLA_TRACKS',
        export_skins=True,
        export_all_influences=False,
        export_yup=True,
        export_apply=False,
        export_force_sampling=True,
        export_frame_step=1,
        export_def_bones=True,
    )
    print('EXPORTADO', SALIDA)
