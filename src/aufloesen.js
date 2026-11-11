/* Auflösen (ab 1.43.0, Runde 117): Bilder in einem Bereich (z. B. die vier Katalog-Szenen der Herausforderungen) lösen sich
   beim Weiterscrollen in Punkte auf. Die Punkte fliessen in ein Zielelement darunter und bilden dort das Diagonal-Band 45°
   (das Ribbon der Marke). Zurückscrollen setzt die Bilder wieder zusammen.

   Am Behälter: data-grafik="aufloesen", data-ziel = CSS-Auswahl des Zielelements (z. B. [data-feld="band"]).
   Optional: data-bilder (CSS-Auswahl der Bilder im Behälter, Standard img), data-ton "hell" (Bilder stehen auf hellem
   Grund, Punkte dunkel) oder "dunkel" (Standard, Punkte hell). Bilder: PNG oder WebP mit transparentem Grund.
   Fortschritt: 0, wenn die Oberkante des Ziels bei 72 % der Fensterhöhe steht, 1 bei 10 %. Die Anzeige folgt dem Scrollen
   mit sanfter Verzögerung (rund 0,45 s). Ab 1.44.0 liegt die Leinwand im Seitenfluss (absolut, scrollt mit), damit das
   Band beim Scrollen nicht nachhinkt und nicht aus dem Ziel läuft.
   Bei «Bewegung reduzieren» geschieht nichts: Die Bilder bleiben stehen. */
import { reduziert, clamp, easeInOut, sobaldNahe, ciFarbe, takt } from './util.js';

const JE_BILD = 650;

function zufall(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function gauss(zz) { let u = 0; for (let i = 0; i < 4; i++) u += zz(); return (u - 2) / 1.1; }

/* sichtbarer Bildrahmen im Element (object-fit contain/cover) */
const STIL = new WeakMap();
function rahmen(img) {
  const r = img.getBoundingClientRect(), nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
  let cs = STIL.get(img);
  if (!cs) { const c = getComputedStyle(img); cs = { objectFit: c.objectFit, objectPosition: c.objectPosition }; STIL.set(img, cs); }
  let w = r.width, h = r.height;
  if (cs.objectFit === 'contain' || cs.objectFit === 'cover') {
    const s = cs.objectFit === 'cover' ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh);
    w = nw * s; h = nh * s;
  }
  const pos = cs.objectPosition.split(' ').map(p => (p.endsWith('%') ? parseFloat(p) / 100 : 0.5));
  return { x: r.left + (r.width - w) * pos[0], y: r.top + (r.height - h) * (pos[1] ?? 0.5), w, h };
}

function laden(src) {
  return new Promise(res => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = src;
  });
}

function abtasten(bild, zz) {
  const S = 220, q = bild.naturalWidth / bild.naturalHeight || 1;
  const w = q >= 1 ? S : Math.round(S * q), h = q >= 1 ? Math.round(S / q) : S;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(bild, 0, 0, w, h);
  let d;
  try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }
  const kand = [];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const o = (y * w + i) * 4, a = d[o + 3];
    if (a < 80) continue;
    const r = d[o], g = d[o + 1], b = d[o + 2];
    kand.push({ u: (i + 0.5) / w, v: (y + 0.5) / h, l: (r + g + b) / 765, p: r > g + 45 && r > b + 10 ? 1 : 0 });
  }
  if (!kand.length) return null;
  const out = [];
  for (let n = 0; n < JE_BILD; n++) out.push(kand[Math.floor(zz() * kand.length)]);
  return out;
}

