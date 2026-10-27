# Revisión editorial — sección por sección

## 24/10/2026 · respuestas de Alejo, ya aplicadas

- **Hero (25/10):** texto propuesto por Alejo, aplicado tal cual: «ALEJO MORALES · PORTFOLIO», «Del concepto al producto. Del diseño al código.», la bajada sobre tecnología, diseño e IA, las píldoras Desarrollo web / UX/UI Design / AI-powered products y los botones «Explorar proyectos» y «Contactar» (el de WhatsApp sigue en Contacto). Se sacó la nota «Busco sumarme a un equipo…» del hero porque no estaba en la propuesta; esa frase sigue en la sección de contacto.

- **VITRACK:** el piloto ya empezó. Estado en la tarjeta y en el caso: «En piloto con una bodega». El texto describe el piloto como estaba planificado en `docs/piloto.md` (dos a cuatro semanas, en paralelo con la planilla): confirmá que se está haciendo así. No se nombra la bodega.
- **Cuenta de demostración de VITRACK:** se está armando en su propio repositorio, aislada de los datos del piloto. Hasta entonces el enlace sigue llevando al ingreso por invitación.
- **Akoncagua y todos los proyectos:** se muestran.
- **Desarrollo asistido por IA:** se cuenta en «Cómo trabajo» (principio 03, «Programar con IA, sin delegar el criterio») y en «Mi parte» de VITRACK, RUTIX y TAKU D&D.
- **assets/img y assets/video:** borrados. Las fuentes que usan los scripts (diplomas, retrato, ilustraciones de Taku y el logo) pasaron a `tools/fuentes`.
- **Favicon:** el logo AM naranja, sin fondo, en PNG (32 y 192 px), ICO y ícono de iOS. En los tamaños chicos se usa la forma sin resplandor para que se lea.

## Octubre 2026 · rediseño con DESIGN.md: qué verificar

Todo lo nuevo sale de los README, `docs/` y commits de cada repositorio local. Lo que no pude confirmar:

- **Hero:** el titular pasó a «Diseño productos digitales y los programo.» (sin el spanglish de «Del research al deploy»). Ya no queda el `<portfolio_2026/>` que tenía la versión publicada.
- **VITRACK:** ¿ya empezó el piloto en una bodega? Escribí que «el siguiente paso documentado» es el piloto de 2 a 4 semanas (según `docs/piloto.md`). ¿Querés nombrar la bodega o al enólogo? No los nombré. El link lleva a la pantalla de ingreso, que pide invitación: ¿preferís sacarlo o armar una cuenta de demostración?
- **RUTIX:** no tiene demo ni repositorio público, así que no hay enlace. Las cifras de tests (315 pgTAP, 111 Deno, 105 Jest, 34 Vitest) salen del commit del 22/10.
- **Mi parte:** en VITRACK y RUTIX puse «producto, diseño, desarrollo y tests», como en las apps del Takuverso. Los commits llevan coautoría de un agente de IA: sigue abierta la pregunta de si querés contar en el sitio que desarrollás asistido por agentes.
- **Akoncagua:** lo sumé a «Sitios web» como negocio (es donde trabajás). ¿Está bien mostrarlo? Afirmo que la administradora ya usa el panel (commit «Guía de producción: la administradora ya usa el panel»).
- **A Mordidas:** actualicé la descripción y el stack al sitio nuevo en Next.js con panel de precios y stock.
- **Taku:** el modelo no tiene esqueleto. Para que camine moviendo piernas y brazos hace falta riggearlo (ver `docs/rediseno-design-md.md`, punto 4).

---

El brief editorial pide revisar la propuesta antes de publicar una reescritura extensa. Los textos nuevos ya están en `index.html`, pero solo en la rama `rediseno-liquid-glass`: no hay nada mergeado ni desplegado. Este documento sirve para aprobarlos, corregirlos o descartarlos.

**Criterio.** Cada dato salió de una fuente real (abajo, en «Fuentes»). Donde no tenía información, no completé: lo dejé fuera o lo marqué en «Verificar». Voz en primera persona y con voseo, como el sitio anterior. Saqué las fórmulas de venta de servicios.

---

## Metadatos y SEO

| | |
|---|---|
| **Antes** | Title «Alejo Morales — Diseño UX/UI & Desarrollo Front-End». Description «…productos digitales rápidos, cuidados y pensados para convertir». OG image `yo largo.png` con ruta relativa. |
| **Diagnóstico** | «Pensados para convertir» es tono de agencia. Una ruta relativa en `og:image` no funciona al compartir. |
| **Cambio** | Description concreta (casos, apps, stack, ciudad). `og:image` absoluta, 1200×630, generada con el objeto del hero. Agregué `og:locale`, `author`, favicon SVG y datos estructurados `Person` con email, ciudad, formación y temas. Sitemap con una sola URL. |
| **Verificar** | ¿Instagram `alejo.menta` es un perfil profesional? Lo saqué de los enlaces visibles y quedó solo en los datos estructurados. |

