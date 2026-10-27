// ============================================================
// Más cielo para la foto del hero.
//   npm run hero-cielo -- "<foto>" "<salida.png>" [px extra, 900 por defecto]
//
// El texto del hero es largo: para que no tape el escritorio, la foto necesita
// cielo de sobra arriba. Cada columna continúa el color de una franja limpia del
// cielo (sin la viñeta de las esquinas) y se oscurece y enfría con la altura; en
// los bordes la transición es más larga para borrar la viñeta original.
// Fuente usada: tools/fuentes/hero-foto-original.png → tools/fuentes/hero-foto.png
// Después: npm run hero-foto -- tools/fuentes/hero-foto.png --foco 0.53,0.72
// ============================================================
import sharp from 'sharp';
const [src, out, extra = '900'] = process.argv.slice(2);
const E = Number(extra);
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = 3;
const px = (x, y, c) => data[(y * W + x) * C + c];
// Color de referencia por columna: promedio de una franja de cielo y suavizado horizontal
const y0 = Math.round(H * 0.17), band = Math.round(H * 0.03);
const ref = new Float32Array(W * 3);
for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) {
  let s = 0; for (let y = y0; y < y0 + band; y++) s += px(x, y, c); ref[x * 3 + c] = s / band;
}
const blurred = new Float32Array(W * 3), R = 60;
for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) {
  let s = 0, n = 0; for (let k = Math.max(0, x - R); k <= Math.min(W - 1, x + R); k++) { s += ref[k * 3 + c]; n++; }
  blurred[x * 3 + c] = s / n;
}
const zenith = [52, 70, 102];      // azul profundo arriba
const NH = H + E;
const outBuf = Buffer.alloc(W * NH * C);
const smooth = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
for (let y = 0; y < NH; y++) {
  const oy = y - E;                                   // fila en la foto original
  const height = (y0 + E - y) / (y0 + E);             // 0 en la franja de referencia, 1 arriba de todo
  const k = smooth(0, 1, height);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    // cielo sintético: la columna de referencia, hacia el azul profundo con la altura
    const sky = [0, 1, 2].map((c) => blurred[x * 3 + c] * (1 - 0.82 * k) + zenith[c] * 0.82 * k);
    if (oy < 0) { for (let c = 0; c < 3; c++) outBuf[i + c] = sky[c]; continue; }
    // dentro de la foto: transición desde el cielo sintético hasta la franja de referencia
    const edge = smooth(0.16, 0, Math.min(x / W, 1 - x / W));   // 1 en el borde, 0 hacia adentro
    const m = smooth(0, y0 + band + edge * H * 0.3, oy);       // en los bordes la transición es más larga
    for (let c = 0; c < 3; c++) outBuf[i + c] = Math.round(sky[c] * (1 - m) + px(x, oy, c) * m);
  }
}
// Grano leve para que el cielo nuevo tenga la misma textura que la foto
for (let y = 0; y < E + y0 + Math.round(H * 0.3); y++) for (let x = 0; x < W; x++) {
  if (y >= E + y0 && Math.min(x / W, 1 - x / W) > 0.16) continue;
  const n = (Math.random() - 0.5) * 3.2, i = (y * W + x) * C;
  for (let c = 0; c < 3; c++) outBuf[i + c] = Math.max(0, Math.min(255, outBuf[i + c] + n));
}
await sharp(outBuf, { raw: { width: W, height: NH, channels: 3 } }).png().toFile(out);
console.log(`${W}×${NH} · escritorio al ${(((0.55 * H) + E) / NH * 100).toFixed(0)} % de la altura`);
