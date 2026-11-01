/* Punktfigur: baut sich einmal aus dem Standbild auf und ruht dann.
   Das Standbild (PNG mit transparentem Hintergrund) ist die Vorlage: Die Figur setzt sich aus kleinen
   Ausschnitten genau dieses Bildes zusammen, die von unten an ihren Platz fliegen; am Ende steht das Original.
   Das Bild wird dafür weder ein zweites Mal geladen noch ausgelesen. */
import { clamp, easeOut, zahl, sobaldNahe, takt, istHandy, beiMaus } from './util.js';

const gruppen = new WeakMap();

/* Lage des sichtbaren Bildes im Element (object-fit / object-position) */
function bildRahmen(img) {
  const bw = img.clientWidth, bh = img.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight, cs = getComputedStyle(img);
  let w = bw, h = bh;
  if (cs.objectFit === 'cover' || cs.objectFit === 'contain') {
    const s = cs.objectFit === 'cover' ? Math.max(bw / nw, bh / nh) : Math.min(bw / nw, bh / nh);
    w = nw * s; h = nh * s;
  }
  const pos = cs.objectPosition.split(' ').map(p => (p.endsWith('%') ? parseFloat(p) / 100 : 0.5));
  return { x: (bw - w) * pos[0], y: (bh - h) * (pos[1] ?? 0.5), w, h, bw, bh };
}

export function figur(box) {
  const img = box.querySelector('img');
  if (!img) return;
  const sec = box.closest('section') || document.body;
  const liste = gruppen.get(sec) || [];
  liste.push(box); gruppen.set(sec, liste);
  const index = liste.length - 1;

  /* nur PNG (transparenter Hintergrund); bereits im Bild beim Laden: Standbild lassen,
     ausser data-start="sofort" (z. B. Lupe im Header der Unterseiten, ab 1.19.0) */
  const sofort = (box.getAttribute('data-start') || '').trim().toLowerCase() === 'sofort';
  const zeige = () => { img.style.opacity = sofort ? '1' : ''; };
  if (!/\.png(\?|\s|$)/i.test(img.getAttribute('src') || '')) { if (sofort) zeige(); return; }
  const r0 = box.getBoundingClientRect();
  if (!sofort && r0.top < innerHeight && r0.bottom > 0) return;

  const tempo = clamp(zahl(box, 'data-tempo', 1), 0.2, 3);
  const verz = zahl(box, 'data-verzoegerung', sofort ? 0.25 : index * 0.12);
  const gross = box.clientWidth * box.clientHeight > 120000;
  const ziel = Math.round((gross ? 2400 : 900) * clamp(zahl(box, 'data-dichte', 1), 0.3, 2) * (istHandy() ? 0.6 : 1));
  let cv, ctx, teile, fertig = false;

  /* Vorbereiten, sobald die Figur näher als 1,5 Bildschirmhöhen ist */
  sobaldNahe(box, () => {
    img.style.opacity = '0';
    img.loading = 'eager';
    const los = () => {
      if (!vorbereiten()) return zeigeOriginal();
      sobaldNahe(box, () => setTimeout(starten, verz * 1000), '0px 0px -12% 0px');
    };
    if (img.complete && img.naturalWidth) los();
    else { img.addEventListener('load', los, { once: true }); img.addEventListener('error', zeigeOriginal, { once: true }); }
    setTimeout(() => { if (!teile) zeigeOriginal(); }, 8000);
  }, '150% 0px');

  function zeigeOriginal() {
    zeige();
    if (cv) cv.remove();
    fertig = true;
  }

  function vorbereiten() {
    const R = bildRahmen(img);
    if (!R.bw || !R.bh || !img.naturalWidth) return false;
    /* sichtbarer Teil des Bildes im Element, in Zellen zerlegt */
    const x0 = Math.max(0, R.x), y0 = Math.max(0, R.y), x1 = Math.min(R.bw, R.x + R.w), y1 = Math.min(R.bh, R.y + R.h);
    const fw = x1 - x0, fh = y1 - y0;
    if (fw < 10 || fh < 10) return false;
    const c = Math.max(3, Math.round(Math.sqrt((fw * fh) / ziel)));
    const sx = img.naturalWidth / R.w, sy = img.naturalHeight / R.h;
    teile = [];
    for (let y = y0; y < y1; y += c) for (let x = x0; x < x1; x += c) {
      const w = Math.min(c, x1 - x), h = Math.min(c, y1 - y);
      /* Aufbau von unten nach oben, leicht von links */
      const k = (1 - (y - y0) / fh) * 0.78 + ((x - x0) / fw) * 0.18 + Math.random() * 0.06;
      const ax = x + (Math.random() - 0.5) * fw * 0.25, ay = y1 + 4 + Math.random() * 10;
      teile.push({
        x, y, w, h, k, ax, ay,
        qx: (x - R.x) * sx, qy: (y - R.y) * sy, qw: w * sx, qh: h * sy,
        cx: (ax + x) / 2 + (Math.random() - 0.5) * fw * 0.18,
        cy: Math.min(ay, y) - Math.random() * fh * 0.12
      });
    }
    cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(R.bw * dpr); cv.height = Math.round(R.bh * dpr);
    cv.style.cssText = `position:absolute;left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${R.bw}px;height:${R.bh}px;pointer-events:none;transition:opacity .6s ease`;
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    img.insertAdjacentElement('afterend', cv);
    ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    teile.bw = R.bw; teile.bh = R.bh;
    return true;
  }

  function zeichne(t) {
    const spread = (gross ? 0.55 : 0.4) / tempo, dauer = (gross ? 0.7 : 0.55) / tempo;
    ctx.clearRect(0, 0, teile.bw, teile.bh);
    for (let i = 0; i < teile.length; i++) {
      const p = teile[i];
      const u = clamp((t - p.k * spread) / dauer, 0, 1);
      if (u <= 0) continue;
      const e = easeOut(u), m = 1 - e;
      ctx.globalAlpha = u < 0.3 ? u / 0.3 : 1;
      ctx.drawImage(img, p.qx, p.qy, p.qw, p.qh,
        m * m * p.ax + 2 * m * e * p.cx + e * e * p.x,
        m * m * p.ay + 2 * m * e * p.cy + e * e * p.y, p.w, p.h);
    }
    ctx.globalAlpha = 1;
    return spread + dauer;
  }

  function starten() {
    if (fertig) return;
    const t0 = performance.now();
    takt(now => {
      const t = (now - t0) / 1000;
      if (t < zeichne(t)) return true;
      /* Überblenden ins Original */
      img.style.transition = 'opacity .6s ease';
      zeige();
      cv.style.opacity = '0';
      setTimeout(() => { cv.remove(); fertig = true; hover(); }, 700);
      return false;
    });
  }

  /* beim Darüberfahren zieht sich die Figur leicht zusammen */
  function hover() {
    const karte = box.closest('a, [class*="card"]');
    if (!karte) return;
    beiMaus(() => {
      img.style.transition = 'transform .7s cubic-bezier(.2,.7,.1,1), opacity .6s ease';
      img.style.transformOrigin = '50% 70%';
      karte.addEventListener('mouseenter', () => { img.style.transform = 'scale(.97)'; });
      karte.addEventListener('mouseleave', () => { img.style.transform = ''; });
    });
  }
}
