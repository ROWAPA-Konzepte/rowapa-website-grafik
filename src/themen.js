/* Themenlinien («Lösungen für Unternehmen»): Szene nach dem Vorbild der Referenz Tresmares Capital, eigener Code.
   Ab 992 px und ohne «Bewegung reduzieren»:
   - Die Bühne (themen_buehne) steht beim Scrollen, je Thema eine Fensterhöhe Scrollweg (data-schritt).
   - Alles hängt am Scroll-Fortschritt zwischen zwei Themen: Vorhang von unten (data-uebergang="unten", Standard) oder
     diagonal 45° («diagonal», zum Vergleichen auch ?uebergang=diagonal in der Adresse). Das alte Thema dunkelt ab,
     Figur und Text rücken nach oben (−20 % / −30 % der Fensterhöhe), das neue kommt von unten nach. Der alte Titel blendet
     im ersten Viertel aus, der neue im letzten Viertel ein. Die Plum-Form zeigt sich nur während des Wechsels: Sie setzt
     sich aus kleinen Quadraten zusammen, schrumpft zu vier kleinen Quadraten, wächst zur nächsten Form (data-form am Panel)
     und zerfällt wieder, sobald der neue Titel steht. In Ruhe ist nur die Schrift zu sehen.
   - Die Figur ist im Wechsel kräftig und tritt zurück (Deckkraft 40 %, data-figur-ruhe), sobald das Thema ganz offen ist.
   - Weiches Scrollen (Lenis) und Wisch-Einrasten (seit 1.12.0 Standard): Ein Wisch auf dem Trackpad oder ein Rad-Stoss
     fährt sofort genau ein Thema weiter, der Nachlauf wird übergangen. Tastatur und Scrollbalken rasten in Scrollrichtung
     ein (früheres Verhalten, mit dem Mausrad zum Vergleichen noch über ?einrasten=rad).
     Klick auf ein Thema der Liste scrollt in einer Sekunde dorthin. Die Navigation ist ausgeblendet, solange die Bühne steht.
   Darunter (Tablet, Handy): Blöcke untereinander mit stehender Leiste (Handy seit 1.17.0: jeder Block füllt den
   Bildschirm und wird vom nächsten von unten zugedeckt, ohne Einrasten); der Titel im Blick ist voll, die anderen blass,
   der ausscheidende Block dunkelt ab, die Form zerfällt, während der Block in den Blick rückt. Bei «Bewegung reduzieren»
   nur die Markierung, ohne Form. Ohne Skript: Blöcke untereinander.
   Anordnung «diagonal» zum Vergleichen: ?anordnung=diagonal oder data-anordnung="diagonal" (Zusatzklasse is-diagonal).
   Texte, Links und Bilder sind native Webflow-Elemente; das Skript setzt Lage, Ausschnitt, Deckkraft und die Klasse is-aktiv. */
import Lenis from 'lenis';
import { clamp, lerp, easeInOut, zahl, reduziert } from './util.js';

const BREIT = '(min-width: 992px)';
const DUNKEL = 0.85;         // Abdunklung des ausscheidenden Themas (Manganese), bei halbem Wechsel rund 42 % wie die Referenz
const DUNKEL_HANDY = 0.2;    // Abdunklung des ausscheidenden Blocks auf Tablet und Handy (Referenz: leicht)
const BLASS = 0.35;          // Deckkraft der Titel ausserhalb des Blicks (Handy)
const PLUM = '#AA1351';
/* Ablauf der Form innerhalb eines Wechsels (Anteil des Scrollwegs) */
const AUFBAU = 0.22;         // bis hier setzt sich die alte Form zusammen
const MITTE = 0.42;          // vier kleine Quadrate
const FERTIG = 0.62;         // neue Form steht
const WEG = 0.92;            // neue Form ist zerfallen
const RASTER = 7;            // Zerfall: jedes Viereck in 7 × 7 Zellen
const ZEIT = 0.4;            // Zerfall: Anteil, über den eine einzelne Zelle schrumpft
const FIGUR_RUHE = 0.4;      // Deckkraft der Figur, sobald ein Thema ganz offen ist (data-figur-ruhe an der Section)
const SCHWELLE = 0.04;       // Einrasten: so weit (Anteil der Fensterhöhe) muss man vom Thema weg, damit es weitergeht
const PAUSE = 200;           // Wisch-Einrasten: so lange (ms) ohne Rad-Ereignis beginnt eine neue Bewegung

