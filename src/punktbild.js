/* Punktbild (ab 1.33.0, Runde 99): Einzelne Punkte erhalten einen Zusammenhang. Ein Feld aus Punkten verwandelt sich in
   600–900 ms in eine Form und bleibt dann stehen (keine Dauerbewegung). Schematische Illustration, keine Messwerte.

   Am Behälter (z. B. lage_bild): data-grafik="punktbild", data-form = eine der Formen unten.
     ordnen     viele Informationen → eine Richtung (Zeilen laufen auf einen Punkt zu)
     verbinden  einzelne Gesprächsmomente → verbundener Weg mit nächstem Schritt (Plum)
     buendeln   drei Kanäle → ein gemeinsamer Kreis
     kreislauf  einzelne Impulse → wiederkehrender Kreislauf
     produkt    Gespräch läuft linear auf das Produkt zu
     kunde      vom Produkt-Ablauf zu vier Phasen rund um den Kunden (Mitte in Plum)
   data-start: "vorher" (Standard) oder "nachher" · data-ausloesen: "klick" (Standard: nur über einen Knopf) oder
   "sichtbar" (spielt, sobald die Grafik bzw. ihr Reiter erscheint) · data-dauer in Sekunden (Standard 0.75).
   Knopf: ein Element mit data-punktbild-ausloeser im selben Reiter (bzw. im Element mit data-punktbild-bereich) schaltet
   zwischen vorher und nachher um (aria-pressed). Jedes neue Öffnen des Reiters beginnt wieder beim Start.
   Farben aus den CI-Variablen; auf dunklem Grund (helle Schriftfarbe am Behälter) Sea Cliff und helles Plum.
   Bei «Bewegung reduzieren» springt das Bild ohne Bewegung in den neuen Zustand. Ohne Skript bleibt die Fläche leer,
   Beschriftung und Text darum herum sind normale Webflow-Elemente. */
import { reduziert, clamp, zahl, ciFarbe, rgb, easeInOut, takt, sobaldNahe } from './util.js';

function zufall(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const P = (x, y, k = 0) => ({ x, y, k });
const kreis = (cx, cy, r, n, a0 = 0, a1 = Math.PI * 2, k = 0, offen = false) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = offen ? i / (n - 1) : i / n;
    const a = a0 + (a1 - a0) * t;
    out.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, k));
  }
  return out;
};
const linie = (x0, y0, x1, y1, n, k = 0, ohneEnden = true) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = ohneEnden ? (i + 1) / (n + 1) : i / (n - 1);
    out.push(P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, k));
  }
  return out;
};
/* Streuung: die Punkte einer Form zufällig über die Fläche (leicht gerastert, wie lose Informationen) */
function streuen(ziel, A, seed, k = 2) {
  const z = zufall(seed), n = ziel.length, C = Math.ceil(Math.sqrt(n * A)), R = Math.ceil(n / C);
  const idx = ziel.map((_, i) => i).sort(() => z() - 0.5);
  return ziel.map((_, i) => {
    const j = idx[i], c = j % C, r = Math.floor(j / C);
    return P(((c + 0.5) / C) * A * 0.92 + A * 0.04 + (z() - 0.5) * (A / C) * 0.7,
      ((r + 0.5) / R) * 0.84 + 0.08 + (z() - 0.5) * (0.84 / R) * 0.7 + Math.sin(c * 1.7) * 0.02, k);
  });
}

