# ============================================================
# Mixamo → GLB: une las animaciones descargadas de Mixamo en un solo modelo.
#
# Entrada: una carpeta con idle.fbx, walk.fbx y greet.fbx (o saludo.fbx),
# descargados de Mixamo como "FBX Binary", "With Skin". El primero aporta la
# malla y el esqueleto; de los demás solo se toma la animación.
# Salida: un .glb con los clips "idle", "walk" y "greet" (los nombres que
# busca js/gl/taku-world.js), Taku de 1 unidad de alto y con los pies en el suelo.
#
# Uso (lo llama tools/mixamo-taku.mjs):
#   blender -b -P mixamo-taku.py -- --carpeta <dir> --salida <archivo.glb> [--material base.glb]
# ============================================================
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


CARPETA = arg('--carpeta')
SALIDA = arg('--salida')
MATERIAL = arg('--material')   # .glb del que se copia el material si Mixamo no devolvió texturas
CLIPS = [('idle', ('idle', 'reposo')), ('walk', ('walk', 'caminata', 'camina')), ('greet', ('greet', 'saludo', 'wave'))]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30


def import_fbx(path):
    before = set(bpy.data.objects)
    try:
        bpy.ops.import_scene.fbx(filepath=path, use_anim=True, automatic_bone_orientation=False, ignore_leaf_bones=True)
    except (AttributeError, RuntimeError):
        bpy.ops.wm.fbx_import(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def find_file(names):
    for f in sorted(os.listdir(CARPETA)):
        stem, ext = os.path.splitext(f)
        if ext.lower() == '.fbx' and stem.lower() in names:
            return os.path.join(CARPETA, f)
    return None


def fcurves_of(action):
    """Curvas de una acción: API clásica o la de capas y slots (Blender 4.4+)."""
    try:
        return list(action.fcurves)
    except AttributeError:
        curves = []
        for layer in action.layers:
            for strip in layer.strips:
                for slot in action.slots:
                    bag = strip.channelbag(slot)
                    if bag:
                        curves.extend(bag.fcurves)
        return curves


def strip_root_motion(action, bone):
    """Si la caminata no se bajó "In Place", saca el avance horizontal de la cadera (deja el balanceo)."""
    for fc in fcurves_of(action):
        if fc.data_path != f'pose.bones["{bone}"].location' or len(fc.keyframe_points) < 2:
            continue
        kps = fc.keyframe_points
        first, last = kps[0].co, kps[-1].co
        drift = last[1] - first[1]
        span = max(1e-6, last[0] - first[0])
        if abs(drift) < 1e-3:
            continue
        # el eje vertical rebota y vuelve; los horizontales avanzan: se quita la tendencia lineal
        for kp in kps:
            delta = drift * (kp.co[0] - first[0]) / span
            kp.co[1] -= delta
            kp.handle_left[1] -= delta
            kp.handle_right[1] -= delta
        fc.update()


armature = None
meshes = []
tracks_done = []
for clip, names in CLIPS:
    path = find_file(names)
    if not path:
        print(f'FALTA {clip}: no encontré {"/".join(n + ".fbx" for n in names)} en {CARPETA}')
        continue
    new = import_fbx(path)
    arm = next((o for o in new if o.type == 'ARMATURE'), None)
    if arm is None or arm.animation_data is None or arm.animation_data.action is None:
        print(f'SIN ANIMACIÓN en {path}')
        for o in new:
            bpy.data.objects.remove(o, do_unlink=True)
        continue
    action = arm.animation_data.action
    action.name = clip
    action.use_fake_user = True
    if armature is None:
        armature = arm
        meshes = [o for o in new if o.type == 'MESH']
    else:
        for o in new:
            bpy.data.objects.remove(o, do_unlink=True)
    hips = next((b.name for b in armature.data.bones if b.name.lower().endswith('hips')), None)
    if clip == 'walk' and hips:
        strip_root_motion(action, hips)
    ad = armature.animation_data or armature.animation_data_create()
    track = ad.nla_tracks.new()
    track.name = clip
    start = int(action.frame_range[0])
    strip = track.strips.new(clip, start, action)
    try:
        strip.action_slot = action.slots[0]
    except (AttributeError, IndexError):
        pass
    tracks_done.append(clip)

if armature is None:
    raise SystemExit('No se pudo armar el modelo: faltan los FBX de Mixamo.')
armature.animation_data.action = None

# Material: si Mixamo no devolvió la textura, se copia la del modelo base
if MATERIAL and not any(n.type == 'TEX_IMAGE' and n.image for m in meshes for s in m.material_slots if s.material and s.material.node_tree for n in s.material.node_tree.nodes):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=MATERIAL)
    donor = next(o for o in bpy.data.objects if o not in before and o.type == 'MESH')
    mat = donor.material_slots[0].material
    for m in meshes:
        m.data.materials.clear()
        m.data.materials.append(mat)
    for o in [o for o in bpy.data.objects if o not in before]:
        bpy.data.objects.remove(o, do_unlink=True)
    print('Material copiado del modelo base')

# Medidas en la pose de reposo
armature.data.pose_position = 'REST'
bpy.context.view_layer.update()
pts = [m.matrix_world @ Vector(c) for m in meshes for c in m.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))

# Cabeza rígida: los pesos automáticos de Mixamo atan parte de las hojas al brazo y al
# levantarlo la cabeza se estira. Arriba del cuello (44,5 % de la altura) todo va al hueso
# de la cabeza, con una transición corta en el cuello para que no quede costura.
head_bone = next((b.name for b in armature.data.bones if b.name.lower().endswith('head') and 'top' not in b.name.lower()), None)
if head_bone:
    height = max(1e-6, hi.z - lo.z)
    fixed = 0
    for m in meshes:
        vg_head = m.vertex_groups.get(head_bone) or m.vertex_groups.new(name=head_bone)
        names = {g.index: g for g in m.vertex_groups}
        mw = m.matrix_world
        for v in m.data.vertices:
            zn = ((mw @ v.co).z - lo.z) / height
            t = min(1.0, max(0.0, (zn - 0.42) / 0.03))
            t = t * t * (3 - 2 * t)
            if t <= 0:
                continue
            head_w = 0.0
            for g in v.groups:
                if g.group == vg_head.index:
                    head_w = g.weight
                    continue
                names[g.group].add([v.index], g.weight * (1 - t), 'REPLACE')
            vg_head.add([v.index], head_w * (1 - t) + t, 'REPLACE')
            fixed += 1
    print(f'Cabeza rígida: {fixed} vértices a {head_bone}')

# Taku de 1 unidad de alto, centrado y con los pies en el suelo
k = 1.0 / max(1e-6, hi.z - lo.z)
armature.scale = armature.scale * k
armature.location = (armature.location - Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))) * k
armature.data.pose_position = 'POSE'

for o in scene.objects:
    o.select_set(o == armature or o in meshes)
bpy.context.view_layer.objects.active = armature
bpy.ops.export_scene.gltf(
    filepath=SALIDA, export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
    export_yup=True, export_force_sampling=True, export_def_bones=True,
)
print('EXPORTADO', SALIDA, 'clips:', ', '.join(tracks_done))
