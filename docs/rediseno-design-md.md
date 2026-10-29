# Rediseño con la dirección de DESIGN.md — octubre 2026

Reemplaza al rediseño «Immersive Liquid Glass» (`docs/rediseno-liquid-glass.md`, que queda como historia). Publicado en `master` el 29/10/2026 (portfolio-alejomorales.vercel.app); la versión anterior quedó en la rama `portfolio-anterior` y la etiqueta `portfolio-anterior-2026-10`. Antes de empezar se copió el estado anterior (HTML, CSS, JS, docs y scripts) a `tools/.cache/backup-liquid-glass/`, que no se versiona ni se despliega.

## 1. Dirección visual

- **Base:** `DESIGN.md` (Mercury): lienzo onyx `#171721`, tarjetas grafito `#1E1E2A`, superficies interactivas `#272735`, texto marfil `#EDEDF3` y ceniza `#C3C3CC`, cobalto `#5266EB` solo para la acción principal de cada pantalla.
- **Adaptación a un portfolio:** densidad menor que una plataforma financiera y capturas reales de producto debajo del hero.
- **Hero (pedido de Alejo, 26/10):** el del portfolio publicado (su retrato y el nombre grande) con el H1 del rediseño. Reemplaza al de la foto del escritorio (punto 7). Ver punto 9.
- **Tipografía:** Archivo con eje de ancho al 112 % y peso 480 para títulos (reemplazo libre de Söhne Breit); Inter 400/480 para todo lo demás. Se sacó IBM Plex Mono: las etiquetas en monoespaciada leían como adorno de código.
- **Takuverso:** la única sección con luz propia, el verde de Taku, que solo aparece ahí (etiqueta, paradas activas, eslogan de cada app). Las acciones siguen siendo las del sistema general.
- **Sin sombras ni vidrio:** la separación sale del valor de la superficie. El nav pasa a fondo difuminado recién al hacer scroll.

## 2. Arquitectura de la página

1. Hero: «ALEJO MORALES · PORTFOLIO», «Del concepto al producto. Del diseño al código.», la bajada de Alejo, tres píldoras (Desarrollo web, UX/UI Design, AI-powered products), «Explorar proyectos» (cobalto) y «Contactar».
2. Perfil: tres tarjetas (investigación, diseño de interfaces, desarrollo) con evidencia y herramientas.
3. Proyectos recientes: VITRACK y RUTIX, las dos apps más recientes (10 al 22 de octubre de 2026, carpetas locales `SISTEMA DE GESTIÓN INTEGRAL DE BODEGAS` y `App Rastreo Cadetes`). Ninguna pertenece al Takuverso.
4. Takuverso: un mapa con cinco paradas (Organiza, D&D, Gastro, Trámite Claro, Giftly). Es un patrón de pestañas accesible: flechas, Inicio y Fin, y sin JS se ven todas las fichas.
5. Casos de UX: Zonaprop y A la Cancha.
6. Sitios web: Akoncagua y A Mordidas destacados (tienen panel propio para precios y stock), cinco más en grilla compacta.
7. Sobre mí, contacto (WhatsApp primero, email con copiar, LinkedIn, GitHub y CV) y footer.

Cada proyecto con más profundidad tiene su página en `casos/`, con ficha, índice lateral fijo en escritorio y enlace al siguiente. TAKU D&D aparece una sola vez (en el Takuverso) y desde ahí se llega a su caso, para no duplicarlo.

## 3. Tarjetas

- Contenedor de 1200 px y grillas con `auto-fit`/`auto-fill`: las columnas salen del ancho disponible, nunca de anchos fijos.
- Proporciones fijas por familia: capturas 16:10, casos 16:9, certificados 3:2.
- Las tarjetas de proyecto destacado usan una consulta de contenedor: debajo de 680 px de ancho van apiladas y, por encima (tablet a una columna), la captura queda a la izquierda y el texto a la derecha, así no se vuelven altísimas.
- Una fila final incompleta se deja así: ninguna tarjeta se agranda para llenar huecos.
- Los casos y los sitios son clicables enteros (enlace estirado), con foco visible sobre toda la tarjeta.

## 4. Taku en 3D