const FORMEN = {
  ordnen(A) {
    const C = 16, R = 6, n = [], v = [];
    const z = zufall(11);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const t = c / (C - 1), dr = (r - (R - 1) / 2) / ((R - 1) / 2);
      const ende = c === C - 1;
      n.push(ende ? P(A * 0.9 - Math.abs(dr) * A * 0.035, 0.5 + dr * 0.075, 1) : P(A * 0.08 + t * A * 0.76, 0.5 + dr * 0.36 * (1 - t * 0.86), 0));
      v.push(P(A * 0.05 + ((c + 0.5) / C) * A * 0.9 + (z() - 0.5) * A * 0.035,
        0.12 + ((r + 0.5) / R) * 0.76 + (z() - 0.5) * 0.08 + (c % 3 - 1) * 0.025, 2));
    }
    return [v, n];
  },
  verbinden(A) {
    const knoten = [0, 1, 2, 3, 4].map(i => [A * (0.1 + i * 0.2), 0.74 - i * 0.12 + (i % 2 ? 0.04 : 0)]);
    const n = [];
    knoten.forEach(([x, y], i) => n.push(...kreis(x, y, 0.06, 10, 0, Math.PI * 2, i === 4 ? 1 : 0)));
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = knoten[i], [x1, y1] = knoten[i + 1];
      const d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / d, uy = (y1 - y0) / d, o = 0.075;
      n.push(...linie(x0 + ux * o, y0 + uy * o, x1 - ux * o, y1 - uy * o, 9, 0));
    }
    /* vorher: Momente ohne Zusammenhang, jeder an einem anderen Ort */
    const z = zufall(23);
    const orte = [[0.18, 0.3], [0.42, 0.72], [0.55, 0.28], [0.78, 0.62], [0.9, 0.24]].map(([a, b]) => [a * A, b]);
    const v = n.map((p, i) => {
      if (i < 50) { const [x, y] = orte[Math.floor(i / 10)]; const a = z() * 6.283, r = 0.03 + z() * 0.07; return P(x + Math.cos(a) * r, y + Math.sin(a) * r, 0); }
      return P(A * (0.05 + z() * 0.9), 0.1 + z() * 0.8, 2);
    });
    return [v, n];
  },
  buendeln(A) {
    const quellen = [0.2, 0.5, 0.8], cx = A * 0.74, cy = 0.5, R = 0.3, n = [], v = [];
    const z = zufall(37);
    quellen.forEach((y, q) => {
      for (let i = 0; i < 8; i++) n.push(P(A * 0.08 + (i % 4) * 0.035, y - 0.03 + Math.floor(i / 4) * 0.06, 0));
      for (let i = 0; i < 12; i++) {
        const t = (i + 1) / 13, x0 = A * 0.22, x1 = cx - R * 0.98, y1 = cy + (y - 0.5) * 0.5;
        const xm = (x0 + x1) / 2;
        const bx = (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * xm + 3 * (1 - t) * t * t * xm + t ** 3 * x1;
        const by = (1 - t) ** 3 * y + 3 * (1 - t) ** 2 * t * y + 3 * (1 - t) * t * t * y1 + t ** 3 * y1;
        n.push(P(bx, by, 0));
      }
    });
    n.push(...kreis(cx, cy, R, 30, -Math.PI / 2, Math.PI * 1.5, 0));
    n.push(...kreis(cx, cy, 0.05, 6, 0, Math.PI * 2, 1));
    /* vorher: drei Kanäle getrennt, je eine eigene Wolke, rechts nichts Gemeinsames */
    n.forEach((p, i) => {
      if (i < 60) {
        const q = Math.floor(i / 20), y = quellen[q], wx = A * (0.12 + q * 0.27);
        v.push(P(wx + (z() - 0.5) * A * 0.16, y + (z() - 0.5) * 0.16, i % 20 < 8 ? 0 : 2));
      } else v.push(P(A * (0.62 + z() * 0.32), 0.12 + z() * 0.76, 2));
    });
    return [v, n];
  },
  kreislauf(A) {
    const cx = A / 2, cy = 0.5, R = 0.34, n = [];
    n.push(...kreis(cx, cy, R, 80, -Math.PI / 2 + 0.25, Math.PI * 1.5 - 0.1, 0, true));
    /* Pfeilspitze am Ende des Kreises (oben), in Plum */
    const ex = cx + Math.cos(Math.PI * 1.5 - 0.1) * R, ey = cy + Math.sin(Math.PI * 1.5 - 0.1) * R;
    for (let i = 1; i <= 6; i++) { n.push(P(ex - i * 0.017, ey - i * 0.016, 1)); n.push(P(ex - i * 0.017, ey + i * 0.016, 1)); }
    n.push(...kreis(cx, cy, 0.04, 4, 0, Math.PI * 2, 1));
    /* vorher: einzelne Impulse, die links verpuffen */
    const z = zufall(41);
    const v = n.map((p, i) => {
      const a = (z() - 0.5) * 2.2, r = 0.04 + Math.pow(z(), 0.7) * 0.5;
      return P(A * 0.12 + Math.cos(a) * r * A * 0.55, 0.5 + Math.sin(a) * r * 0.75, i % 9 === 0 ? 0 : 2);
    });
    return [v, n];
  },
  produkt(A) {
    const n = [], bx = A * 0.76, by = 0.5, s = 0.36;
    /* Produkt als Kasten */
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      n.push(P(bx - s / 2 + t * s, by - s / 2, 0), P(bx + s / 2, by - s / 2 + t * s, 0), P(bx + s / 2 - t * s, by + s / 2, 0), P(bx - s / 2, by + s / 2 - t * s, 0));
    }
    /* innen frei für die Beschriftung «Produkt» */
    /* Gesprächsschritte laufen in einer Linie auf das Produkt zu */
    const xs = [0.08, 0.24, 0.4, 0.54].map(t => t * A);
    xs.forEach(x => n.push(...kreis(x, by, 0.035, 6, 0, Math.PI * 2, 0)));
    for (let i = 0; i < 3; i++) n.push(...linie(xs[i] + 0.05, by, xs[i + 1] - 0.05, by, 4, 2));
    n.push(...linie(xs[3] + 0.05, by, bx - s / 2 - 0.03, by, 0 + 4, 2));
    return [streuen(n, A, 53), n];
  },
  kunde(A) {
    const cx = A / 2, cy = 0.5, n = [];
    /* vier Phasen als Viertelbögen mit Lücken (wie das ROWAPA-Rad), oben rechts beginnend im Uhrzeigersinn */
    for (let q = 0; q < 4; q++) {
      const a0 = -Math.PI / 2 + q * Math.PI / 2 + 0.12, a1 = a0 + Math.PI / 2 - 0.24;
      n.push(...kreis(cx, cy, 0.43, 18, a0, a1, 0, true));
    }
    /* Ring um die Mitte in Plum; die Mitte bleibt frei für die Beschriftung «Kunde» */
    n.push(...kreis(cx, cy, 0.16, 24, -Math.PI / 2, Math.PI * 1.5, 1));
    /* vorher: derselbe lineare Ablauf wie «produkt» (Punktzahl angeglichen) */
    const [, prod] = FORMEN.produkt(A);
    const v = n.map((_, i) => ({ ...prod[i % prod.length] }));
    return [v, n];
  }
};