export function aufloesen(el) {
  if (reduziert()) return;
  const ziel = document.querySelector((el.getAttribute('data-ziel') || '').trim() || '[data-feld="band"]');
  if (!ziel) return;
  const bilder = [...el.querySelectorAll(el.getAttribute('data-bilder') || 'img')];
  if (!bilder.length) return;
  const hell = (el.getAttribute('data-ton') || '').trim().toLowerCase() === 'hell';
  const zz = zufall(117);
  const MANG = ciFarbe('manganese-black', '#1D3149'), SERP = ciFarbe('great-serpent', '#486EA3');
  const SEA = ciFarbe('sea-cliff', '#A0C4DF'), PLUM = ciFarbe('plum-perfect', '#AA1351');
  const PLUMH = [224, 69, 127], WEISS = [255, 255, 255];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  let cv, ctx, P = [], aus = null, sichtbar = new Set(), aufgeloest = false, anz = 0, letzt = 0, OT = 0, OH = 0, OW = 0;

  function farbe(k) {
    if (k.p) return hell ? PLUM : PLUMH;
    return hell ? mix(MANG, SERP, clamp((1 - k.l) * 1.3, 0, 1)) : mix(SEA, WEISS, clamp(k.l * 1.2, 0, 1));
  }

  /* Leinwand im Seitenfluss: vom Behälter (mit Rand für das Streuen) bis unter das Ziel */
  function leinwand() {
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:1';
      document.body.appendChild(cv);
      ctx = cv.getContext('2d');
    }
    const er = el.getBoundingClientRect(), zr = ziel.getBoundingClientRect();
    const t = Math.round(er.top + scrollY - 160), h = Math.round(zr.bottom + scrollY + 40 - t), w = document.documentElement.clientWidth;
    if (t === OT && h === OH && w === OW) return;
    OT = t; OH = h; OW = w;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.style.top = t + 'px'; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bilderZeigen(a) {
    bilder.forEach(b => { b.style.opacity = a >= 1 ? '' : String(a); });
  }

  function zeichne(zeit) {
    leinwand();
    const zr0 = ziel.getBoundingClientRect();
    const ziel01 = clamp((innerHeight * 0.72 - zr0.top) / (innerHeight * 0.62), 0, 1);
    /* sanft nachziehen: die Bewegung folgt dem Scrollen leicht verzögert */
    const dt = Math.min(0.1, Math.max(0, (zeit - letzt) / 1000)); letzt = zeit;
    anz += (ziel01 - anz) * (1 - Math.exp(-dt / 0.45));
    if (Math.abs(ziel01 - anz) < 0.0005) anz = ziel01;
    const p = anz;
    if (p <= 0.0005) { if (aufgeloest) { ctx.clearRect(0, 0, OW, OH); bilderZeigen(1); aufgeloest = false; } return; }
    ctx.clearRect(0, 0, OW, OH);
    aufgeloest = true;
    bilderZeigen(1 - clamp(p / 0.12, 0, 1));
    /* alle Lagen in Leinwand-Koordinaten (Seite minus Leinwand-Oberkante) */
    const dy = scrollY - OT;
    const zr = { left: zr0.left, right: zr0.right, top: zr0.top + dy, bottom: zr0.bottom + dy, width: zr0.width, height: zr0.height };
    const R = bilder.map(b => { const r = rahmen(b); r.y += dy; return r; });
    const ZB = zr.width, ZH = zr.height;
    for (let i = 0; i < P.length; i++) {
      const q = P[i], r = R[q.b];
      const x0 = r.x + q.k.u * r.w, y0 = r.y + q.k.v * r.h;
      const e = easeInOut(clamp((p - q.v * 0.55) / 0.5, 0, 1));
      const quer = q.rg * 0.055 * ZH;
      const bx = zr.left + 0.56 * ZB - 0.2 * ZH + q.rt * ZH * 1.3 + quer * 0.7071;
      const by = zr.top + ZH * 1.15 - q.rt * ZH * 1.3 + quer * 0.7071;
      /* Weg über einen gestreuten Zwischenpunkt: das Bild zerfällt zuerst, dann ziehen die Punkte ins Band */
      const cx = x0 + q.sx, cy = y0 + q.sy, m = 1 - e;
      let x = m * m * x0 + 2 * m * e * cx + e * e * bx;
      let y = m * m * y0 + 2 * m * e * cy + e * e * by;
      x += Math.sin(zeit * 0.0006 + q.ph) * 1.2 * e; y += Math.cos(zeit * 0.0005 + q.ph) * 1.0 * e;
      if (y < -10 || y > OH + 10) continue;
      let a = q.a;
      if (e > 0.5 && (y < zr.top || y > zr.bottom || x < zr.left || x > zr.right)) a *= 1 - e;
      const c = mix(q.c0, q.c1, e);
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      const rr = q.r * (1 + 0.25 * e);
      if (rr < 1.5) ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      else { ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  function start() {
    leinwand();
    addEventListener('resize', () => { OT = -1; leinwand(); });
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) sichtbar.add(e.target); else sichtbar.delete(e.target); });
      if (!sichtbar.size && ctx) ctx.clearRect(0, 0, OW, OH);
      if (sichtbar.size && !aus) aus = takt(t => { if (!sichtbar.size) { aus = null; return false; } zeichne(t); });
    });
    io.observe(el); io.observe(ziel);
  }

  sobaldNahe(el, async () => {
    const geladen = await Promise.all(bilder.map(b => laden(b.currentSrc || b.src)));
    geladen.forEach((g, b) => {
      const pk = g && abtasten(g, zz);
      if (!pk) return;
      pk.forEach(k => {
        const w = zz() * 6.283, d = 30 + zz() * 90;
        P.push({ b, k, c0: farbe(k), c1: zz() < 0.85 ? PLUMH : SEA, r: 0.9 + zz() * 1.3, a: 0.55 + zz() * 0.45,
          v: zz() * 0.4, ph: zz() * 6.283, rt: zz(), rg: gauss(zz), sx: Math.cos(w) * d, sy: Math.sin(w) * d * 0.6 + 40 });
      });
    });
    if (P.length) start();
  }, '60% 0px');
}
