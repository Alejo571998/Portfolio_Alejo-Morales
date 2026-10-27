// ============================================================
// Taku en 3D, caminando por el mapa del Takuverso.
//
// Modelo: assets/3d/taku.glb, el modelo de Tripo con un rig procedural hecho en
// Blender (tools/taku-rig.mjs): 21 huesos y los clips idle, walk y greet, que se
// reproducen con AnimationMixer.
//   · entrada: aparece por el borde y camina hasta la primera parada;
//   · al elegir otra app: sigue el camino punteado hasta esa parada, con el paso
//     ajustado a la velocidad, y al llegar mira al frente y saluda;
//   · en reposo: respira y, con mouse, mira apenas hacia el puntero.
// Si algún día el .glb no trae clips, camina como figura rígida: se balancea a
// cada paso y da un saltito al llegar.
//
// mount(map, { pads, route, start, model }) → { goTo(i), relayout(), destroy() }
//   pads():           centro de cada plataforma en px, relativo al mapa
//   route(desde, a):  puntos en px que siguen el camino entre dos paradas
//   model:            URL de otro .glb (la vista previa de tools/preview lo usa)
// ============================================================
import {
  ACESFilmicToneMapping, AnimationMixer, BackSide, CanvasTexture, Color, DirectionalLight,
  GLTFLoader, Group, HemisphereLight, LoopOnce, MathUtils, Mesh, MeshBasicMaterial, MeshoptDecoder,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, SphereGeometry, SRGBColorSpace,
  Vector3, WebGLRenderer,
} from '../vendor/three.min.js';

const MODEL_URL = new URL('../../assets/3d/taku.glb', import.meta.url).href;
const FOV = 24;                          // grados
const ELEVATION = MathUtils.degToRad(26); // la cámara mira el suelo desde arriba
// Con clips: unidades (alturas de Taku) que avanza el ciclo de caminata por segundo a velocidad 1.
// Las piernas de Taku son cortas; arriba de ~2,4× el paso se vuelve corrida.
const WALK_UNITS_PER_SEC = 0.42;

// Reloj mínimo: delta acotado (sin saltos al volver de otra pestaña) y tiempo acumulado.
function createClock() {
  let last = performance.now();
  return {
    elapsed: 0,
    reset() { last = performance.now(); },
    tick() {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      this.elapsed += dt;
      return dt;
    },
  };
}

// Entorno suave para que los materiales PBR tengan de dónde reflejar
function studioEnvironment(renderer) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.42, '#80889a');
  grad.addColorStop(0.6, '#1e2230');
  grad.addColorStop(1, '#050608');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const envScene = new Scene();
  const sky = new Mesh(new SphereGeometry(5, 32, 16), new MeshBasicMaterial({ map: tex, side: BackSide }));
  envScene.add(sky);
  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.03);
  sky.geometry.dispose(); sky.material.dispose(); tex.dispose(); pmrem.dispose();
  return rt.texture;
}

// Sombra de contacto: un disco difuso bajo los pies, sin mapas de sombra
function contactShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const map = new CanvasTexture(c);
  const mesh = new Mesh(new PlaneGeometry(0.95, 0.62), new MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;
  return mesh;
}

