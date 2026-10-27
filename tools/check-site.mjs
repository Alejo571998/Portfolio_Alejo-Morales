// Chequeo del sitio en Chromium headless: errores de consola, requests fallidos,
// desborde horizontal, anclas internas rotas, imágenes sin alt, accesibilidad con
// axe y capturas por sección en cuatro anchos (móvil angosto, tablet, notebook y
// escritorio amplio). Recorre la página principal, las páginas de proyecto y la 404.
// Requiere el servidor local (npm run serve).
// Uso: npm run check [-- --shots] [-- --links]   (--links verifica los enlaces externos)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.ORIGIN || 'http://localhost:5180';
const shots = process.argv.includes('--shots');
const checkLinks = process.argv.includes('--links');
const outDir = path.join(here, '.cache', 'shots');
fs.mkdirSync(outDir, { recursive: true });
const axeSource = fs.readFileSync(path.join(here, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const viewports = [
  ['movil', { width: 360, height: 740 }, 2, true],
  ['tablet', { width: 820, height: 1180 }, 1, true],
  ['notebook', { width: 1366, height: 768 }, 1, false],
  ['amplio', { width: 1920, height: 1080 }, 1, false],
];
const pages = ['/', '/casos/vitrack.html', '/casos/rutix.html', '/casos/zonaprop.html', '/casos/taku-dnd.html', '/casos/a-la-cancha.html', '/404.html'];
const sections = ['inicio', 'perfil', 'trabajo', 'takuverso', 'casos', 'sitios', 'sobre-mi', 'trayectoria', 'contacto'];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let problems = 0;
const external = new Set();

for (const [name, viewport, dpr, touch] of viewports) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: touch && viewport.width < 600, hasTouch: touch });
  for (const route of pages) {
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') issues.push(`console.${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => issues.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400 && !(route === '/404.html' && r.url().endsWith('/404.html'))) issues.push(`HTTP ${r.status()}: ${r.url()}`); });

    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    // Recorrer la página para disparar lazy-load, reveals y el 3D
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += viewport.height * 0.7) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(160);
    }
    await page.waitForTimeout(route === '/' ? 2500 : 600);

    const report = await page.evaluate(() => {
      const out = {};
      out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      out.wide = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('.evolution, .tv-map, [hidden]');
      }).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
      out.brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h));
      out.imgNoAlt = [...document.querySelectorAll('img:not([alt])')].map((i) => i.src);
      out.imgBroken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && !i.closest('[hidden]')).map((i) => i.src);
      out.h1 = document.querySelectorAll('h1').length;
      out.internal = [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => h.startsWith(location.origin) && !h.includes('#'));
      out.external = [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href).filter((h) => !h.startsWith(location.origin));
      const hero = document.getElementById('inicio');
      out.heroScroll = hero ? getComputedStyle(hero).getPropertyValue('--hero-p').trim() !== '' : null;
      out.takuLive = document.getElementById('taku-stage')?.classList.contains('is-live');
      // Títulos que el nav fijo tapa al llegar por ancla
      out.navCovers = [...document.querySelectorAll('main section[id]')].filter((s) => {
        const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        return pad < (document.getElementById('nav')?.offsetHeight || 0);
      }).length;
      return out;
    });
    for (const href of report.external) external.add(href);
    // Enlaces internos (páginas y archivos): deben responder 200
    for (const href of new Set(report.internal)) {
      const res = await page.request.get(href).catch(() => null);
      if (!res || res.status() >= 400) issues.push(`enlace interno roto: ${href} (${res?.status() ?? 'sin respuesta'})`);
    }

    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { resultTypes: ['violations'] });
      return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    });

    const label = `${name} ${viewport.width}×${viewport.height} ${route}`;
    const lines = [];
    if (report.overflowX > 0) lines.push(`overflow-x: ${report.overflowX}px → ${report.wide.join(', ')}`);
    if (report.h1 !== 1) lines.push(`h1: ${report.h1}`);
    if (report.navCovers) lines.push('el nav fijo tapa los títulos al navegar por ancla');
    if (report.brokenAnchors.length) lines.push(`anclas rotas: ${report.brokenAnchors.join(', ')}`);
    if (report.imgNoAlt.length) lines.push(`img sin alt: ${report.imgNoAlt.join(', ')}`);
    if (report.imgBroken.length) lines.push(`img rotas: ${report.imgBroken.join(', ')}`);
    // three.js lee el .glb como stream y Chromium lo reporta como abortado aunque el modelo cargó
    if (report.takuLive) for (let i = issues.length - 1; i >= 0; i--) if (/taku\.glb net::ERR_ABORTED/.test(issues[i])) issues.splice(i, 1);
    lines.push(...issues);
    if (axe.length) lines.push('axe:\n    ' + axe.join('\n    '));
    const extra = route === '/' ? ` · scroll del hero: ${report.heroScroll} · 3D Taku: ${report.takuLive}` : '';
    console.log(`${lines.length ? '✗' : '✓'} ${label}${extra}`);
    if (lines.length) console.log('  ' + lines.join('\n  '));
    problems += (report.overflowX > 0 ? 1 : 0) + (report.h1 !== 1 ? 1 : 0) + report.navCovers + report.brokenAnchors.length + report.imgNoAlt.length + report.imgBroken.length + issues.length + axe.length;

    if (shots) {
      const slug = route === '/' ? 'inicio' : path.basename(route, '.html');
      if (route === '/') {
        // Capturas de viewport por sección (fullPage redimensiona y vacía los canvas WebGL)
        for (const [i, id] of sections.entries()) {
          await page.evaluate((sel) => {
            const el = document.getElementById(sel);
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (sel === 'inicio' ? 0 : 24), behavior: 'instant' });
          }, id);
          await page.waitForTimeout(id === 'takuverso' ? 3200 : 700);
          await page.screenshot({ path: path.join(outDir, `${name}-${i}-${id}.png`) });
        }
      } else {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `${name}-p-${slug}.png`), fullPage: true });
      }
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

if (checkLinks) {
  console.log(`\nEnlaces externos (${external.size}):`);
  for (const href of external) {
    let status = 0;
    try {
      const res = await fetch(href, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (portfolio link check)' }, signal: AbortSignal.timeout(20000) });
      status = res.status;
    } catch (err) { status = err.name; }
    // LinkedIn responde 999 a los bots aunque el perfil exista
    const ok = (typeof status === 'number' && status < 400) || (href.includes('linkedin.com') && status === 999);
    if (!ok) problems++;
    console.log(`  ${ok ? '✓' : '✗'} ${status} ${href}`);
  }
}
console.log(`\n${problems ? `${problems} problema(s)` : 'Sin problemas detectados'}`);
process.exitCode = problems ? 1 : 0;
