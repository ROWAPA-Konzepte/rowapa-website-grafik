/* Hover-Video der Karten (früher eigenes Skript «ROWAPAHoverVideo» 1.0.0):
   <video data-hover-video src="…mp4"> spielt nur, solange die Maus über der Karte ist.
   Bei Berührung mit dem Finger und bei «Bewegung reduzieren» nie. */
import { reduziert, beiMaus } from './util.js';

export function hoverVideos(info) {
  if (reduziert()) { info.videos = 0; return; }
  info.videos = 'wartet auf die Maus';
  beiMaus(() => { info.videos = verbinden(); });
}

function verbinden() {
  let anzahl = 0;
  document.querySelectorAll('video[data-hover-video]').forEach(v => {
    if (!v.getAttribute('src')) return;
    anzahl++;
    const karte = v.closest('a, .card') || v.parentElement;
    v.muted = true;
    karte.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch') return;
      v.preload = 'auto';
      const p = v.play();
      if (p) p.then(() => { v.style.opacity = 1; }).catch(() => {});
    });
    karte.addEventListener('pointerleave', () => { v.style.opacity = 0; v.pause(); });
  });
  return anzahl;
}
