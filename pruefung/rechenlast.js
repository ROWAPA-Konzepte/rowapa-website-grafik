// Rechenlast, solange ROWAPA Digital im Bild ist: Bilder pro Sekunde, Zeichenaufrufe pro Bild, lange Aufgaben über 5 s. Aufruf: node rechenlast.js [breite] [höhe]
const { chromium } = require('playwright');
const [w = 1440, h = 900] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto('https://rowapa-website-2027-automation.webflow.io/home-v2?x=' + Date.now(), { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const y = document.querySelector('.digital_visual').getBoundingClientRect().top + scrollY - 120; scrollTo(0, y); });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => new Promise(res => {
    let lt = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) lt += e.duration; }).observe({ type: 'longtask' });
    const cv = document.querySelector('.digital_visual canvas'), ctx = cv.getContext('2d');
    const orig = ctx.drawImage.bind(ctx); let n = 0; ctx.drawImage = (...a) => { n++; return orig(...a); };
    const clr = ctx.clearRect.bind(ctx); let frames = 0;
    ctx.clearRect = (...a) => { frames++; return clr(...a); };
    setTimeout(() => res({ frames5s: frames, drawImageProBild: Math.round(n / Math.max(1, frames)), longtasksMs: Math.round(lt) }), 5000);
  }));
  console.log(JSON.stringify({ viewport: `${w}x${h}`, ...r }));
  await b.close();
})();
