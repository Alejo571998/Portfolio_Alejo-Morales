// Verifica el contraste WCAG de los pares de tokens que usa el sitio.
// Uso: node contrast.mjs
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
// Color resultante de pintar `top` con opacidad `a` sobre `base`
const over = (top, a, base) => '#' + hex(top).map((t, i) => Math.round((t * a + hex(base)[i] * (1 - a)) * 255).toString(16).padStart(2, '0')).join('');

// Tokens de css/estilos.css (paleta del 27/10: carbón + naranja del logo)
const T = {
  carbon: '#131313', graphite: '#1B1B1B', graphiteHi: '#212121', obsidian: '#272727',
  ivory: '#EDEDED', ash: '#C4C4C4', steel: '#9C9C9C', white: '#FFFFFF', mist: '#E4E4E4',
  ember: '#FF6B1F', emberDeep: '#F84800', emberAmber: '#FF8A00', emberPress: '#FF8447', emberInk: '#FF9A5C', emberGlow: '#F86000',
  takuInk: '#8DF5A6', taku: '#2FD35C',
};
const heroGlow = over(T.emberGlow, 0.2, T.carbon);          // luz naranja detrás del retrato, en su punto más fuerte
const contactGlow = over(T.emberGlow, 0.3, T.graphite);     // difuminado al pie de la tarjeta de contacto
const link = over(T.emberInk, 0.17, T.carbon);              // una unión de la constelación cruzando texto
const glass = over(T.white, 0.12, T.graphite);              // ficha translúcida del Takuverso sobre una captura blanca
const station = over(T.taku, 0.14, T.carbon);               // nombre de parada sobre la luz verde del mapa

const pairs = [
  // [uso, texto, fondo, mínimo]
  ['texto principal sobre lienzo', T.ivory, T.carbon, 4.5],
  ['texto principal sobre tarjeta', T.ivory, T.graphite, 4.5],
  ['texto secundario sobre lienzo', T.ash, T.carbon, 4.5],
  ['texto secundario sobre tarjeta', T.ash, T.graphite, 4.5],
  ['texto secundario sobre tarjeta hover', T.ash, T.graphiteHi, 4.5],
  ['tags: secundario sobre obsidian', T.ash, T.obsidian, 4.5],
  ['texto terciario sobre lienzo', T.steel, T.carbon, 4.5],
  ['texto terciario sobre tarjeta', T.steel, T.graphite, 4.5],
  ['texto terciario sobre tarjeta hover', T.steel, T.graphiteHi, 4.5],
  ['texto terciario sobre obsidian', T.steel, T.obsidian, 4.5],
  ['hero: nombre, arranque del degradé (blanco)', T.white, T.carbon, 4.5],
  ['hero: nombre, final del degradé (ceniza)', T.ash, T.carbon, 4.5],
  ['hero: secundario sobre la luz naranja', T.ash, heroGlow, 4.5],
  ['hero: principal sobre la luz naranja', T.ivory, heroGlow, 4.5],
  ['botón principal: carbón sobre el extremo rojo del degradé', T.carbon, T.emberDeep, 4.5],
  ['botón principal: carbón sobre el extremo ámbar del degradé', T.carbon, T.emberAmber, 4.5],
  ['botón principal hover: carbón sobre naranja claro', T.carbon, T.emberPress, 4.5],
  ['selección y skip link: carbón sobre naranja', T.carbon, T.ember, 4.5],
  ['naranja como texto sobre lienzo', T.emberInk, T.carbon, 4.5],
  ['foco naranja sobre lienzo (no texto)', T.emberInk, T.carbon, 3],
  ['foco naranja sobre tarjeta (no texto)', T.emberInk, T.graphite, 3],
  ['borde de botón fantasma (no texto)', T.mist, T.carbon, 3],
  ['constelación: terciario sobre una unión naranja', T.steel, link, 4.5],
  ['contacto: secundario sobre el difuminado naranja', T.ash, contactGlow, 4.5],
  ['íconos de app al pasar el puntero: carbón sobre marfil', T.carbon, T.ivory, 4.5],
  ['takuverso: verde de etiqueta sobre lienzo', T.takuInk, T.carbon, 4.5],
  ['takuverso: nombre de parada sobre el mapa con luz verde', T.ash, station, 4.5],
  ['takuverso: ficha translúcida sobre captura blanca, secundario', T.ash, glass, 4.5],
  ['takuverso: ficha translúcida sobre captura blanca, eslogan', T.takuInk, glass, 4.5],
  ['takuverso: dominio en la barra de la ventana', T.steel, T.obsidian, 4.5],
];
let fail = 0;
for (const [use, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? 'ok ' : 'NO '} ${r.toFixed(2).padStart(5)}:1 (mín ${min})  ${use}  ${fg} / ${bg}`);
}
process.exitCode = fail ? 1 : 0;
