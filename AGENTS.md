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
- Si hace falta resolver la duplicación de tarjetas de proyecto o automatizar la
  optimización de imágenes, se puede sumar un paso de build MÍNIMO (Vite solo para
  procesar assets, o un template engine liviano tipo Eleventy). Evaluar antes de sumarlo.
- Deploy: Vercel, desde este repo.

## Estructura actual
- `index.html` — página principal
- `pages/proyectos.html` — listado extendido de proyectos (probablemente se fusiona con
  index una vez que P2 reduzca la cantidad de proyectos mostrados en profundidad)
- `css/estilos.css` — un solo stylesheet, con sistema de variables en `:root` — mantenerlo,
  es una buena base
- `js/script.js`, `js/animations.js` — vanilla JS, patrón IIFE + wrapper `safe()` por
  feature (si una rompe, no tira abajo el resto). Mantener ese patrón al agregar features.
- `assets/img`, `assets/video` — pesado, ver P4.

## Convenciones a respetar
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

## Tareas de este rediseño, en orden

### 🔴 P0 — bugs en vivo (primero, aislado de todo lo demás)
1. El mailto de Contacto usa un placeholder — `tuemail@gmail.com` — en `index.html` Y en
   `pages/proyectos.html`. Reemplazar por el email real de Alejo.
   **PENDIENTE: falta el email real, no inventar uno.**
2. En `pages/proyectos.html`, la card "MentaTools" de la sección Destacados tiene
   `href="#"`. Debe apuntar a `https://mentatool.lovable.app` (la URL correcta, ya usada
   en otra parte de la misma página).

### P1 — paleta: implementar AMBAS direcciones con toggle
Objetivo: decidir viendo el sitio real, no una maqueta. Agregar un segundo set de tokens
activado por una clase en `<body>` (ej. `body.theme-b`). Una vez que Alejo elige, se borra
el toggle y los tokens de la dirección descartada.

**Dirección A — oscura (grafito cálido + naranja quemado). Default sugerido.**
```css
--bg: #1a1817;
--surface: #221f1d;
--text: #f2ede6;
--text-dim: #a39d94;
--accent: #e0682c;         /* como texto/link sobre bg: 5.21:1 — AA en cualquier tamaño */
--accent-text-on: #1a1817; /* texto oscuro sobre botones con fondo --accent: 5.21:1 AA */
```

**Dirección B — clara (piedra cálida + naranja quemado, más oscuro para contraste).**
```css
--bg: #f2ede6;
--surface: #e8e0d5;
--text: #1c1917;
--text-dim: #6b6259;
--accent: #b8501f;         /* como texto/link sobre bg: 4.29:1 — AA solo en texto grande,
                               usar en botones/headings, NO en links de texto corrido chico */
--accent-text-on: #ffffff; /* texto blanco sobre botones con fondo --accent: 4.99:1 AA */
```

Mantener la tipografía actual (Space Grotesk / Inter / IBM Plex Mono) — eso no es parte de
esta decisión. Aplicar el toggle a TODO el sitio, no solo el hero, para comparar en contexto real.

### P2 — contenido: reescribir Trabajos como case studies reales
Elegir 3-4 proyectos y expandirlos con estructura problema → proceso/decisiones → resultado
(no un párrafo de una línea + link de salida). Candidatos por material ya existente:
- **A la Cancha** — research + wireframes en Figma → caso UX/UI
- **Zonaprop Rediseño** — auditoría heurística en Slides → caso UX/UI
- **MentaTools** — web app real deployada → caso Dev
- Un cuarto a elección de Alejo entre el resto (boda, Elmentaa, Forza, etc.)

El resto de los proyectos puede quedar en una grilla más liviana debajo, sin duplicar
descripciones entre `index.html` y `proyectos.html` como pasa hoy con MentaTools (3
versiones distintas del mismo proyecto).

### P3 — barrer tono freelance + unificar navegación
- Quitar sección Paquetes.
- Reescribir o quitar sección Beneficios ("Entrega rápida", "Pensada para vender").
- Badge "Disponible para proyectos" → reformular para contexto de búsqueda laboral.
- CTA principal del hero: hoy "Trabajemos juntos" apunta a `#paquetes` (que se borra) —
  cambiar a algo tipo "Ver proyectos", apuntando a la sección de trabajos.
- Unificar `index.html` y `pages/proyectos.html` en una sola navegación — evaluar si
  después de P2 (menos proyectos, más profundos) hace falta una segunda página.
- Quitar la card "Próximamente" (placeholder vacío).

### P4 — performance
- `assets/` pesa 65,2MB hoy. De eso, ~37,6MB no está referenciado en ningún HTML/CSS/JS
  (confirmado con script de auditoría — cualquier archivo en `assets/img` que no aparezca
  en un `grep -r` por html/css/js es candidato a borrar).
- Las imágenes de proyectos son PNG sin comprimir, mostradas en cards de unos cientos de
  px con originales de 1500-2500px de ancho. Convertir a WebP y generar tamaños acordes
  al display real.

### P5 — accesibilidad
- El token actual `--text-faint` (#6b6b76) da 3.5-3.8:1 sobre el fondo — falla AA en los
  tamaños chicos donde se usa (nav-idx, price-sub, footer). Al definir la paleta nueva
  (P1), verificar que el token equivalente cumpla ≥4.5:1 en esos mismos usos.

## Cómo trabajamos
Alejo ejecuta con OpenCode. Claude (chat separado) revisa cada avance antes de dar por
cerrada una tarea — comparte diff, capturas, o el zip/preview actualizado. No dar por
mergeado P2 o P3 sin esa revisión: son cambios de contenido y tono, no solo técnicos,
y ahí es más fácil que un agente reintroduzca sin querer el tono freelance que se está
sacando.
