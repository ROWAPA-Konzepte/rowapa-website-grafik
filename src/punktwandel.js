/* Punktwandel (ab 1.37.0, Runde 109): Eine stehende Bühne zeigt ein Katalogbild aus Punkten. Beim Scrollen durch die
   Schritte daneben lösen sich die Punkte und setzen sich zum nächsten Bild zusammen (Lupe → Person → Team → Wachstum).
   Idee nach den Referenzen Tresmares (Emblem verwandelt sich) und Checkpoint (Figur bleibt stehen, Schritte laufen vorbei).

   Am Behälter: data-grafik="punktwandel". Darin die Bilder als normale Webflow-Bilder (PNG mit transparentem Grund, aus
   dem Bildkatalog), in der Reihenfolge der Schritte.
   data-schritte: CSS-Auswahl der Schritte, gesucht im umgebenden Abschnitt (Standard: [data-schritt]).
   data-ton: "hell" (Standard, Punkte in Manganese/Serpent auf hellem Grund) oder "dunkel" (Sea Cliff/Weiss).
   Plum-Punkte im Bild bleiben Plum. Der jeweils aktive Schritt erhält die Klasse is-aktiv.
   Bei «Bewegung reduzieren» wechselt das Bild ohne Bewegung. Ohne Skript bleibt das erste Bild stehen. */
import { reduziert, clamp, easeInOut, sobaldNahe, ciFarbe } from './util.js';

const ANZAHL = 2200;

function zufall(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* Punkte eines Bildes: Lage (−0.5…0.5, Seitenverhältnis bleibt), Helligkeit, Plum */
function abtasten(img, zz) {
  const S = 200;
  const q = img.naturalWidth / img.naturalHeight || 1;
  const w = q >= 1 ? S : Math.round(S * q), h = q >= 1 ? Math.round(S / q) : S;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  let d;
  try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }
  const kand = [];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const o = (y * w + i) * 4, a = d[o + 3];
    if (a < 70) continue;
    const r = d[o], g = d[o + 1], b = d[o + 2];
    const plum = r > g + 45 && r > b + 10;
    kand.push({ x: (i - w / 2) / S, y: (y - h / 2) / S, l: (r + g + b) / 765, p: plum ? 1 : 0, a: a / 255 });
  }
  if (!kand.length) return null;
  const out = [];
  for (let n = 0; n < ANZAHL; n++) {
    const k = kand[Math.floor(zz() * kand.length)];
    out.push({ x: k.x + (zz() - 0.5) / S, y: k.y + (zz() - 0.5) / S, l: k.l, p: k.p, a: k.a });
  }
  /* gleiche Reihenfolge-Logik in allen Bildern: von oben links nach unten rechts in Bändern, damit die Wege ruhig bleiben */
  out.sort((u, v) => (u.y * 0.65 + u.x * 0.35) - (v.y * 0.65 + v.x * 0.35));
  return out;
}