// Diferencia angular más corta, para girar siempre por el lado cercano
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function mount(map, { pads, route, start: initial = 0, model: modelUrl = MODEL_URL }) {
  if (!map || map.dataset.glMounted) return null;
  map.dataset.glMounted = 'true';

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  map.appendChild(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, fine ? 1.75 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.55;
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);

  // Luces: clave neutra, contraluz verde (la luz del Takuverso) y relleno naranja (la del sitio)
  const key = new DirectionalLight(new Color('#fff3e6'), 2.3); key.position.set(1.4, 2.6, 2.4);
  const rim = new DirectionalLight(new Color('#3dff7a'), 2.6); rim.position.set(-2.2, 1.6, -2.0);
  const cool = new DirectionalLight(new Color('#ff8a3d'), 1.1); cool.position.set(2.4, 0.8, -1.8);
  const fill = new HemisphereLight(new Color('#d4dcf0'), new Color('#0c0f14'), 0.7);
  scene.add(key, rim, cool, fill);

  const rig = new Group();   // posición sobre el suelo y rumbo
  const body = new Group();  // balanceo, respiración y saltos
  rig.add(body);
  rig.visible = false;
  scene.add(rig);
  const shadow = contactShadow();
  shadow.visible = false;
  scene.add(shadow);

  // ---------- Encuadre y conversión pantalla → suelo ----------
  let W = 1, H = 1;
  const layout = () => {
    const r = map.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Una unidad (la altura de Taku) mide ~30 % del mapa, con topes para que no tape nada
    const takuPx = MathUtils.clamp(Math.min(H, W) * 0.3, 92, 148);
    const dist = H / (2 * Math.tan(MathUtils.degToRad(FOV) / 2) * takuPx);
    camera.position.set(0, Math.sin(ELEVATION) * dist, Math.cos(ELEVATION) * dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  };
  const ray = new Vector3();
  const toGround = (x, y, out = new Vector3()) => {
    ray.set((x / W) * 2 - 1, -(y / H) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = -camera.position.y / Math.min(ray.y, -1e-4);
    return out.copy(camera.position).addScaledVector(ray, t);
  };
  const padPoint = (i) => { const p = pads()[i]; return toGround(p.x, p.y); };

  // ---------- Clips (solo si el modelo algún día los trae) ----------
  let mixer = null;
  const clips = {};
  let currentClip = null;
  const play = (name) => {
    const next = clips[name];
    if (!next || next === currentClip) return;
    next.reset().setEffectiveWeight(1).play();
    currentClip?.crossFadeTo(next, 0.3, false);
    currentClip = next;
  };
  function setupClips(model, animations) {
    mixer = new AnimationMixer(model);
    const find = (re) => animations.find((a) => re.test(a.name));
    for (const [name, re] of [['idle', /idle|reposo/i], ['walk', /walk|camina/i], ['greet', /greet|wave|saludo/i]]) {
      const clip = find(re);
      if (!clip) continue;
      const action = mixer.clipAction(clip);
      if (name === 'greet') { action.setLoop(LoopOnce, 1); action.clampWhenFinished = false; }
      clips[name] = action;
    }
    if (!clips.idle) clips.idle = mixer.clipAction(animations[0]);
    play('idle');
    mixer.addEventListener('finished', () => play('idle'));
  }
  const animated = () => !!mixer;

  // ---------- Estado de la caminata ----------
  let path = [];            // puntos sobre el suelo
  let seg = 0, along = 0;   // tramo actual y avance dentro del tramo
  let speed = 1, stepLen = 0.3;
  let walking = false, walkBlend = 0, phase = 0, hop = 0;
  let heading = 0, headingTarget = 0, lookX = 0;
  let station = initial, target = initial;
  let entered = false, ready = false;

  const nearestStation = () => {
    let best = station, bestD = Infinity;
    pads().forEach((p, i) => {
      const d = toGround(p.x, p.y).distanceTo(rig.position);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  function walkTo(i, from = walking ? nearestStation() : station) {
    target = i;
    const pts = route(from, i).map((p) => toGround(p.x, p.y));
    if (!pts.length) pts.push(padPoint(i));
    // Si ya venía caminando (o recién entra), arranca desde donde está
    if (walking || pts[0].distanceTo(rig.position) > 0.02) pts.unshift(rig.position.clone());
    if (pts.length < 2) return arrive();
    path = pts; seg = 0; along = 0;
    let total = 0;
    for (let k = 1; k < pts.length; k++) total += pts[k].distanceTo(pts[k - 1]);
    // Viajes largos van un poco más rápido: ninguno dura más de ~3 s
    speed = MathUtils.clamp(total / 2.6, 0.9, 2.4);
    stepLen = 0.24 + speed * 0.06;
    walking = true;
    if (animated()) {
      // Con piernas de verdad camina más tranquilo y el paso sigue a la velocidad
      speed = MathUtils.clamp(total / 3.0, 0.6, 1.3);
      if (clips.walk) clips.walk.timeScale = MathUtils.clamp(speed / WALK_UNITS_PER_SEC, 1, 2.4);
      play('walk');
    }
    start();
  }

  function arrive() {
    walking = false;
    station = target;
    headingTarget = 0;
    if (animated()) play(clips.greet ? 'greet' : 'idle'); else hop = 1;
  }

  function advance(dt) {
    let remaining = speed * dt;
    while (remaining > 0 && seg < path.length - 1) {
      const left = path[seg].distanceTo(path[seg + 1]) - along;
      if (remaining < left) { along += remaining; remaining = 0; } else { remaining -= left; seg++; along = 0; }
    }
    if (seg >= path.length - 1) { rig.position.copy(path[path.length - 1]); arrive(); return; }
    const a = path[seg], b = path[seg + 1];
    rig.position.lerpVectors(a, b, along / Math.max(1e-5, a.distanceTo(b)));
    // Mira unos pasos más adelante: gira suave en las curvas
    const ahead = path[Math.min(seg + 4, path.length - 1)];
    const dx = ahead.x - rig.position.x, dz = ahead.z - rig.position.z;
    if (dx * dx + dz * dz > 1e-6) headingTarget = Math.atan2(dx, dz);
    phase += ((speed * dt) / stepLen) * Math.PI;
  }

  // ---------- Carga del modelo ----------
  map.dataset.glState = 'cargando'; // estado visible para depurar y para tools/check-site.mjs
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(modelUrl, (gltf) => {
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        o.material.envMapIntensity = 1;
        if (o.material.roughness !== undefined) o.material.roughness = Math.max(o.material.roughness, 0.45);
      }
    });
    body.add(gltf.scene);
    if (gltf.animations?.length) setupClips(gltf.scene, gltf.animations);
    ready = true;
    map.dataset.glState = 'listo';
    start();
  }, undefined, (err) => {
    console.warn('[taku-world] no se pudo cargar el modelo', err);
    destroy();
  });

  // ---------- Bucle ----------
  const clock = createClock();
  let visible = false, running = false, raf = 0, shown = false, odd = false;

  const frame = () => {
    raf = 0;
    if (!visible || document.hidden || !ready) { running = false; return; }
    const dt = clock.tick();
    const t = clock.elapsed;

    // Entrada: aparece fuera del mapa, a la altura de la primera parada, y camina hasta ella
    if (!entered) {
      entered = true;
      const p = pads()[station];
      rig.position.copy(toGround(-W * 0.06, p.y));
      heading = headingTarget = Math.PI / 2;
      rig.visible = shadow.visible = true;
      walkTo(station, station);
    }

    if (walking) advance(dt);
    else if (fine) headingTarget = lookX * 0.45;

    walkBlend = MathUtils.damp(walkBlend, walking ? 1 : 0, 9, dt);
    heading += angleDelta(heading, headingTarget) * (1 - Math.exp(-(walking ? 10 : 5) * dt));
    rig.rotation.y = heading;
    hop = Math.max(0, hop - dt * 2.6);
    const hopLift = Math.sin((1 - hop) * Math.PI) * hop * 0.14;

    if (animated()) {
      body.position.y = hopLift;
    } else {
      // Caminata de figura rígida: sube y baja a cada paso, se balancea de lado y se inclina apenas hacia adelante
      const breath = Math.sin(t * 1.7);
      const step = Math.abs(Math.sin(phase));
      body.position.y = step * 0.05 * walkBlend + (0.008 + breath * 0.008) * (1 - walkBlend) + hopLift;
      body.rotation.z = Math.sin(phase) * 0.12 * walkBlend + Math.sin(t * 0.9) * 0.02 * (1 - walkBlend);
      body.rotation.x = 0.08 * walkBlend;
      body.scale.set(1 + breath * 0.005 * (1 - walkBlend), 1 - breath * 0.007 * (1 - walkBlend), 1);
    }
    shadow.position.set(rig.position.x, 0.002, rig.position.z);
    shadow.scale.setScalar(1 - (body.position.y / 0.2) * 0.35);

    mixer?.update(dt);
    // En reposo alcanza con 30 cuadros por segundo
    odd = !odd;
    if (walking || hop > 0 || walkBlend > 0.01 || odd || mixer) renderer.render(scene, camera);
    if (!shown) { shown = true; map.classList.add('is-live'); }
    raf = requestAnimationFrame(frame);
  };
  function start() {
    if (!running && ready && visible) { running = true; clock.reset(); raf = requestAnimationFrame(frame); }
  }

  layout();
  const ro = new ResizeObserver(() => relayout());
  ro.observe(map);
  // Si llegan varios registros juntos (fuera → dentro), vale el último
  const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) start(); }, { threshold: 0.15 });
  io.observe(map);
  const onVisibility = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVisibility);
  const onPointer = (e) => {
    const r = map.getBoundingClientRect();
    lookX = MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
  };
  if (fine) map.addEventListener('pointermove', onPointer, { passive: true });
  const onLeave = () => { lookX = 0; };
  if (fine) map.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); destroy(); });

  function relayout() {
    layout();
    if (!entered) return;
    if (walking) walkTo(target);
    else rig.position.copy(padPoint(station));
    start();
  }

  function destroy() {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    map.removeEventListener('pointermove', onPointer);
    map.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    scene.environment?.dispose();
    renderer.dispose();
    canvas.remove();
    map.classList.remove('is-live');
    delete map.dataset.glMounted;
  }

  return {
    goTo(i) {
      if (!entered) { station = target = i; return; }
      if (i === target && walking) return;
      if (i === station && !walking) { if (!animated()) hop = 1; start(); return; }
      walkTo(i);
    },
    relayout,
    destroy,
  };
}