## Navegación

| | |
|---|---|
| **Antes** | Trabajos · Servicios · Sobre mí · Contacto, badge «Disponible para proyectos» y botón «Hablemos». En proyectos.html, otra navegación distinta. |
| **Cambio** | Una sola navegación: Trabajo · Takuverso · Proyectos · Sobre mí + Contacto. El badge pasa al hero como «Busco equipo: UX/UI o front-end · remoto o híbrido». |

## Hero

| | |
|---|---|
| **Antes** | «Alejo Morales» + «Diseño experiencias digitales modernas y las construyo con código propio. Ayudo a marcas y negocios a tener productos que se ven bien y que funcionan.» CTA «Trabajemos juntos». |
| **Diagnóstico** | «Ayudo a marcas y negocios» es venta de servicios. «Modernas» y «se ven bien» no dicen nada verificable. |
| **Cambio** | Titular «Del research al deploy.», con el nombre y el rol en el mismo `h1`. Bajada: «Investigo con usuarios, diseño en Figma y programo lo que diseño. Acá están mis proyectos, contados con lo que funcionó y con lo que todavía falta.» CTAs «Ver proyectos» y «Escribime». |
| **Verificar** | ¿Te sentís cómodo con un titular en spanglish? Alternativa más neutra: «De la investigación al código». |

## Trabajo seleccionado (nuevo formato de caso)

Antes había tres tarjetas de una línea con link de salida, y en proyectos.html tres descripciones distintas de MentaTools. Ahora son tres casos con problema, lo que hice, decisiones y estado. **Cambié MentaTools por TAKU D&D** como caso de desarrollo: tiene arquitectura, tests y decisiones documentadas en su README; MentaTools es un directorio de enlaces y pasó a «Otros proyectos».

### Zonaprop
- **Fuente**: la presentación de Google Slides (exportada y leída completa).
- **Conservé**: análisis heurístico y rediseño de la búsqueda.
- **Agregué**: tree test con 10 personas (20 % de éxito en la tarea 2 y 80 % de error; 40 % en la tarea 1 con 20 % de directness), 89,9 % de la encuesta, benchmark, persona, journey map, las tres soluciones y el estado honesto: **la propuesta no se validó con usuarios**.
- **Verificar**: ¿fue individual o en equipo? (la presentación habla en plural). ¿Año 2026? ¿Hay un link público al prototipo de Figma para sumarlo?

### TAKU D&D
- **Fuente**: README y `docs/captures` del repositorio.
- **Agregué**: el problema de los valores derivados, las tres decisiones de arquitectura explicadas sin jerga, el papel de Taku, cifras (264 tests + 48 de base de datos, 112 E2E, 3.039 definiciones del SRD) y «Lo que todavía no hace».
- **Verificar**: ¿la traducción del SRD al español la hiciste vos o con ayuda de IA? No lo afirmé. El repositorio es privado: ¿querés hacerlo público y sumar el link?

### A la Cancha
- **Fuentes**: archivo de Figma (textos), «Portfolio 1.jpg», conclusiones de entrevistas, POV, MVP, card sorting, wireframes y storyboard de tu carpeta del curso.
- **Agregué**: hallazgos de las 5 entrevistas, MVP con «postularse como jugador», card sorting con 10 participantes, evolución de wireframes (papel → baja → Material → alta) y lo que mostró el test con 5 personas.
- **Verificar**: el card sorting ¿fue en UXtweak u Optimal Workshop? La captura es de UXtweak y Figma dice Optimal Workshop, así que no nombré la herramienta. ¿Año 2025?

## Takuverso (sección nueva)

- **Fuentes**: README de cada repo, metadatos de cada deploy (verifiqué que responden) y tus ilustraciones de Taku.
- **Catálogo**: TAKU Organiza, TAKU D&D, TAKU Gastro, Trámite Claro y Giftly, con nombre, frase propia de cada app, para qué sirve, estado, stack y enlaces. «Código» solo aparece en los repos públicos: Organiza, Trámite Claro y Giftly.
- **Estados**: «Publicada» para las que tienen deploy; «Publicada · en desarrollo» para D&D; «MVP publicado» para Gastro, cuyo README dice que el piloto con A Mordidas está pendiente.
- **Verificar**:
  - Trámite Claro: el código usa React + Vite + Gemini, pero el CV dice Next.js + Claude API. En el sitio puse lo del código. ¿Cuál es el correcto? ¿Querés mencionar que se presentó en la CoderCup?
  - TAKU Gastro: el CV menciona la API de Claude y el README no. ¿Usa IA hoy? ¿En qué estado está el piloto?
  - Giftly no figura en tu CV; ¿lo sumamos?

