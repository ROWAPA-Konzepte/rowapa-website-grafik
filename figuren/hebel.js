// Rendert die vier Hebel-Figuren der Vertriebsperformance als transparente PNG (Runde 98, Entscheid 411).
// Gleiche Zeichnung wie die Figur «Vertrieb» (render.js vertrieb): Punkte in 3D, Kamera, Drehung und Punktgrösse identisch.
//   1 gespraech  Verkaufstrainings: zwei Personen im Gespräch, Sprechblase Plum
//   2 story      Sales-Story: Erzählbogen aus verbundenen Punkten, Ziel Plum
//   3 pfad       Verkaufsprozess: Pfad mit Stationen, Fahne Plum am Ziel
//   4 hybrid     Digitales & hybrides Verkaufen: zwei Bildschirme, Verbindung Plum
// Je Figur zwei Fassungen: -dunkel (helle Punkte für dunklen Grund) und -hell (dunkle Punkte für hellen Grund).
// Aufruf (im Repository-Ordner): node figuren/hebel.js  → roh-hebel-NAME-dunkel.png / -hell.png
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  await p.setContent('<html><body style="margin:0;background:transparent"></body></html>');
  await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' });
  const out = await p.evaluate(() => {
    let seed = 7; const Rn = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const TAU = Math.PI * 2;
    const add = (a, x, y, z, k) => a.push([x, y, z, k]);
    const box = (a, x0, y0, z0, w, h, d, n, k) => { for (let i = 0; i < n; i++) { let x, y, z; if (Rn() < .6) { const ax = Math.floor(Rn() * 3), t = Rn(), u = Rn() < .5 ? 0 : 1, v = Rn() < .5 ? 0 : 1; if (ax === 0) { x = x0 + t * w; y = y0 + u * h; z = z0 + v * d } else if (ax === 1) { x = x0 + u * w; y = y0 + t * h; z = z0 + v * d } else { x = x0 + u * w; y = y0 + v * h; z = z0 + t * d } } else { const f = Math.floor(Rn() * 3), pp = Rn(), q = Rn(); if (f === 0) { x = x0 + pp * w; y = y0 + h; z = z0 + q * d } else if (f === 1) { x = x0 + pp * w; y = y0 + q * h; z = z0 + d } else { x = x0 + w; y = y0 + q * h; z = z0 + pp * d } } add(a, x, y, z, k) } };
    const ring = (a, cx, cy, cz, R0, n, k, arc = 1, a0 = 0, tube = .04, plane = 'xy', ry = 1) => { for (let i = 0; i < n; i++) { const t = a0 + Rn() * TAU * arc, tr = (Rn() - .5) * tube; const c = Math.cos(t) * (R0 + tr), s = Math.sin(t) * (R0 + tr) * ry; if (plane === 'xy') add(a, cx + c, cy + s, cz + (Rn() - .5) * tube, k); else add(a, cx + c, cy + (Rn() - .5) * tube, cz + s, k) } };
    const seg = (a, pp, q, n, k, j = .03) => { for (let i = 0; i < n; i++) { const t = Rn(); add(a, pp[0] + (q[0] - pp[0]) * t + (Rn() - .5) * j, pp[1] + (q[1] - pp[1]) * t + (Rn() - .5) * j, pp[2] + (q[2] - pp[2]) * t + (Rn() - .5) * j, k) } };
    const sph = (a, cx, cy, cz, R0, n, k) => { for (let i = 0; i < n; i++) { const u = Rn() * 2 - 1, th = Rn() * TAU, s = Math.sqrt(1 - u * u); add(a, cx + R0 * s * Math.cos(th), cy + R0 * u, cz + R0 * s * Math.sin(th), k) } };
    /* Schale eines Halb-Ellipsoids (Schultern/Oberkörper), nur obere Hälfte */
    const schale = (a, cx, cy, cz, rx, ry, rz, n, k) => { for (let i = 0; i < n; i++) { const u = Rn(), th = Rn() * TAU, s = Math.sqrt(1 - u * u); add(a, cx + rx * s * Math.cos(th), cy + ry * u, cz + rz * s * Math.sin(th), k) } };
    /* Kurve (quadratische Bézier) als Punktband */
    const bez = (a, A, B, C, n, k, j = .03) => { for (let i = 0; i < n; i++) { const t = Rn(), m = 1 - t; add(a, m * m * A[0] + 2 * m * t * B[0] + t * t * C[0] + (Rn() - .5) * j, m * m * A[1] + 2 * m * t * B[1] + t * t * C[1] + (Rn() - .5) * j, m * m * A[2] + 2 * m * t * B[2] + t * t * C[2] + (Rn() - .5) * j, k) } };
    const boden = (a, n = 900) => ring(a, 0, -2.25, 0, 3.4, n, 2, 1, 0, .06, 'xz', .62);

    const F = {};
    /* 1 Gespräch: zwei Personen am Tisch, Sprechblase */
    F.gespraech = (() => {
      const a = []; boden(a);
      const person = (x, kopf) => { schale(a, x, -1.25, 0, 1.0, 1.05, .62, 1500, 0); sph(a, x, .45, 0, .52, 900, kopf); };
      person(-1.75, 1); person(1.75, 1);
      box(a, -1.0, -1.4, -.9, 2.0, .08, 1.8, 700, 1); /* Tisch */
      for (const x of [-.85, .85]) seg(a, [x, -1.4, .7], [x, -2.2, .7], 60, 1, .03);
      /* Sprechblase Plum über dem Tisch, mit Spitze und drei Punkten */
      ring(a, 0, 1.55, 0, .62, 520, 3, 1, 0, .07, 'xy', .72);
      seg(a, [-.18, 1.12, 0], [-.42, .72, 0], 70, 3, .05);
      for (const x of [-.24, 0, .24]) sph(a, x, 1.55, 0, .06, 40, 3);
      return a;
    })();
    /* 2 Sales-Story: Erzählbogen aus verbundenen Punkten, Abzweigungen, Ziel Plum */
    F.story = (() => {
      const a = []; boden(a);
      const P = [[-2.9, -1.7, .2], [-1.9, -.7, -.2], [-.8, .05, .25], [.4, .55, -.15], [1.6, .9, .2], [2.7, 1.55, 0]];
      bez(a, P[0], [-1.2, 1.0, 0], P[5], 900, 1, .04);
      P.forEach((q, i) => { if (i < 5) { sph(a, q[0], q[1], q[2], .2 + i * .025, 170, i % 2 ? 0 : 1); ring(a, q[0], q[1], q[2], .34 + i * .03, 120, 2, 1, 0, .03, 'xz', 1); } });
      /* Ziel: grosser Punkt Plum mit Ring */
      sph(a, P[5][0], P[5][1], P[5][2], .34, 420, 3); ring(a, P[5][0], P[5][1], P[5][2], .62, 360, 3, 1, 0, .05);
      /* Argumente: kleine Nebenpunkte, mit dem Bogen verbunden */
      const N = [[-1.4, -1.6, .6], [-.1, -.8, -.6], [1.1, -.3, .6], [2.0, .2, -.5]];
      N.forEach((q, i) => { sph(a, q[0], q[1], q[2], .13, 90, 2); seg(a, q, P[i + 1], 90, 2, .02); });
      /* Stelen unter den Punkten (Höhe = Wirkung) */
      P.slice(0, 5).forEach(q => seg(a, [q[0], -2.2, q[2]], [q[0], q[1] - .25, q[2]], 70, 2, .03));
      return a;
    })();
    /* 3 Verkaufsprozess: geschwungener Pfad mit vier Stationen, Fahne Plum am Ziel */
    F.pfad = (() => {
      const a = []; boden(a, 600);
      const y = -2.05;
      /* Pfad als breites Band aus zwei Rändern und Querpunkten */
      /* Pfad als geschwungenes Band in der Bildebene, steigt nach rechts */
      const pfad = t => [-3.0 + 5.3 * t, y + .25 + 1.55 * t + .42 * Math.sin(t * TAU), 0];
      const norm = t => { const e = .002, A = pfad(t - e), B = pfad(t + e), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
      for (let i = 0; i < 2400; i++) { const t = Rn(), q = pfad(t), n = norm(t), w = (Rn() - .5) * .34, z = (Rn() - .5) * .9; add(a, q[0] + n[0] * w, q[1] + n[1] * w, z, Rn() < .7 ? 1 : 2); }
      for (const side of [-.45, .45]) for (let i = 0; i < 800; i++) { const t = Rn(), q = pfad(t), n = norm(t); add(a, q[0] + n[0] * .17, q[1] + n[1] * .17, side + (Rn() - .5) * .04, 0); }
      /* Stützen unter dem Pfad */
      [.25, .5, .75].forEach(t => { const q = pfad(t); seg(a, [q[0], y, 0], [q[0], q[1], 0], 70, 2, .03); });
      [.1, .42, .7].forEach(t => { const q = pfad(t); ring(a, q[0], q[1] + .01, q[2], .5, 260, 0, 1, 0, .04, 'xz'); seg(a, [q[0], q[1], q[2]], [q[0], q[1] + .95, q[2]], 110, 0, .03); sph(a, q[0], q[1] + 1.15, q[2], .22, 240, 1); });
      { const q = pfad(.95); ring(a, q[0], q[1] + .01, q[2], .6, 320, 3, 1, 0, .05, 'xz'); seg(a, [q[0], q[1], q[2]], [q[0], q[1] + 2.0, q[2]], 180, 0, .03); for (let j = 0; j < 620; j++) { const u = Rn(), v = Rn(); add(a, q[0] + u * .95, q[1] + 2.0 - v * .62 + Math.sin(u * 3) * .07, q[2], 3); } }
      return a;
    })();
    /* 4 Hybrid: Laptop links, Bildschirm rechts, Personen-Symbol in beiden, Verbindung Plum */
    F.hybrid = (() => {
      const a = []; boden(a, 700);
      /* Laptop: Unterteil flach, Bildschirm schräg */
      box(a, -3.3, -2.15, -.9, 2.5, .1, 1.6, 900, 1);
      for (let i = 0; i < 1300; i++) { const u = Rn(), v = Rn(), x = -3.3 + u * 2.5, yy = -2.05 + v * 1.65, z = -.9 - v * .35; if (Rn() < .55) { const e = Math.floor(Rn() * 4); add(a, e === 0 ? -3.3 : e === 1 ? -.8 : x, e === 2 ? -2.05 : e === 3 ? -.4 : yy, e === 2 ? -.9 : e === 3 ? -1.25 : z, 0) } else add(a, x, yy, z, 1); }
      /* Bildschirm rechts mit Fuss */
      box(a, .7, -1.0, -.2, 2.6, 1.7, .1, 1500, 0);
      seg(a, [2.0, -1.0, -.15], [2.0, -2.15, -.15], 120, 1, .05); ring(a, 2.0, -2.17, -.15, .45, 160, 1, 1, 0, .04, 'xz', .6);
      /* Personen-Symbole: Kopf und Schulterbogen */
      const icon = (x, yy, z, s) => { ring(a, x, yy + .28 * s, z, .2 * s, 150, 2, 1, 0, .03); ring(a, x, yy - .35 * s, z, .42 * s, 170, 2, .5, 0, .03); };
      icon(-2.05, -1.25, -1.1, 1); icon(2.0, -.15, -.12, 1.15);
      /* Verbindung: Bogen Plum mit Punkten */
      bez(a, [-1.4, -.2, -1.0], [.0, 1.9, -.6], [1.4, .9, -.15], 650, 3, .05);
      for (const t of [.25, .5, .75]) { const m = 1 - t; sph(a, m * m * -1.4 + 2 * m * t * 0 + t * t * 1.4, m * m * -.2 + 2 * m * t * 1.9 + t * t * .9, m * m * -1 + 2 * m * t * -.6 + t * t * -.15, .1, 60, 3); }
      return a;
    })();

    const PALS = { dunkel: ['#FFFFFF', '#D9E7F2', '#A0C4DF', '#D23A70'], hell: ['#1D3149', '#486EA3', '#7196BF', '#AA1351'] };
    const cv = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    const PR = 3; r.setPixelRatio(PR); r.setClearColor(0x000000, 0); r.setSize(620, 520, false);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 620 / 520, .1, 100), grp = new THREE.Group(); sc.add(grp);
    const d = 11.5; cam.position.set(0, .5 * d / 11, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); grp.rotation.set(.12, -.5, 0);
    const res = {};
    for (const name of Object.keys(F)) {
      const A = F[name], N = A.length;
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N);
      A.forEach((q, i) => { pos.set([q[0], q[1], q[2]], i * 3); rnd[i] = Rn(); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uS: { value: 31 * PR * 1.6 } },
        vertexShader: 'attribute vec3 color;attribute float rnd;uniform float uS;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float dz=clamp((-mv.z-8.)/5.,0.,1.);gl_PointSize=uS*(.55+rnd*.45)*(1.15-.35*dz)/-mv.z;vC=color;vA=(1.-.4*dz);}',
        fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;gl_FragColor=vec4(vC,min(1.,vA*1.15)*smoothstep(.5,.34,d));}' });
      const pts = new THREE.Points(g, mat); grp.add(pts);
      for (const pal of Object.keys(PALS)) {
        const C = PALS[pal].map(h => new THREE.Color(h));
        A.forEach((q, i) => { const c = C[q[3]]; col.set([c.r, c.g, c.b], i * 3); });
        g.attributes.color.needsUpdate = true; r.render(sc, cam); res[name + '-' + pal] = cv.toDataURL('image/png');
      }
      grp.remove(pts); g.dispose(); mat.dispose();
    }
    return res;
  });
  for (const [k, u] of Object.entries(out)) fs.writeFileSync(`roh-hebel-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
  console.log(Object.keys(out).join(' '));
  await b.close();
})();
