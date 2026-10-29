// Genera las imágenes del sitio en assets/media/ (WebP, varios anchos).
// Las fuentes son archivos reales: capturas de los sitios publicados, material
// de los casos de estudio y las ilustraciones originales de Taku.
// Uso (desde tools/): npm run images   ·   npm run images -- <filtro>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const out = path.join(repo, 'assets', 'media');
const img = (f) => path.join(here, 'fuentes', f);   // fuentes originales (no se despliegan)
const cache = (f) => path.join(here, '.cache', f);
const alc = (f) => path.join('C:/Nosotros/Alejo/Diseño UX-UI/A la cancha', f);
const dnd = (f) => path.join('C:/Nosotros/Alejo/Programacion/AppTaku-Dungeons and Dragons/docs/captures', f);
const giftly = (f) => path.join('C:/Nosotros/Alejo/Programacion/AppTaku_Giftly/assets/img', f);
const vitrack = (f) => path.join('C:/Nosotros/Alejo/Programacion/SISTEMA DE GESTIÓN INTEGRAL DE BODEGAS/.playwright-mcp', f);
const rutix = (f) => path.join('C:/Nosotros/Alejo/Programacion/App Rastreo Cadetes/.playwright-mcp', f);

// [nombre, origen, anchos, opciones]
// crop: [left, top, width, height] sobre el original · cutout: quitar el fondo negro · trim: recortar el borde transparente
const manifest = [
  // Apps recientes: capturas que quedaron en cada repositorio al revisar las pantallas
  ['vitrack-panel', vitrack('panel-oscuro-1366.png'), [720, 1352], { crop: [0, 0, 1352, 845] }],
  ['vitrack-vasijas', vitrack('revision-vasijas-1920.png'), [900, 1600], { crop: [0, 0, 1904, 1100] }],
  ['vitrack-movil', vitrack('panel-claro-375.png'), [384], { crop: [0, 0, 384, 830] }],
  ['rutix-reparto', rutix('capturas-etapa3/page-2026-10-22T20-29-49-388Z.jpeg'), [720, 1266], { crop: [0, 0, 1266, 791] }],
  ['rutix-pedido', rutix('capturas-etapa2/rutix-oscuro-detalle.png'), [900, 1264], { crop: [0, 0, 1264, 790] }],
  ['rutix-seguimiento', rutix('capturas-etapa3/page-2026-10-22T20-26-27-123Z.jpeg'), [390], { crop: [0, 0, 390, 740] }],
  // Caso Zonaprop (slides del caso, renderizados desde el PDF exportado)
  ['zonaprop-wireflow', cache('zh-036.png'), [900, 1600], { crop: [66, 147, 1668, 760] }],
  ['zonaprop-tree-test', cache('zh-030.png'), [700, 1200], { crop: [18, 240, 1247, 532] }],
  // Caso A la Cancha
  ['alacancha-boceto', alc('Wireframe a mano/1.jpeg'), [320, 560], {}],
  ['alacancha-lowfi', alc('wireframe en baja/Home wireframe baja.png'), [320], {}],
  ['alacancha-midfi', alc('Wireframe en baja con patrones de diseño/1 a.png'), [320], {}],
  ['alacancha-hifi', alc('Sin título.png'), [320], { crop: [494, 146, 262, 532] }],
  ['alacancha-storyboard', alc('Storyboard.png'), [800, 1400], {}],
  // Caso TAKU D&D (capturas del propio repositorio)
  ['dnd-modo-juego', dnd('desktop-07-modo-juego.png'), [900, 1440], {}],
  ['dnd-modo-juego-movil', dnd('mobile-07-modo-juego.png'), [360, 600], { crop: [0, 0, 1082, 2202] }],
  ['dnd-subir-nivel', dnd('desktop-15-subir-de-nivel.png'), [900, 1440], {}],
  // Takuverso — ilustraciones originales de cada app
  ['taku-hola', img('Taku-tramiteclaro.png'), [360, 720], { cutout: true }],
  ['taku-organiza', img('Taku-organiza.png'), [240, 480], { cutout: true }],
  ['taku-dnd', img('Taku-D&D.png'), [240, 480], { cutout: true }],
  ['taku-gastro', img('Taku-Gastro.png'), [240, 480], { cutout: true }],
  ['taku-tramite', img('taku-.png'), [240, 480], { cutout: true }],
  ['taku-giftly', giftly('Taku-Giftly.png'), [240, 480], { cutout: true }],
  // Capturas actuales de los sitios publicados (Playwright, 1440×900)
  ['web-amordidas', cache('live-amordidas-d.png'), [640, 1200], {}],
  ['web-boda', cache('live-boda-d.png'), [640, 1200], {}],
  ['web-forza', cache('live-forza-d.png'), [640, 1200], {}],
  ['web-lacava', cache('live-lacava-d.png'), [640, 1200], {}],
  ['web-elmentaa', cache('live-elmentaa-d.png'), [640, 1200], {}],
  ['web-mentatools', cache('live-mentatools-d.png'), [640, 1200], {}],
  ['web-akoncagua', cache('live-akoncagua-d.png'), [640, 1200], {}],
  // Capturas de las apps del Takuverso publicadas (Playwright, 1440×900)
  ['app-organiza', cache('live-organiza-d.png'), [640, 1200], {}],
  ['app-dnd', cache('live-dnd-d.png'), [640, 1200], {}],
  ['app-gastro', cache('live-gastro-d.png'), [640, 1200], {}],
  ['app-tramite', cache('live-tramite-d.png'), [640, 1200], {}],
  ['app-giftly', cache('live-giftly-d.png'), [640, 1200], {}],
  // Formación
  ['cert-frontend', img('Diploma_FronEndAM.png'), [480, 1400], {}],
  ['cert-uxui', img('Diploma_UXUIAM.png'), [480, 1400], {}],
  ['cert-uxui-avanzado', img('Diploma_UXUIAvanzadoAM.png'), [480, 1400], {}],
  ['cert-ux-research', img('Diploma_UXResearchAM.jpg'), [480, 1400], {}],
  ['cert-ux-writing', img('Certificado Ux Writer Alejo Morales_page-0001.jpg'), [480, 1400], {}],
  // Retrato
  ['alejo', img('retrato-hero.png'), [360, 720, 1080], { trim: true }],
  // Logo de Alejo (marca del nav): parte del logo sin fondo que genera npm run favicon
  ['logo-am', img('logo-am-transparente.png'), [96, 192], { trim: true }],
];

