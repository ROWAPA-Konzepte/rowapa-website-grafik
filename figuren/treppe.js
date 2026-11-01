// Rendert die Treppe «Unser Vorgehen» als transparentes PNG, alle vier Stufen im Ruhezustand (Geometrie aus rowapa-website/src/vorgehen.js).
// Aufruf: node treppe.js [Pixeldichte, Standard 2]. Gibt zusätzlich die Spaltengrenzen und die Grundlinie als Anteile der Bildbreite/-höhe aus (Standardwerte im Skriptteil «treppe»).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  await p.setContent('<html><body style="margin:0;background:transparent"></body></html>');
  await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' });
  const res = await p.evaluate(PR => {
    const W0 = 600, H0 = 430, DOT = 1.45;
    const Rn = Math.random, TAU = Math.PI * 2;
    const steps = [[], [], [], []]; const add = (a, x, y, z, k) => a.push([x, y, z, k]);
    const box = (a, x0, y0, z0, w, h, d, n, k) => { for (let i = 0; i < n; i++) { let x, y, z; if (Rn() < .6) { const ax = Math.floor(Rn() * 3), t = Rn(), u = Rn() < .5 ? 0 : 1, v = Rn() < .5 ? 0 : 1; if (ax === 0) { x = x0 + t * w; y = y0 + u * h; z = z0 + v * d } else if (ax === 1) { x = x0 + u * w; y = y0 + t * h; z = z0 + v * d } else { x = x0 + u * w; y = y0 + v * h; z = z0 + t * d } } else { const f = Math.floor(Rn() * 3), pp = Rn(), q = Rn(); if (f === 0) { x = x0 + pp * w; y = y0 + h; z = z0 + q * d } else if (f === 1) { x = x0 + pp * w; y = y0 + q * h; z = z0 + d } else { x = x0 + w; y = y0 + q * h; z = z0 + pp * d } } add(a, x, y, z, k) } };
    const ring = (a, cx, cy, cz, R0, n, k, arc = 1, a0 = 0, tube = .04, plane = 'xy') => { for (let i = 0; i < n; i++) { const t = a0 + Rn() * TAU * arc, tr = (Rn() - .5) * tube; const c = Math.cos(t) * (R0 + tr), s = Math.sin(t) * (R0 + tr); if (plane === 'xy') add(a, cx + c, cy + s, cz + (Rn() - .5) * tube, k); else add(a, cx + c, cy + (Rn() - .5) * tube, cz + s, k) } };
    const seg = (a, pp, q, n, k, j = .03) => { for (let i = 0; i < n; i++) { const t = Rn(); add(a, pp[0] + (q[0] - pp[0]) * t + (Rn() - .5) * j, pp[1] + (q[1] - pp[1]) * t + (Rn() - .5) * j, pp[2] + (q[2] - pp[2]) * t + (Rn() - .5) * j, k) } };
    const sph = (a, cx, cy, cz, R0, n, k) => { for (let i = 0; i < n; i++) { const u = Rn() * 2 - 1, th = Rn() * TAU, s = Math.sqrt(1 - u * u); add(a, cx + R0 * s * Math.cos(th), cy + R0 * u, cz + R0 * s * Math.sin(th), k) } };
    const W = 1.4, G = .5, H = .72, B = -2.2, X0 = -3.7;
    for (let k = 0; k < 4; k++) {
      const a = steps[k], x0 = X0 + k * (W + G), h = H * (k + 1);
      box(a, x0, B, -W / 2, W, h, W, 1100, 0); ring(a, x0 + W / 2, B + h, 0, .55, 160, 2, 1, 0, .03, 'xz');
      const cx = x0 + W / 2, cy = B + h + 1.05;
      if (k === 0) { ring(a, cx - .1, cy + .1, 0, .42, 420, 3, 1, 0, .07); seg(a, [cx + .2, cy - .2, 0], [cx + .6, cy - .62, 0], 140, 3, .08) }
      if (k === 1) { const P = [[cx - .5, cy - .3, 0], [cx + .45, cy - .35, .1], [cx, cy + .45, -.1], [cx + .55, cy + .35, .2], [cx - .5, cy + .4, .1]]; P.forEach(q => sph(a, q[0], q[1], q[2], .13, 90, 3));[[0, 1], [0, 2], [1, 2], [2, 3], [1, 3], [2, 4], [0, 4]].forEach(e => seg(a, P[e[0]], P[e[1]], 60, 2, .02)) }
      if (k === 2) { [.5, .33, .16].forEach((R0, j) => ring(a, cx, cy, 0, R0, 220 - j * 50, j === 2 ? 3 : 2, 1, 0, .05)); sph(a, cx, cy, 0, .06, 60, 3); seg(a, [cx + 1, cy + .55, .3], [cx + .05, cy + .02, 0], 150, 3, .03) }
      if (k === 3) { ring(a, cx, cy - .25, 0, .68, 420, 2, .5, 0, .08); seg(a, [cx, cy - .25, 0], [cx + .45, cy + .25, 0], 160, 3, .06); sph(a, cx, cy - .15, 0, .07, 50, 3); for (let j = 0; j < 4; j++) seg(a, [cx - .45 + j * .3, cy - .62, 0], [cx - .45 + j * .3, cy - .62 + .12 + j * .1, 0], 40, 1, .06) }
    }
    /* Ruhezustand wie die nicht aktiven Stufen der ersten Fassung: Säulen gedämpft, Symbole in Serpent und Mischton */
    const mix = (a, p, b2) => a.map((v, i) => Math.round(v * p + b2[i] * (1 - p)));
    const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
    const serp = [72, 110, 163], sea = [160, 196, 223], snow = [232, 233, 233];
    const COL = { 0: hex(mix(serp, .38, snow)), 1: hex(mix(serp, .38, snow)), 2: hex(mix(serp, .31, sea)), 3: '#486EA3' };
    const all = []; steps.forEach((a, k) => a.forEach(q => all.push([q[0], q[1], q[2], q[3], k])));
    const N = all.length, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N);
    all.forEach((q, i) => { pos.set([q[0], q[1], q[2]], i * 3); const c = new THREE.Color(COL[q[3]]); col.set([c.r, c.g, c.b], i * 3); rnd[i] = Rn() });
    const cv = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(PR); r.setClearColor(0x000000, 0); r.setSize(W0, H0, false);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, W0 / H0, .1, 100), grp = new THREE.Group(); sc.add(grp);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uS: { value: 30 * PR * DOT } },
      vertexShader: 'attribute vec3 color;attribute float rnd;uniform float uS;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uS*(.55+rnd*.45)/-mv.z;vC=color;}',
      fragmentShader: 'varying vec3 vC;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;gl_FragColor=vec4(vC,smoothstep(.5,.34,d));}' });
    grp.add(new THREE.Points(g, mat));
    const d = 15.5 * Math.max(1, 1.15 / cam.aspect); cam.position.set(0, 1.2, d); cam.lookAt(0, .2, 0); cam.updateProjectionMatrix();
    grp.rotation.x = .06; grp.updateMatrixWorld(); cam.updateMatrixWorld();
    r.render(sc, cam);
    /* Spaltengrenzen und Grundlinie in Bildanteilen */
    const v = new THREE.Vector3();
    const proj = (x, y, z) => { v.set(x, y, z).applyMatrix4(grp.matrixWorld).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2] };
    const ext = steps.map(a => { let x0 = 1, x1 = 0; a.forEach(q => { const s = proj(q[0], q[1], q[2]); x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]) }); return [x0, x1] });
    const grenzen = [0, ...[0, 1, 2].map(k => (ext[k][1] + ext[k + 1][0]) / 2), 1];
    const linie = [0, 1, 2, 3].map(k => { const x0 = X0 + k * (W + G); return [proj(x0, B, W / 2)[0], proj(x0 + W, B, W / 2)[0]] });
    const grund = proj(X0, B, W / 2)[1];
    return { png: cv.toDataURL('image/png'), ext, grenzen, linie, grund };
  }, +(process.argv[2] || 2));
  fs.writeFileSync('roh-treppe.png', Buffer.from(res.png.split(',')[1], 'base64'));
  delete res.png;
  console.log(JSON.stringify(res, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)));
  await b.close();
})();
