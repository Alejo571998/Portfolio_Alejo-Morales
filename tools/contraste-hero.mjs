// ============================================================
// Contraste del texto del hero sobre la foto (no es un color plano: lo mide npm run
// contrast). Oculta el color del texto, captura el fondo real y toma el píxel más claro
// (percentil 98) detrás de cada bloque como peor caso; en las píldoras mide dentro de la
// forma. Requiere npm run serve.   Uso: npm run contraste-hero
// ============================================================
import { chromium } from 'playwright-core';
import sharp from 'sharp';
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let worst = Infinity;
for (const route of ['/', '/404.html']) for (const [w, h] of [[360, 740], [820, 1180], [1366, 768], [1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:5180' + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3600);
  const items = await page.evaluate(() => [...document.querySelectorAll('.hero-kicker, .hero-headline, .hero-lead, .hero-tags li')].map((el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return { cls: el.className, x: r.left, y: r.top, w: r.width, h: r.height, color: cs.color, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) };
  }));
  await page.addStyleTag({ content: '.hero-inner, .hero-inner *{ color:transparent !important; } .hero-inner svg{ visibility:hidden; }' });
  await page.waitForTimeout(80);
  const shot = await page.screenshot();
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const out = [];
  for (const it of items) {
    const L = [];
    const pill = it.cls === '' ; // las píldoras (li) no tienen clase: se mide dentro de la forma, sin las esquinas
    const inset = pill ? it.h / 2 : 0;
    for (let y = Math.max(0, Math.floor(it.y + (pill ? 3 : 0))); y < Math.min(info.height, it.y + it.h - (pill ? 3 : 0)); y += 2)
      for (let x = Math.max(0, Math.floor(it.x + inset)); x < Math.min(info.width, it.x + it.w - inset); x += 2) {
        const i = (y * info.width + x) * info.channels; L.push(lum(data[i], data[i + 1], data[i + 2]));
      }
    L.sort((a, b) => a - b);
    const bg = L[Math.floor(L.length * 0.98)] ?? 0;
    const [r, g, b] = it.color.match(/\d+/g).map(Number);
    const c = ratio(lum(r, g, b), bg);
    const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
    const need = large ? 3 : 4.5;
    worst = Math.min(worst, c / need);
    out.push(`${it.cls.replace('hero-', '') || 'píldora'} ${c.toFixed(1)}:1${c < need ? ' ✗' : ''}`);
  }
  console.log(`${route} ${w}×${h}: ${out.join(' · ')}`);
  await page.close();
}
console.log(worst >= 1 ? 'Todo cumple AA' : 'Hay textos por debajo de AA');
await browser.close();
