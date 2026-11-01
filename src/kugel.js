/* Wissensplattform: Kugel aus Punkten mit einem Netz im Innern (Canvas 2D).
   Dieselbe Zeichnung erzeugt auch das Standbild (figuren/kugel.mjs), damit der Übergang nahtlos ist. */

/* fester Zufall, damit Standbild und Animation dieselben Punkte haben */
function zufall(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mische = (a, b, p) => a.map((v, i) => Math.round(v * p + b[i] * (1 - p)));

/* Punkte der Kugel (Einheitskugel) und des Netzes */
export function kugelDaten(n = 2600, seed = 7) {
  const R = zufall(seed), schale = [], knoten = [], kanten = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963, j = 1 + (R() - 0.5) * 0.03;
    schale.push({ x: Math.cos(th) * r * j, y: y * j, z: Math.sin(th) * r * j, s: R(), c: y > 0.15 ? 0 : y < -0.45 ? 2 : 1 });
  }
  for (let i = 0; i < 34; i++) {
    let x, y, z;
    do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
    const pkt = [];
    for (let j = 0; j < 5; j++) pkt.push([x * 0.77 + (R() - 0.5) * 0.06, y * 0.77 + (R() - 0.5) * 0.06, z * 0.77 + (R() - 0.5) * 0.06]);
    knoten.push({ x: x * 0.77, y: y * 0.77, z: z * 0.77, plum: i % 6 === 0, pkt });
  }
  knoten.forEach((a, i) => {
    knoten.map((b, k) => [k, (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2]).filter(q => q[0] > i)
      .sort((p, q) => p[1] - q[1]).slice(0, 2).forEach(([k]) => kanten.push([i, k]));
  });
  return { schale, knoten, kanten };
}

/* Punkt-Bildchen je Farbe, einmal vorbereitet */
function bildchen(rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d'), g = x.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.62, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 16, 16);
  return c;
}

/* Farben auf dunklem Grund aus den CI-Farben: Sea Cliff oben, Great Serpent unten, Plum für einzelne Knoten */
export function kugelFarben(f) {
  const basis = [f.sea, mische(f.serpent, f.sea, 0.5), f.serpent];
  const dunkel = mische(f.manganese, f.serpent, 0.51);
  const stufen = basis.map(b => Array.from({ length: 8 }, (_, l) => bildchen(mische(b, dunkel, 0.25 + (0.75 * l) / 7).join(','))));
  return { stufen, hell: bildchen(mische(f.sea, [255, 255, 255], 0.23).join(',')), plum: bildchen(mische(f.plum, [255, 255, 255], 0.85).join(',')), linie: `rgba(${f.sea.join(',')},.22)` };
}

/* zeichnet die Kugel um (cx, cy) mit Radius R, gedreht um den Winkel w */
export function zeichneKugel(ctx, D, F, cx, cy, R, w, jedes = 1) {
  const neig = 0.42, cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(neig), sn = Math.sin(neig);
  const dreh = (x, y, z) => {
    const x1 = x * cw - z * sw, z1 = x * sw + z * cw;
    return [x1, y * cn - z1 * sn, y * sn + z1 * cn];
  };
  const groesse = Math.max(0.6, R * 0.0095), f = 4.2;
  const punkt = (b, x, y, z, s, a) => {
    const p = f / (f - z), r = groesse * s * (0.8 + 0.25 * (z + 1));
    ctx.globalAlpha = a;
    ctx.drawImage(b, cx + x * R * p - r, cy - y * R * p - r, 2 * r, 2 * r);
  };
  const schale = (vorne) => {
    for (let i = 0; i < D.schale.length; i += jedes) {
      const q = D.schale[i], [x, y, z] = dreh(q.x, q.y, q.z);
      if ((z >= 0) !== vorne) continue;
      const licht = Math.min(1, Math.max(0, 0.55 + 0.45 * z + 0.25 * y));
      punkt(F.stufen[q.c][Math.round(licht * 7)], x, y, z, 0.55 + q.s * 0.45, 0.3 + 0.65 * (z + 1) / 2);
    }
  };
  schale(false);
  /* Netz im Innern */
  const K = D.knoten.map(k => dreh(k.x, k.y, k.z));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = F.linie;
  ctx.lineWidth = Math.max(0.5, R * 0.004);
  ctx.beginPath();
  D.kanten.forEach(([a, b]) => {
    const pa = f / (f - K[a][2]), pb = f / (f - K[b][2]);
    ctx.moveTo(cx + K[a][0] * R * pa, cy - K[a][1] * R * pa);
    ctx.lineTo(cx + K[b][0] * R * pb, cy - K[b][1] * R * pb);
  });
  ctx.stroke();
  D.knoten.forEach(k => k.pkt.forEach(p => {
    const [x, y, z] = dreh(p[0], p[1], p[2]);
    punkt(k.plum ? F.plum : F.hell, x, y, z, 0.9, 0.55 + 0.4 * (z + 1) / 2);
  }));
  schale(true);
  ctx.globalAlpha = 1;
}
