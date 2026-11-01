// Misst Ladezeit und Datenmenge einer Seite (Chromium, Playwright). Aufruf: node messen.js <url> [läufe] [breite] [höhe]
// Misst Datenmenge (nach Typ), LCP, Load, Long Tasks. Schriften werden lokal geliefert (Host in der Umgebung gesperrt), ihre Grösse wird mitgezählt.
const { chromium } = require('playwright');
const fs = require('fs');
const FD = process.env.SCHRIFTEN || './schriften/'; // TASA-Dateien lokal, falls der Schrift-Host gesperrt ist
const url = process.argv[2], runs = +(process.argv[3] || 3), w = +(process.argv[4] || 1440), h = +(process.argv[5] || 900);
(async () => {
  const res = [];
  for (let i = 0; i < runs; i++) {
    const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.route(/fastly\.net\/.*\.woff2/, r => { const f = r.request().url().match(/(TASA[A-Za-z]+-[A-Za-z]+)\.woff2/)[1]; r.fulfill({ path: FD + f + '.woff2', contentType: 'font/woff2' }); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable');
    const reqs = {}; const types = {};
    cdp.on('Network.responseReceived', e => { reqs[e.requestId] = { url: e.response.url, type: e.type }; });
    cdp.on('Network.loadingFinished', e => { const r = reqs[e.requestId]; if (!r) return; const t = r.type; types[t] = types[t] || { n: 0, kb: 0 }; types[t].n++; types[t].kb += e.encodedDataLength / 1024; });
    await p.addInitScript(() => { window.__lcp = 0; window.__lt = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt += e.duration; }).observe({ type: 'longtask', buffered: true }); });
    await p.goto(url, { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(3000);
    const m = await p.evaluate(() => ({ lcp: Math.round(window.__lcp), load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd), longtasks: Math.round(window.__lt) }));
    // Schriften: lokale Grösse addieren
    let fontKB = 0; for (const f of fs.readdirSync(FD)) if (f.endsWith('.woff2')) fontKB += fs.statSync(FD + f).size / 1024;
    let tot = 0; for (const t in types) tot += types[t].kb;
    res.push({ ...m, totalKB: Math.round(tot), types: Object.fromEntries(Object.entries(types).map(([k, v]) => [k, `${v.n} / ${Math.round(v.kb)} KB`])) });
    await b.close();
  }
  console.log(JSON.stringify(res, null, 1));
})();
