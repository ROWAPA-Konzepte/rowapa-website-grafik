/* Punktemeer: welliges Punktfeld mit WebGL (Header, Footer).
   Das Standbild im Element bleibt darunter liegen und ist zugleich Ersatz,
   falls WebGL fehlt oder «Bewegung reduzieren» eingestellt ist.
   Auf Wunsch liegt darüber ein ruhiges Netz aus Plum-Knoten (data-netz, siehe netz.js). */
import { clamp, lerp, easeInOut, zahl, farbe, sichtbar, takt, istHandy } from './util.js';
import { netz, netzStufe } from './netz.js';

const VS = `
attribute vec3 aP;
uniform mat4 uV, uP;
uniform float uT, uAmp, uRip, uS;
uniform vec2 uM;
varying float vH, vA, vR;
void main(){
  vec3 p = vec3(aP.x, 0.0, aP.y);
  float h = sin(p.x*.22 + uT*.5)*.5 + sin(p.z*.3 - uT*.65)*.42 + sin((p.x+p.z)*.14 + uT*.3)*.6 + sin(p.x*.7 - p.z*.5 + uT*.9)*.1;
  float r = distance(p.xz, uM);
  float rip = exp(-r*.25) * sin(r*1.8 - uT*4.0) * .7 * uRip;
  p.y = h*uAmp + rip;
  vH = clamp((h*uAmp + rip)*.45 + .5, 0.0, 1.0);
  vR = aP.z;
  vec4 mv = uV * vec4(p, 1.0);
  gl_Position = uP * mv;
  gl_PointSize = uS * (.55 + aP.z*.5) * (.75 + .5*vH) / -mv.z;
  float fz = smoothstep(-64.0, -18.0, p.z);
  vA = (.25 + .75*fz) * (.5 + .5*vH);
}`;

const FS = `
precision mediump float;
uniform vec3 uC1, uC2, uC3;
uniform float uK;
varying float vH, vA, vR;
void main(){
  vec2 q = gl_PointCoord - .5;
  float d = length(q);
  if (d > .5) discard;
  vec3 c = mix(uC1, uC2, smoothstep(.3, .8, vH));
  c = mix(c, uC3, smoothstep(.8, .95, vH) * step(.9, vR));
  gl_FragColor = vec4(c, smoothstep(.5, .1, d) * vA * uK);
}`;

/* Farben wie in der ersten Fassung: linear umgerechnet, ohne Rückwandlung ausgegeben */
const lin = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

const ARTEN = {
  /* Header: Band im unteren Teil, oben weich ausgeblendet; Hintergrund deckt das Standbild ab */
  'punktemeer': { nx: 320, nz: 200, size: 54, alpha: 1, amp: 1.1, camY: 4.6, look: -3.8, scroll: true,
    band: [65, 35], bandHandy: [66, 34], maske: 'linear-gradient(180deg,transparent 0%,#000 40%,#000 66%,rgba(0,0,0,.5) 100%)',
    bg: 'linear-gradient(180deg,#192940 0%,#1d2f46 30%,#213651 50%,#26405f 75%,#344f76 100%)' },
  /* Footer: füllt das Element, oben weich ausgeblendet */
  'punktemeer-footer': { nx: 260, nz: 150, size: 50, alpha: 0.8, amp: 1, camY: 4.2, look: -3.4, scroll: false,
    band: [0, 100], bandHandy: [0, 100], maske: 'linear-gradient(180deg,transparent 0%,#000 45%)', bg: '' }
};

