// Erzeugt das Standbild der Wissensplattform (transparentes PNG) mit genau der Zeichnung des Skriptteils «orbit».
// Aufruf in tools/grafik: node figuren/kugel.mjs  →  figuren/grafik-wissensplattform-kugel.png
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

/* Playwright wie in render.js über require (globale Installation, ggf. NODE_PATH setzen) */
const { chromium } = createRequire(import.meta.url)('playwright');

const code = (await build({
  entryPoints: [new URL('../src/kugel.js', import.meta.url).pathname],
  bundle: true, format: 'iife', globalName: 'Kugel', write: false
})).outputFiles[0].text;

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent('<html><body style="margin:0;background:transparent"></body></html>');
await p.addScriptTag({ content: code });
const url = await p.evaluate(() => {
  const S = 640, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const D = Kugel.kugelDaten();
  const F = Kugel.kugelFarben({ sea: [160, 196, 223], serpent: [72, 110, 163], manganese: [29, 49, 73], plum: [170, 19, 81] });
  Kugel.zeichneKugel(ctx, D, F, S / 2, S / 2, S * 0.46, 0);
  return cv.toDataURL('image/png');
});
writeFileSync(new URL('./grafik-wissensplattform-kugel.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
await b.close();
console.log('figuren/grafik-wissensplattform-kugel.png');
