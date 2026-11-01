/* ROWAPA Grafik: Punkte-Grafiken und kleine Bewegungen der ROWAPA-Website.
   Gesteuert über Attribute in Webflow (Settings › Custom attributes), siehe LIESMICH.md.
   Ohne dieses Skript bleiben überall die Standbilder stehen. */
import { reduziert } from './util.js';
import { punktemeer } from './punktemeer.js';
import { figur } from './figur.js';
import { zaehler } from './zaehler.js';
import { treppe } from './treppe.js';
import { orbit } from './orbit.js';
import { reihe } from './reihe.js';
import { zeiger } from './zeiger.js';
import { vorschau } from './vorschau.js';
import { hoverVideos } from './hovervideo.js';
import { nachoben } from './nachoben.js';
import { themen } from './themen.js';
import { diagnose } from './diagnose.js';
import { methoden } from './methoden.js';
import { aufbau } from './aufbau.js';
import { diagramm } from './diagramm.js';
import { kopfleiste } from './kopfleiste.js';

const VERSION = '__VERSION__';

/* Bedienung (immer) und Bewegung (nur ohne «Bewegung reduzieren»); themen, diagramm und kopfleiste prüfen «Bewegung reduzieren» selbst
   (diagramm muss immer laufen, weil es die Werte überhaupt erst setzt) */
const BEDIENUNG = { reihe, zeiger, vorschau, nachoben, themen, diagramm, kopfleiste };
const BEWEGUNG = { punktemeer, punktfigur: figur, zaehler, treppe, orbit, methoden, aufbau };

const info = (window.ROWAPAGrafik = { version: VERSION });
let gestartet = false;

function start() {
  if (gestartet) return;
  gestartet = true;
  info.gestartet = performance.now();
  hoverVideos(info);
  const ruhig = reduziert();
  document.querySelectorAll('[data-grafik]').forEach(el => {
    const art = (el.getAttribute('data-grafik') || '').trim().toLowerCase();
    const name = art.split('-')[0];
    const f = BEDIENUNG[name] || (!ruhig && BEWEGUNG[name]);
    try {
      if (f) f(el, art);
    } catch (e) {
      /* Fehler in einer Grafik lässt deren Standbild stehen */
    }
  });
}

diagnose(info);
/* erst nach dem Laden der Seite, damit der erste Bildaufbau nicht verzögert wird; hängt eine Datei (langsames Netz),
   startet alles spätestens 5 s nach dem Aufbau der Seite */
if (document.readyState === 'complete') setTimeout(start, 0);
else {
  addEventListener('load', () => setTimeout(start, 0), { once: true });
  const spaetestens = () => setTimeout(start, 5000);
  if (document.readyState === 'interactive') spaetestens();
  else document.addEventListener('DOMContentLoaded', spaetestens, { once: true });
}
