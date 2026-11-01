// Rendert die vier Themenfiguren als transparente PNG (Bildsprache der ersten Fassung, Formdaten aus rowapa-website).
const { chromium } = require('playwright');
const fs = require('fs');
const shapes = fs.readFileSync('makeShapes.js', 'utf8');
/* HELL=1: Vertriebs-Treppe in den Farben der Themenfiguren (für hellen Grund) */
const HELL_SUFFIX = process.env.HELL && process.argv[2] === 'vertrieb' ? '-hell' : '';
/* PLUM=1: Farbkonzept (Runde 33) – Plum als Hauptfarbe (Formen und Akzente), Sea Cliff und Mischblau untergeordnet; Dateien mit -plum */
const PLUM = !!process.env.PLUM;
const PLUM_SUFFIX = PLUM ? '-plum' : '';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  await p.setContent('<html><body style="margin:0;background:transparent"></body></html>');
  await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' });
  const urls = await p.evaluate(([src, ART, HELL, PLUM]) => {
    const N = ART === 'vertrieb' ? 7000 : 3200;
    const makeShapes = new Function('N', src + '; return makeShapes();');
    const SH = makeShapes(N);
    const cv = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    const PR = 3;
    r.setPixelRatio(PR);
    r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N);
    for (let i = 0; i < N; i++) rnd[i] = Math.random();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uS: { value: 31 * PR * (ART === 'vertrieb' ? 1.6 : 2.5) } },
      vertexShader: 'attribute vec3 color;attribute float rnd;uniform float uS;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float dz=clamp((-mv.z-8.)/5.,0.,1.);gl_PointSize=uS*(.55+rnd*.45)*(1.15-.35*dz)/-mv.z;vC=color;vA=(1.-.4*dz);}',
      fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;gl_FragColor=vec4(vC,min(1.,vA*1.15)*smoothstep(.5,.34,d));}' });
    const pts = new THREE.Points(g, mat), grp = new THREE.Group(); grp.add(pts); sc.add(grp);
    { let y0 = 1e9, y1 = -1e9; const P0 = SH[0].P; for (let i = 1; i < P0.length; i += 3) { if (P0[i] < y0) y0 = P0[i]; if (P0[i] > y1) y1 = P0[i]; } pts.position.y = -(y0 + y1) / 2; }
    const PAL = (PLUM ? ['#AA1351', '#A0C4DF', '#7196BF', '#AA1351'] : ART === 'vertrieb' && !HELL ? ['#FFFFFF', '#D9E7F2', '#A0C4DF', '#D23A70'] : ['#1D3149', '#486EA3', '#7196BF', '#AA1351']).map(h => new THREE.Color(h));
    if (ART === 'vertrieb') { r.setSize(620, 520, false); cam.aspect = 620 / 520; } else { r.setSize(800, 640, false); cam.aspect = 800 / 640; } const d = ART === 'vertrieb' ? 11.5 : 15.5; cam.position.set(0, .5 * d / 11, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); grp.rotation.set(.12, -.5, 0);
    const out = [];
    for (const k of (ART === 'vertrieb' ? [0] : [1, 2, 3, 4])) { const A = SH[k]; pos.set(A.P); for (let i = 0; i < N; i++) { const c = PAL[A.K[i]]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; r.render(sc, cam); out.push(cv.toDataURL('image/png')); }
    return out;
  }, [shapes, process.argv[2] || 'themen', !!process.env.HELL, PLUM]);
  const names = process.argv[2] === 'vertrieb' ? ['vertrieb'] : ['potenzial', 'fuehrung', 'recruiting', 'digital'];
  urls.forEach((u, i) => fs.writeFileSync(`roh-${names[i]}${HELL_SUFFIX}${PLUM_SUFFIX}.png`, Buffer.from(u.split(',')[1], 'base64')));
  await b.close();
})();
