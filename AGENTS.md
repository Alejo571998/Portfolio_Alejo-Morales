# alejo.morales — portfolio · contexto para agentes de código

## Qué es esto
Portfolio personal de Alejo Morales (Dev + UX/UI), en rediseño activo para pasar filtros
de contratación — NO es una landing de venta de servicios freelance. Objetivo: conseguir
entrevistas como Web Developer o UX/UI Designer. Perfil que se muestra: híbrido, con
proyectos end-to-end (diseño + implementación) como argumento central.

## Stack (decisión tomada — no migrar sin confirmar con Alejo)
- HTML/CSS/JS vanilla. Sin framework, sin bundler todavía. El código actual está limpio
  y sin deuda técnica real — no se justifica reescribir en React/Next/Vue para un sitio
  100% contenido estático sin estado real. Sería sobreingeniería.
- La optimización de imágenes, el modelo 3D y el subset de three.js se resuelven con
  scripts en `tools/` que se corren a mano y cuyo resultado se versiona. El deploy sigue
  sin paso de build: Vercel sirve los archivos tal cual.
- Deploy: Vercel, desde este repo.

## Estructura actual (rediseño con la dirección de DESIGN.md, rama `rediseno/liquid-glass`)
- `index.html` — hero (pedido de Alejo, 26/10: el del portfolio publicado con su retrato y el
  nombre grande, más el H1 «Del concepto al producto. Del diseño al código.»), perfil, proyectos
  recientes (VITRACK y RUTIX), Takuverso (mapa a la izquierda y la app a la derecha, los dos a la
  vista; Taku camina por una línea verde que se dibuja entre paradas), casos de UX, sitios web,
  sobre mí, trayectoria (formación, experiencia y certificados) y contacto (perfiles como íconos
  de app). Cada sección está pensada para entrar en una pantalla de notebook.
- `casos/*.html` — una página por proyecto con detalle: vitrack, rutix, taku-dnd, zonaprop,
  a-la-cancha. Comparten la misma plantilla (nav, ficha, índice lateral, «siguiente»).
