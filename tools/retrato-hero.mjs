// ============================================================
// Retrato del hero → tools/fuentes/retrato-hero.png (transparente, ~1080 px de alto).
//   npm run retrato                          escala la foto original con Lanczos
//   npm run retrato -- "<escalada.png>"      usa una versión escalada con IA (Topaz)
// Después: npm run images -- alejo   y   npm run posters
//
// La fuente es tools/fuentes/yomanga.png (la foto de Alejo con manga larga, sin fondo, 500 px).
// El recorte sale de yomanga-recorte.json. Los escaladores con IA no conservan la
// transparencia, así que la versión de Topaz se hace sobre el grafito del panel del hero y acá
// se le vuelve a poner la silueta: el alfa original agrandado con Lanczos y con el borde ajustado.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const fuentes = path.join(here, 'fuentes');
const original = path.join(fuentes, 'yomanga.png');
const crop = JSON.parse(fs.readFileSync(path.join(fuentes, 'yomanga-recorte.json'), 'utf8'));
const scaled = process.argv[2];
const out = path.join(fuentes, 'retrato-hero.png');
const TARGET_H = 1080;

const cut = await sharp(original).extract(crop).ensureAlpha().png().toBuffer();
let width, height, rgb;
if (scaled) {
  const meta = await sharp(scaled).metadata();
  ({ width, height } = meta);
  rgb = await sharp(scaled).removeAlpha().toBuffer();
} else {
  height = TARGET_H;
  width = Math.round((crop.width / crop.height) * TARGET_H);
  rgb = await sharp(cut).flatten({ background: '#1B1B1B' })
    .resize({ width, height, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 })
    .toBuffer();
}
// Silueta: alfa original agrandado; la curva endurece apenas el borde para que no quede un halo
const alpha = await sharp(cut).extractChannel('alpha')
  .resize({ width, height, kernel: 'lanczos3' })
  .linear(1.25, -32)
  .toColourspace('b-w')
  .toBuffer();
await sharp(rgb).resize({ width, height }).joinChannel(alpha).png({ compressionLevel: 9 }).toFile(out);
console.log(`retrato ${width}×${height} ${scaled ? '(escalado con IA)' : '(Lanczos)'} → ${path.relative(path.resolve(here, '..'), out)}`);
