/* Punktfeld (ab 1.38.0, Runde 111): ein Feld aus Punkten, das sich mit dem Scrollen ordnet. Kein Bild nötig.
   Am Behälter: data-grafik="punktfeld", data-form = eine der Formen unten, data-ton = "hell" (Standard) oder "dunkel".
     wolke    dichte Wolke links unten, die sich beim Scrollen über die ganze Breite verteilt (Referenz Talamus)
     band     verstreute Punkte ordnen sich zu einem Band in 45° (das Diagonal Ribbon der Marke, Plum)
     sammeln  vier Punktgruppen (die vier Herausforderungen) laufen zu einer Linie mit Pfeil zusammen (ein Weg nach vorn)
   Der Behälter braucht eine Höhe (z. B. absolut über die ganze Section oder feste Höhe). Fortschritt: 0, wenn die
   Oberkante unten ins Bild kommt, 1, wenn sie bei 15 % der Fensterhöhe steht. Leichtes Atmen der Punkte nur ohne
   «Bewegung reduzieren»; dann steht das fertige Bild. Farben aus den CI-Variablen.
   Ab 1.40.0: data-ablauf="film" (nur wolke) ohne Scroll-Kopplung: Sobald ein Viertel des Feldes sichtbar ist, öffnet sich
   die Wolke von selbst (1,8 s) und läuft dann als Film weiter (1.39.0: Öffnen noch mit dem Scrollen).
   Film: sie zieht sich langsam
   zu vier Gruppen zusammen (unter den vier Karten) und öffnet sich wieder (Takt rund 11 s). Läuft nur, solange das Feld
   sichtbar ist; bei «Bewegung reduzieren» steht die offene Wolke. */
import { reduziert, clamp, easeInOut, sobaldNahe, ciFarbe, takt } from './util.js';

