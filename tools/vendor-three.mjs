// Genera js/vendor/three.min.js: un único módulo ES con la parte de three.js
// que usa el sitio (ver three-entry.js). No hay build en el deploy: el archivo
// generado se versiona y el HTML lo importa tal cual.
// Uso (desde tools/): npm run vendor
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.resolve(here, '..', 'js', 'vendor', 'three.min.js');
const { version } = JSON.parse(fs.readFileSync(path.join(here, 'node_modules', 'three', 'package.json'), 'utf8'));

await build({
  entryPoints: [path.join(here, 'three-entry.js')],
  outfile,
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  legalComments: 'none',
  banner: { js: `/* three.js r${version.split('.')[1]} (${version}) — MIT License, https://threejs.org — subset para el portfolio */` },
});

const kb = (fs.statSync(outfile).size / 1024).toFixed(0);
console.log(`three@${version} → ${path.relative(process.cwd(), outfile)} (${kb} KB)`);
