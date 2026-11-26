// Servidor estático mínimo para ver el portfolio en local.
// Uso: node tools/serve.mjs [puerto]  →  http://localhost:5180
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || process.env.PORT || 5180);

// Las mismas cabeceras que pone Vercel (vercel.json), así la política de seguridad se prueba en local.
// Solo entiende fuentes del tipo "/ruta/(.*)", que son las que usa el sitio.
const vercelHeaders = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers || [];
  } catch { return []; }
})();
const headersFor = (pathname) => {
  const out = {};
  for (const rule of vercelHeaders) {
    const prefix = rule.source.replace(/\(\.\*\)$/, '');
    if (pathname.startsWith(prefix)) for (const { key, value } of rule.headers) out[key.toLowerCase()] = value;
  }
  return out;
};

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      const notFound = path.join(root, '404.html');
      res.writeHead(404, { ...headersFor(url.pathname), 'content-type': types['.html'] });
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
      return;
    }
    res.writeHead(200, {
      ...headersFor(url.pathname),
      'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Portfolio en http://localhost:${port}`));
