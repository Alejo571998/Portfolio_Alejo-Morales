// Optimiza el modelo 3D de Taku (exportado de Tripo, ~16 MB y ~500k triángulos)
// para la web: simplifica la malla, reduce y convierte texturas a WebP y
// comprime la geometría con meshopt. El arte original no se modifica.
// Uso (desde tools/): npm run taku -- "<origen.glb>" [triángulos] [textura px]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, getSceneVertexCount, VertexCountMethod } from '@gltf-transform/functions';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
const targetTris = Number(process.argv[3] || 36000);
const texSize = Number(process.argv[4] || 1024);
const out = process.argv[5] || path.resolve(here, '..', 'assets', '3d', 'taku.glb');
if (!src) {
  console.error('Falta la ruta del .glb de origen');
  process.exit(1);
}

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);

const countTris = () => {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) tris += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
  return Math.round(tris);
};

const before = countTris();
const ratio = Math.min(1, targetTris / before);

// El material de Tripo trae KHR_materials_volume pensado para render offline;
// en tiempo real solo encarece el shader sin aportar al personaje.
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === 'KHR_materials_volume') ext.dispose();
}

await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [texSize, texSize], quality: 82 }),
  dedup(),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);

fs.mkdirSync(path.dirname(out), { recursive: true });
await io.write(out, doc);
const after = countTris();
console.log(
  `${path.basename(src)}: ${before} → ${after} triángulos, ` +
    `${(fs.statSync(src).size / 1e6).toFixed(1)} MB → ${(fs.statSync(out).size / 1e6).toFixed(2)} MB → ${path.relative(process.cwd(), out)}`,
);
void getSceneVertexCount; void VertexCountMethod;
