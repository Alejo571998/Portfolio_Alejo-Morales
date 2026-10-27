// ============================================================
// Taku animado con Tripo: esqueleto automático + animaciones prediseñadas.
//
// La API key se lee de la variable TRIPO_API_KEY o de tools/.env
// (ignorado por git y fuera del deploy). Nunca se imprime.
//
// Pasos (cada uno guarda su resultado en tools/.cache/tripo/estado.json):
//   node tripo-taku.mjs saldo                     → créditos disponibles (gratis)
//   node tripo-taku.mjs chequeo                   → sube el modelo y verifica si se puede riggear (gratis)
//   node tripo-taku.mjs esqueleto --confirmar     → esqueleto automático (25 créditos)
//   node tripo-taku.mjs animaciones --confirmar   → animaciones (10 créditos cada una) y descarga
//   node tripo-taku.mjs armar                     → une clips, optimiza y escribe assets/3d/taku.glb (local)
//
// Opcional: --modelo "<ruta.glb>" para cambiar el modelo de origen.
// Docs: https://developers.tripo3d.ai/en/docs/quick-start
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, resample } from '@gltf-transform/functions';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const work = path.join(here, '.cache', 'tripo');
const stateFile = path.join(work, 'estado.json');
const API = 'https://openapi.tripo3d.ai/v3';

// Animaciones elegidas (rig v1.0-20240301, prefijo preset:biped:)
//  · idle: reposo en loop · walk: caminata por el mapa del Takuverso · greet_01: saludo al llegar
const ANIMATIONS = { idle: 'preset:biped:idle', walk: 'preset:biped:walk', greet: 'preset:biped:greet_01' };
const RIG_MODEL = 'v1.0-20240301';

const args = process.argv.slice(2);
const step = args[0];
const confirmed = args.includes('--confirmar');
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const source = flag('--modelo') || path.join(repo, 'assets', '3d', 'taku3d.glb');

fs.mkdirSync(work, { recursive: true });
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