- **Modelo:** `assets/3d/taku3d.glb` es la misma malla de Tripo que ya estaba (490.000 triángulos, texturas de 4096 px, sin esqueleto ni animaciones). El sitio usa `assets/3d/taku.glb`: 40.000 triángulos, WebP de 1024 px, meshopt y el rig procedural del punto 8 (0,66 MB).
- **Movimiento:** como no hay rig, camina como una figura rígida: sigue el camino punteado del mapa, se balancea y sube a cada paso, se inclina al avanzar, gira en las curvas y al llegar mira al frente y da un saltito. No se deforma la malla.
- **Si el .glb trae clips:** `taku-world.js` reproduce `idle`, `walk` y `greet` con AnimationMixer, apaga el balanceo procedural, camina más tranquilo y ajusta el ritmo del paso a la velocidad. Hay tres caminos para conseguir esos clips (punto 8).
- **Rendimiento:** three.js y el modelo se descargan recién cuando el mapa está a 500 px de la pantalla; el render se pausa fuera de pantalla y con la pestaña oculta; en reposo dibuja a 30 cuadros por segundo; DPR acotado.
- **Alternativa liviana:** con movimiento reducido, ahorro de datos, sin WebGL o en equipos con menos de 4 GB o menos de 4 núcleos, Taku es la ilustración original y salta de parada en parada con una transición de CSS (instantánea con movimiento reducido).

## 5. Verificación hecha

- `npm run check` (Chromium headless) sobre index, las cinco páginas de proyecto y la 404, en 360×740, 820×1180, 1366×768 y 1920×1080: sin desborde horizontal, un `h1` por página, axe sin violaciones, consola sin errores, enlaces internos y anclas válidos, imágenes con `alt`.
- `npm run check -- --links`: los 23 enlaces externos responden (LinkedIn devuelve 999 a los bots, como siempre).
- `npm run contrast`: 20 pares de tokens, todos AA.
- Takuverso: navegación con teclado, caminata en escritorio y en móvil, y la alternativa 2D con movimiento reducido (sin canvas y sin descargar three.js).
- Errores encontrados y corregidos durante la revisión: el parámetro `start` del módulo de Taku pisado por una función con el mismo nombre, y los `IntersectionObserver` que leían solo el primer registro cuando llegaban dos juntos (Taku a veces no arrancaba en móvil).

No verificado: dispositivos reales (iPhone, Android de gama media), Firefox, lector de pantalla y Lighthouse sobre Vercel.

## 6. Pendientes

- Datos a confirmar: ver la sección nueva al principio de `docs/revision-editorial.md`.
- Rig de Taku: resuelto con el procedural (punto 8). Mejoras posibles: más expresión en la caminata y movimiento secundario en las hojas.
- Cuenta de demostración de VITRACK: en curso en su propio repositorio; cuando exista, actualizar el enlace y la nota de «Abrir la app».

## 7. Hero: el de DESIGN.md y el video de referencia

Historia corta: primero hubo un render de Blender a la hora azul con paralaje en WebGL. Alejo pasó un video de referencia (la recreación del hero de Mercury) y una propuesta de texto, y el render no se parecía. El 25/10 se reemplazó por esto:

- **Foto:** escena propia generada con IA (Seedream 5 en ElevenLabs, 212 créditos): un escritorio de roble con notebook, cajonera blanca y silla de cuero en una loma con pasto y flores, montañas con niebla, un río y el amanecer, en los Andes patagónicos. No se usa la imagen de Mercury. Fuente: `tools/fuentes/hero-foto-original.png`.
- **Cielo de sobra:** el texto de Alejo es largo, así que la foto se estiró hacia arriba con `npm run hero-cielo` (cada columna continúa el cielo y se oscurece con la altura) hasta dejar el escritorio al 72 % de la altura: `tools/fuentes/hero-foto.png`, 2560×2340. `npm run hero-foto` saca los WebP (apaisada 1280/1920/2560 y vertical 9:16 centrada en el escritorio, 720/1080).
- **Composición como en el video:** texto arriba y centrado (etiqueta, H1, bajada, píldoras y dos botones); el escritorio centrado debajo. `object-position` y el espacio inferior del hero están ajustados para que el escritorio quede debajo de los botones en 360, 820, 1366 y 1920 px.
- **Movimiento como en el video:** al hacer scroll la cámara se acerca cada vez más al escritorio (escala 1 + 3p², con origen en el escritorio) y el texto se desvanece y sube. `js/script.js` solo escribe `--hero-p` mientras el hero está en pantalla; el resto es CSS. Al cargar, la foto aparece desde el negro con un leve asentamiento. Con movimiento reducido, la foto queda quieta. Ya no hay WebGL en el hero.
- **Contraste sobre la foto real** (`npm run contraste-hero`, percentil 98 del fondo detrás de cada texto): todo AA en los cuatro anchos y en la 404. Para lograrlo hay un óvalo oscuro detrás del bloque de texto (el resplandor del sol sube hasta la bajada), una sombra suave en la tipografía, píldoras con fondo oscuro y el botón «Contactar» con fondo translúcido; en notebooks bajos el bloque de texto se compacta.
- La og:image (`npm run posters`) usa la misma foto.

