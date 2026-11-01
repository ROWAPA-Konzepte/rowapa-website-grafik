/* Nach oben: Der Knopf erscheint, sobald man gut eine Bildschirmhöhe gescrollt hat (Klasse is-sichtbar,
   Gestaltung im Style-Panel: nach-oben › is-sichtbar). Klick führt sanft an den Seitenanfang. */
import { reduziert } from './util.js';

export function nachoben(el) {
  let geplant = false;
  const stand = () => {
    geplant = false;
    el.classList.toggle('is-sichtbar', scrollY > innerHeight * 0.8);
  };
  addEventListener('scroll', () => { if (!geplant) { geplant = true; requestAnimationFrame(stand); } }, { passive: true });
  stand();
  el.addEventListener('click', e => {
    e.preventDefault();
    const y0 = scrollY;
    scrollTo({ top: 0, behavior: reduziert() ? 'auto' : 'smooth' });
    /* falls das sanfte Scrollen bei hoher Last nicht anläuft: direkt springen */
    setTimeout(() => { if (scrollY >= y0 - 2) scrollTo(0, 0); }, 700);
    /* Tastatur: Fokus zurück an den Anfang der Seite */
    const erstes = document.querySelector('a[href]:not([tabindex="-1"]), button');
    if (erstes && erstes !== el) erstes.focus({ preventScroll: true });
  });
}
