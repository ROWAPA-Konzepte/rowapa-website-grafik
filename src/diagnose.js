/* Diagnose-Anzeige, nur mit ?diagnose in der Adresse: zeigt unten links, ob das Skript läuft und was der Browser meldet
   (Maus oder Touch, «Bewegung reduzieren», Zeiger, Hover-Videos, Themen-Szene). Hilft, Fehler auf einem bestimmten Gerät
   zu finden. Ohne den Zusatz in der Adresse passiert nichts. */
export function diagnose(info) {
  let an = false;
  try { an = new URLSearchParams(location.search).has('diagnose'); } catch (e) { /* alte Browser */ }
  if (!an) return;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483001;max-width:min(380px,calc(100vw - 16px));padding:10px 12px;' +
    'background:#fff;color:#1D3149;border:1px solid #1D3149;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;pointer-events:none';
  let eingabe = '–';
  addEventListener('pointermove', e => { eingabe = e.pointerType || '?'; }, { passive: true });
  const jn = q => (matchMedia(q).matches ? 'ja' : 'nein');
  const html = document.documentElement.classList;
  const browser = (navigator.userAgent.match(/(Edg|OPR|Chrome|Firefox|Version)\/[\d.]+/g) || []).join(' ');
  const text = () => [
    `ROWAPA Grafik ${info.version}`,
    `Start: ${info.gestartet ? Math.round(info.gestartet) + ' ms nach dem Aufruf' : 'wartet, bis die Seite geladen ist …'}`,
    `Maus (Hauptgerät): hover ${jn('(hover: hover)')}, fein ${jn('(pointer: fine)')}`,
    `Maus (irgendein Gerät): hover ${jn('(any-hover: hover)')}, fein ${jn('(any-pointer: fine)')}`,
    `Touchpunkte: ${navigator.maxTouchPoints || 0} · letzte Eingabe: ${eingabe}`,
    `Bewegung reduzieren: ${jn('(prefers-reduced-motion: reduce)')}`,
    `Zeiger: ${html.contains('hat-zeiger') ? 'an' : 'aus'} · Hover-Videos: ${info.videos === undefined ? '–' : info.videos}`,
    `Themen-Szene: ${html.contains('lenis') ? 'Bühne' : 'aus'} · Einrasten: ${info.einrasten || '–'} · Plum-Form: ${info.plumform || '–'}`,
    `Netz im Punktemeer: ${info.netz || '–'}`,
    `Fenster: ${innerWidth} × ${innerHeight} · ${browser}`
  ].join('\n');
  const einhaengen = () => {
    document.body.appendChild(box);
    const zeigen = () => { box.textContent = text(); };
    zeigen();
    setInterval(zeigen, 1000);
  };
  if (document.body) einhaengen();
  else addEventListener('DOMContentLoaded', einhaengen, { once: true });
}
