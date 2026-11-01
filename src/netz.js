/* Netz im Punktemeer (seit 1.14.0): Plum-Knoten liegen auf der Welle und schwingen mit, feine Linien
   verbinden Nachbarn und blenden langsam ein und aus, Impulse laufen von Knoten zu Knoten.
   Zeigt, dass zu ROWAPA auch digitale Lösungen gehören. Gezeichnet in 2D über der WebGL-Fläche,
   mit derselben Kamera und derselben Wellenformel wie die Punkte. Seit 1.16.0 leuchtet es stärker
   (Licht addiert sich auf dem dunklen Grund), mehrere Impulse gleichzeitig, Ring beim Ankommen. */
import { clamp, istHandy, easeInOut } from './util.js';

/* knoten/spalten: Anzahl und Raster; nachbarn: Linien je Knoten; linie: Deckkraft der Linien, grund: Anteil,
   der nie ganz verschwindet; takt: Sekunden zwischen Impulsen, impulse: wie viele gleichzeitig;
   hof: Stärke des Leuchtens, breite: Linienstärke, ring: Ring beim Ankommen eines Impulses */
const STUFEN = {
  ruhig: { spalten: 6, spaltenHandy: 3, knoten: 14, knotenHandy: 7, nachbarn: 2, linie: 0.6, grund: 0, takt: 3.2, impulse: 1, hof: 0.45, breite: 1.2, ring: false },
  mehr: { spalten: 8, spaltenHandy: 4, knoten: 22, knotenHandy: 11, nachbarn: 3, linie: 0.75, grund: 0, takt: 1.7, impulse: 1, hof: 0.45, breite: 1.2, ring: false },
  stark: { spalten: 8, spaltenHandy: 4, knoten: 24, knotenHandy: 12, nachbarn: 3, linie: 0.9, grund: 0.25, takt: 0.9, impulse: 3, hof: 0.8, breite: 1.5, ring: true }
};
/* «an» ist der Standard (seit 1.16.0 «stark», Entscheid ROWAPA) */
STUFEN.an = STUFEN.stark;

/* Stufe aus der Adresse (?netz=…, nur Header) oder dem nächsten Element mit data-netz.
   Standard seit 1.15.0: im Header an (Entscheid ROWAPA, alle Seiten), im Footer aus */
export function netzStufe(box, art) {
  const eigenes = box.hasAttribute('data-netz');
  if (art !== 'punktemeer' && !eigenes) return null;
  let w = '';
  try { w = new URLSearchParams(location.search).get('netz') || ''; } catch (e) { /* alte Browser */ }
  if (!w || art !== 'punktemeer') {
    const el = box.closest('[data-netz]');
    w = el ? el.getAttribute('data-netz') : '';
  }
  w = (w || '').trim().toLowerCase() || (art === 'punktemeer' ? 'an' : '');
  return STUFEN[w] ? w : null;
}

/* Wellenhöhe wie im Vertex-Shader des Punktemeers */
function welle(x, z, t) {
  return Math.sin(x * 0.22 + t * 0.5) * 0.5 + Math.sin(z * 0.3 - t * 0.65) * 0.42 +
    Math.sin((x + z) * 0.14 + t * 0.3) * 0.6 + Math.sin(x * 0.7 - z * 0.5 + t * 0.9) * 0.1;
}

/* 4×4-Matrix (spaltenweise, wie an WebGL übergeben) mal Vektor */
function mal(M, v) {
  return [0, 1, 2, 3].map(i => M[i] * v[0] + M[4 + i] * v[1] + M[8 + i] * v[2] + M[12 + i] * v[3]);
}