export function punktbild(el) {
  const form = (el.getAttribute('data-form') || '').trim().toLowerCase();
  if (!FORMEN[form]) return;
  const ruhig = reduziert();
  const dauer = clamp(zahl(el, 'data-dauer', 0.75), 0.3, 2) * 1000;
  const startNachher = (el.getAttribute('data-start') || '').trim().toLowerCase() === 'nachher';
  const auto = (el.getAttribute('data-ausloesen') || 'klick').trim().toLowerCase() === 'sichtbar';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  el.prepend(cv);
  const ctx = cv.getContext('2d');

  const text = rgb(getComputedStyle(el).color) || [29, 49, 73];
  const dunkel = (text[0] * 0.299 + text[1] * 0.587 + text[2] * 0.114) > 150;
  const FARBE = dunkel
    ? [ciFarbe('sea-cliff', '#A0C4DF'), rgb('#D23A70'), ciFarbe('sea-cliff', '#A0C4DF')]
    : [ciFarbe('great-serpent', '#486EA3'), ciFarbe('plum-perfect', '#AA1351'), ciFarbe('great-serpent', '#486EA3')];
  const ALPHA = [0.9, 1, 0.42], GROESSE = [1, 1.45, 0.85];

  let W = 0, H = 0, A = 1.6, dpr = 1, lagen = null, akt = [], ziel = startNachher ? 1 : 0, stop = null;

  const layout = () => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; A = W / H;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    lagen = FORMEN[form](A);
    akt = lagen[ziel].map(p => ({ x: p.x, y: p.y, k: p.k }));
    return true;
  };
  /* Punkt zeichnen; während der Verwandlung mischen Farbe, Deckkraft und Grösse von Start- zu Zielart (ka → kb, Anteil m) */
  const zeichneMisch = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const r0 = clamp(H * 0.011, 1.5, 3.6);
    akt.forEach(p => {
      const ca = FARBE[p.ka ?? p.k], cb = FARBE[p.kb ?? p.k], m = p.m ?? 0;
      const ia = p.ka ?? p.k, ib = p.kb ?? p.k;
      const c = [0, 1, 2].map(i => Math.round(ca[i] + (cb[i] - ca[i]) * m));
      const a = ALPHA[ia] + (ALPHA[ib] - ALPHA[ia]) * m, g = GROESSE[ia] + (GROESSE[ib] - GROESSE[ia]) * m;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.beginPath();
      ctx.arc(p.x * H, p.y * H, r0 * g, 0, 6.2832);
      ctx.fill();
    });
  };

  const setzen = z => {
    ziel = z;
    if (stop) { stop(); stop = null; }
    if (!lagen && !layout()) return;
    akt = lagen[z].map(p => ({ x: p.x, y: p.y, k: p.k }));
    zeichneMisch();
  };
  const spielen = z => {
    if (!lagen && !layout()) return;
    if (ruhig) { setzen(z); return; }
    ziel = z;
    if (stop) { stop(); stop = null; }
    const von = akt.map(p => ({ x: p.x, y: p.y, k: p.ka !== undefined && p.m > 0.5 ? p.kb : (p.ka ?? p.k) }));
    const nach = lagen[z], n = nach.length, t0 = performance.now(), versatz = dauer * 0.22;
    stop = takt(t => {
      let fertig = true;
      for (let i = 0; i < n; i++) {
        const d = (i / n) * versatz;
        let u = (t - t0 - d) / (dauer - versatz);
        if (u < 1) fertig = false;
        u = easeInOut(clamp(u, 0, 1));
        const a = von[i] || nach[i], b = nach[i];
        akt[i] = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, ka: a.k, kb: b.k, m: u, k: b.k };
      }
      zeichneMisch();
      if (fertig) { stop = null; akt = nach.map(p => ({ x: p.x, y: p.y, k: p.k })); zeichneMisch(); return false; }
    });
  };

  /* Knöpfe im selben Reiter bzw. Bereich */
  const reiter = el.closest('.w-tab-pane');
  const bereich = el.closest('[data-punktbild-bereich]') || reiter || el.parentElement;
  const knoepfe = [...bereich.querySelectorAll('[data-punktbild-ausloeser]')];
  const startZ = startNachher ? 1 : 0;
  const knopfStand = () => knoepfe.forEach(k => k.setAttribute('aria-pressed', String(ziel !== startZ)));
  knoepfe.forEach(k => {
    k.setAttribute('role', k.getAttribute('role') || 'button');
    k.addEventListener('click', e => {
      if (k.getAttribute('href') === '#' || !k.getAttribute('href')) e.preventDefault();
      spielen(ziel === 1 ? 0 : 1);
      knopfStand();
    });
  });

  const zurueck = () => { setzen(startZ); knopfStand(); };
  const losAuto = () => { if (auto) setTimeout(() => { spielen(startZ === 1 ? 0 : 1); knopfStand(); }, 350); };

  new ResizeObserver(() => {
    const z = ziel;
    if (stop) { stop(); stop = null; }
    if (layout()) { akt = lagen[z].map(p => ({ x: p.x, y: p.y, k: p.k })); zeichneMisch(); }
  }).observe(el);

  if (!reiter || reiter.classList.contains('w--tab-active')) {
    sobaldNahe(el, () => { zurueck(); losAuto(); }, '0px 0px -15% 0px');
  }
  if (reiter) {
    let offen = reiter.classList.contains('w--tab-active');
    new MutationObserver(() => {
      const jetzt = reiter.classList.contains('w--tab-active');
      if (jetzt && !offen) requestAnimationFrame(() => { lagen = null; layout(); zurueck(); losAuto(); });
      offen = jetzt;
    }).observe(reiter, { attributes: true, attributeFilter: ['class'] });
  }
}
