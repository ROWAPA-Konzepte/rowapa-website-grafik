/* Mauszeiger als Punkt (Plum) mit feinem Ring (Geräte mit Maus oder Trackpad; meldet der Browser keine Maus, z. B. bei
   Touchscreens unter Windows, schaltet er sich bei der ersten Mausbewegung ein; bei Berührung mit dem Finger ausgeblendet).
   Element mit data-grafik="zeiger" schaltet ihn ein.
   Der Ring steht immer im Kontrast zum Grund darunter: dunkel auf hellem, hell auf dunklem Grund und auf Bildern.
   data-zeiger="a" (Standard) Punkt und Ring · "b" zusätzlich wächst der Ring auf Links und Karten («Öffnen»).
   In Formularfeldern bleibt der normale Cursor.
   Ab 1.20.0 läuft der Ring 1:1 mit der Maus, ohne Nachziehen (Entscheid 383). Wer wieder einen Nachlauf möchte:
   data-zeiger-nachlauf="0.8" am selben Element (0 = direkt, Standard; bis 0.95 = stark verzögert). Bei «Bewegung reduzieren»
   immer direkt. */
import { reduziert, ciFarbe, beiMaus, clamp } from './util.js';

let laeuft = false;

export function zeiger(el) {
  if (laeuft) return;
  laeuft = true;
  beiMaus(() => starten(el));
}

function starten(el) {
  const plum = `rgb(${ciFarbe('plum-perfect', '#AA1351').join(',')})`;
  const dunkelblau = `rgb(${ciFarbe('manganese-black', '#1D3149').join(',')})`;
  const stil = document.createElement('style');
  stil.textContent = 'html.hat-zeiger, html.hat-zeiger *{cursor:none!important}html.hat-zeiger input, html.hat-zeiger textarea, html.hat-zeiger select{cursor:auto!important}';
  document.head.appendChild(stil);
  const mk = css => { const d = document.createElement('div'); d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483000;opacity:0;transition:opacity .2s ease;' + css; document.body.appendChild(d); return d; };
  const punkt = mk(`width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:${plum}`);
  const kreis = mk(`width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;border:1px solid ${dunkelblau};display:flex;align-items:center;justify-content:center;font:800 10px/1 var(--_typografie---schrift-akzent, sans-serif);letter-spacing:.12em;text-transform:uppercase;transition:opacity .2s ease, width .25s ease, height .25s ease, margin .25s ease, background-color .25s ease, border-color .25s ease, color .25s ease`);
  const text = document.createElement('span'); kreis.appendChild(text);
  document.documentElement.classList.add('hat-zeiger');

  let mx = -100, my = -100, kx = -100, ky = -100, sichtbar = false, groesse = 36;
  const variante = () => (el.getAttribute('data-zeiger') || 'a').toLowerCase();
  const nachlauf = () => { const n = parseFloat(el.getAttribute('data-zeiger-nachlauf')); return Number.isFinite(n) ? clamp(n, 0, 0.95) : 0; };

  /* Grund unter dem Zeiger: 'bild', 'dunkel' oder 'hell' (erste deckende Hintergrundfarbe, Bilder zählen als dunkel) */
  const merk = new WeakMap();
  function grund(t) {
    if (!t || !t.closest) return 'hell';
    if (merk.has(t)) return merk.get(t);
    let g = 'hell';
    for (let e = t; e && e.nodeType === 1; e = e.parentElement) {
      if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(e.tagName)) { g = 'bild'; break; }
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) { g = 'bild'; break; }
      const m = s.backgroundColor.match(/rgba?\(([^)]+)\)/);
      const a = m ? m[1].split(/[ ,/]+/).map(parseFloat) : null;
      if (a && (a.length < 4 || a[3] > 0.5)) {
        const [r, gr, b] = a.map(v => v / 255);
        g = 0.2126 * r + 0.7152 * gr + 0.0722 * b < 0.5 ? 'dunkel' : 'hell';
        break;
      }
    }
    merk.set(t, g);
    return g;
  }

  function zustand(t) {
    const v = variante();
    let g = 36, fuell = 'transparent', label = '', farbePunkt = plum, schrift = '#fff';
    const feld = t && t.closest && t.closest('input, textarea, select');
    const gr = grund(t);
    let ring = gr === 'hell' ? dunkelblau : 'rgba(255,255,255,.92)';
    kreis.style.boxShadow = gr === 'bild' ? '0 0 0 1px rgba(17,29,44,.28), inset 0 0 0 1px rgba(17,29,44,.28)' : 'none';
    if (v === 'b') {
      const ziel = t && t.closest && t.closest('a, button, [role="button"], .card, label');
      if (ziel) { g = 72; fuell = plum; ring = plum; label = ziel.getAttribute('data-zeiger-text') || (ziel.matches('.card, a') ? 'Öffnen' : ''); farbePunkt = 'transparent'; }
      else if (t && t.closest && t.closest('p, h1, h2, h3, h4, li')) g = 22;
    }
    groesse = g;
    kreis.style.width = kreis.style.height = g + 'px';
    kreis.style.margin = `${-g / 2}px 0 0 ${-g / 2}px`;
    kreis.style.backgroundColor = fuell;
    kreis.style.borderColor = ring;
    kreis.style.color = schrift;
    text.textContent = label;
    punkt.style.background = farbePunkt;
    const an = sichtbar && !feld;
    punkt.style.opacity = an ? '1' : '0';
    kreis.style.opacity = an ? '1' : '0';
  }

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') { if (sichtbar) { sichtbar = false; zustand(null); } return; }
    mx = e.clientX; my = e.clientY;
    if (!sichtbar) { sichtbar = true; kx = mx; ky = my; }
    zustand(e.target);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { sichtbar = false; zustand(null); });
  addEventListener('mousedown', () => { kreis.style.transform = 'scale(.85)'; });
  addEventListener('mouseup', () => { kreis.style.transform = ''; });

  const folgen = () => {
    const f = reduziert() ? 1 : 1 - nachlauf();
    kx += (mx - kx) * f; ky += (my - ky) * f;
    punkt.style.translate = `${mx}px ${my}px`;
    kreis.style.translate = `${kx}px ${ky}px`;
    requestAnimationFrame(folgen);
  };
  requestAnimationFrame(folgen);
}
