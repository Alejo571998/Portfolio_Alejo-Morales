// Captura una URL local con Chromium headless (Playwright).
// Uso: node shot.mjs <url> <salida.png> [ancho] [alto] [fullPage:0|1] [espera ms]
import { chromium } from 'playwright-core';

const [url, out, w = '1440', h = '900', full = '0', wait = '1500'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
if (logs.length) console.log(logs.join('\n'));
console.log('ok', out);
