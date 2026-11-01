/* Treppe «Unser Vorgehen»: Die vier Stufen bauen sich nacheinander aus dem Standbild auf, die Phasen in der Liste
   leuchten dazu der Reihe nach auf; danach steht wieder Phase 01 (data-modus="folge", Standard).
   data-modus="ruhig": Aufbau ohne Farbwechsel, danach Phase 01; gewechselt wird nur auf Wunsch.
   data-modus="tabs": wie «ruhig», dazu Reiter [data-phase-tab] und Texttafeln [data-phase] (Klasse is-aktiv). Ein Klick auf eine Phase (oder auf eine Stufe)
   hebt deren Stufe hervor: Plum füllt sie von unten, eine Linie markiert sie.
   Vorlage ist das PNG im Bildfeld (Stufen im Ruhezustand); die Hervorhebung entsteht daraus, ohne zweiten Download. */
import { clamp, easeOut, easeInOut, lerp, zahl, sobaldNahe, takt, ciFarbe, beiMaus } from './util.js';

/* Spaltengrenzen und Grundlinie des mitgelieferten Bildes (Anteile von Breite und Höhe), siehe figuren/treppe.js */
const GRENZEN = [0.258, 0.498, 0.755];
const LINIE = [[0.03, 0.214], [0.28, 0.463], [0.529, 0.713], [0.779, 0.963]];
const GRUND = 0.957;

