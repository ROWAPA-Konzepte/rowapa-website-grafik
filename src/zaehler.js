/* Zähler: eine Zahl zählt einmal von 0 bis zu ihrem Wert, sobald sie ins Bild kommt.
   Vorsatz und Zusatz bleiben stehen («100 %», «CHF 2'000»); am Ende steht wieder genau der Text aus Webflow. */
import { clamp, easeOut, zahl, sobaldNahe, takt } from './util.js';

export function zaehler(el) {
  const text = el.textContent;
  const m = text.match(/^(\D*?)(\d{1,3}(?:[’'.   ]\d{3})+|\d+)(.*)$/s);
  if (!m) return;
  const [, vor, ziffern, nach] = m;
  const trenner = (ziffern.match(/[’'.   ]/) || [''])[0];
  const ziel = parseInt(ziffern.replace(/\D/g, ''), 10);
  if (!ziel) return;
  /* bereits im Bild beim Laden: stehen lassen */
  const r0 = el.getBoundingClientRect();
  if (r0.top < innerHeight && r0.bottom > 0) return;

  const dauer = 1.6 / clamp(zahl(el, 'data-tempo', 1), 0.2, 3);
  const format = n => {
    let s = String(n);
    if (trenner) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, trenner);
    return vor + s + nach;
  };
  /* Bildschirmleser lesen den Endwert, nicht die laufende Zahl */
  el.setAttribute('aria-label', text.trim());
  sobaldNahe(el, () => { el.textContent = format(0); }, '100% 0px');
  sobaldNahe(el, () => {
    const t0 = performance.now();
    takt(now => {
      const u = clamp((now - t0) / 1000 / dauer, 0, 1);
      if (u < 1) { el.textContent = format(Math.round(easeOut(u) * ziel)); return true; }
      el.textContent = text;
      el.removeAttribute('aria-label');
      return false;
    });
  }, '0px 0px -15% 0px');
}