## 8. Taku con movimientos reales: tres caminos

1. **Rig procedural (publicado, 25/10):** `npm run rig` simplifica el modelo, `tools/blender/taku-rig.py` arma 21 huesos en posiciones medidas sobre la malla, calcula los pesos por distancia a cada hueso con zonas (la cabeza de hojas queda rígida, una pierna no mueve la otra) y genera `idle` (3,2 s), `walk` (0,67 s) y `greet` (2 s). Escribe `assets/3d/taku.glb` (0,66 MB). Alejo lo eligió frente a Mixamo porque deforma limpio debajo de los brazos. Verificado en el Takuverso de la portada caminando en escritorio y en móvil.
2. **Tripo (descartado por ahora, 24/10):** la clave de `tools/.env` funciona (el script apuntaba a `openapi.tripo3d.com`; el dominio correcto es `openapi.tripo3d.ai`). El chequeo de rig, que es gratis, dio **no riggeable** tanto con el modelo original como con el simplificado (sugiere bípedo, pero lo rechaza; probablemente por las proporciones de chibi). Además la cuenta de la API tiene 0 créditos (1 crédito = USD 0,01; rig 25 + 10 por animación). Solo valdría la pena con un modelo regenerado en otra pose.
3. **Mixamo (descartado, 25/10):** con el modelo de 40 k triángulos el rig automático falló tres veces («Unknown error while generating motion»). Funcionó con `tools/mixamo/taku-para-mixamo-liviano.fbx` (15 k triángulos, 1,7 m, sin texturas) y los marcadores: mentón bajo la cabeza, muñeca en el puño, codo en la mitad de la manga, rodilla a media pierna e ingle en la entrepierna; esqueleto sin dedos. Animaciones: Breathing Idle (brazos 73), Happy Walk «In Place» (brazos 77) y Waving Gesture, en `tools/mixamo/{idle,walk,greet}.fbx`. `npm run mixamo` las une en `tools/.cache/mixamo/taku-mixamo.glb` (0,48 MB, no se despliega), copia la textura del modelo base y deja la cabeza rígida (los pesos de Mixamo estiraban las hojas al levantar el brazo). Resultado: movimientos con más vida que el procedural, pero el buzo se estira alrededor de los hombros al mover los brazos y la malla tiene menos detalle. Comparación: `tools/preview/taku-rig.html` (`?mapa=mixamo` para verlo en el mapa).

## 9. Segunda vuelta (26/10): hero con retrato, puntos en todo el sitio y secciones de una pantalla

Pedido de Alejo después de recorrer el rediseño en local: volver al hero del sitio publicado («al entrar ya me vea yo y quién soy») pero con el H1 nuevo, sumar a todo el sitio el fondo de puntos que sigue al mouse, achicar las secciones (eran más altas que la pantalla), poner el mapa del Takuverso al lado de la app con un diseño más llamativo, sacar el espacio vacío de Sobre mí y mostrar los perfiles como íconos de app.

**Referencias consultadas** (skill de investigación previa; Mobbin pide plan pago, no se pudo usar):
- Active Theory (Refero Styles): escenario oscuro, paneles translúcidos con borde de un pelo, movimiento guiado por opacidad → el Takuverso.
- Dylanbrouwer (Refero Styles): nombre monumental en el hero, densidad compacta, curvas `cubic-bezier(.32,.72,0,1)` para entradas y `(.19,1,.22,1)` para recortes → hero y transiciones.
- Phantom Studios (Refero Styles): una sola línea de señal verde sobre negro como acento del sistema → el camino del mapa.
- Codrops, «Creating Scroll-Driven SVG Map Animations with GSAP» (21/05/2026): trazo de caminos SVG que se dibujan → la señal que se enciende tramo por tramo (sin GSAP: `pathLength` + `stroke-dashoffset` en CSS).
- El portfolio publicado (rama `master`): disposición del hero y el algoritmo del campo de puntos.

