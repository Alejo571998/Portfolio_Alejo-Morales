// ============================================================
// Foto del hero → WebP para la web.
//   npm run hero-foto -- "<foto.png|jpg|webp>" [--foco 0.5,0.66]
//
// La foto es la escena de DESIGN.md: escritorio solitario en una loma con montañas y
// niebla. --foco es el centro del escritorio en la foto (0..1); de ahí sale el recorte
// vertical para celulares y hacia ahí se acerca la cámara al hacer scroll.
//
// La foto puede ser más alta que 16:9 (con cielo de sobra): el CSS la recorta con
// object-position para que el escritorio quede debajo del texto en cada pantalla.
// Salida (assets/media):
//   hero-foto-h-{1280,1920,2560}.webp   la foto entera, para pantallas apaisadas
//   hero-foto-v-{720,1080}.webp         9:16 para celulares, centrada en el escritorio
//   y guarda la fuente en tools/fuentes/hero-foto.<ext>
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const media = path.join(repo, 'assets', 'media');
const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--') && !/^[\d.]+,[\d.]+$/.test(a));
const focoArg = args[args.indexOf('--foco') + 1];
const [fx, fy] = (args.includes('--foco') ? focoArg : '0.5,0.66').split(',').map(Number);
if (!src || !fs.existsSync(src)) {
  console.error('Uso: npm run hero-foto -- "<foto>" [--foco x,y]');
  process.exit(1);
}

const keep = path.join(here, 'fuentes', `hero-foto${path.extname(src).toLowerCase()}`);
if (path.resolve(src) !== path.resolve(keep)) fs.copyFileSync(src, keep);

const meta = await sharp(src).metadata();
const W = meta.width, H = meta.height;

const wide = await sharp(src).toBuffer();

// 9:16: franja vertical centrada en el escritorio
const vW = Math.min(W, Math.round(H * 9 / 16));
const vLeft = Math.round(Math.min(W - vW, Math.max(0, fx * W - vW / 2)));
const tall = await sharp(src).extract({ left: vLeft, top: 0, width: vW, height: H }).toBuffer();

const outs = [];
for (const w of [1280, 1920, 2560].filter((w) => w <= W * 1.05)) {
  const out = path.join(media, `hero-foto-h-${w}.webp`);
  await sharp(wide).resize({ width: w, kernel: 'lanczos3' }).webp({ quality: 82, effort: 6 }).toFile(out);
  outs.push(out);
}
for (const w of [720, 1080].filter((w) => w <= vW * 1.05)) {
  const out = path.join(media, `hero-foto-v-${w}.webp`);
  await sharp(tall).resize({ width: w, kernel: 'lanczos3' }).webp({ quality: 82, effort: 6 }).toFile(out);
  outs.push(out);
}
console.log(`Foto ${W}×${H} · foco ${fx},${fy}`);
for (const f of outs) console.log(`  ${path.relative(repo, f)}  ${(fs.statSync(f).size / 1024).toFixed(0)} KB`);
console.log(`Foco del recorte vertical en la imagen 9:16: x=${((fx * W - vLeft) / vW).toFixed(3)}`);