function zufall(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function gauss(zz) { let u = 0; for (let i = 0; i < 4; i++) u += zz(); return (u - 2) / 1.1; }

export function punktfeld(el) {
  const form = (el.getAttribute('data-form') || 'wolke').trim().toLowerCase();
  const dunkel = (el.getAttribute('data-ton') || '').trim().toLowerCase() === 'dunkel';
  const film = form === 'wolke' && (el.getAttribute('data-ablauf') || '').trim().toLowerCase() === 'film';
  let filmStart = -1, filmSeit = -1;
  const ruhig = reduziert();
  /* ab 1.42.0: data-ziel (CSS-Auswahl, nur wolke): Beim Weiterscrollen fliessen die Punkte in das Element darunter und bilden
     dort das Diagonal-Band (45°, wie Form band). Die Leinwand liegt dann fest über dem Fenster (position:fixed). */
  const zielSel = (el.getAttribute('data-ziel') || '').trim();
  const ziel = form === 'wolke' && zielSel && !ruhig ? document.querySelector(zielSel) : null;
  const sicht = new Set();
  const zz = zufall(form.length * 977 + 111);
  const PLUM = ciFarbe('plum-perfect', '#AA1351'), SEA = ciFarbe('sea-cliff', '#A0C4DF');
  const MANG = ciFarbe('manganese-black', '#1D3149'), SERP = ciFarbe('great-serpent', '#486EA3');
  const PLUMH = [224, 69, 127];
  let cv, ctx, B = 0, H = 0, P = [], sichtbarJetzt = false, aus = null, letztP = -1;

  function punkte() {
    P = [];
    const n = form === 'wolke' ? 2600 : form === 'band' ? 1900 : 1700;
    const lang = Math.hypot(B, H);
    for (let i = 0; i < n; i++) {
      let sx, sy, tx, ty, c0, c1, r;
      if (form === 'wolke') {
        /* dichte Wolke → weite Streuung, Plum-lastig wie die Referenz, dazu Manganese/Serpent */
        sx = 0.3 * B + gauss(zz) * 0.06 * B; sy = 0.62 * H + gauss(zz) * 0.11 * H;
        const weit = zz() < 0.55;
        tx = weit ? zz() * B : 0.34 * B + gauss(zz) * 0.2 * B;
        ty = weit ? zz() * H : 0.58 * H + gauss(zz) * 0.22 * H;
        const k = zz();
        c0 = k < 0.62 ? PLUM : k < 0.8 ? PLUMH : k < 0.92 ? SERP : MANG; c1 = c0;
        r = zz() < 0.06 ? 2.6 + zz() * 1.6 : 0.9 + zz() * 1.5;
      } else if (form === 'band') {
        /* verstreut → Band in 45° durch das rechte Drittel (Text bleibt frei) */
        sx = zz() * B; sy = zz() * H;
        const t = zz(), x0 = 0.56 * B - 0.2 * H, y0 = H * 1.15;
        const bx = x0 + t * (H * 1.3), by = y0 - t * (H * 1.3);
        const quer = gauss(zz) * 0.055 * H;
        tx = bx + quer * 0.7071; ty = by + quer * 0.7071;
        c0 = zz() < 0.5 ? SEA : SERP; c1 = zz() < 0.85 ? (dunkel ? PLUMH : PLUM) : SEA;
        r = 0.9 + zz() * 1.4;
      } else {
        /* sammeln: vier Gruppen → eine Linie mit Pfeil unter dem Text */
        const g = i % 4, gx = (0.14 + g * 0.24) * B;
        sx = gx + gauss(zz) * 0.045 * B; sy = 0.5 * H + gauss(zz) * 0.16 * H;
        const pfeil = zz() < 0.16;
        if (!pfeil) { tx = (0.3 + zz() * 0.4) * B; ty = 0.86 * H + gauss(zz) * 0.006 * H; }
        else {
          const a = zz(), seite = zz() < 0.5 ? -1 : 1, L = 0.035 * B;
          tx = 0.7 * B - a * L; ty = 0.86 * H + seite * a * L * 0.8;
        }
        c0 = dunkel ? SEA : SERP; c1 = dunkel ? PLUMH : PLUM;
        r = 1 + zz() * 1.3;
      }
      const g = i % 4;
      const gx = (0.125 + g * 0.25) * B + gauss(zz) * 0.045 * B, gy = 0.56 * H + gauss(zz) * 0.12 * H;
      const q = { sx, sy, tx, ty, gx, gy, c0, c1, r, v: zz() * 0.35, ph: zz() * 6.283, a: 0.45 + zz() * 0.55 };
      if (ziel) { q.rt = zz(); q.rg = gauss(zz); q.rc = zz() < 0.85 ? PLUMH : SEA; }
      P.push(q);
    }
    P.lang = lang;
  }

  function vorbereiten() {
    const rr = el.getBoundingClientRect();
    B = rr.width; H = rr.height;
    if (B < 20 || H < 20) return false;
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      if (ziel) { cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:1'; document.body.appendChild(cv); }
      else {
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(cv);
      }
      ctx = cv.getContext('2d');
    }
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const CW = ziel ? innerWidth : B, CH = ziel ? innerHeight : H;
    cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    punkte(); letztP = -1;
    return true;
  }

  function fortschritt() {
    if (ruhig) return 1;
    if (film) return filmSeit < 0 ? 0 : clamp((performance.now() - filmSeit) / 1800, 0, 1);
    const r = el.getBoundingClientRect();
    /* Film: früher ganz offen (Oberkante bei 45 % der Fensterhöhe), damit der Film läuft, solange die Karten im Bild sind */
    return clamp((innerHeight * 0.95 - r.top) / (innerHeight * (film ? 0.5 : 0.8)), 0, 1);
  }

  function zeichne(zeit) {
    if (!ctx) return;
    const p = fortschritt();
    let ox = 0, oy = 0, p2 = 0, zr = null;
    if (ziel) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const fr = el.getBoundingClientRect(); ox = fr.left; oy = fr.top;
      zr = ziel.getBoundingClientRect();
      p2 = clamp((innerHeight * 0.95 - zr.top) / (innerHeight * 0.6), 0, 1);
    } else ctx.clearRect(0, 0, B, H);
    if (film && !ruhig && p >= 0.999 && filmStart < 0) filmStart = zeit;
    const filmT = filmStart < 0 ? -1 : (zeit - filmStart) / 11000 * 6.283;
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      const e = easeInOut(clamp((p - q.v * 0.6) / 0.6, 0, 1));
      const atmen = ruhig ? 0 : Math.sin(zeit * 0.0006 + q.ph) * 1.4;
      let x = q.sx + (q.tx - q.sx) * e + atmen;
      let y = q.sy + (q.ty - q.sy) * e + Math.cos(zeit * 0.0005 + q.ph) * (ruhig ? 0 : 1.1);
      if (filmT >= 0) {
        /* Film: weich zu den vier Gruppen und zurück, jeder Punkt leicht versetzt */
        const f = easeInOut(clamp(0.5 - 0.5 * Math.cos(filmT - q.v * 1.6), 0, 1)) * 0.88;
        x += (q.gx - x) * f; y += (q.gy - y) * f;
      }
      let c = [q.c0[0] + (q.c1[0] - q.c0[0]) * e, q.c0[1] + (q.c1[1] - q.c0[1]) * e, q.c0[2] + (q.c1[2] - q.c0[2]) * e];
      let alpha = q.a * (form === 'wolke' ? 1 - e * 0.35 : 0.55 + e * 0.45);
      if (ziel) {
        x += ox; y += oy;
        const e2 = easeInOut(clamp((p2 - q.v * 0.7) / 0.55, 0, 1));
        if (e2 > 0) {
          /* Ziel: Band 45° durch das rechte Drittel des Zielelements (wie Form band) */
          const ZB = zr.width, ZH = zr.height, quer = q.rg * 0.055 * ZH;
          const bx = zr.left + 0.56 * ZB - 0.2 * ZH + q.rt * ZH * 1.3 + quer * 0.7071;
          const by = zr.top + ZH * 1.15 - q.rt * ZH * 1.3 + quer * 0.7071;
          x += (bx - x) * e2; y += (by - y) * e2;
          c = [c[0] + (q.rc[0] - c[0]) * e2, c[1] + (q.rc[1] - c[1]) * e2, c[2] + (q.rc[2] - c[2]) * e2];
          alpha = alpha + (q.a - alpha) * e2;
          /* angekommen: nur innerhalb des Zielelements zeigen (wie die Form band in ihrem Feld) */
          if (y < zr.top || y > zr.bottom || x < zr.left || x > zr.right) alpha *= 1 - e2;
        }
        if (y < -10 || y > innerHeight + 10) continue;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      ctx.beginPath(); ctx.arc(x, y, q.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    letztP = p;
  }

  sobaldNahe(el, () => {
    if (!vorbereiten()) {
      /* versteckter Entwurf: warten, bis er sichtbar wird */
      const ro = new ResizeObserver(() => { if (vorbereiten()) { ro.disconnect(); start(); } });
      ro.observe(el);
      return;
    }
    start();
  }, '50% 0px');

  function start() {
    zeichne(0);
    addEventListener('resize', () => { if (vorbereiten()) zeichne(performance.now()); });
    if (ruhig) return;
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) sicht.add(e.target); else sicht.delete(e.target); });
      sichtbarJetzt = sicht.size > 0;
      if (!sichtbarJetzt && ziel && ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (sichtbarJetzt && !aus) aus = takt(t => { if (!sichtbarJetzt) { aus = null; return false; } zeichne(t); });
    });
    io.observe(el);
    if (ziel) io.observe(ziel);
    if (film) new IntersectionObserver(es => { if (filmSeit < 0 && es[0].intersectionRatio >= 0.25) filmSeit = performance.now(); }, { threshold: [0, 0.25] }).observe(el);
  }
}