const glatt = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function netz(ebene, vorlage, stufe, plum) {
  const s = STUFEN[stufe];
  const cv = document.createElement('canvas');
  cv.style.cssText = vorlage.style.cssText;
  ebene.appendChild(cv);
  const c = cv.getContext('2d');
  if (!c) return null;
  /* Plum etwas aufgehellt, damit es auf dem dunklen Grund trägt */
  const hell = plum.map(v => Math.round(v + (255 - v) * 0.3));
  const farbe = a => `rgba(${hell[0]},${hell[1]},${hell[2]},${clamp(a, 0, 1).toFixed(3)})`;
  const kern = a => `rgba(255,235,242,${clamp(a, 0, 1).toFixed(3)})`;

  let knoten = [], kanten = [], groesse = '', impulse = [], ringe = [], naechster = 1.5;

  /* Projektion eines Punktes der Welle auf die Zeichenfläche (CSS-Pixel) */
  function projiziere(x, z, f) {
    const r = Math.hypot(x - f.m[0], z - f.m[1]);
    const y = welle(x, z, f.t) * f.amp + Math.exp(-r * 0.25) * Math.sin(r * 1.8 - f.t * 4) * 0.7 * f.rip;
    const mv = mal(f.V, [x, y, z, 1]);
    const p = mal(f.P, mv);
    if (p[3] <= 0.01) return null;
    return { x: (p[0] / p[3] * 0.5 + 0.5) * f.w, y: (0.5 - p[1] / p[3] * 0.5) * f.h, tiefe: -mv[2] };
  }

  /* Knoten im sichtbaren Teil der Welle verteilen: Raster aus Feldern (Spalten × 3 Zeilen), höchstens ein Knoten
     je Feld, darin zufällig. So entsteht ein Netz und keine Kette. */
  function verteile(f) {
    const handy = istHandy();
    const sp = handy ? s.spaltenHandy : s.spalten, ze = 3, zahl = handy ? s.knotenHandy : s.knoten;
    const x0 = 0.04, x1 = 0.96, y0 = 0.44, y1 = 0.94;
    const felder = Array.from({ length: sp * ze }, () => []);
    for (let i = 0; i < 2400; i++) {
      const x = (Math.random() - 0.5) * 68, z = 2 - Math.random() * 40;
      const q = projiziere(x, z, f);
      if (!q) continue;
      const u = (q.x / f.w - x0) / (x1 - x0), v = (q.y / f.h - y0) / (y1 - y0);
      /* Rand im Feld frei lassen, damit Nachbarn nicht zusammenkleben */
      const fu = u * sp, fv = v * ze, iu = Math.floor(fu), iv = Math.floor(fv);
      if (iu < 0 || iu >= sp || iv < 0 || iv >= ze || fu - iu < 0.15 || fu - iu > 0.85 || fv - iv < 0.15 || fv - iv > 0.85) continue;
      felder[iv * sp + iu].push({ x, z, sx: q.x, sy: q.y });
    }
    const frei = felder.map((l, i) => i).filter(i => felder[i].length).sort(() => Math.random() - 0.5).slice(0, zahl);
    knoten = frei.map(i => {
      const l = felder[i], k = l[Math.floor(Math.random() * l.length)];
      return { ...k, blitz: 0, phase: Math.random() * 6.28 };
    });
    /* je Knoten die nächsten Nachbarn, keine sehr langen Linien */
    const weit = f.w * (handy ? 0.5 : 0.24);
    const paare = new Set();
    kanten = [];
    knoten.forEach((k, i) => {
      knoten.map((o, j) => ({ j, d: Math.hypot(o.sx - k.sx, o.sy - k.sy) }))
        .filter(o => o.j !== i && o.d < weit).sort((a, b) => a.d - b.d).slice(0, s.nachbarn)
        .forEach(o => {
          const key = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (paare.has(key)) return;
          paare.add(key);
          kanten.push({ a: Math.min(i, o.j), b: Math.max(i, o.j), periode: 9 + Math.random() * 7, phase: Math.random() * 6.28, glanz: 0 });
        });
    });
    impulse = []; ringe = [];
  }

  /* Lichthöfe einmal vorzeichnen und danach nur noch skaliert einsetzen (spart Rechenzeit) */
  function hofBild(f) {
    const b = document.createElement('canvas');
    b.width = b.height = 64;
    const g = b.getContext('2d'), v = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    v.addColorStop(0, f(1)); v.addColorStop(0.4, f(0.35)); v.addColorStop(1, f(0));
    g.fillStyle = v; g.fillRect(0, 0, 64, 64);
    return b;
  }
  const hofPlum = hofBild(farbe), hofKern = hofBild(kern);
  /* weicher Lichtpunkt; auf dem dunklen Grund addiert sich das Licht */
  function licht(x, y, r, a, k = 0) {
    c.globalAlpha = clamp(a, 0, 1);
    c.drawImage(hofPlum, x - r, y - r, 2 * r, 2 * r);
    if (k > 0) { c.globalAlpha = clamp(k, 0, 1); c.drawImage(hofKern, x - r * 0.5, y - r * 0.5, r, r); }
    c.globalAlpha = 1;
  }

  /* f: { V, P, t (Sekunden × Tempo), sek (echte Sekunden), amp, rip, m, w, h, dpr } */
  return function zeichne(f) {
    /* höchstens 1,5-fache Auflösung: Licht und Linien bleiben weich, auch schwächere Geräte zeichnen flüssig */
    const dpr = Math.min(f.dpr, 1.5);
    const W = Math.round(f.w * dpr), H = Math.round(f.h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const g = W + 'x' + H;
    if (g !== groesse) { groesse = g; verteile(f); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, f.w, f.h);
    if (!knoten.length) return;

    const pos = knoten.map(k => {
      const q = projiziere(k.x, k.z, f);
      /* weiter hinten blasser, wie die Punkte */
      return q && { ...q, a: 0.25 + 0.75 * glatt(-64, -18, k.z) };
    });

    /* Linien: atmen langsam; ein Grundanteil bleibt stehen, eine Linie mit Impuls leuchtet kurz nach */
    c.globalCompositeOperation = 'lighter';
    c.lineWidth = s.breite;
    const alpha = kanten.map(e => s.linie * (s.grund + (1 - s.grund) * glatt(0.3, 0.75, 0.5 + 0.5 * Math.sin((f.sek / e.periode) * 6.283 + e.phase))));
    kanten.forEach((e, i) => {
      const A = pos[e.a], B = pos[e.b];
      e.glanz *= 0.97;
      if (!A || !B || alpha[i] + e.glanz < 0.01) return;
      c.strokeStyle = farbe((alpha[i] + e.glanz * 0.5) * Math.min(A.a, B.a));
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
    });

    /* Impulse: laufen über gerade sichtbare Linien und lassen den Zielknoten aufleuchten */
    if (impulse.length < s.impulse && f.sek > naechster) {
      const besetzt = new Set(impulse.map(p => p.kante));
      const offen = kanten.map((e, i) => i).filter(i => alpha[i] > s.linie * 0.5 && !besetzt.has(i));
      if (offen.length) {
        const i = offen[Math.floor(Math.random() * offen.length)];
        const umkehren = Math.random() < 0.5;
        impulse.push({ kante: i, von: umkehren ? kanten[i].b : kanten[i].a, nach: umkehren ? kanten[i].a : kanten[i].b, start: f.sek });
      }
      naechster = f.sek + s.takt * (0.75 + Math.random() * 0.5);
    }
    impulse = impulse.filter(im => {
      const A = pos[im.von], B = pos[im.nach];
      const p = (f.sek - im.start) / 1.6;
      if (!A || !B) return false;
      if (p >= 1) {
        knoten[im.nach].blitz = 1;
        kanten[im.kante].glanz = s.linie;
        if (s.ring) ringe.push({ k: im.nach, start: f.sek });
        return false;
      }
      const e = easeInOut(clamp(p, 0, 1));
      const x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e, a = Math.min(A.a, B.a);
      /* Spur hinter dem Impuls */
      const spur = c.createLinearGradient(A.x, A.y, x, y);
      spur.addColorStop(0, farbe(0));
      spur.addColorStop(1, farbe(0.9 * a));
      c.strokeStyle = spur; c.lineWidth = s.breite + 0.6;
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(x, y); c.stroke();
      licht(x, y, 8 + 8 * s.hof, 0.8 * a, a);
      return true;
    });

    /* Ring: wächst beim Ankommen eines Impulses aus dem Knoten und verblasst */
    ringe = ringe.filter(rg => {
      const q = pos[rg.k], p = (f.sek - rg.start) / 1.2;
      if (!q || p >= 1) return false;
      c.lineWidth = 1.2;
      c.strokeStyle = farbe(0.7 * (1 - p) * q.a);
      c.beginPath(); c.arc(q.x, q.y, 4 + 18 * easeInOut(p), 0, 6.283); c.stroke();
      return true;
    });

    /* Knoten: Punkt mit Lichthof, vorne etwas grösser */
    knoten.forEach((k, i) => {
      const q = pos[i];
      if (!q) return;
      k.blitz *= 0.965;
      const atmen = 0.8 + 0.2 * Math.sin(f.sek * 0.9 + k.phase);
      const r = clamp(44 / q.tiefe, 2, 4.2) * (1 + 0.5 * k.blitz);
      const a = q.a * atmen;
      licht(q.x, q.y, r * (3.2 + 1.6 * s.hof), s.hof * a + 0.4 * k.blitz);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = farbe(Math.min(1, a + 0.2 * k.blitz));
      c.beginPath(); c.arc(q.x, q.y, r, 0, 6.283); c.fill();
      if (k.blitz > 0.05) {
        c.fillStyle = kern(0.85 * k.blitz);
        c.beginPath(); c.arc(q.x, q.y, r * 0.55, 0, 6.283); c.fill();
      }
      c.globalCompositeOperation = 'lighter';
    });
    c.globalCompositeOperation = 'source-over';
  };
}