function shader(gl, typ, src) {
  const s = gl.createShader(typ);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export function punktemeer(box, art) {
  const o = ARTEN[art];
  if (!o) return;
  /* Ebene über dem Standbild: Hintergrund (falls nötig) und darin die Zeichenfläche */
  const ebene = document.createElement('div');
  ebene.setAttribute('aria-hidden', 'true');
  ebene.style.cssText = 'position:absolute;inset:0;overflow:hidden;opacity:0;transition:opacity 1.4s ease;pointer-events:none' + (o.bg ? ';background:' + o.bg : '');
  const cv = document.createElement('canvas');
  const [top, hoehe] = istHandy() ? o.bandHandy : o.band;
  cv.style.cssText = `position:absolute;left:0;width:100%;top:${top}%;height:${hoehe}%;display:block;-webkit-mask-image:${o.maske};mask-image:${o.maske}`;
  ebene.appendChild(cv);
  const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return;
  const vs = shader(gl, gl.VERTEX_SHADER, VS), fs = shader(gl, gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const pr = gl.createProgram();
  gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  box.appendChild(ebene);
  const stufe = netzStufe(box, art);
  if (window.ROWAPAGrafik && art === 'punktemeer') window.ROWAPAGrafik.netz = stufe || 'aus';

  /* Punktfeld: 70 × 70 Einheiten, auf dem Handy weniger Punkte */
  const dichte = clamp(zahl(box, 'data-dichte', 1), 0.3, 1.5), handy = istHandy();
  const NX = Math.round(o.nx * Math.sqrt(dichte) * (handy ? 0.55 : 1));
  const NZ = Math.round(o.nz * Math.sqrt(dichte) * (handy ? 0.6 : 1));
  const n = NX * NZ, buf = new Float32Array(n * 3);
  let k = 0;
  for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
    buf[k++] = (x / (NX - 1) - 0.5) * 70;
    buf[k++] = 6 - (z / (NZ - 1)) * 70;
    buf[k++] = Math.random();
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(pr, 'aP');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uV', 'uP', 'uT', 'uAmp', 'uRip', 'uS', 'uM', 'uC1', 'uC2', 'uC3', 'uK'].forEach(u => { U[u] = gl.getUniformLocation(pr, u); });

  const serpent = farbe(box, 'data-farbe-1', 'great-serpent', '#486EA3');
  const weiss = farbe(box, 'data-farbe-2', 'white', '#FFFFFF');
  const plum = rgbOder(box.getAttribute('data-farbe-3')) || mix(farbe(box, '', 'plum-perfect', '#AA1351'), [255, 255, 255], 0.15);
  gl.uniform3fv(U.uC1, lin(serpent));
  gl.uniform3fv(U.uC2, lin(weiss));
  /* mit Netz gehört Plum nur den Knoten: die Wellenkämme bleiben dann weiss */
  gl.uniform3fv(U.uC3, lin(stufe ? weiss : plum));
  const netzZeichnen = stufe ? netz(ebene, cv, stufe, farbe(box, '', 'plum-perfect', '#AA1351')) : null;
  gl.uniform1f(U.uK, o.alpha);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);

  const dpr = Math.min(devicePixelRatio || 1, 2);
  gl.uniform1f(U.uS, o.size * dpr);
  const tempo = clamp(zahl(box, 'data-tempo', 1), 0.1, 3);
  const amp0 = o.amp * clamp(zahl(box, 'data-hoehe', 1), 0, 3);
  const kraeuseln = box.getAttribute('data-kraeuseln') !== 'aus';

  /* Kamera */
  const sec = box.closest('section, footer, header') || box.parentElement;
  let fov = 58, asp = 1, eye = [0, o.camY, 7], ax = [1, 0, 0], ay = [0, 1, 0], az = [0, 0, 1], V = null, P = null;
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return v.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function kamera(camY, look) {
    eye = [0, camY, 7];
    az = norm([eye[0], eye[1] - look, eye[2] + 14]);
    ax = norm(cross([0, 1, 0], az));
    ay = cross(az, ax);
    V = [ax[0], ay[0], az[0], 0, ax[1], ay[1], az[1], 0, ax[2], ay[2], az[2], 0, -dot(ax, eye), -dot(ay, eye), -dot(az, eye), 1];
    gl.uniformMatrix4fv(U.uV, false, V);
    const f = 1 / Math.tan((fov * Math.PI) / 360), nr = 0.1, fr = 200;
    P = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, (2 * fr * nr) / (nr - fr), 0];
    gl.uniformMatrix4fv(U.uP, false, P);
  }

  /* Kräuseln unter der Maus: Strahl von der Kamera auf die Ebene y = 0 */
  let rip = 0;
  const mZiel = [0, -6], m = [0, -6];
  if (kraeuseln && sec) {
    sec.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const b = cv.getBoundingClientRect();
      const mx = ((e.clientX - b.left) / b.width) * 2 - 1, my = -((e.clientY - b.top) / b.height) * 2 + 1;
      const t = Math.tan((fov * Math.PI) / 360);
      const d = norm([0, 1, 2].map(i => -az[i] + mx * t * asp * ax[i] + my * t * ay[i]));
      if (d[1] >= -1e-4) return;
      const s = -eye[1] / d[1];
      mZiel[0] = eye[0] + s * d[0];
      mZiel[1] = eye[2] + s * d[2];
      rip = 1;
    }, { passive: true });
  }

  let sicht = false, stop = null, erst = true;
  const t0 = performance.now();
  function frame(now) {
    if (!sicht) { stop = null; return false; }
    const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (!w || !h) return true;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    asp = w / h;
    fov = istHandy() ? 75 : 58;
    const hp = o.scroll ? clamp(scrollY / ((sec ? sec.clientHeight : innerHeight) * 0.8), 0, 1) : 0;
    kamera(lerp(o.camY, o.camY + 1.3, hp), o.look);
    const sek = (now - t0) / 1000, amp = lerp(amp0, 0.6 * amp0 / o.amp, easeInOut(hp));
    gl.uniform1f(U.uT, sek * tempo);
    gl.uniform1f(U.uAmp, amp);
    rip *= 0.985;
    gl.uniform1f(U.uRip, rip);
    m[0] += (mZiel[0] - m[0]) * 0.08; m[1] += (mZiel[1] - m[1]) * 0.08;
    gl.uniform2f(U.uM, m[0], m[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, n);
    if (netzZeichnen) netzZeichnen({ V, P, t: sek * tempo, sek, amp, rip, m, w: cv.clientWidth, h: cv.clientHeight, dpr });
    if (erst) { erst = false; ebene.style.opacity = '1'; }
    return true;
  }
  sichtbar(box, v => {
    sicht = v;
    if (v && !stop) stop = takt(frame);
  }, '100px');
}

function rgbOder(s) {
  const m = (s || '').trim().match(/^#([0-9a-f]{6})$/i);
  return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : null;
}