/* Formen aus 45°-Bändern wie das Ribbon, je vier Vierecke in einem Feld von −1 bis 1 (y nach unten) */
function band(ax, ay, bx, by, d, stuecke, luecke = 0.035) {
  const lx = bx - ax, ly = by - ay, l = Math.hypot(lx, ly), ux = lx / l, uy = ly / l, nx = -uy * d / 2, ny = ux * d / 2;
  const out = [];
  for (let s = 0; s < stuecke; s++) {
    const t0 = s / stuecke + (s ? luecke / 2 : 0), t1 = (s + 1) / stuecke - (s < stuecke - 1 ? luecke / 2 : 0);
    const p0x = ax + lx * t0, p0y = ay + ly * t0, p1x = ax + lx * t1, p1y = ay + ly * t1;
    out.push([[p0x + nx, p0y + ny], [p1x + nx, p1y + ny], [p1x - nx, p1y - ny], [p0x - nx, p0y - ny]]);
  }
  return out;
}
function quadrat(cx, cy, s) {
  return [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
}
const FORMEN = {
  band: () => band(-0.9, 0.9, 0.9, -0.9, 0.42, 4),
  doppel: () => [...band(-0.95, 0.45, 0.45, -0.95, 0.32, 2), ...band(-0.45, 0.95, 0.95, -0.45, 0.32, 2)],
  winkel: () => [...band(-0.9, 0.55, 0, -0.35, 0.34, 2), ...band(0, -0.35, 0.9, 0.55, 0.34, 2)],
  trichter: () => [...band(-0.9, -0.55, 0, 0.35, 0.34, 2), ...band(0, 0.35, 0.9, -0.55, 0.34, 2)],
  raster: () => [quadrat(-0.4, -0.4, 0.34), quadrat(0.4, -0.4, 0.34), quadrat(-0.4, 0.4, 0.34), quadrat(0.4, 0.4, 0.34)]
};
const REIHE = ['band', 'doppel', 'winkel', 'trichter', 'raster'];
const KLEIN = [quadrat(-0.16, -0.16, 0.13), quadrat(0.16, -0.16, 0.13), quadrat(-0.16, 0.16, 0.13), quadrat(0.16, 0.16, 0.13)];

/* Ecken im Uhrzeigersinn, beginnend oben links, damit beim Verwandeln nichts verdreht */
function ordne(q) {
  const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4;
  const r = q.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  let k = 0;
  r.forEach((p, i) => { if (p[0] + p[1] < r[k][0] + r[k][1]) k = i; });
  return r.slice(k).concat(r.slice(0, k));
}
/* jedes Viereck dem nächstgelegenen kleinen Quadrat zuordnen (beste von 24 Reihenfolgen) */
function zuordnen(form) {
  const m = q => [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4];
  const mk = KLEIN.map(m), mf = form.map(m);
  let best = null, bestD = 1e9;
  const perm = (a, l = []) => {
    if (!a.length) {
      const d = l.reduce((s, k, i) => s + Math.hypot(mf[i][0] - mk[k][0], mf[i][1] - mk[k][1]), 0);
      if (d < bestD) { bestD = d; best = l; }
      return;
    }
    a.forEach((x, i) => perm(a.slice(0, i).concat(a.slice(i + 1)), l.concat(x)));
  };
  perm([0, 1, 2, 3]);
  const out = [];
  best.forEach((k, i) => { out[k] = ordne(form[i]); });
  return out;
}
const KLEIN_O = KLEIN.map(ordne);
function zwischen(A, B, t) {
  return A.map((q, i) => q.map((p, j) => [lerp(p[0], B[i][j][0], t), lerp(p[1], B[i][j][1], t)]));
}

/* Zerfall in kleine Quadrate wie die Punktfiguren: jede Zelle hat einen festen Zeitpunkt (Zufall plus Lage, oben rechts
   zuerst) und eine kleine Drift nach rechts oben, in 45° wie das Ribbon */
const zufall = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const ZELLEN = [];
for (let q = 0; q < 4; q++) {
  for (let a = 0; a < RASTER; a++) {
    for (let b = 0; b < RASTER; b++) {
      const z = ZELLEN.length, lage = ((RASTER - 1 - b) + a) / (2 * (RASTER - 1));
      const w = -Math.PI / 4 + (zufall(z + 101) - 0.5) * 2.4, weit = 0.05 + 0.12 * zufall(z + 202);
      ZELLEN.push({ q, u0: b / RASTER, u1: (b + 1) / RASTER, v0: a / RASTER, v1: (a + 1) / RASTER,
        start: (0.6 * zufall(z) + 0.4 * lage) * (1 - ZEIT), dx: Math.cos(w) * weit, dy: Math.sin(w) * weit });
    }
  }
}
const zahl3 = v => (Math.round(v * 1000) / 1000).toString();
/* Punkt im Viereck (Ecken oben links, oben rechts, unten rechts, unten links) */
function punkt(Q, u, v) {
  const ox = lerp(Q[0][0], Q[1][0], u), oy = lerp(Q[0][1], Q[1][1], u);
  const ux = lerp(Q[3][0], Q[2][0], u), uy = lerp(Q[3][1], Q[2][1], u);
  return [lerp(ox, ux, v), lerp(oy, uy, v)];
}
/* Pfad der Form F; weg = 0 ganz, 1 ganz zerfallen */
function pfad(F, weg) {
  if (weg >= 0.999) return '';
  if (weg <= 0.001) return F.map(Q => 'M' + Q.map(p => zahl3(p[0]) + ' ' + zahl3(p[1])).join('L') + 'Z').join('');
  let d = '';
  for (const z of ZELLEN) {
    const k = 1 - easeInOut(clamp((weg - z.start) / ZEIT, 0, 1));
    if (k <= 0.02) continue;
    const Q = F[z.q];
    const e = [punkt(Q, z.u0, z.v0), punkt(Q, z.u1, z.v0), punkt(Q, z.u1, z.v1), punkt(Q, z.u0, z.v1)];
    const mx = (e[0][0] + e[1][0] + e[2][0] + e[3][0]) / 4, my = (e[0][1] + e[1][1] + e[2][1] + e[3][1]) / 4;
    const cx = mx + (1 - k) * z.dx, cy = my + (1 - k) * z.dy;
    const g = k * 1.06; // leicht überlappend, damit zwischen ganzen Zellen keine Haarlinien entstehen
    d += 'M' + e.map(p => zahl3(cx + (p[0] - mx) * g) + ' ' + zahl3(cy + (p[1] - my) * g)).join('L') + 'Z';
  }
  return d;
}

function navHoehe(nav) {
  if (!nav) return 0;
  const pos = getComputedStyle(nav).position;
  return pos === 'sticky' || pos === 'fixed' ? nav.getBoundingClientRect().height : 0;
}

function uebergang(sec) {
  let art = '';
  try { art = new URLSearchParams(location.search).get('uebergang') || ''; } catch (e) { /* alte Browser */ }
  art = (art || sec.getAttribute('data-uebergang') || '').trim().toLowerCase();
  return art === 'diagonal' ? 'diagonal' : 'unten';
}

/* Anordnung der Texte zum Vergleichen: ?anordnung=diagonal in der Adresse oder data-anordnung="diagonal" an der Section
   setzt die Zusatzklasse is-diagonal (Stile in Webflow): Kernbotschaft unten links, Satz und Link oben rechts */
function anordnung(sec) {
  let art = '';
  try { art = new URLSearchParams(location.search).get('anordnung') || ''; } catch (e) { /* alte Browser */ }
  art = (art || sec.getAttribute('data-anordnung') || '').trim().toLowerCase();
  return art === 'diagonal' ? 'diagonal' : '';
}

/* Einrasten: «wisch» (Standard seit 1.12.0, sofort, ein Wisch = ein Thema) oder «rad» (früher: 150 ms nach dem letzten
   Rad-Schritt); zum Vergleichen ?einrasten=rad in der Adresse oder data-einrasten="rad" an der Section */
function einrastArt(sec) {
  let art = '';
  try { art = new URLSearchParams(location.search).get('einrasten') || ''; } catch (e) { /* alte Browser */ }
  art = (art || sec.getAttribute('data-einrasten') || '').trim().toLowerCase();
  return art === 'rad' ? 'rad' : 'wisch';
}

/* Plum-Form im Wechsel: «an» (Standard) oder «aus»; zum Vergleichen ?plumform=aus in der Adresse oder data-plumform="aus"
   an der Section (Figuren, Vorhang, Titel und Einrasten bleiben gleich) */
function plumform(sec) {
  let art = '';
  try { art = new URLSearchParams(location.search).get('plumform') || ''; } catch (e) { /* alte Browser */ }
  art = (art || sec.getAttribute('data-plumform') || '').trim().toLowerCase();
  return art === 'aus' ? 'aus' : 'an';
}

export function themen(sec) {
  const huelle = sec.querySelector('.themen_huelle');
  const buehne = sec.querySelector('.themen_buehne');
  const liste = sec.querySelector('.themen_liste');
  const box = sec.querySelector('.themen_panels');
  const panels = [...sec.querySelectorAll('.themen_panel')];
  const links = [...sec.querySelectorAll('.themen_link')];
  const n = panels.length;
  if (!huelle || !buehne || !box || !n) return;
  const nav = document.querySelector('.navbar_component');
  const hoch = document.querySelector('.nach-oben');
  const mitForm = plumform(sec) === 'an';
  if (window.ROWAPAGrafik) window.ROWAPAGrafik.plumform = mitForm ? 'an' : 'aus';

  if (anordnung(sec) === 'diagonal') {
    panels.forEach(p => ['.themen_titel', '.themen_unten', '.themen_text', '.themen_aktion'].forEach(k => {
      const e = p.querySelector(k);
      if (e) e.classList.add('is-diagonal');
    }));
  }

  const zu = links.map((a, i) => {
    const id = (a.getAttribute('href') || '').split('#')[1];
    const k = id ? panels.findIndex(p => p.id === id) : -1;
    return k >= 0 ? k : Math.min(i, n - 1);
  });

  /* Ebenen je Panel: Abdunklung und Plum-Form (vom Skript angelegt, nicht in Webflow) */
  const svgNS = 'http://www.w3.org/2000/svg';
  const teile = panels.map((p, k) => {
    const dunkel = document.createElement('div');
    dunkel.setAttribute('aria-hidden', 'true');
    dunkel.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;opacity:0;background:var(--_farben---manganese-black,#1D3149)';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.style.cssText = 'position:absolute;z-index:2;pointer-events:none;overflow:visible;left:50%;top:50%;transform:translate(-50%,-50%)';
    if (!mitForm) svg.style.display = 'none';
    const form = document.createElementNS(svgNS, 'path');
    form.setAttribute('fill', `var(--_farben---plum-perfect, ${PLUM})`);
    svg.appendChild(form);
    p.prepend(svg);
    p.prepend(dunkel);
    const name = (p.getAttribute('data-form') || '').trim().toLowerCase();
    return { p, dunkel, svg, pfad: form, d: null, form: zuordnen((FORMEN[name] || FORMEN[REIHE[k % REIHE.length]])()),
      titel: p.querySelector('.themen_titel'), figur: p.querySelector('.themen_figur'), unten: p.querySelector('.themen_unten') };
  });
  const male = (t, F, weg) => {
    if (!mitForm) return;
    const d = pfad(F, weg);
    if (d !== t.d) { t.d = d; t.pfad.setAttribute('d', d); }
  };

  function markiere(i) {
    links.forEach((a, k) => {
      const an = zu[k] === i;
      a.classList.toggle('is-aktiv', an);
      if (an) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    const a = links[zu.indexOf(i)];
    if (a && liste && liste.scrollWidth > liste.clientWidth + 2) {
      liste.scrollTo({ left: a.offsetLeft - (liste.clientWidth - a.offsetWidth) / 2, behavior: reduziert() ? 'auto' : 'smooth' });
    }
  }

  const mq = matchMedia(BREIT);
  let modus = null;
  function wechsle() {
    const soll = mq.matches && !reduziert() ? 'buehne' : 'liste';
    if (modus && modus.art === soll) return;
    if (modus) modus.weg();
    modus = soll === 'buehne' ? neueBuehne() : neueListe();
  }
  if (mq.addEventListener) mq.addEventListener('change', wechsle);
  else mq.addListener(wechsle);

  links.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (modus) modus.geheZu(zu[i]);
  }));

  /* ---------- Bühne (Desktop) ---------- */
  function neueBuehne() {
    const art = uebergang(sec);
    const anteil = clamp(zahl(sec, 'data-schritt', 1), 0.4, 2);
    const gemerkt = [];
    const setze = (el, stile) => {
      if (!el) return;
      for (const k in stile) { gemerkt.push([el, k]); el.style[k] = stile[k]; }
    };
    const ruheFigur = clamp(zahl(sec, 'data-figur-ruhe', FIGUR_RUHE), 0.1, 1);
    const wisch = einrastArt(sec) === 'wisch';
    if (window.ROWAPAGrafik) window.ROWAPAGrafik.einrasten = wisch ? 'Wisch' : 'Rad';
    let vh = innerHeight, w = innerWidth, schritt = vh, oben = 0, aktiv = -1, aus = false, navWeg = false, letzteLage = null;

    setze(buehne, { position: 'sticky', top: '0px', overflow: 'hidden' });
    setze(box, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%' });
    teile.forEach(t => {
      setze(t.p, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', minHeight: '0px', willChange: 'clip-path' });
      setze(t.figur, { willChange: 'transform, opacity' });
      setze(t.unten, { willChange: 'transform' });
    });
    if (nav) setze(nav, { transition: 'transform .45s cubic-bezier(.2,.7,.1,1)' });
    if (hoch) setze(hoch, { transition: 'opacity .3s ease' });

    function messen() {
      vh = innerHeight; w = buehne.clientWidth || innerWidth;
      schritt = Math.round(vh * anteil);
      buehne.style.height = vh + 'px';
      huelle.style.height = vh + (n - 1) * schritt + 'px';
      oben = huelle.getBoundingClientRect().top + scrollY;
      const s = Math.round(Math.min(w * 0.24, vh * 0.33) * 2);
      /* Form mittig auf dem Titel (dessen Lage steht in Webflow, Klasse themen_titel) */
      teile.forEach(t => {
        const mitte = t.titel ? parseFloat(getComputedStyle(t.titel).top) : NaN;
        Object.assign(t.svg.style, { width: s + 'px', height: s + 'px', left: '50%', top: isFinite(mitte) ? mitte + 'px' : '50%' });
      });
    }
    gemerkt.push([buehne, 'height'], [huelle, 'height']);
    teile.forEach(t => gemerkt.push([t.p, 'clipPath'], [t.p, 'visibility'], [t.p, 'zIndex'], [t.dunkel, 'opacity'], [t.titel, 'opacity'],
      [t.figur, 'transform'], [t.figur, 'opacity'], [t.unten, 'transform'], [t.unten, 'opacity']));
    if (nav) gemerkt.push([nav, 'transform']);
    if (hoch) gemerkt.push([hoch, 'opacity'], [hoch, 'pointerEvents']);

    function klappe(p) {
      if (p >= 1) return 'none';
      if (art === 'diagonal') {
        /* Kante unter 45° wie das Ribbon (/), wandert von rechts unten nach links oben */
        const h = vh, c = (1 - p) * (w + h);
        return `polygon(${c.toFixed(1)}px 0, ${w + h}px 0, ${w + h}px ${h}px, ${(c - h).toFixed(1)}px ${h}px)`;
      }
      return `inset(${((1 - p) * 100).toFixed(3)}% 0 0 0)`;
    }

    function zeichne(neu) {
      if (aus) return;
      const r = huelle.getBoundingClientRect();
      if (!neu && r.top === letzteLage) return; // je Bild nur einmal rechnen (Lenis und Browser melden beide)
      letzteLage = r.top;
      let q = clamp(-r.top / schritt, 0, n - 1);
      if (Math.abs(q - Math.round(q)) < 0.003) q = Math.round(q); // Rest unter 2 px (halbe Pixel der Lage): Thema steht
      const i = Math.min(Math.floor(q), n - 1), p = i === n - 1 ? 0 : q - i, j = Math.min(i + 1, n - 1);
      /* Figur: im Wechsel kräftig, sobald das Thema ganz offen ist, tritt sie zurück (data-figur-ruhe) */
      const einstieg = i === 0 && p === 0 ? easeInOut(clamp(1 - r.top / (vh * 0.5), 0, 1)) : 1;
      teile.forEach((t, k) => {
        if (k === i) {
          t.p.style.visibility = ''; t.p.style.zIndex = '1'; t.p.style.clipPath = 'none';
          t.dunkel.style.opacity = (DUNKEL * p).toFixed(3);
          t.figur.style.transform = `translate(-50%, calc(-50% - ${(20 * p).toFixed(3)}vh))`;
          t.figur.style.opacity = (lerp(1, ruheFigur, einstieg) * (1 - 0.5 * p)).toFixed(3);
          t.unten.style.transform = `translateY(${(-30 * p).toFixed(3)}vh)`;
          t.unten.style.opacity = '';
          t.titel.style.opacity = (1 - clamp(p / 0.25, 0, 1)).toFixed(3);
        } else if (k === j && p > 0) {
          t.p.style.visibility = ''; t.p.style.zIndex = '2'; t.p.style.clipPath = klappe(p);
          t.dunkel.style.opacity = '0';
          t.figur.style.transform = `translate(-50%, calc(-50% + ${(20 * (1 - p)).toFixed(3)}vh))`;
          t.figur.style.opacity = lerp(1, ruheFigur, easeInOut(clamp((p - 0.8) / 0.2, 0, 1))).toFixed(3);
          t.unten.style.transform = `translateY(${(30 * (1 - p)).toFixed(3)}vh)`;
          t.titel.style.opacity = clamp((p - 0.7) / 0.25, 0, 1).toFixed(3);
        } else {
          t.p.style.visibility = 'hidden';
        }
      });
      /* Form nur im Wechsel: zusammensetzen, zu vier kleinen Quadraten, zur neuen Form, zerfallen; in Ruhe keine Form */
      let F = teile[i].form, weg = 0;
      if (p <= AUFBAU) weg = 1 - easeInOut(p / AUFBAU);
      else if (p <= MITTE) F = zwischen(teile[i].form, KLEIN_O, easeInOut((p - AUFBAU) / (MITTE - AUFBAU)));
      else if (p <= FERTIG) F = zwischen(KLEIN_O, teile[j].form, easeInOut((p - MITTE) / (FERTIG - MITTE)));
      else { F = teile[j].form; weg = easeInOut(clamp((p - FERTIG) / (WEG - FERTIG), 0, 1)); }
      male(teile[i], F, weg);
      if (j !== i) male(teile[j], F, weg);
      const k = Math.round(q);
      if (k !== aktiv) { aktiv = k; markiere(k); }
      /* Navigation und «Nach oben» ausblenden, solange die Bühne steht */
      const steht = r.top <= vh * 0.05 && r.bottom >= vh * 0.6;
      if (steht !== navWeg) {
        navWeg = steht;
        if (nav) nav.style.transform = steht ? 'translateY(-101%)' : '';
        if (hoch) { hoch.style.opacity = steht ? '0' : ''; hoch.style.pointerEvents = steht ? 'none' : ''; }
      }
    }

    /* weiches Scrollen und Einrasten in Scrollrichtung (wie die Referenz): Wer vom stehenden Thema aus ein Stück
       weiterscrollt, kommt zum nächsten, wer zurückscrollt, zum vorherigen; nur kleine Bewegungen laufen zurück.
       Während der Fahrt zählt das Mausrad nicht, damit jeder Wechsel ganz abläuft. */
    let virtuell = () => true;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: false, allowNestedScroll: true,
      virtualScroll: d => virtuell(d) });
    document.documentElement.style.scrollBehavior = 'auto';
    let ruhe = null, versuche = 0, rad = 0, faehrt = false, gesperrt = false, sicher = null, basis = 0;
    /* Fahrt mit dem Tempo beginnen, das gerade anliegt, und weich anhalten (kubische Hermite-Kurve) */
    const kurve = m0 => t => (t * t * t - 2 * t * t + t) * m0 + (3 * t * t - 2 * t * t * t);
    const fahre = (k, dauer, start) => {
      const y = oben + k * schritt, d = y - scrollY, anteil = Math.abs(d) / schritt;
      if (Math.abs(d) < 2) { basis = k; return; }
      /* kurze Korrekturen kurz und ohne Sperre, ganze Wechsel 1,3 s und gesperrt */
      dauer *= clamp(Math.sqrt(anteil), 0.3, 1);
      const v = lenis.velocity * 60; // Pixel je Sekunde
      const m0 = start !== undefined ? start : Math.sign(d) === Math.sign(v) ? clamp(Math.abs(v) * dauer / Math.abs(d), 0, 2.5) : 0;
      faehrt = true;
      gesperrt = anteil > 0.15;
      clearTimeout(sicher);
      sicher = setTimeout(() => { faehrt = false; }, dauer * 1000 + 500);
      lenis.scrollTo(y, { duration: dauer, easing: kurve(m0), lock: gesperrt, force: true, onComplete: () => { faehrt = false; basis = k; } });
    };
    const selbst = () => { rad = performance.now(); if (faehrt && !gesperrt && !wisch) faehrt = false; }; // kurze Korrektur: Rad übernimmt
    addEventListener('wheel', selbst, { passive: true });
    const einrasten = () => {
      if (aus || faehrt) return;
      /* Mausrad: 150 ms nach dem letzten Rad-Schritt, ohne den weichen Nachlauf abzuwarten;
         Wischen und Tastatur: warten, bis der Browser fertig gescrollt hat */
      const nachlauf = lenis.isScrolling === 'smooth' && performance.now() - rad >= 150;
      if (lenis.isScrolling && !nachlauf && versuche++ < 30) { ruhe = setTimeout(einrasten, 80); return; }
      versuche = 0;
      const s = scrollY - oben, max = (n - 1) * schritt;
      if (s <= 1) { basis = 0; return; }
      if (s >= max - 1) { basis = n - 1; return; }
      const q = s / schritt;
      let k = basis;
      if (q > basis + SCHWELLE) k = Math.ceil(q - 0.001);
      else if (q < basis - SCHWELLE) k = Math.floor(q + 0.001);
      fahre(clamp(k, 0, n - 1), 1.3);
    };
    /* Wisch-Einrasten: Die erste Rad-Meldung einer Bewegung startet die Fahrt zum nächsten Thema in ihrer Richtung; alle
       weiteren Meldungen derselben Bewegung (Nachlauf des Trackpads, weitere Rad-Schritte) werden übergangen. Neue Bewegung:
       200 ms Pause oder ein deutlich stärkerer Ausschlag nach der Fahrt. Am ersten und letzten Thema führt die nächste
       Bewegung wie gewohnt aus der Szene hinaus; wer von aussen hineinscrollt, hält am ersten bzw. letzten Thema an. */
    let strom = 0, letztesD = 0, schlucken = false;
    if (wisch) virtuell = ({ deltaY: d, event: e }) => {
      if (aus || !e || !e.type.includes('wheel') || e.ctrlKey || !d) return true;
      const jetzt = performance.now();
      const neu = jetzt - strom > PAUSE || (!faehrt && Math.abs(d) > 1.6 * Math.abs(letztesD) + 4 && Math.abs(d) >= 12);
      strom = jetzt; letztesD = d;
      const halt = () => { if (e.cancelable) e.preventDefault(); return false; };
      if (faehrt || (schlucken && !neu)) return halt();
      schlucken = false;
      const s = scrollY - oben, max = (n - 1) * schritt, dir = Math.sign(d);
      if (s > -2 && s < max + 2) {
        const q = s / schritt;
        const k = dir > 0 ? Math.floor(q + 0.02) + 1 : Math.ceil(q - 0.02) - 1;
        if (k < 0 || k > n - 1) return true;
        schlucken = true;
        fahre(k, 1.1, 0.6);
        return halt();
      }
      const ziel = lenis.targetScroll + d - oben;
      if ((dir > 0 && s < 0 && ziel > 0) || (dir < 0 && s > max && ziel < max)) {
        schlucken = true;
        fahre(dir > 0 ? 0 : n - 1, 0.8, 0.8);
        return halt();
      }
      return true;
    };
    const beimScrollen = () => {
      zeichne();
      if (faehrt) return;
      const s = scrollY - oben;
      /* von oben hereingescrollt: wie vom ersten Thema aus; von unten: wie vom letzten */
      if (s < -2) basis = 0; else if (s > (n - 1) * schritt + 2) basis = n - 1;
      /* nach dem Mausrad zählt der letzte Rad-Schritt, nicht jeder Schritt des weichen Nachlaufs */
      const seitRad = performance.now() - rad;
      clearTimeout(ruhe);
      ruhe = setTimeout(einrasten, seitRad < 1000 ? Math.max(0, 150 - seitRad) : 140);
    };
    lenis.on('scroll', beimScrollen);
    let geplant = false;
    const nativ = () => { if (!geplant) { geplant = true; requestAnimationFrame(() => { geplant = false; zeichne(); }); } };
    addEventListener('scroll', nativ, { passive: true });
    const beiGroesse = () => requestAnimationFrame(() => { if (!aus) { messen(); zeichne(true); } });
    addEventListener('resize', beiGroesse);

    /* Tastatur: Fokus in einem verdeckten Thema holt dieses Thema auf die Bühne */
    const fokus = e => {
      const k = panels.findIndex(p => p.contains(e.target));
      if (k >= 0 && k !== aktiv) { lenis.scrollTo(oben + k * schritt, { immediate: true, force: true }); basis = k; }
    };
    sec.addEventListener('focusin', fokus);

    messen();
    zeichne(true);

    return {
      art: 'buehne',
      geheZu(k) { fahre(k, 1); },
      weg() {
        aus = true;
        clearTimeout(ruhe);
        clearTimeout(sicher);
        removeEventListener('wheel', selbst);
        lenis.destroy();
        document.documentElement.style.scrollBehavior = '';
        removeEventListener('scroll', nativ);
        removeEventListener('resize', beiGroesse);
        sec.removeEventListener('focusin', fokus);
        gemerkt.forEach(([el, k]) => { if (el) el.style[k] = ''; });
      }
    };
  }

  /* ---------- Blöcke untereinander (Tablet, Handy, «Bewegung reduzieren») ---------- */
  function neueListe() {
    const ruhig = reduziert();
    let aktiv = -1, geplant = false, aus = false;
    teile.forEach(t => { if (t.titel && !ruhig) t.titel.style.transition = 'opacity .35s ease'; });

    /* Form liegt auf der Figur */
    function messen() {
      /* Handy: Die Blöcke stehen (CSS sticky in Webflow) und werden vom nächsten Block von unten zugedeckt.
         Ein Block, der höher ist als der freie Platz, bleibt erst stehen, wenn sein Ende im Fenster ist. */
      const oben = navHoehe(nav) + (liste && getComputedStyle(liste).position === 'sticky' ? liste.getBoundingClientRect().height : 0);
      panels.forEach(p => {
        if (getComputedStyle(p).position !== 'sticky') { p.style.top = ''; return; }
        p.style.top = Math.round(Math.min(oben, innerHeight - p.offsetHeight)) + 'px';
      });
      teile.forEach(t => {
        const f = t.figur, pr = t.p.getBoundingClientRect();
        if (!f) return;
        const fr = f.getBoundingClientRect(), s = Math.round(Math.min(fr.height * 0.95, pr.width * 0.7));
        Object.assign(t.svg.style, { width: s + 'px', height: s + 'px', left: fr.left - pr.left + fr.width / 2 + 'px', top: fr.top - pr.top + fr.height / 2 + 'px' });
      });
    }

    function lage() {
      geplant = false;
      if (aus) return;
      const linie = innerHeight * 0.4;
      let k = 0;
      const tops = panels.map(p => p.getBoundingClientRect().top);
      tops.forEach((top, i) => { if (top <= linie) k = i; });
      if (k !== aktiv) {
        aktiv = k;
        markiere(k);
        if (!ruhig) teile.forEach((t, i) => { if (t.titel) t.titel.style.opacity = i === k ? '' : String(BLASS); });
      }
      /* der ausscheidende Block dunkelt ab, während der nächste hochkommt; die Form zerfällt, während die Figur
         von 85 % auf 50 % der Fensterhöhe steigt */
      teile.forEach((t, i) => {
        if (ruhig || !t.figur) { male(t, t.form, 1); return; }
        const naechster = tops[i + 1];
        t.dunkel.style.opacity = naechster === undefined ? '0' : (DUNKEL_HANDY * clamp(1 - naechster / innerHeight, 0, 1)).toFixed(3);
        const fr = t.figur.getBoundingClientRect(), mitte = (fr.top + fr.bottom) / 2;
        male(t, t.form, easeInOut(clamp((innerHeight * 0.85 - mitte) / (innerHeight * 0.35), 0, 1)));
      });
    }
    const beimScrollen = () => { if (!geplant) { geplant = true; requestAnimationFrame(lage); } };
    const beiGroesse = () => requestAnimationFrame(() => { messen(); lage(); });
    addEventListener('scroll', beimScrollen, { passive: true });
    addEventListener('resize', beiGroesse);
    messen();
    lage();

    return {
      art: 'liste',
      geheZu(k) {
        const leiste = liste && getComputedStyle(liste).position === 'sticky' ? liste.getBoundingClientRect().height : 0;
        /* stehende Blöcke melden ihre stehende Lage; darum vom Anfang der Liste aus zählen */
        let y = panels[0].parentElement.getBoundingClientRect().top + scrollY - navHoehe(nav) - leiste;
        for (let j = 0; j < k; j++) y += panels[j].offsetHeight;
        scrollTo({ top: y, behavior: ruhig ? 'auto' : 'smooth' });
      },
      weg() {
        aus = true;
        removeEventListener('scroll', beimScrollen);
        removeEventListener('resize', beiGroesse);
        teile.forEach(t => { if (t.titel) { t.titel.style.opacity = ''; t.titel.style.transition = ''; } t.dunkel.style.opacity = '0'; male(t, t.form, 1); });
        panels.forEach(p => { p.style.top = ''; });
      }
    };
  }

  wechsle();
}
