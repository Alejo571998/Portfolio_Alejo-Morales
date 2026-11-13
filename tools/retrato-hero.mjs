// ============================================================
// Retrato del hero → tools/fuentes/retrato-hero.png (transparente).
//   npm run retrato                          usa tools/fuentes/yo-hd.webp (la foto vigente, 13/11)
//   npm run retrato -- "<foto sin fondo>"    cualquier otra foto ya recortada (PNG/WebP con alfa)
//   npm run retrato -- "<escalada.png>"      versión opaca de yomanga escalada con IA (Topaz, 29/10)
// Después: npm run images -- alejo   y   npm run posters
//
// Con una foto sin fondo, recorta el borde transparente dejando un margen chico (abajo no,
// para que el cuerpo apoye en el borde del panel). Los escaladores con IA no conservan la
// transparencia: para ese caso queda el camino de yomanga, que le vuelve a poner la silueta
// original agrandada con Lanczos.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const fuentes = path.join(here, 'fuentes');
const out = path.join(fuentes, 'retrato-hero.png');
const src = process.argv[2] || path.join(fuentes, 'yo-hd.webp');
const PAD = 12;

const meta = await sharp(src).metadata();
const opaque = !meta.hasAlpha || (await sharp(src).stats()).isOpaque;

if (!opaque) {
  // Foto ya recortada: caja de la silueta + margen
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
  }
  const left = Math.max(0, x0 - PAD), top = Math.max(0, y0 - PAD);
  const crop = { left, top, width: Math.min(info.width, x1 + PAD + 1) - left, height: info.height - top };
  await sharp(src).extract(crop).png({ compressionLevel: 9 }).toFile(out);
  console.log(`retrato ${crop.width}×${crop.height} (foto sin fondo) → ${path.relative(path.resolve(here, '..'), out)}`);
} else {
  // Versión de yomanga escalada con IA: se le devuelve la silueta original
  const crop = JSON.parse(fs.readFileSync(path.join(fuentes, 'yomanga-recorte.json'), 'utf8'));
  const cut = await sharp(path.join(fuentes, 'yomanga.png')).extract(crop).ensureAlpha().png().toBuffer();
  const { width, height } = meta;
  const alpha = await sharp(cut).extractChannel('alpha')
    .resize({ width, height, kernel: 'lanczos3' })
    .linear(1.25, -32)
    .toColourspace('b-w')
    .toBuffer();
  await sharp(src).removeAlpha().joinChannel(alpha).png({ compressionLevel: 9 }).toFile(out);
  console.log(`retrato ${width}×${height} (yomanga escalada con IA) → ${path.relative(path.resolve(here, '..'), out)}`);
}
