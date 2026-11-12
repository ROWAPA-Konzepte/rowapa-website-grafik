/* Fortschritt (ab 1.49.0, Entscheid 430): Liste mit aktivem Eintrag und mitlaufender Linie (Philosophie C).
   An der Liste: data-grafik="fortschritt". Einträge: die direkten Kinder mit der Klasse aus data-eintrag (Standard
   «philo_item»). Ein Eintrag ist aktiv (Klasse is-aktiv), bis der nächste mit seiner Oberkante die Fenstermitte erreicht;
   frühere erhalten is-vorbei. Die Linie: ein Element mit data-fortschritt-linie in der Liste; das Modul skaliert es von oben
   (scaleY 0–1) mit dem Scrollen. Bei «Bewegung reduzieren» ist die Linie voll, die Aktiv-Regel gilt weiter. */
import { clamp, reduziert, takt } from './util.js';

export function fortschritt(el) {
  const klasse = (el.getAttribute('data-eintrag') || 'philo_item').trim();
  const items = [...el.querySelectorAll('.' + klasse)];
  if (!items.length) return;
  const linie = el.querySelector('[data-fortschritt-linie]');
  if (linie) linie.style.transformOrigin = '50% 0';
  const ruhig = reduziert();
  let alt = -1, altP = -1;
  takt(() => {
    const vh = innerHeight, r = el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    let akt = 0;
    items.forEach((it, i) => { if (it.getBoundingClientRect().top < vh * 0.5) akt = i; });
    if (akt !== alt) {
      alt = akt;
      items.forEach((it, i) => { it.classList.toggle('is-aktiv', i === akt); it.classList.toggle('is-vorbei', i < akt); });
    }
    if (linie) {
      const p = ruhig ? 1 : clamp((vh * 0.62 - r.top) / Math.max(1, r.height * 0.9), 0, 1);
      if (Math.abs(p - altP) > 0.001) { altP = p; linie.style.transform = `scaleY(${p.toFixed(3)})`; }
    }
  });
}