- `404.html` con la misma identidad. `pages/proyectos.html` solo redirige a `/#trabajo`.
- `css/estilos.css` — tokens (paleta del 27/10: carbón #131313, grafito #1B1B1B, obsidian
  #272727, marfil #EDEDED, ceniza #C4C4C4 y el naranja del logo de Alejo: #FF6B1F, degradé
  #FF8A00 → #F84800) y componentes. Un solo ambiente
  oscuro; separación por valor de superficie, sin sombras.
- `js/script.js` — IIFE + `safe()` por feature. Mantener ese patrón. Incluye el campo de puntos
  que sigue al mouse (un canvas fijo detrás de todo el sitio, verde dentro del Takuverso, quieto con
  reduced-motion), las pestañas del Takuverso, el camino entre paradas y el Taku 2D de respaldo.
- El hero se mueve con CSS + una variable que escribe `js/script.js` (`--hero-p`). NO volver a la
  escultura de Möbius, al render de Blender ni a la foto del escritorio (reemplazada el 26/10).
- `js/gl/taku-world.js` (Taku 3D caminando por el mapa). Se carga tarde, solo con WebGL, sin
  reduced-motion ni ahorro de datos; en equipos con poca memoria o pocos núcleos queda el Taku 2D.
- `js/vendor/three.min.js` — subset de three.js generado con `tools/` (no editar a mano).
- `assets/media/` — TODO lo que usa el sitio (WebP generados, favicon PNG del logo de Alejo).
  `assets/3d/taku.glb` es el modelo que usa el sitio: rig procedural de Blender (`npm run rig`)
  con los clips idle, walk y greet. `taku3d.glb` es la fuente de Tripo. Mixamo y Tripo se
  probaron y quedaron descartados (ver `docs/rediseno-design-md.md`, punto 8).
- `tools/` — tooling local (no se despliega, ver `.vercelignore`): `tools/blender/` (rig de
  Taku, Mixamo → GLB), `tools/fuentes/` (imágenes originales que usan los scripts),
  `tools/.env` (clave de Tripo, ignorada por git). La foto del escritorio (Seedream 5, ElevenLabs)
  quedó en `tools/fuentes/` sin uso; NO usar la imagen de Mercury. `docs/` — decisiones y revisión editorial
  (`docs/rediseno-design-md.md` describe el rediseño vigente).

## Convenciones a respetar
- Dirección visual: la estructura de `DESIGN.md` (Mercury) con la paleta carbón + naranja que
  eligió Alejo el 27/10 (NO volver al azul cobalto). El naranja es para la acción principal de
  cada pantalla (con texto carbón encima: el blanco no llega a AA) y los difuminados de luz; el verde de Taku, solo dentro del Takuverso. Nada de
  etiquetas de adorno tipo `<portfolio_2026/>` ni frases genéricas.
- Paleta y tipografía viven en `:root` como custom properties. Nunca hardcodear un color
  o tamaño de fuente en un selector nuevo — agregar o reusar un token.
- Contraste mínimo WCAG AA para cualquier color de texto nuevo: 4.5:1 en texto normal,
  3:1 en texto grande (≥18.66px o ≥14px bold). Verificar antes de commitear.
- Todo `<img>` nuevo lleva `alt` descriptivo y `loading="lazy"`, salvo el hero (carga
  above the fold).
- Cero copy en tono "vendo un servicio freelance": evitar "contrataciones", "clientes",
  "presupuesto", badges tipo "disponible para proyectos". El tono correcto es evidencia
  de trabajo para un reclutador — primera persona, foco en decisiones y resultados.
- Commits descriptivos (no "cambio total de portfolio" o "prox").

## Estado de las tareas originales
- P0 ✔ email real y link de MentaTools corregidos (ya estaban en master).
- P1 ✔ reemplazada tres veces. Vigente (pedido de Alejo, 27/10/2026): la estructura de
  `DESIGN.md` en negro carbón con el naranja de su logo. Los ambientes claro/oscuro del rediseño
  «Liquid Glass» y el cobalto quedaron atrás. NO reimplementar toggle ni direcciones A/B.
- P2 ✔ casos con problema → proceso → decisiones → estado, ahora en `casos/*.html`.
  VITRACK y RUTIX (las dos apps más recientes, octubre 2026) son los proyectos destacados.
  Datos por confirmar en `docs/revision-editorial.md`.
- P3 ✔ sin Paquetes, Beneficios, Servicios, badge freelance ni «Próximamente»; una sola
  navegación. Takuverso: sección nueva con las apps de Taku.
- P4 ✔ imágenes optimizadas en `assets/media`. `assets/img` y `assets/video` se borraron
  (24/10/2026, con OK de Alejo); las fuentes que se siguen usando están en `tools/fuentes`.
- P5 ✔ contraste verificado con `tools/contrast.mjs`; axe sin violaciones (`npm run check`).

## Antes de dar por terminado un cambio
- `cd tools && npm run check` (con `npm run serve` corriendo; recorre index, casos y 404 en
  360, 820, 1366 y 1920 px; `-- --links` verifica enlaces externos) y `npm run contrast`.
- Si se cambia el hero o el retrato: `npm run posters` (og:image).
- Si se agrega una imagen: sumarla al manifiesto de `tools/optimize-images.mjs`.
- No inventar datos de proyectos: si falta información, preguntar a Alejo.

## Cómo trabajamos
Alejo ejecuta con OpenCode. Claude (chat separado) revisa cada avance antes de dar por
cerrada una tarea — comparte diff, capturas, o el zip/preview actualizado. No dar por
mergeado P2 o P3 sin esa revisión: son cambios de contenido y tono, no solo técnicos,
y ahí es más fácil que un agente reintroduzca sin querer el tono freelance que se está
sacando.
