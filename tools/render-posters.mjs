// Genera la imagen para compartir a partir de tools/posters/og.html (el paisaje del hero):
//  · assets/media/og-alejo-morales.jpg  (1200×630)
// El paisaje en sí sale de Blender: npm run hero.
// Requiere el servidor local corriendo (npm run serve).  Uso: npm run posters
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const media = path.resolve(here, '..', 'assets', 'media');
const origin = process.env.ORIGIN || 'http://localhost:5180';

const browser = await chromium.launch();
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.goto(`${origin}/tools/posters/og.html`, { waitUntil: 'networkidle' });
await og.evaluate(() => document.fonts.ready);
const ogPng = await og.screenshot();
await sharp(ogPng).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(media, 'og-alejo-morales.jpg'));
console.log('og ok');
await browser.close();