**Decisiones**
| Decisión | Fuente | Por qué |
|---|---|---|
| Hero: nombre en dos renglones (Archivo 112 %, degradé marfil → ceniza), H1 debajo, retrato recortado que sobresale de su panel, perfiles debajo | Sitio publicado + Dylanbrouwer | Alejo quiere verse y presentarse al entrar; el H1 sigue siendo el del rediseño |
| Campo de puntos: canvas fijo detrás de todo el sitio, densidad por área, uniones cobalto, verde dentro del Takuverso, se acerca al puntero y acompaña el scroll al 15 % | Sitio publicado | «Más movimiento, que no sea tan lineal»; el verde respeta la regla de Taku |
| Secciones: padding atado al alto de pantalla (`2vw + 5svh`), cabecera en dos columnas, capturas con alto en `svh` | Regla de oficio | Cada sección entra en una vista de notebook (excepto Proyectos, ver abajo) |
| Takuverso: mapa vertical a la izquierda y escenario a la derecha (contador 01/05, barra, flechas, ventana con el dominio real y ficha translúcida encima); en celular el mapa queda horizontal arriba de la app | Active Theory + Phantom + Codrops | Mapa y app a la par, se entienden juntos |
| Takuverso, movimiento: suelo en perspectiva, barrido de luz, haz y pulsos en la parada activa, señal verde que se dibuja en el sentido del viaje, ventana que se descubre con un barrido, Taku vestido que salta a escena | Mismas | «Visualmente llamativo y loco», con todo apagado en movimiento reducido |
| Sobre mí sin el retrato (ya está en el hero), en dos columnas; Trayectoria como sección propia | Brief | Sacar el espacio vacío y partir una sección que medía 1832 px |
| Contacto: LinkedIn, GitHub y CV como íconos de app (logos de Simple Icons, CC0) | Sitio publicado | Más ameno que enlaces subrayados |

Se permitió el vidrio (ficha translúcida con desenfoque) solo en el Takuverso, la sección con luz propia; con `prefers-reduced-transparency` la ficha es opaca.

**Alto de cada sección** (antes → ahora, px): a 1366×768: perfil 925 → 589, proyectos 1398 → 947, Takuverso 1441 → 748, casos 1120 → 745, sitios 1342 → 814, sobre mí 1832 → 742 + trayectoria 774, contacto 860 → 759. A 1920×1080 todas entran en la pantalla. Proyectos sigue un poco más alto que 768: dos tarjetas con descripción y tres evidencias cada una; para bajarlo habría que recortar contenido, y eso queda para que lo decida Alejo.

**Sin uso desde este cambio:** la foto del escritorio (`assets/media/hero-foto-*.webp`, fuentes en `tools/fuentes/`) y los scripts `hero-foto`, `hero-cielo` y `contraste-hero`. Quedan hasta que Alejo apruebe el hero nuevo; después se pueden borrar los WebP. La og:image se regeneró con el hero nuevo (`npm run posters`). Copia del estado anterior en `tools/.cache/backup-hero-foto/`.

**Verificado:** `npm run check` sin problemas en las 7 páginas y 4 anchos (axe, desborde, consola, enlaces), `npm run contrast` con 28 pares AA (incluye la ficha translúcida sobre una captura blanca y el texto sobre una unión de la constelación), pestañas del Takuverso con flechas, Inicio/Fin y los botones anterior/siguiente, y movimiento reducido (Taku 2D, sin animaciones, puntos quietos). No verificado: dispositivos reales y Firefox/Safari (el recorte del nombre usa `background-clip:text`).

## 10. Tercera vuelta (27/10): carbón y naranja, proyectos con la captura al frente, repaso de UX, AA y responsive

**Pedido de Alejo:** el azul no le gusta; prefiere un negro carbón mate con un difuminado naranja (su color favorito, el de su logo). Las tarjetas de Proyectos seguían más altas que la pantalla, con demasiado texto y la captura chica. Después, un repaso senior de UX/UI, AA y responsive de todo el sitio.

