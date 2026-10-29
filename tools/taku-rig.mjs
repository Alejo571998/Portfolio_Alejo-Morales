// ============================================================
// Taku con rig procedural (Blender) en tres pasos:
//   1. base:   simplifica el modelo de Tripo (tools/fuentes/taku3d.glb) a ~40 k triángulos, sin comprimir
//   2. rig:    tools/blender/taku-rig.py arma esqueleto, pesos y los clips idle / walk / greet
//   3. web:    texturas WebP 1024, meshopt y animaciones limpias → assets/3d/taku.glb (el que usa el sitio)
//
//   npm run rig                → los tres pasos
//   npm run rig -- --poses     → además renderiza poses de prueba en tools/.cache/rig
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, resample } from '@gltf-transform/functions';
import { findBlender } from './blender/blender.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const work = path.join(here, '.cache', 'rig');
const args = process.argv.slice(2);
const source = path.join(here, 'fuentes', 'taku3d.glb');
const base = path.join(work, 'taku-base.glb');
const rigged = path.join(work, 'taku-rig-blender.glb');
const out = path.join(repo, 'assets', '3d', 'taku.glb');

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
fs.mkdirSync(work, { recursive: true });

// 1. Base: malla simplificada, sin meshopt ni WebP (Blender no los lee bien)
{
  const doc = await io.read(source);
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'KHR_materials_volume') ext.dispose();
  const tris = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, 40000 / tris), error: 0.002, lockBorder: false }),
    textureCompress({ encoder: sharp, targetFormat: 'png', resize: [2048, 2048] }),
    dedup(),
    prune(),
  );
  await io.write(base, doc);
  console.log(`1. base: ${Math.round(tris)} → ~40 000 triángulos`);
}

// 2. Rig en Blender
{
  const extra = [];
  if (args.includes('--poses')) extra.push('--poses', work);
  execFileSync(findBlender(), ['-b', '-P', path.join(here, 'blender', 'taku-rig.py'), '--', '--entrada', base, '--salida', rigged, ...extra], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('2. rig: esqueleto, pesos y clips listos');
}

// 3. Para la web
{
  const doc = await io.read(rigged);
  await doc.transform(
    resample(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  await io.write(out, doc);
  const clips = doc.getRoot().listAnimations().map((a) => a.getName());
  const joints = doc.getRoot().listSkins()[0]?.listJoints().length ?? 0;
  console.log(`3. web: ${path.relative(repo, out)} · ${(fs.statSync(out).size / 1e6).toFixed(2)} MB · ${joints} huesos · clips: ${clips.join(', ')}`);
}