## Otros proyectos (antes «Galería» en proyectos.html)

| | |
|---|---|
| **Antes** | «Soluciones digitales desarrolladas… con foco en rendimiento, experiencia de usuario y diseño moderno», descripciones del tipo «diseño moderno y responsive» repetidas en casi todas las tarjetas. |
| **Cambio** | Capturas nuevas de cada sitio en vivo. Una línea concreta por proyecto (qué es y qué resuelve) y la aclaración de tu CV: sitios ad honorem para emprendimientos entre 2024 y 2026. |
| **Verificar** | «El Mundo de Menta»: ¿es tu propio canal? Lo describí de forma neutral. MentaTools: está hecho con Lovable; ¿qué parte diseñaste o programaste vos? |

## Servicios y Beneficios (eliminadas)

«Dos disciplinas. Un mismo producto», «Entrega rápida: tu web lista en días», «100 % responsive», «Pensada para vender: diseñada con foco en generar clientes». Era tono freelance, como pedía sacar AGENTS.md (P3). La idea de las dos disciplinas sigue viva en el titular y en el objeto del hero. También salieron los dos videos de fondo (9 MB).

## Sobre mí

| | |
|---|---|
| **Antes** | «Diseño y programo el mismo producto de punta a punta… combino ambos para que el resultado no solo se vea bien, sino que funcione.» |
| **Diagnóstico** | Repetía el hero y no decía nada sobre vos como persona. |
| **Cambio** | Título «Vengo de las ventas». Tu recorrido real: más de 7 años en ventas y atención al cliente, Front-end en 2024, la carrera de UX/UI en 2025–2026. Después, «Cómo trabajo» con cuatro principios, cada uno con evidencia de un proyecto, herramientas, formación, experiencia y certificados. |
| **Verificar** | ¿Te parece bien mostrar los trabajos de ventas con el nombre de cada empresa? ¿Tenés un retrato en mejor resolución? El actual mide 408 px. |

## Contacto

| | |
|---|---|
| **Antes** | «¿Tenés un proyecto en mente?» + «Busco sumarme a un equipo… full-time, part-time o freelance» (y en proyectos.html: «Estoy disponible para trabajos freelance y contrataciones»). |
| **Cambio** | «Busco sumarme a un equipo de producto», con tu propia frase como base. El email grande con botón para copiar, y LinkedIn, GitHub, WhatsApp y CV. Saqué el botón flotante de WhatsApp. |
| **Verificar** | Saqué «o freelance». ¿Lo querés de vuelta? ¿El CV de Drive es la versión de septiembre (`CV_Alejo_Morales_Frontend_UXUI.pdf`)? |

## Microcopy y accesibilidad

- Todos los `alt` describen lo que muestra la imagen, por ejemplo «Modo Juego de TAKU D&D en escritorio: puntos de golpe con controles rápidos…».
- Los links externos avisan «(se abre en otra pestaña)» a lectores de pantalla.
- El botón de copiar anuncia «Email copiado» y, si el navegador no permite copiar, deja el email seleccionado.
- Footer: «Diseñado y programado con HTML, CSS y JavaScript. El 3D, con three.js.» y un link al código del sitio.

## Pregunta abierta

Tu CV dice «desarrollo asistido con agentes de IA», pero el portfolio no lo menciona. ¿Querés contarlo, por ejemplo en «Cómo trabajo»? Es información que muchos equipos valoran y evita malentendidos sobre cómo se hicieron las apps.

## Textos cambiados el 27/10 (aprobados por Alejo el 27/10)

Al achicar las tarjetas de Proyectos: título «Dos productos de punta a punta», bajada sin «Ninguno lo usa todavía un cliente a diario», y descripciones de una línea para VITRACK y RUTIX. Detalle en `docs/rediseno-design-md.md`, punto 10.

## Fuentes de los datos

README y metadatos de los 5 repos Taku · deploys verificados (`taku-ten`, `taku-dnd`, `taku-gastro`, `taku-giftly`, `tramite-claro-omega`) · `CV_Alejo_Morales_Frontend_UXUI.pdf` (27/09/2026) · presentación de Zonaprop en Google Slides · archivo de Figma «Portfolio Diseño Ux Ui» y carpeta `Diseño UX-UI/A la cancha` · certificados en `assets/img`.