export function treppe(box) {
  const img = box.querySelector('img');
  if (!img || !/\.png(\?|\s|$)/i.test(img.getAttribute('src') || '')) return;
  const sec = box.closest('section') || document.body;
  const modus = (box.getAttribute('data-modus') || 'folge').trim().toLowerCase();
  const folge = modus === 'folge';
  const schritte = [...sec.querySelectorAll('.step_item, [data-phase-tab]')];
  const tafeln = [...sec.querySelectorAll('[data-phase]')];
  const r0 = box.getBoundingClientRect();
  if (r0.top < innerHeight && r0.bottom > 0) return;

  const eigene = (box.getAttribute('data-spalten') || '').split(',').map(parseFloat).filter(isFinite);
  const grenzen = [0, ...(eigene.length === 3 ? eigene : GRENZEN), 1];
  const linie = eigene.length === 3 ? grenzen.slice(0, 4).map((g, k) => [g + 0.03, grenzen[k + 1] - 0.03]) : LINIE;
  const N = 4;
  const tempo = clamp(zahl(box, 'data-tempo', 1), 0.2, 3);
  const plum = ciFarbe('plum-perfect', '#AA1351');
  const plumCss = `rgb(${plum.join(',')})`;

  let cv, ctx, W = 0, H = 0, neutral, getont, teile = null, t0 = 0, gebaut = false, laeuft = false, manuell = false;
  let aktiv = 0, zurueck = 0;
  const ton = [0, 0, 0, 0], ziel = [0, 0, 0, 0], fuell = [1, 1, 1, 1];
  const lin = { x0: 0, x1: 0, a: 0, ziel: 0 };

  /* Liste: Phase hervorheben */
  function markiere(k) {
    schritte.forEach((s, i) => {
      const an = i === k;
      s.classList.toggle('is-aktiv', an);
      const n = s.querySelector('.step_number');
      if (n) n.classList.toggle('is-aktiv', an);
      if (an) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    tafeln.forEach((t, i) => t.classList.toggle('is-aktiv', i === k));
  }

  function setAktiv(k, neu) {
    if (k === aktiv && !neu) return;
    aktiv = k;
    markiere(k);
    for (let i = 0; i < N; i++) ziel[i] = i === k ? 1 : 0;
    if (gebaut) fuell[k] = 0;
    lin.ziel = 1;
    los();
  }

  /* Bedienung: Phase in der Liste oder Stufe im Bild */
  schritte.slice(0, N).forEach((s, k) => {
    s.tabIndex = 0;
    s.setAttribute('role', 'button');
    s.style.cursor = 'pointer';
    const waehle = neu => { manuell = true; setAktiv(k, neu); };
    if (s.matches('.step_item')) beiMaus(() => s.addEventListener('mouseenter', () => waehle(false)));
    s.addEventListener('click', () => waehle(true));
    s.addEventListener('focus', () => waehle(false));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle(true); } });
  });
  /* Handy: Wischt man durch die Phasen-Karten, wird die vorne stehende Karte aktiv (Plum-Nummer läuft mit, seit 1.18.0) */
  const liste = schritte[0] && schritte[0].matches('.step_item') ? schritte[0].parentElement : null;
  if (liste) {
    let geplant = false;
    liste.addEventListener('scroll', () => {
      if (geplant) return;
      geplant = true;
      requestAnimationFrame(() => {
        geplant = false;
        const max = liste.scrollWidth - liste.clientWidth;
        if (max < 2) return;
        const x = liste.scrollLeft, x0 = schritte[0].offsetLeft;
        let k = 0, d = Infinity;
        schritte.slice(0, N).forEach((s, i) => { const a = Math.abs(s.offsetLeft - x0 - x); if (a < d) { d = a; k = i; } });
        if (x >= max - 2) k = Math.min(N, schritte.length) - 1;
        manuell = true;
        setAktiv(k, false);
      });
    }, { passive: true });
  }
  box.addEventListener('click', e => {
    if (!cv) return;
    const x = (e.clientX - cv.getBoundingClientRect().left) / W;
    for (let k = 0; k < N; k++) if (x < grenzen[k + 1]) { manuell = true; setAktiv(k, true); break; }
  });

  /* Vorbereiten, sobald die Treppe näher als 1,5 Bildschirmhöhen ist */
  sobaldNahe(box, () => {
    img.loading = 'eager';
    const bereit = () => {
      if (!einrichten()) return;
      img.style.opacity = '0';
      /* Aufbau, sobald die Treppe in der Bildmitte steht */
      sobaldNahe(box, starten, '-35% 0px -35% 0px');
    };
    if (img.complete && img.naturalWidth) bereit();
    else img.addEventListener('load', bereit, { once: true });
  }, '150% 0px');

  /* Leinwand in Grösse des Bildes, dazu zwei Vorlagen: Ruhezustand und Plum */
  function einrichten() {
    W = img.clientWidth; H = img.clientHeight;
    if (!W || !H || !img.naturalWidth) return false;
    const dpr = Math.min(devicePixelRatio || 1, 2), pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      img.insertAdjacentElement('afterend', cv);
      ctx = cv.getContext('2d');
      new ResizeObserver(() => {
        if (img.clientWidth && Math.abs(img.clientWidth - W) > 1 && einrichten() && t0) { if (!gebaut) fertigBauen(); zeichne(); }
      }).observe(img);
    }
    cv.width = pw; cv.height = ph;
    cv.style.cssText = `position:absolute;left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${W}px;height:${H}px;cursor:pointer`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    neutral = vorlage(pw, ph, null);
    getont = vorlage(pw, ph, plumCss);
    teile = null;
    return true;
  }

  function vorlage(pw, ph, farbe) {
    const c = document.createElement('canvas');
    c.width = pw; c.height = ph;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, pw, ph);
    if (farbe) { x.globalCompositeOperation = 'source-in'; x.fillStyle = farbe; x.fillRect(0, 0, pw, ph); }
    return c;
  }

  /* Ausschnitte je Stufe, von unten nach oben */
  function zerlegen() {
    const menge = 2400 * clamp(zahl(box, 'data-dichte', 1), 0.3, 2) * (innerWidth < 700 ? 0.6 : 1);
    const c = Math.max(4, Math.round(Math.sqrt((W * H) / menge)));
    teile = [];
    for (let k = 0; k < N; k++) {
      const x0 = grenzen[k] * W, x1 = grenzen[k + 1] * W, fw = x1 - x0, L = [];
      for (let y = 0; y < H; y += c) for (let x = x0; x < x1; x += c) {
        const w = Math.min(c, x1 - x), h = Math.min(c, H - y);
        const ax = x + (Math.random() - 0.5) * fw * 0.3, ay = H + 4 + Math.random() * 12;
        L.push({ x, y, w, h, ax, ay, k: (1 - y / H) * 0.85 + Math.random() * 0.15,
          cx: (ax + x) / 2 + (Math.random() - 0.5) * fw * 0.2, cy: Math.min(ay, y) - Math.random() * H * 0.1 });
      }
      teile.push(L);
    }
  }

  const SPREAD = 0.55, DAUER = 0.85, ABSTAND = 0.95;
  const start = k => (k * ABSTAND) / tempo;
  const ende = () => start(N - 1) + (SPREAD + DAUER) / tempo;

  function starten() {
    zerlegen();
    t0 = performance.now();
    los();
  }

  function fertigBauen() { teile = null; gebaut = true; for (let i = 0; i < N; i++) fuell[i] = 1; }

  /* ein gemeinsamer Takt für Aufbau, Überblendungen und Linie; ruht, sobald alles steht */
  let tLetzt = 0;
  function los() {
    if (laeuft || !cv) return;
    laeuft = true; tLetzt = performance.now();
    takt(now => {
      const dt = Math.min(0.05, (now - tLetzt) / 1000); tLetzt = now;
      const t = (now - t0) / 1000;
      if (teile) {
        /* Phasen der Reihe nach, solange niemand selbst wählt */
        if (!manuell && folge) for (let k = N - 1; k >= 0; k--) if (t >= start(k) + 0.15) { if (aktiv !== k || !ziel[k]) setAktiv(k, true); break; }
        if (t >= ende()) { fertigBauen(); zurueck = manuell ? 0 : now + (folge ? 1500 : 200); }
      }
      if (zurueck && now >= zurueck) { zurueck = 0; if (!manuell) setAktiv(0, true); }
      let ruhig = !teile && !zurueck;
      for (let i = 0; i < N; i++) {
        const z = ziel[i];
        ton[i] = z > ton[i] ? Math.min(z, ton[i] + dt / 0.25) : Math.max(z, ton[i] - dt / 0.5);
        if (gebaut && fuell[i] < 1) fuell[i] = Math.min(1, fuell[i] + dt / 0.8);
        if (ton[i] !== z || fuell[i] < 1) ruhig = false;
      }
      const L = linie[aktiv], f = Math.min(1, dt * 7);
      lin.x0 = lin.a ? lerp(lin.x0, L[0], f) : L[0]; lin.x1 = lin.a ? lerp(lin.x1, L[1], f) : L[1];
      lin.a = Math.min(lin.ziel, lin.a + dt / 0.4);
      if (Math.abs(lin.x0 - L[0]) > 0.0005 || lin.a < lin.ziel) ruhig = false;
      zeichne(t);
      if (ruhig) laeuft = false;
      return !ruhig;
    });
  }

  function zeichne(t) {
    ctx.clearRect(0, 0, W, H);
    const s = neutral.width / W;
    if (teile) {
      for (let k = 0; k < N; k++) {
        const t1 = (t - start(k)) * tempo;
        if (t1 <= 0) continue;
        for (const p of teile[k]) {
          const u = clamp((t1 - p.k * SPREAD) / DAUER, 0, 1);
          if (u <= 0) continue;
          const e = easeOut(u), m = 1 - e;
          const x = m * m * p.ax + 2 * m * e * p.cx + e * e * p.x, y = m * m * p.ay + 2 * m * e * p.cy + e * e * p.y;
          const a = u < 0.3 ? u / 0.3 : 1;
          if (ton[k] < 1) { ctx.globalAlpha = a; ctx.drawImage(neutral, p.x * s, p.y * s, p.w * s, p.h * s, x, y, p.w, p.h); }
          if (ton[k] > 0) { ctx.globalAlpha = a * ton[k]; ctx.drawImage(getont, p.x * s, p.y * s, p.w * s, p.h * s, x, y, p.w, p.h); }
        }
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(neutral, 0, 0, W, H);
      for (let k = 0; k < N; k++) {
        if (ton[k] <= 0) continue;
        const x0 = grenzen[k] * W, x1 = grenzen[k + 1] * W, y0 = H * (1 - easeInOut(fuell[k]));
        ctx.globalAlpha = ton[k];
        ctx.drawImage(getont, x0 * s, y0 * s, (x1 - x0) * s, (H - y0) * s, x0, y0, x1 - x0, H - y0);
      }
      ctx.globalAlpha = 1;
    }
    /* Linie unter der aktiven Stufe */
    if (lin.a > 0) {
      ctx.globalAlpha = lin.a;
      ctx.fillStyle = plumCss;
      ctx.fillRect(lin.x0 * W, GRUND * H + (H - GRUND * H) * 0.5, (lin.x1 - lin.x0) * W, Math.max(2, H * 0.004));
      ctx.globalAlpha = 1;
    }
  }
}
