# Rediseño «Immersive Liquid Glass» — investigación, dirección y decisiones

> **Reemplazado** el 23/10/2026 por la dirección de `DESIGN.md`: ver `docs/rediseno-design-md.md`. Este documento queda como historia de las decisiones técnicas que se mantienen (three.js como subset, pósters generados, carga progresiva del 3D).

Rama: `rediseno-liquid-glass` · Octubre 2026 · Nada de esto está mergeado ni publicado.

## 1. Investigación

Fuentes que consulté (búsqueda web y lectura de artículos; no recorrí galerías como Awwwards pantalla por pantalla):

- Liquid Glass en web: [LogRocket — CSS + SVG](https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/), [backdrop-filter: recetas y cuándo no usarlo](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026), librerías como liquidGL y liquid-glass-js.
- 3D en tiempo real: docs de `MeshPhysicalMaterial` y foros de three.js sobre el costo de `transmission` en móviles.
- Portfolios de UX: [casestudy.club](https://www.casestudy.club/journal/ux-designer-portfolio), listados de Muzli y Colorlib.
- Optimización de modelos: guías de glTF-Transform (simplify, WebP, meshopt).
- Movimiento: estado de las scroll-driven animations (Chrome y Safari sí; Firefox estable todavía no).

**Lo que conviene adoptar**

- El vidrio es *chrome*, no contenido: nav, chips, paneles de metadatos y tarjetas. Nunca detrás de párrafos largos.
- `backdrop-filter` no refracta. La refracción real en web exige SVG (solo Chromium) o WebGL. Por eso la refracción vive en el objeto 3D y el resto usa vidrio esmerilado con fallback sólido.
- Escalera de fallback: superficie sólida → vidrio esmerilado con `@supports` → efectos solo donde hay soporte. No animar el blur.
- Pocos casos de estudio profundos rinden más que una grilla de miniaturas: problema → proceso → decisiones → resultado o estado.
- `transmission` de three.js agrega una pasada de render completa; en móvil se vuelve fragment-bound. Un shader propio con entorno analítico da el mismo lenguaje visual con costo fijo.

**Lo que conviene evitar**

- Glassmorphism en todo, neones, gradientes por todos lados: es exactamente la plantilla genérica que pide evitar el brief.
- Scroll secuestrado y animaciones constantes que compiten con la lectura.
- Dispersión cromática fuerte: en las primeras pruebas el objeto parecía un CD tornasolado y le robaba protagonismo al naranja. Quedó sutil.
- Cursor custom, marquesina, partículas, botón flotante de WhatsApp y videos en autoplay: suman peso y ruido y no comunican nada a quien contrata.

## 2. Tres direcciones evaluadas

| | A · Editorial minimalista | B · Inmersiva cinematográfica | C · Híbrida (elegida) |
|---|---|---|---|
| Idea | Porcelana, tipografía grande, naranja como único acento, sin 3D | Escena WebGL a pantalla completa con cámara guiada por scroll | Dos «escenarios» 3D (hero y Takuverso) dentro de un sitio editorial |
| Originalidad | Baja: se parece a muchos portfolios | Alta | Alta, con una firma reconocible |
| Claridad para un reclutador | Muy alta | Baja: el efecto tapa el contenido | Alta |
| Rendimiento / accesibilidad | Excelente | Riesgoso en móvil; difícil de hacer accesible | Bueno: el 3D es progresivo y tiene póster |
| Coherencia con el brief | Pierde el Liquid Glass y el objeto 3D | Cumple la estética, falla en legibilidad | Cumple ambas cosas |

La C toma la claridad de la A y la materia de la B, pero limita el 3D a dos lugares donde tiene sentido narrativo.

## 3. Dirección elegida

**Regla de ambientes.** Oscuro (obsidian) para *mostrar* —objetos, apps, sitios—; claro (porcelana) para *leer* —casos, proceso, sobre mí—. Cada sección declara `data-ambient` y los tokens cambian solos. El cambio responde a qué está haciendo quien lee, no a una alternancia decorativa.

**Firma visual: una banda de Möbius de vidrio.** Una sola superficie con dos caras: diseño y código. Es asimétrica (más ancha de un lado), gira media vuelta y se ilumina con softboxes blancos y una luz naranja papaya. La pieza se lee como escultura, no como esfera genérica ni como imagen dentro de una tarjeta.

**Naranja papaya como luz, no como relleno.** Aparece en el reflejo del objeto, en el CTA principal, en el acento de texto y en el resplandor del contacto, que cierra el recorrido con la misma luz del inicio.

**Takuverso con luz propia.** Es la única sección donde aparece el verde de Taku, como luz ambiente y contraluz del modelo. El naranja se mantiene en las interacciones, así la sección se siente parte del mismo sitio.

## 4. Sistema de diseño (`css/estilos.css`)

- **Tokens de marca** (los del brief) y **tokens semánticos por ambiente**: `--bg`, `--text`, `--text-2`, `--text-3`, `--accent`, `--border`, `--glass-*`, `--focus`, `--shadow`.
- **Materiales**: Obsidian Glass y Porcelain Glass son el mismo componente `.glass` con tokens por ambiente; la nav tiene un vidrio propio más opaco (`--nav-glass`) porque es la única pieza que pasa por encima de todas las secciones. Liquid Refraction es el shader del objeto (`js/gl/hero-sculpture.js`).
- **Tipografía**: Space Grotesk / Inter / IBM Plex Mono, escala fluida con `clamp()` de `--fs-label` (13px, nunca menos) a `--fs-display`. Etiquetas en mono sin mayúsculas forzadas.
- **Movimiento**: `--ease-out`, cuatro duraciones. Revelado con opacity + transform; `prefers-reduced-motion` desactiva todo y no carga WebGL.
- **Componentes**: nav de vidrio con hoja móvil, hero, objeto 3D, botones primario y de vidrio, caso de estudio (aside fijo + cuerpo), stats, figuras, evolución de wireframes, tarjeta de app del Takuverso, tarjeta de proyecto con marco de navegador, principios, timeline, certificados, contacto, footer y 404.

**Contraste** (verificado con `tools/contrast.mjs`, todos ≥ AA): texto secundario en oscuro 8,18:1; terciario 5,93:1; naranja sobre obsidian 7,91:1; naranja de texto en claro (`#A84E00`) 5,12:1; texto del botón primario 7,91:1. El naranja de marca `#FF8000` sobre porcelana da 2,3:1, así que en claro nunca se usa como texto.

## 5. Decisiones técnicas

| Decisión | Alternativas consideradas | Por qué |
|---|---|---|
| Mantener HTML/CSS/JS sin framework | React/Next | Sitio de contenido estático; lo pide AGENTS.md; nada lo justifica |
| three.js como subset ES (`js/vendor/three.min.js`, 642 KB → ~135 KB brotli) generado con esbuild y versionado | CDN con importmap; three completo; shader crudo sin three | Sin dependencias externas en runtime, sin paso de build en el deploy y reutilizado por los dos escenarios |
| Shader propio para el vidrio (refracción con dispersión + reflejo sobre entorno analítico) | `MeshPhysicalMaterial` con `transmission`; video pre-renderizado | Sin texturas ni pasada extra; costo por píxel bajo y predecible |
| Póster WebP generado con el mismo código (`npm run posters`) | Render en Blender | El póster coincide con el primer cuadro en vivo: el paso de imagen a WebGL no se nota |
| WebGL progresivo: carga después de `load`, en idle, solo con WebGL, sin reduced-motion ni ahorro de datos; pausa fuera de pantalla y con la pestaña oculta; DPR acotado y adaptativo; si se pierde el contexto vuelve el póster | Cargarlo siempre | El LCP es texto + póster (≈370 ms en local) y el 3D nunca bloquea |
| Taku: modelo `leafy` de Tripo, de 490 k a 40 k triángulos, texturas WebP 1024, meshopt: 15,8 MB → 0,55 MB | Modelo `green` (tiene un disco de base pegado) | Silueta y cara fieles a la ilustración, sin base propia |
| Animación de Taku procedural (entrada, respiración, mira la app señalada) | — | El .glb no trae rig ni clips. Si aparece una versión animada, `AnimationMixer` la reproduce sola |
| Capturas nuevas de los sitios publicados (Playwright) y material real de los casos (slides, Figma exportado, capturas del repo de D&D) | Seguir con las portadas promocionales | Las portadas tenían fondos espaciales que chocaban con la identidad y no mostraban la interfaz |
| `pages/proyectos.html` pasa a redirigir a `/#trabajo` | Borrarla | No romper enlaces que ya circulan |

Imágenes: todo lo que usa el sitio vive en `assets/media/` (1,8 MB en total, WebP con `srcset`). Antes, `assets/` pesaba 65 MB.

## 6. Verificación

Hecho en esta rama:

- `npm run check` (Chromium headless) en 390, 820 y 1440 px: sin desborde horizontal, un solo `h1`, 0 violaciones de axe, consola limpia, sin anclas rotas ni imágenes sin `alt`, ambos escenarios 3D activos.
- `npm run contrast`: todos los pares de tokens pasan AA.
- Movimiento reducido: no se crea ningún canvas y three.js ni se descarga. Sin JS: todo el contenido visible.
- En el navegador: menú móvil (foco al abrir, Escape cierra y devuelve el foco), Taku girando hacia la app señalada, consola limpia con GPU real.

No verificado todavía: dispositivos reales (iPhone/Safari, Android de gama media), Firefox, lector de pantalla y Lighthouse sobre el deploy de Vercel.

## 7. Pendientes y riesgos

- **Assets sin uso**: `assets/img/` y `assets/video/` ya no se referencian (≈65 MB). No los borré: esperan tu confirmación. Las ilustraciones de Taku que agregaste en `assets/img/` son las fuentes de `assets/media/taku-*`.
- **Animación de Taku**: no encontré un archivo animado; encontré dos `.glb` estáticos de Tripo en Descargas. Si tenés uno con rig o clips, se reemplaza `assets/3d/taku.glb` con `npm run taku -- "<archivo>"`.
- **Fuentes** desde Google Fonts. Autoalojarlas mejoraría privacidad y un poco el primer render.
- **Datos por confirmar**: ver `docs/revision-editorial.md`.
- `.claude/launch.json` (servidor local para el panel de vista previa) quedó sin trackear a propósito.

## 8. Mantenimiento (`tools/`, no se despliega)

```bash
cd tools && npm install
npm run serve        # http://localhost:5180
npm run images       # regenera assets/media desde las fuentes del manifiesto
npm run taku -- "<origen.glb>"   # optimiza el modelo de Taku
npm run vendor       # regenera js/vendor/three.min.js tras actualizar three
npm run posters      # póster del hero y og:image (con el servidor corriendo)
npm run check        # chequeo completo; --shots guarda capturas por sección
npm run contrast     # contraste de los tokens
```

Para sumar una app al Takuverso: copiar un `<li class="tv-app">` en `index.html`, agregar su ilustración al manifiesto de `tools/optimize-images.mjs` y correr `npm run images`.
