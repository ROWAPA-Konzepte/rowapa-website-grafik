/* Wort für Wort (ab 1.49.0, Entscheid 427): Ein Leitsatz erscheint beim Scrollen Wort für Wort und wird voll.
   Am Textelement: data-grafik="wortweise". Optional data-blass (Deckkraft der noch nicht gelesenen Wörter, Standard 0.28).
   Fortschritt: beginnt, wenn die Oberkante bei 92 % der Fensterhöhe steht, fertig nach 35 % Fensterhöhe plus 60 % der
   Texthöhe. Bei «Bewegung reduzieren» läuft das Modul nicht, der Satz steht voll da. Für Bildschirmleser bleibt der Satz
   als ganzer Text lesbar (Wörter in Spans, kein aria-hidden). */
import { clamp, zahl, takt } from './util.js';

export function wortweise(el) {
  if (el.querySelector('.rg-w')) return;
  const blass = String(clamp(zahl(el, 'data-blass', 0.28), 0, 1));
  const teile = [];
  /* nur Textknoten aufteilen, Elemente (z. B. <br>, <strong>) bleiben */
  const gehe = n => {
    [...n.childNodes].forEach(k => {
      if (k.nodeType === 3) {
        const frag = document.createDocumentFragment();
        k.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          const s = document.createElement('span');
          s.className = 'rg-w'; s.textContent = w;
          s.style.opacity = blass; s.style.transition = 'opacity .25s linear';
          teile.push(s); frag.appendChild(s);
        });
        k.replaceWith(frag);
      } else if (k.nodeType === 1) gehe(k);
    });
  };
  gehe(el);
  let an = -1;
  takt(() => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -vh || r.top > vh * 2) return;
    const p = clamp((vh * 0.92 - r.top) / (vh * 0.35 + r.height * 0.6), 0, 1);
    const n = Math.round(p * teile.length);
    if (n === an) return;
    an = n;
    teile.forEach((s, i) => { s.style.opacity = i < n ? '1' : blass; });
  });
}