// Quita el fondo negro de las ilustraciones de Taku: relleno por inundación
// desde los bordes sobre píxeles casi negros, con borde suave. El contorno
// verde del personaje hace de barrera, así que el interior queda intacto.
async function cutout(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    const i = p * 4;
    if (data[i + 3] < 8 || lum(i) < 34) { seen[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p - x) / w;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (seen[p]) { data[i + 3] = 0; continue; }
    // Suavizado: píxeles oscuros pegados al fondo se vuelven semitransparentes
    const x = p % w, y = (p - x) / w;
    const nearBg = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
    if (nearBg) data[i + 3] = Math.min(data[i + 3], Math.round(Math.min(1, lum(i) / 60) * 255));
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 0 }).png().toBuffer();
}

const filter = process.argv[2];
fs.mkdirSync(out, { recursive: true });
let total = 0;
for (const [name, src, widths, opt] of manifest) {
  if (filter && !name.includes(filter)) continue;
  if (!fs.existsSync(src)) { console.warn(`falta: ${src}`); continue; }
  let base = opt.cutout ? await cutout(src) : fs.readFileSync(src);
  if (opt.trim) base = await sharp(base).trim({ threshold: 0 }).png().toBuffer();
  if (opt.crop) {
    const [left, top, width, height] = opt.crop;
    base = await sharp(base).extract({ left, top, width, height }).toBuffer();
  }
  const meta = await sharp(base).metadata();
  for (const wdt of widths) {
    const file = path.join(out, `${name}-${wdt}.webp`);
    await sharp(base)
      .resize({ width: Math.min(wdt, meta.width), withoutEnlargement: true })
      .webp({ quality: opt.cutout || opt.trim ? 84 : 78, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toFile(file);
    total += fs.statSync(file).size;
  }
  const ratio = (meta.height / meta.width).toFixed(4);
  console.log(`${name.padEnd(24)} ${meta.width}×${meta.height} (h/w ${ratio}) → ${widths.join(', ')}`);
}
console.log(`Total: ${(total / 1024).toFixed(0)} KB en ${path.relative(repo, out)}`);