export function punktwandel(el) {
  const bilder = [...el.querySelectorAll('img')];
  if (bilder.length < 2) return;
  const bereich = el.closest('section') || document;
  const schritte = [...bereich.querySelectorAll(el.getAttribute('data-schritte') || '[data-schritt]')];
  const dunkel = (el.getAttribute('data-ton') || '').trim().toLowerCase() === 'dunkel';
  const ruhig = reduziert();
  const zz = zufall(109);

  const MANG = ciFarbe('manganese-black', '#1D3149');
  const SERP = ciFarbe('great-serpent', '#486EA3');
  const SEA = ciFarbe('sea-cliff', '#A0C4DF');
  const PLUM = ciFarbe('plum-perfect', '#AA1351');
  const WEISS = [255, 255, 255];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  let formen = null, cv = null, ctx = null, B = 0, H = 0, wartet = false, letzt = -1, streu = [];

  function farbe(p) {
    if (p.p) return dunkel ? [224, 69, 127] : PLUM;
    return dunkel ? mix(SEA, WEISS, clamp(p.l * 1.2, 0, 1)) : mix(MANG, SERP, clamp(p.l * 1.6, 0, 1));
  }

  function vorbereiten() {
    const r = el.getBoundingClientRect();
    B = r.width; H = r.height;
    if (B < 20 || H < 20) return false;
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(cv);
      ctx = cv.getContext('2d');
    }
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    letzt = -1;
    return true;
  }

  /* Position im Ablauf: 0 = erster Schritt … n−1 = letzter; zwischen zwei Schritten fliessend */
  function lage() {
    if (!schritte.length) return 0;
    const mitte = innerHeight * 0.5;
    const z = schritte.map(s => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
    if (mitte <= z[0]) return 0;
    for (let i = 0; i < z.length - 1; i++) {
      if (mitte < z[i + 1]) return i + (mitte - z[i]) / (z[i + 1] - z[i]);
    }
    return z.length - 1;
  }

  function zeichne() {
    wartet = false;
    if (!formen || !ctx) return;
    const n = formen.length - 1;
    let f = clamp(lage(), 0, n);
    if (ruhig) f = Math.round(f);
    const i = Math.min(Math.floor(f), n - 1 < 0 ? 0 : n - 1);
    const roh = f - i;
    /* Halt an jedem Schritt, Wechsel in der Mitte dazwischen */
    const t = ruhig ? Math.round(roh) : easeInOut(clamp((roh - 0.32) / 0.36, 0, 1));
    const schluessel = i * 1000 + Math.round(t * 1000);
    if (schluessel === letzt) return;
    letzt = schluessel;
    const aktiv = Math.min(n, Math.round(f));
    schritte.forEach((s, k) => s.classList.toggle('is-aktiv', k === aktiv));

    const A = formen[i], Z = formen[Math.min(i + 1, n)];
    const gross = Math.min(B, H) * 0.92, cx = B / 2, cy = H / 2;
    const bogen = Math.sin(Math.PI * t);
    const rad = Math.max(1.2, gross / 230);
    ctx.clearRect(0, 0, B, H);
    for (let k = 0; k < ANZAHL; k++) {
      const a = A[k], z = Z[k], s = streu[k];
      const e = clamp((t - s.v) / 0.75, 0, 1);
      const u = easeInOut(e);
      const x = cx + (a.x + (z.x - a.x) * u) * gross + s.x * bogen * gross;
      const y = cy + (a.y + (z.y - a.y) * u) * gross + s.y * bogen * gross;
      const c = mix(farbe(a), farbe(z), u);
      ctx.globalAlpha = (a.a + (z.a - a.a) * u) * (0.85 + 0.15 * (1 - bogen));
      ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      const pr = (a.p || z.p) ? rad * 1.25 : rad;
      ctx.fillRect(x - pr / 2, y - pr / 2, pr, pr);
    }
    ctx.globalAlpha = 1;
  }

  const anstossen = () => { if (!wartet) { wartet = true; requestAnimationFrame(zeichne); } };

  sobaldNahe(el, () => {
    /* Punkte lesen braucht eine Kopie mit crossOrigin (Webflow-CDN erlaubt das); das Webflow-Bild bleibt unverändert */
    const laden = b => new Promise(r => {
      const q = new Image();
      q.crossOrigin = 'anonymous';
      q.onload = () => r(q); q.onerror = () => r(null);
      q.src = b.currentSrc || b.src;
    });
    Promise.all(bilder.map(laden))
      .then(kopien => {
        const f = kopien.map(q => (q && q.naturalWidth ? abtasten(q, zz) : null));
        if (f.some(x => !x)) return; /* Bild nicht lesbar (z. B. fremde Quelle): Standbild bleibt */
        formen = f;
        for (let k = 0; k < ANZAHL; k++) {
          const w = zz() * Math.PI * 2, r = 0.015 + zz() * 0.05;
          streu.push({ x: Math.cos(w) * r, y: Math.sin(w) * r, v: zz() * 0.25 });
        }
        if (!vorbereiten()) return;
        bilder.forEach(b => { b.style.opacity = '0'; });
        zeichne();
        addEventListener('scroll', anstossen, { passive: true });
        addEventListener('resize', () => { if (vorbereiten()) anstossen(); });
        /* versteckter Entwurf wird sichtbar: neu messen */
        new ResizeObserver(() => { if (vorbereiten()) anstossen(); }).observe(el);
      });
  }, '120% 0px');
}
