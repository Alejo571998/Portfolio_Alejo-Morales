// ============================================================
// Favicon a partir del logo (fondo negro → transparente).
//   npm run favicon            (fuente: tools/fuentes/logoAM.png)
//
// El fondo se quita con "color a alfa" sobre negro: alfa = canal más brillante,
// color = color / alfa. Así se conserva el resplandor naranja sin borde negro.
// Salida:
//   tools/fuentes/logo-am-transparente.png logo recortado, transparente (1024 px; de ahí sale el del nav)
//   assets/media/favicon-{32,192}.png      ícono cuadrado transparente
//   assets/media/apple-touch-icon.png      180 px sobre carbón (iOS no admite transparencia)
//   favicon.ico                            16, 32 y 48 px (PNG dentro del ICO)
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const media = path.join(repo, 'assets', 'media');
const source = process.argv[2] || path.join(here, 'fuentes', 'logoAM.png');
const CARBON = { r: 0x13, g: 0x13, b: 0x13, alpha: 1 };
const FLOOR = 0.07; // ruido del fondo negro que pasa a ser transparente

const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// alpha(m): con resplandor (tamaños grandes) o solo la forma llena (16–48 px, donde el brillo ensucia)
async function cutout(alpha) {
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const m = Math.max(r, g, b);
    const k = m > 0 ? 1 / m : 0;
    out[j] = Math.round(Math.min(1, r * k) * 255);
    out[j + 1] = Math.round(Math.min(1, g * k) * 255);
    out[j + 2] = Math.round(Math.min(1, b * k) * 255);
    out[j + 3] = Math.round(alpha(m) * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}
const glowing = await cutout((m) => Math.min(1, Math.max(0, (m - FLOOR) / (1 - FLOOR))));
const solid = await cutout((m) => smooth(0.42, 0.62, m));
// Mismo recorte para las dos versiones (el de la versión con brillo)
const box = await sharp(glowing).trim({ threshold: 6 }).toBuffer({ resolveWithObject: true });
const crop = { left: -box.info.trimOffsetLeft, top: -box.info.trimOffsetTop, width: box.info.width, height: box.info.height };
const logo = box.data;
const logoSmall = await sharp(solid).extract(crop).toBuffer();
const { width: lw, height: lh } = box.info;
await sharp(logo).resize({ width: 1024 }).png({ compressionLevel: 9 }).toFile(path.join(here, 'fuentes', 'logo-am-transparente.png'));

// Cuadrado: el logo es apaisado; se centra con un margen chico para que se lea a 16 px
async function square(size, background = { r: 0, g: 0, b: 0, alpha: 0 }, margin = 0.06) {
  const inner = Math.round(size * (1 - margin * 2));
  const fitted = await sharp(size <= 48 ? logoSmall : logo).resize({ width: inner, height: inner, fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

for (const size of [32, 192]) fs.writeFileSync(path.join(media, `favicon-${size}.png`), await square(size, undefined, size <= 32 ? 0.02 : 0.08));
fs.writeFileSync(path.join(media, 'apple-touch-icon.png'), await square(180, CARBON, 0.14));

// ICO con PNG embebidos (formato válido desde Windows Vista y en todos los navegadores)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => square(s, undefined, 0.02)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
fs.writeFileSync(path.join(repo, 'favicon.ico'), Buffer.concat([header, ...pngs]));
console.log(`logo ${lw}×${lh} → favicon listo`);
