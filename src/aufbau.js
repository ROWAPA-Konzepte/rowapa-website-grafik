/* Aufbau: Grafik baut sich auf, sobald sie ins Bild kommt und jedes Mal, wenn ihr Reiter geöffnet wird (ab 1.19.0).
   Am Behälter der Grafik (z. B. auswertung_grafik in den Reitern der Performance-Analyse) steht data-grafik="aufbau".
   data-richtung: "links" (Balken wachsen von links, Standard), "mitte" (von der Mitte nach aussen), "oben" (Zeile für Zeile
   von oben); data-dauer in Sekunden (Standard 0.9). Das Bild selbst bleibt ein normales Webflow-Bild und wird nur
   schrittweise freigegeben; ohne Skript steht es ganz da. */
import { clamp, zahl, sobaldNahe } from './util.js';

const START = { links: 'inset(0 100% 0 0)', mitte: 'inset(0 50% 0 50%)', oben: 'inset(0 0 100% 0)' };

export function aufbau(el) {
  const richtung = (el.getAttribute('data-richtung') || 'links').trim().toLowerCase();
  const start = START[richtung] || START.links;
  const dauer = clamp(zahl(el, 'data-dauer', 0.9), 0.2, 4);
  const reiter = el.closest('.w-tab-pane');
  let timer;

  const los = () => {
    clearTimeout(timer);
    el.style.transition = 'none';
    el.style.clipPath = start;
    void el.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = `clip-path ${dauer}s cubic-bezier(.2,.7,.2,1) .08s`;
      el.style.clipPath = 'inset(0 0 0 0)';
    }));
    /* Sicherheit: steht nach Ablauf in jedem Fall vollständig da */
    timer = setTimeout(() => { el.style.transition = 'none'; el.style.clipPath = ''; }, (dauer + 1) * 1000);
  };

  /* erstes Erscheinen (offener Reiter oder Grafik ohne Reiter) */
  if (!reiter || reiter.classList.contains('w--tab-active')) {
    sobaldNahe(el, () => { el.style.clipPath = start; }, '30% 0px');
    sobaldNahe(el, los, '0px 0px -15% 0px');
  }
  /* jedes Öffnen eines Reiters */
  if (reiter) {
    let aktiv = reiter.classList.contains('w--tab-active');
    new MutationObserver(() => {
      const jetzt = reiter.classList.contains('w--tab-active');
      if (jetzt && !aktiv) los();
      aktiv = jetzt;
    }).observe(reiter, { attributes: true, attributeFilter: ['class'] });
  }
}
