// ============================================================
// Alejo Morales — Portfolio
// Vanilla JS, sin dependencias. Cada feature corre aislada con
// safe(): si una falla, no rompe las demás ni deja contenido oculto.
// El 3D (js/gl/*) se carga aparte, tarde y solo si suma.
// ============================================================
(() => {
  'use strict';

  // Recién con JS activo el CSS oculta lo que se revela al hacer scroll.
  document.documentElement.classList.add('js');

  const safe = (name, fn) => {
    try { fn(); } catch (err) { console.warn(`[portfolio:${name}]`, err); }
  };

  const media = (q) => window.matchMedia(q);
  const reduceMotion = media('(prefers-reduced-motion: reduce)').matches;

  // WebGL solo si suma: sin "reducir movimiento", sin ahorro de datos y con contexto disponible
  const glAllowed = (() => {
    if (reduceMotion || navigator.connection?.saveData === true) return false;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch { return false; }
  })();
  // Equipos modestos (poca memoria o pocos núcleos) reciben la versión liviana del Takuverso
  const modestDevice = (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency || 8) < 4;
  const loadModule = (path) => import(new URL(path, document.baseURI).href);

  // ---------- Año del footer ----------
  safe('year', () => {
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  });

  // ---------- Menú móvil ----------
  safe('nav-sheet', () => {
    const nav = document.getElementById('nav');
    const toggle = document.querySelector('.nav-toggle');
    const sheet = document.getElementById('nav-sheet');
    if (!toggle || !sheet) return;
    const label = toggle.querySelector('.nav-toggle-label');

    const setOpen = (open, { focus = true } = {}) => {
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Cerrar' : 'Menú';
      sheet.hidden = !open;
      nav?.classList.toggle('is-open', open);
      if (open && focus) sheet.querySelector('a')?.focus();
      if (!open && focus) toggle.focus();
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false, { focus: false }); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sheet.hidden) setOpen(false);
    });
    document.addEventListener('click', (e) => {
      if (!sheet.hidden && !e.target.closest('#nav')) setOpen(false, { focus: false });
    });
    media('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setOpen(false, { focus: false }); });
  });

  // ---------- Nav: fondo al scrollear + sección activa ----------
  safe('nav-state', () => {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

    let ticking = false;
    const update = () => {
      ticking = false;
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      // Sección activa: la que cruza la línea a un tercio de la pantalla
      const line = window.innerHeight * 0.33;
      const current = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
      links.forEach((a) => {
        if (current && a.getAttribute('href') === `#${current.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  });

  // ---------- Revelado al hacer scroll ----------
  safe('reveal', () => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  });

  // ---------- Copiar email ----------
  safe('copy', () => {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      const label = btn.querySelector('[data-copy-label]');
      const status = btn.parentElement.querySelector('[data-copy-status]');
      const icon = btn.querySelector('use');
      let timer;
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
          btn.dataset.copied = 'true';
          if (label) label.textContent = 'Copiado';
          icon?.setAttribute('href', '#i-check');
          if (status) status.textContent = `Email copiado: ${text}`;
        } catch {
          // Sin permiso de portapapeles: dejamos el email seleccionado para copiar a mano.
          const link = btn.parentElement.querySelector('.mail-link');
          if (link) { const range = document.createRange(); range.selectNodeContents(link); getSelection().removeAllRanges(); getSelection().addRange(range); }
          if (status) status.textContent = 'No se pudo copiar automáticamente. El email quedó seleccionado.';
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          btn.dataset.copied = 'false';
          if (label) label.textContent = 'Copiar';
          icon?.setAttribute('href', '#i-copy');
        }, 2200);
      });
    });
  });

  // ---------- Pausar animaciones (WCAG 2.2.2) ----------
  // El campo de puntos y los pulsos del Takuverso se mueven solos: el botón del footer los
  // detiene y la elección queda guardada en este navegador. Con movimiento reducido ya están
  // quietos, así que el botón no se muestra.
  safe('motion-toggle', () => {
    const KEY = 'portfolio:animaciones-en-pausa';
    const html = document.documentElement;
    const buttons = [...document.querySelectorAll('[data-motion-toggle]')];
    if (reduceMotion) { buttons.forEach((b) => { b.closest('li')?.setAttribute('hidden', ''); }); return; }
    const set = (on) => {
      html.classList.toggle('is-still', on);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(on)));
      document.dispatchEvent(new Event('portfolio:motion'));
    };
    let saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch { /* sin almacenamiento: arranca en movimiento */ }
    set(saved);
    buttons.forEach((b) => b.addEventListener('click', () => {
      const on = !html.classList.contains('is-still');
      set(on);
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* no se recuerda, pero se aplica */ }
    }));
  });

  // ---------- Campo de puntos que sigue al mouse (todo el sitio) ----------
  // El del portfolio publicado, con la paleta de ahora: puntos marfil, uniones naranjas y,
  // dentro del Takuverso, todo en el verde de Taku. Un canvas fijo detrás de la página: se
  // desplaza un poco con el scroll (profundidad) y los puntos cercanos se acercan al puntero.
  // Con movimiento reducido, ahorro de datos o el botón de pausa queda quieto, dibujado una vez.
  safe('field', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext?.('2d');
    if (!ctx) return;
    canvas.className = 'field';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const still = reduceMotion || navigator.connection?.saveData === true;
    const root = getComputedStyle(document.documentElement);
    const rgb = (name) => root.getPropertyValue(name).trim().split(/\s+/).join(', ');
    const DOT = rgb('--ivory-rgb'), LINK = rgb('--ember-ink-rgb'), TAKU = rgb('--taku-rgb');
    const zone = document.getElementById('takuverso');
    const LINK_D = 130, MOUSE_D = 170;
    let w = 0, h = 0, pts = [], mouse = null, lastY = window.scrollY, raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(140, Math.round((w * h) / (w < 600 ? 16000 : 22000))));
      while (pts.length < n) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
      pts.length = n;
      pts.forEach((p) => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const z = zone?.getBoundingClientRect();
      const inZone = (y) => !!z && y > z.top && y < z.bottom;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 > LINK_D * LINK_D) continue;
          const t = 1 - Math.sqrt(d2) / LINK_D;
          const green = inZone(a.y) && inZone(b.y);
          ctx.strokeStyle = `rgba(${green ? TAKU : LINK}, ${(green ? 0.24 : 0.17) * t})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        if (mouse) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < MOUSE_D) {
            ctx.strokeStyle = `rgba(${inZone(a.y) ? TAKU : DOT}, ${0.24 * (1 - d / MOUSE_D)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = inZone(p.y) ? `rgba(${TAKU}, 0.6)` : `rgba(${DOT}, 0.5)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    };

    const step = () => {
      // Profundidad: el campo acompaña el scroll a un 15 % de la velocidad
      const dyScroll = (window.scrollY - lastY) * 0.15;
      lastY = window.scrollY;
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy - dyScroll;
        if (mouse) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d < MOUSE_D && d > 36) { const f = 0.22 * (1 - d / MOUSE_D); p.x += (dx / d) * f; p.y += (dy / d) * f; }
        }
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const paused = () => document.documentElement.classList.contains('is-still');
    const run = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (document.hidden) return;
      if (paused()) { draw(); return; }
      lastY = window.scrollY;
      raf = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener('resize', () => { resize(); if (still || paused()) draw(); }, { passive: true });
    if (still) { draw(); return; }
    window.addEventListener('pointermove', (e) => { mouse = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null; }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { mouse = null; });
    // En pausa se redibuja al hacer scroll solo para que el verde siga al Takuverso
    window.addEventListener('scroll', () => { if (!raf && paused()) draw(); }, { passive: true });
    document.addEventListener('visibilitychange', run);
    document.addEventListener('portfolio:motion', run);
    run();
  });

  // ---------- Hero: el texto sube y se desvanece al hacer scroll ----------
  // Escribe --hero-p (0 arriba, 1 cuando el hero ya salió); el CSS mueve el texto y el
  // retrato a distinta velocidad. Solo trabaja mientras el hero está en pantalla.
  safe('hero-scroll', () => {
    const hero = document.getElementById('inicio');
    if (!hero || reduceMotion) return;
    let visible = true, queued = false;
    const update = () => {
      queued = false;
      const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight)));
      hero.style.setProperty('--hero-p', p.toFixed(4));
    };
    const onScroll = () => { if (visible && !queued) { queued = true; requestAnimationFrame(update); } };
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; onScroll(); }).observe(hero);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  });

  // ---------- Takuverso: mapa, pestañas y Taku ----------
  safe('takuverso', () => {
    const world = document.querySelector('[data-tv]');
    const map = world?.querySelector('.tv-map');
    if (!world || !map) return;
    const tabs = [...world.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const svg = map.querySelector('.tv-path');
    const taku2d = map.querySelector('.tv-taku');
    let active = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
    let stage = null;

    // Centro de cada plataforma, en px relativos al mapa
    const pads = () => {
      const m = map.getBoundingClientRect();
      return tabs.map((t) => {
        const r = t.querySelector('.tv-pad').getBoundingClientRect();
        return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2 };
      });
    };

    // Camino suave entre paradas consecutivas (Catmull-Rom → Bézier). Por tramo: la base
    // punteada (la que sigue Taku) y la señal verde (halo + línea) que se enciende hasta la
    // parada activa.
    let segments = [], signals = [];
    const svgPath = (d, cls, unit) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', cls);
      if (unit) path.setAttribute('pathLength', '1');
      svg.appendChild(path);
      return path;
    };
    const drawPath = () => {
      const p = pads();
      const { width, height } = map.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.replaceChildren();
      const ds = p.slice(0, -1).map((p1, i) => {
        const p0 = p[i - 1] || p1, p2 = p[i + 1], p3 = p[i + 2] || p2;
        const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
        const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
        return `M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
      });
      segments = ds.map((d) => svgPath(d, 'tv-seg'));
      signals = ds.map((d, k) => {
        const lit = k < active ? ' is-lit' : '';
        return [svgPath(d, `tv-glow${lit}`, true), svgPath(d, `tv-line${lit}`, true)];
      });
    };
    // Enciende los tramos hasta la parada activa, uno detrás del otro en el sentido del viaje
    const SEG_MS = 380;
    const light = (from, to) => {
      signals.forEach((pair, k) => {
        const order = to > from ? k - from : from - 1 - k;
        pair.forEach((el) => {
          el.style.setProperty('--d', `${Math.max(0, order) * SEG_MS}ms`);
          el.classList.toggle('is-lit', k < to);
        });
      });
    };

    // Puntos que siguen el camino de una parada a otra (en cualquier sentido)
    const route = (from, to) => {
      const pts = [];
      const dir = from < to ? 1 : -1;
      for (let i = from; i !== to; i += dir) {
        const seg = segments[dir > 0 ? i : i - 1];
        if (!seg) break;
        const len = seg.getTotalLength();
        const n = Math.max(8, Math.round(len / 10));
        for (let k = pts.length ? 1 : 0; k <= n; k++) {
          const q = seg.getPointAtLength((dir > 0 ? k / n : 1 - k / n) * len);
          pts.push({ x: q.x, y: q.y });
        }
      }
      return pts;
    };

    // Taku en 2D: se para sobre la plataforma activa (sin WebGL o mientras carga el 3D)
    const place2d = (i, animate = true) => {
      const p = pads()[i];
      if (!p || !taku2d) return;
      if (!animate) taku2d.style.transition = 'none';
      taku2d.style.setProperty('--tx', `${p.x}px`);
      taku2d.style.setProperty('--ty', `${p.y}px`);
      if (!animate) { void taku2d.offsetWidth; taku2d.style.transition = ''; }
      map.classList.add('is-ready');
    };

    // Contador y barra de avance del escenario
    const counter = world.querySelector('[data-tv-index]');
    const total = world.querySelector('.tv-count-total');
    const two = (n) => String(n).padStart(2, '0');
    world.style.setProperty('--tv-n', tabs.length);
    if (total) total.textContent = `/ ${two(tabs.length)}`;
    const hud = (i) => {
      world.style.setProperty('--tv-i', i);
      if (counter) counter.textContent = two(i + 1);
    };
    // La ficha nueva entra animada (ventana, barrido, ficha y Taku vestido: ver estilos.css)
    const enter = (panel) => {
      panels.forEach((p) => p.classList.remove('is-in'));
      if (reduceMotion) return;
      void panel.offsetWidth;
      panel.classList.add('is-in');
    };

    const select = (i, { focus = false } = {}) => {
      if (i === active) { if (focus) tabs[i].focus(); return; }
      const from = active;
      active = i;
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
      light(from, i);
      hud(i);
      enter(panels[i]);
      place2d(i, !reduceMotion);
      stage?.goTo(i);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select((next + tabs.length) % tabs.length, { focus: true });
      });
    });
    world.querySelectorAll('[data-tv-step]').forEach((btn) => {
      btn.addEventListener('click', () => select((active + Number(btn.dataset.tvStep) + tabs.length) % tabs.length));
    });

    drawPath();
    hud(active);
    place2d(active, false);
    new ResizeObserver(() => { drawPath(); place2d(active, false); stage?.relayout(); }).observe(map);

    // La primera ficha también entra animada, cuando el escenario aparece en pantalla
    if ('IntersectionObserver' in window && !reduceMotion) {
      const seen = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.disconnect();
        enter(panels[active]);
      }, { threshold: 0.35 });
      seen.observe(world.querySelector('.tv-stage') || map);
    }

    // El 3D se descarga recién cuando el mapa se acerca a la pantalla
    if (!glAllowed || modestDevice || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      loadModule('js/gl/taku-world.js')
        .then((m) => { stage = m.mount(map, { pads, route, start: active }); })
        .catch((err) => console.warn('[portfolio:gl-taku]', err));
    }, { rootMargin: '500px 0px' });
    io.observe(map);
  });

  // ---------- Páginas de proyecto: índice con la sección activa ----------
  safe('toc', () => {
    const links = [...document.querySelectorAll('.case-toc a[href^="#"]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  });
})();
