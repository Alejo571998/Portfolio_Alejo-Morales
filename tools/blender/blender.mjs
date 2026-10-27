// Ubica el ejecutable de Blender: variable BLENDER, la instalación estándar de Windows o el PATH.
import fs from 'node:fs';
import path from 'node:path';

export function findBlender() {
  if (process.env.BLENDER && fs.existsSync(process.env.BLENDER)) return process.env.BLENDER;
  const base = 'C:/Program Files/Blender Foundation';
  if (fs.existsSync(base)) {
    const versions = fs.readdirSync(base).filter((d) => d.startsWith('Blender')).sort().reverse();
    for (const v of versions) {
      const exe = path.join(base, v, 'blender.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return 'blender';
}
