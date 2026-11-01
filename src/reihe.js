/* Reihe (Insights): Pfeile blättern um eine Karte, eine feine Linie zeigt, wo man in der Reihe steht.
   Wischen und Scrollen funktionieren auch ohne Skript; das Skript ergänzt nur Pfeile und Fortschritt.
   In der Section: [data-reihe="zurueck"], [data-reihe="weiter"], [data-reihe="balken"].
   Der Scrollbalken des Browsers wird ausgeblendet; die Reihe bleibt per Wischen, Trackpad und Pfeilen bedienbar. */
import { reduziert } from './util.js';

export function reihe(el) {
  ohneBalken(el);
  const sec = el.closest('section') || document.body;
  const zurueck = sec.querySelector('[data-reihe="zurueck"]');
  const weiter = sec.querySelector('[data-reihe="weiter"]');
  const balken = sec.querySelector('[data-reihe="balken"]');
  const spur = balken && balken.parentElement;

  const schritt = () => {
    const a = el.children[0], b = el.children[1];
    return a ? (b ? b.offsetLeft - a.offsetLeft : a.offsetWidth) : el.clientWidth;
  };
  const blaettern = r => el.scrollBy({ left: r * schritt(), behavior: reduziert() ? 'auto' : 'smooth' });
  [[zurueck, -1], [weiter, 1]].forEach(([knopf, r]) => {
    if (!knopf) return;
    knopf.addEventListener('click', e => { e.preventDefault(); blaettern(r); });
  });

  let geplant = false;
  function stand() {
    geplant = false;
    const max = el.scrollWidth - el.clientWidth, x = el.scrollLeft;
    const kann = max > 2;
    [zurueck, weiter, spur].forEach(k => { if (k) k.style.visibility = kann ? '' : 'hidden'; });
    if (!kann) return;
    const setze = (k, an) => {
      if (!k) return;
      k.style.opacity = an ? '' : '0.35';
      k.style.pointerEvents = an ? '' : 'none';
      k.setAttribute('aria-disabled', String(!an));
    };
    setze(zurueck, x > 2);
    setze(weiter, x < max - 2);
    if (balken) {
      const anteil = el.clientWidth / el.scrollWidth;
      balken.style.width = (anteil * 100).toFixed(2) + '%';
      balken.style.left = ((x / max) * (1 - anteil) * 100).toFixed(2) + '%';
    }
  }
  const planen = () => { if (!geplant) { geplant = true; requestAnimationFrame(stand); } };
  el.addEventListener('scroll', planen, { passive: true });
  new ResizeObserver(planen).observe(el);
  stand();
}

/* Scrollbalken ausblenden: Standard (scrollbar-width) und ältere WebKit-Browser */
function ohneBalken(el) {
  el.style.scrollbarWidth = 'none';
  if (document.getElementById('rowapa-reihe')) return;
  const stil = document.createElement('style');
  stil.id = 'rowapa-reihe';
  stil.textContent = '[data-grafik="reihe"]::-webkit-scrollbar{display:none}';
  document.head.appendChild(stil);
}