function apiKey() {
  if (process.env.TRIPO_API_KEY) return process.env.TRIPO_API_KEY.trim();
  const envFile = path.join(here, '.env');
  if (fs.existsSync(envFile)) {
    const line = fs.readFileSync(envFile, 'utf8').split(/\r?\n/).find((l) => l.startsWith('TRIPO_API_KEY='));
    const key = line?.slice('TRIPO_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
    if (key) return key;
  }
  console.error('Falta la API key: pegala en tools/.env, en la línea TRIPO_API_KEY=');
  process.exit(1);
}

async function api(method, route, body, { form } = {}) {
  const headers = { Authorization: `Bearer ${apiKey()}` };
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${route}`, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== 0) {
    const msg = json.message || json.msg || res.statusText;
    throw new Error(`Tripo ${method} ${route} → HTTP ${res.status}, code ${json.code ?? '?'}: ${msg}${json.suggestion ? ` (${json.suggestion})` : ''}`);
  }
  return json.data;
}

async function waitTask(taskId, label) {
  process.stdout.write(`${label}: `);
  for (let i = 0; i < 900; i++) {
    const data = await api('GET', `/tasks/${taskId}`);
    if (data.status === 'success') { process.stdout.write(' listo\n'); return data; }
    if (['failed', 'cancelled', 'banned', 'expired', 'unknown'].includes(data.status)) {
      process.stdout.write('\n');
      throw new Error(`${label} terminó en estado «${data.status}»`);
    }
    process.stdout.write(`${data.progress ?? 0}% `);
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(`${label}: se agotó la espera`);
}

// Las URLs de resultado vencen a los 5 minutos: se descargan apenas termina la tarea
async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

function urlsFrom(output) {
  if (!output) return [];
  const many = output.model_urls ?? output.models;
  if (Array.isArray(many)) return many.map((u) => (typeof u === 'string' ? u : u.url ?? u.model_url));
  if (many && typeof many === 'object') return Object.values(many).map((u) => (typeof u === 'string' ? u : u.url ?? u.model_url));
  return output.model_url ? [output.model_url] : [];
}

const steps = {
  async saldo() {
    const data = await api('GET', '/account/balance');
    console.log('Saldo de Tripo:', JSON.stringify(data));
  },

  async chequeo() {
    if (!fs.existsSync(source)) throw new Error(`No existe el modelo de origen: ${source}`);
    const size = fs.statSync(source).size;
    if (size > 60 * 1024 * 1024) throw new Error('El modelo pesa más de 60 MB: usar la subida con URL prefirmada');
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(source)], { type: 'model/gltf-binary' }), path.basename(source));
    const uploaded = await api('POST', '/files', null, { form });
    state.fileToken = uploaded.file_token;
    state.source = path.relative(repo, source);
    save();
    console.log(`Modelo subido (${(size / 1e6).toFixed(1)} MB).`);

    const { task_id } = await api('POST', '/animations/rig-check', { input: state.fileToken });
    const result = await waitTask(task_id, 'Chequeo de rig');
    state.rigCheck = result.output;
    save();
    console.log(`¿Se puede riggear?: ${result.output?.riggable ? 'sí' : 'no'} · tipo sugerido: ${result.output?.rig_type ?? '—'} · créditos: ${result.credits_consumed ?? 0}`);
    if (!result.output?.riggable) console.log('Tripo no lo considera riggeable: conviene probar con otra pose o regenerar el modelo.');
  },

  async esqueleto() {
    if (!state.fileToken || !state.rigCheck) throw new Error('Primero corré: node tripo-taku.mjs chequeo');
    if (!state.rigCheck.riggable) throw new Error('El chequeo dijo que el modelo no es riggeable');
    if (!confirmed) { console.log('Este paso consume 25 créditos. Volvé a correrlo con --confirmar.'); return; }
    const rigType = state.rigCheck.rig_type || 'biped';
    const { task_id } = await api('POST', '/animations/rig', { input: state.fileToken, model: RIG_MODEL, rig_type: rigType, spec: 'tripo', out_format: 'glb' });
    state.rigTask = task_id;
    save();
    const result = await waitTask(task_id, 'Esqueleto automático');
    const [url] = urlsFrom(result.output);
    if (url) state.rigFile = path.relative(repo, await download(url, path.join(work, 'taku-rig.glb')));
    state.rigCredits = result.credits_consumed;
    save();
    console.log(`Esqueleto listo · créditos: ${result.credits_consumed ?? '?'} · ${state.rigFile ?? 'sin archivo'}`);
  },

  async animaciones() {
    if (!state.rigTask) throw new Error('Primero corré: node tripo-taku.mjs esqueleto --confirmar');
    const names = Object.keys(ANIMATIONS);
    if (!confirmed) { console.log(`Este paso consume ${names.length * 10} créditos (${names.length} animaciones). Volvé a correrlo con --confirmar.`); return; }
    state.clips = {};
    // Una tarea por animación: así cada archivo descargado sabe qué clip trae
    for (const name of names) {
      const { task_id } = await api('POST', '/animations/retarget', { input: state.rigTask, animation: ANIMATIONS[name], out_format: 'glb' });
      const result = await waitTask(task_id, `Animación «${name}»`);
      const [url] = urlsFrom(result.output);
      if (!url) throw new Error(`La animación «${name}» no devolvió archivo`);
      state.clips[name] = path.relative(repo, await download(url, path.join(work, `taku-${name}.glb`)));
      save();
      console.log(`  ${name}: ${result.credits_consumed ?? '?'} créditos`);
    }
  },

  // Une los clips en un solo .glb (el esqueleto es el mismo en todos) y lo optimiza para la web
  async armar() {
    const clips = state.clips || {};
    const names = Object.keys(clips);
    if (!names.length) throw new Error('No hay animaciones descargadas: corré antes el paso «animaciones»');
    await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

    const base = await io.read(path.join(repo, clips[names[0]]));
    const root = base.getRoot();
    const buffer = root.listBuffers()[0];
    const nodesByName = new Map(root.listNodes().map((n) => [n.getName(), n]));
    root.listAnimations().forEach((a) => a.setName(names[0]));

    for (const name of names.slice(1)) {
      const other = await io.read(path.join(repo, clips[name]));
      for (const anim of other.getRoot().listAnimations()) {
        const copy = base.createAnimation(name);
        for (const channel of anim.listChannels()) {
          const target = nodesByName.get(channel.getTargetNode()?.getName());
          if (!target) continue;
          const s = channel.getSampler();
          const clone = (acc) => base.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buffer);
          const sampler = base.createAnimationSampler().setInput(clone(s.getInput())).setOutput(clone(s.getOutput())).setInterpolation(s.getInterpolation());
          copy.addSampler(sampler).addChannel(base.createAnimationChannel().setTargetNode(target).setTargetPath(channel.getTargetPath()).setSampler(sampler));
        }
      }
    }

    let tris = 0;
    for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
    const ratio = Math.min(1, 40000 / tris);
    for (const ext of root.listExtensionsUsed()) if (ext.extensionName === 'KHR_materials_volume') ext.dispose();

    await base.transform(
      resample(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002 }),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
      dedup(),
      prune(),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    );
    const out = path.join(repo, 'assets', '3d', 'taku.glb');
    await io.write(out, base);
    console.log(`taku.glb listo: ${Math.round(tris)} → ~40000 triángulos, clips: ${root.listAnimations().map((a) => a.getName()).join(', ')} · ${(fs.statSync(out).size / 1e6).toFixed(2)} MB`);
  },
};

if (!steps[step]) {
  console.log('Uso: node tripo-taku.mjs <saldo | chequeo | esqueleto --confirmar | animaciones --confirmar | armar>');
  process.exit(1);
}
try {
  await steps[step]();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