**Referencia:** Refero Styles, «Three» (https://styles.refero.design/style/57160546-4cf7-4d52-bb05-cd8b88e1fbf9): lienzo negro mate (#111111 → #181818 → #343434) con una sola chispa naranja para la acción principal. Se tomó la escala de superficies neutras y la regla de un solo color; se le sumó el difuminado que pidió Alejo, con el degradé real de su logo (#FF8A00 → #F84800, medido sobre `tools/fuentes/logoAM.png`).

**Decisiones**
| Decisión | Por qué |
|---|---|
| Superficies neutras: carbón #131313, grafito #1B1B1B, obsidian #272727; textos #EDEDED / #C4C4C4 / #9C9C9C | El lienzo anterior tenía un tinte azul; los grises neutros dejan al naranja como única nota de color |
| Botón principal con el degradé del logo y texto carbón | El blanco sobre naranja da 2,9:1 (no llega a AA); el carbón da entre 5,2 y 7,9:1 en todo el degradé |
| Difuminados naranjas detrás del retrato, al pie de las capturas de Proyectos y en la tarjeta de contacto; uniones naranjas en el campo de puntos | El «difuminado naranja» pedido, sin teñir superficies con texto |
| Logo naranja de Alejo en el nav de todas las páginas (`logo-am-96/192.webp`, 4 KB) | Antes era un círculo «AM» genérico |
| Proyectos: la captura ocupa casi toda la tarjeta (alto atado a la pantalla); queda nombre, estado, una línea de qué es y la tecnología; toda la tarjeta lleva al caso | Las tres evidencias por app ya están en `casos/*.html`; ahora la tarjeta entra en una pantalla de 1366×768 |
| El Takuverso mantiene su verde | Sigue siendo la única sección con luz propia |

**Textos que cambiaron (aprobados por Alejo el 27/10):** título de Proyectos «Dos productos completos, con datos y reglas de negocio reales» → «Dos productos de punta a punta»; la bajada ya no dice «Ninguno lo usa todavía un cliente a diario» y remite a la página de cada uno; descripciones: VITRACK «Gestión para bodegas chicas y medianas: vasijas, lotes, análisis y botellas, desde la computadora o el celular, también sin señal.», RUTIX «Reparto para restaurantes y rotiserías: pedidos, repartidores con GPS y el pedido en camino, en el mapa, para quien lo espera.». Se sacaron de la tarjeta las etiquetas «Gestión para bodegas · App web instalable» y «Reparto y seguimiento · SaaS» y las tres evidencias de cada app.

**Repaso de UX/UI y responsive** (capturas en 320, 360, 740×360, 768, 820, 1024, 1366, 1440, 1920 y 2560 px):
- Nav: en 320 px el nombre se partía en dos renglones; ahora no se parte y el botón del menú queda solo con el ícono debajo de 380 px (el texto «Menú» sigue para lectores de pantalla).
- Hero: dos columnas desde 700 px (en tablet el retrato iba arriba y dejaba un costado vacío). Los íconos de LinkedIn, GitHub y CV muestran su nombre al pasar el puntero o con el foco.
- Tarjetas huérfanas: Perfil pasa de una a dos columnas (la tercera a lo ancho) y a tres; «Cómo trabajo» de una a dos y a cuatro; los cinco sitios chicos entran en una fila desde 1000 px.
- Takuverso: el mapa va al lado de la app desde 768 px (antes, desde 1024). En tablet la cabecera ocupa todo el ancho y el mapa usa un zigzag vertical con el nombre debajo de cada plataforma; los nombres al costado quedan para 1200 px o más (en 1024 se cortaba «Trámite Claro»).
- Trayectoria: formación y experiencia lado a lado desde 760 px.
- Monitores de 2560 px al 100 %: el contenedor pasa a 1440 px y el texto sube un 12,5 %.

**AA**
- Contraste: `npm run contrast` con 30 pares, todos AA, calculados con la mezcla real cuando hay transparencias (texto sobre la luz naranja, sobre una unión de la constelación, sobre la ficha translúcida del Takuverso y sobre el difuminado del contacto).
- Movimiento (2.2.2): el campo de puntos y los pulsos del Takuverso se mueven solos, así que hay un botón «Pausar animaciones» en el footer de todas las páginas, con `aria-pressed`, que se recuerda en el navegador. Con movimiento reducido ya está todo quieto y el botón no aparece.
- Teclado: recorrido con Tab de la portada (44 paradas) y de un caso: orden lógico, foco visible en todo (en las tarjetas, el anillo lo dibuja la tarjeta o la captura), y los destacados de Sitios ahora marcan la tarjeta entera.
- Objetivos táctiles de 24 px o más (los títulos con enlace estirado cubren toda la tarjeta).
- `npm run check`: 7 páginas × 4 anchos sin problemas (axe, desborde, consola, enlaces internos).

No verificado: lectores de pantalla reales, Safari/Firefox y dispositivos físicos.

## 11. Datos confirmados, retrato nuevo y limpieza (28/10)

**Respuestas de Alejo aplicadas**
- Retrato del hero: `yomanga.png` (camisa de manga larga, sin fondo). Fuente en `tools/fuentes/`; `npm run retrato` la recorta y la agranda (Lanczos) hasta 1080 px de alto y `npm run images -- alejo` saca `alejo-360/720.webp`. Pidió mejorarla al máximo sin modificarlo: queda preparada `tools/fuentes/yomanga-para-escalar.png` para Topaz Image Upscale (ElevenLabs, modelo fiel, sin creatividad en la cara); `npm run retrato -- <escalada.png>` le vuelve a poner la silueta.
- Zonaprop fue individual (ficha del caso). A la Cancha: el card sorting fue en UXtweak (ficha y texto del caso). TAKU D&D: la traducción del SRD se hizo con IA (cifra del caso).
- Trámite Claro: presentada en la CoderCup de Coderhouse (CV). La tecnología de la tarjeta coincide con el código del repo público y de la app publicada (pedido de Alejo): React, TypeScript, Vite, la API de Gemini y PWA. Su CV dice Next.js y API de Claude: conviene corregirlo ahí.
- TAKU Gastro sigue en piloto con datos reales de un emprendimiento (estado «En piloto»); usa la API de Claude (`@anthropic-ai/sdk` en el repo y CV).
- El Mundo de Menta: diseño y código de Alejo. MentaTools: hecho con Lovable. Los dos lo dicen en su tarjeta.
- CV: la versión actual (`CV_Alejo_Morales_Frontend_UXUI.pdf`, 27/09) se aloja en `assets/cv/` y la enlazan el hero y el contacto, en lugar de Google Drive.
- VITRACK: el piloto se está haciendo como estaba planeado.

**Limpieza** (todo lo borrado sigue en el commit 910083f):
- Del sitio: los WebP de la foto del escritorio, `rutix-entregado-*` y `alacancha-hifi-560` (nadie los usaba), el retrato viejo `alejo-408.webp` y el logo PNG de 366 KB (era fuente del logo del nav: pasó a `tools/fuentes/logo-am-transparente.png`). El ícono de iOS ahora va sobre carbón.
- `assets/3d/taku3d.glb` (16 MB, la malla original de Tripo) pasó a `tools/fuentes/`: el sitio solo usa `taku.glb` y ya no se despliega.
- Herramientas que quedaron sin uso: el pipeline de la foto del escritorio (`hero-foto`, `hero-cielo`, `contraste-hero` y sus fuentes, 13 MB), `optimize-taku.mjs` (reemplazado por `taku-rig.mjs`; además pisaba el modelo riggeado), los caminos descartados del rig (`mixamo-taku`, `tripo-taku`, `blender/mixamo-taku.py`) y la vista previa `tools/preview/taku-rig.html`. Quedan en disco, fuera de git, los FBX de Mixamo (`tools/mixamo/`) y `tools/.env` (clave de Tripo, ya sin uso).

**Repo de TAKU D&D (28/10):** antes de hacerlo público se revisó el historial: sin claves, los PDF con copyright excluidos por `.gitignore` y la atribución CC-BY del SRD en el README. Lo único ajeno era `D&D.zip` (10 capturas de la app «5e Character Keep», material de benchmark): a pedido de Alejo se sacó de los 7 commits (se conserva el commit vacío del primer deploy) y quedó solo en su disco, en `Capturas_privadas/` (ignorada). Respaldo del repo original: `C:/Nosotros/Alejo/Programacion/_respaldos/Taku_DnD-antes-de-sacar-capturas-2026-10-28.bundle`. El 29/10, con permiso de Alejo, se subió con push forzado (con resguardo del estado anterior), el repo pasó a público y el enlace «Código» quedó en el Takuverso y en el caso.

**VITRACK (29/10):** el botón de la tarjeta y del caso pasa a «Probar la demo» y lleva a https://vitrack-demo.vercel.app/ (datos de ejemplo, sin contraseña, se reinicia cada noche). La app del piloto sigue aparte, con ingreso por invitación.

**Retrato con Topaz (29/10):** `yomanga-para-escalar.png` se escaló x4 con Topaz Image Upscale en ElevenLabs (modelo High Fidelity V3, sin retoque de cara, 485 créditos aprobados por Alejo) → `tools/fuentes/yomanga-topaz.png`, 1216×1808. `npm run retrato -- fuentes/yomanga-topaz.png` le devuelve la silueta y `npm run images -- alejo` saca 360, 720 y 1080 px. Comparada con el original, la cara queda igual, solo más nítida.
