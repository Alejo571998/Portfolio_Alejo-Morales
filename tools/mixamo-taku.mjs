// ============================================================
// Taku animado con Mixamo (gratis, con cuenta de Adobe):
//   1. Subí tools/mixamo/taku-para-mixamo.fbx a https://www.mixamo.com (Upload Character)
//      y marcá mentón, muñecas, codos, rodillas y entrepierna.
//   2. Elegí tres animaciones y descargá cada una como FBX Binary, With Skin, 30 fps:
//        reposo   → tools/mixamo/idle.fbx   (p. ej. "Idle" o "Breathing Idle")
//        caminata → tools/mixamo/walk.fbx   ("Walking", con "In Place" marcado)
//        saludo   → tools/mixamo/greet.fbx  ("Waving")
//   3. npm run mixamo   → tools/.cache/mixamo/taku-mixamo.glb (se compara en tools/preview/taku-rig.html)
// El sitio usa el rig procedural (assets/3d/taku.glb). Se probó Mixamo el 25/10/2026 y quedó
// descartado: el buzo se deforma debajo de los brazos. --publicar escribe assets/3d/taku.glb.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MeshoptEncoder } from 'meshoptimizer';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt, resample } from '@gltf-transform/functions';
import { findBlender } from './blender/blender.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const folder = flag('--carpeta') || path.join(here, 'mixamo');
const work = path.join(here, '.cache', 'mixamo');
const raw = path.join(work, 'taku-mixamo-blender.glb');
const base = path.join(here, '.cache', 'rig', 'taku-base.glb');   // lo genera npm run rig
const out = args.includes('--publicar') ? path.join(repo, 'assets', '3d', 'taku.glb') : (flag('--salida') || path.join(work, 'taku-mixamo.glb'));

if (!fs.existsSync(folder) || !fs.readdirSync(folder).some((f) => f.toLowerCase().endsWith('.fbx') && f !== 'taku-para-mixamo.fbx')) {
  console.error(`No hay FBX de Mixamo en ${path.relative(repo, folder)}. Seguí los pasos del encabezado de este archivo.`);
  process.exit(1);
}
fs.mkdirSync(work, { recursive: true });
const extra = fs.existsSync(base) ? ['--material', base] : [];
execFileSync(findBlender(), ['-b', '-P', path.join(here, 'blender', 'mixamo-taku.py'), '--', '--carpeta', folder, '--salida', raw, ...extra], { stdio: ['ignore', 'inherit', 'inherit'] });

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(raw);
await doc.transform(
  resample(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
  dedup(),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(out, doc);
const clips = doc.getRoot().listAnimations().map((a) => a.getName());
console.log(`${path.relative(repo, out)} · ${(fs.statSync(out).size / 1e6).toFixed(2)} MB · clips: ${clips.join(', ')}`);
