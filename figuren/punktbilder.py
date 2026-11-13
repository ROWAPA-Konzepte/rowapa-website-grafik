"""Punktbilder im Stil des ROWAPA-Bildkatalogs (Runde 128).

Motive werden als Formen gezeichnet (Striche und Flächen) und dann in Punkte
umgesetzt: dichte Punkte auf den Strichen, lockere Punkte in den Flächen
(nach unten auslaufend), links ein Zerfall in Plum- und Sea-Cliff-Punkte.

    python3 figuren/punktbilder.py [ausgabeordner]

Erzeugt PNG mit Transparenz. Paletten: «hell» (dunkle Punkte für Weiss und
Snowbank), «frei» (helle Punkte für Manganese-Flächen), «szene» (Sea Cliff und
Great Serpent, zart, für weissen Grund wie die Katalog-Szenen).
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

K = 4  # Überabtastung

MANGANESE = (29, 49, 73)
SERPENT = (72, 110, 163)
SEACLIFF = (160, 196, 223)
PLUM = (170, 19, 81)
PLUM_HELL = (214, 64, 126)
WEISS = (255, 255, 255)

PALETTEN = {
    "hell": {"strich": [MANGANESE, MANGANESE, (44, 70, 104)], "flaeche": [MANGANESE, SERPENT, (52, 80, 118)],
             "zerfall": [PLUM, SERPENT, SEACLIFF, MANGANESE], "akzent": [PLUM, (150, 15, 70)]},
    "frei": {"strich": [SEACLIFF, (190, 216, 236), WEISS], "flaeche": [SEACLIFF, (126, 168, 206), WEISS],
             "zerfall": [PLUM_HELL, PLUM, WEISS, SEACLIFF], "akzent": [PLUM_HELL, (226, 90, 146)]},
    "szene": {"strich": [SERPENT, (58, 90, 134), (96, 134, 182)], "flaeche": [(120, 162, 206), SEACLIFF, SERPENT],
              "zerfall": [PLUM, PLUM_HELL, SEACLIFF, SERPENT], "akzent": [PLUM, PLUM_HELL]},
}


class Motiv:
    """Zeichenfläche mit drei Masken: Strich, Fläche, Akzent (Plum)."""

    def __init__(self, b, h):
        self.b, self.h = b, h
        self.strich = Image.new("L", (b * K, h * K), 0)
        self.flaeche = Image.new("L", (b * K, h * K), 0)
        self.akzent = Image.new("L", (b * K, h * K), 0)
        self.akzent_flaeche = Image.new("L", (b * K, h * K), 0)

    def _d(self, ebene):
        return ImageDraw.Draw(getattr(self, ebene))

    @staticmethod
    def _p(pts):
        return [(x * K, y * K) for x, y in pts]

    def linie(self, pts, w=4, ebene="strich"):
        d = self._d(ebene)
        d.line(self._p(pts), fill=255, width=int(w * K), joint="curve")
        r = w * K / 2
        for x, y in self._p(pts):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)

    def kreis(self, cx, cy, r, w=4, ebene="strich", fuellen=None):
        d = self._d(ebene)
        box = [(cx - r) * K, (cy - r) * K, (cx + r) * K, (cy + r) * K]
        if fuellen:
            self._d(fuellen).ellipse(box, fill=255)
        if w:
            d.ellipse(box, outline=255, width=int(w * K))

    def bogen(self, cx, cy, rx, ry, a0, a1, w=4, ebene="strich", n=60):
        pts = [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
                cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
        self.linie(pts, w, ebene)

    def poly(self, pts, w=4, ebene="strich", fuellen=None):
        if fuellen:
            self._d(fuellen).polygon(self._p(pts), fill=255)
        if w:
            self.linie(list(pts) + [pts[0]], w, ebene)

    def rechteck(self, x0, y0, x1, y1, w=4, ebene="strich", fuellen=None, radius=6):
        box = [x0 * K, y0 * K, x1 * K, y1 * K]
        if fuellen:
            self._d(fuellen).rounded_rectangle(box, radius * K, fill=255)
        if w:
            self._d(ebene).rounded_rectangle(box, radius * K, outline=255, width=int(w * K))

    def person(self, cx, top, s=1.0, w=4, gesicht=True, ebene="strich", fuellen="flaeche", rumpf=1.0):
        """Büste von vorn: Kopf, Hals, Schultern. top = Oberkante Kopf."""
        rk = 34 * s
        cy = top + rk
        self.kreis(cx, cy, rk, w, ebene, fuellen=fuellen)
        if gesicht:
            self.bogen(cx, cy + rk * 0.18, rk * 0.38, rk * 0.28, 25, 155, w * 0.7, ebene)
        hals = cy + rk
        sb = 78 * s * rumpf
        unten = hals + 92 * s
        pts = [(cx - sb, unten)]
        n = 24
        for i in range(n + 1):
            t = i / n
            a = math.pi * (1 - t)
            pts.append((cx + sb * math.cos(a), hals + 18 * s + (unten - hals - 18 * s) * (1 - math.sin(a)) * 0.55))
        pts.append((cx + sb, unten))
        if fuellen:
            self._d(fuellen).polygon(self._p(pts), fill=255)
        self.linie(pts[1:-1], w, ebene)
        self.linie([pts[0], pts[1]], w, ebene)
        self.linie([pts[-2], pts[-1]], w, ebene)
        return unten


def _streuen(maske, abstand, rng, wahrsch=lambda x, y: 1.0):
    """Punkte auf einem verwackelten Raster innerhalb der Maske."""
    b, h = maske.size
    px = maske.load()
    pts = []
    a = abstand * K
    y = rng.uniform(0, a)
    while y < h:
        x = rng.uniform(0, a)
        while x < b:
            jx = x + rng.uniform(-0.45, 0.45) * a
            jy = y + rng.uniform(-0.45, 0.45) * a
            if 0 <= jx < b and 0 <= jy < h and px[int(jx), int(jy)] > 128:
                if rng.random() < wahrsch(jx / K, jy / K):
                    pts.append((jx / K, jy / K))
            x += a
        y += a
    return pts


def rendern(motiv, palette, datei, seed=7, zerfall=0.22, zerfall_links=0.42, streu_unten=True,
            strich_abstand=3.0, flaeche_abstand=5.2, r_strich=(0.9, 1.75), r_flaeche=(0.55, 1.2), auslauf=(0.55, 1.0)):
    rng = random.Random(seed)
    pal = PALETTEN[palette]
    b, h = motiv.b, motiv.h
    punkte = []  # (x, y, r, farbe)

    # Strichmaske ohne Akzent, Akzent getrennt
    for maske, farben, abst, rr, art in (
        (motiv.strich, pal["strich"], strich_abstand, r_strich, "strich"),
        (motiv.akzent, pal["akzent"], strich_abstand * 0.95, r_strich, "akzent"),
        (motiv.akzent_flaeche, pal["akzent"], flaeche_abstand * 0.8, (0.8, 1.6), "akzent"),
    ):
        for x, y in _streuen(maske, abst, rng):
            punkte.append([x, y, rng.uniform(*rr), rng.choice(farben), art])

    # Fläche: nach unten auslaufend
    bbox = motiv.flaeche.getbbox()
    if bbox:
        y0, y1 = bbox[1] / K, bbox[3] / K

        def wahr(x, y):
            t = (y - y0) / max(1, (y1 - y0))
            return max(0.0, auslauf[1] - t * (auslauf[1] - auslauf[0] + 0.25))

        innen = motiv.flaeche.filter(ImageFilter.MinFilter(int(3 * K) | 1))
        for x, y in _streuen(innen, flaeche_abstand, rng, wahr):
            punkte.append([x, y, rng.uniform(*r_flaeche), rng.choice(pal["flaeche"]), "flaeche"])

    # Zerfall: links ein Teil der Punkte nach links unten versetzt, in Zerfallsfarben
    if punkte:
        xs = [p[0] for p in punkte]
        xmin, xmax = min(xs), max(xs)
        grenze = xmin + (xmax - xmin) * zerfall_links
        for p in punkte:
            if p[0] < grenze and p[4] != "akzent":
                f = 1 - (p[0] - xmin) / max(1, grenze - xmin)
                if rng.random() < zerfall * (0.4 + f):
                    p[0] -= rng.uniform(4, 40) * (0.5 + f)
                    p[1] += rng.uniform(-14, 22)
                    p[2] *= rng.uniform(0.7, 1.5)
                    p[3] = rng.choice(pal["zerfall"])
        if streu_unten:
            ys = [p[1] for p in punkte]
            ymax = max(ys)
            for _ in range(int(len(punkte) * 0.025)):
                x = rng.uniform(xmin - 30, xmin + (xmax - xmin) * 0.55)
                y = rng.uniform(ymax - 60, ymax + 12)
                punkte.append([x, y, rng.uniform(0.7, 2.0), rng.choice(pal["zerfall"]), "streu"])

    img = Image.new("RGBA", (b * K, h * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x, y, r, c, _ in punkte:
        if not (0 <= x < b and 0 <= y < h):
            continue
        R = r * K
        d.ellipse([x * K - R, y * K - R, x * K + R, y * K + R], fill=c + (255,))
    img = img.resize((b, h), Image.LANCZOS)
    img.save(datei, optimize=True)
    return len(punkte)


# ---------------------------------------------------------------- Motive

def hebel_motivation():
    m = Motiv(408, 408)
    # Flamme mit drei Zungen, innen kleine Flamme in Plum, drei Funken
    def flamme(cx, unten, s):
        roh = [(0, 0), (-0.55, -0.12), (-0.7, -0.45), (-0.55, -0.8), (-0.42, -0.62), (-0.36, -1.0),
               (-0.18, -1.25), (-0.12, -1.0), (0.02, -1.55), (0.22, -1.2), (0.3, -0.95), (0.44, -1.1),
               (0.62, -0.75), (0.7, -0.42), (0.55, -0.12)]
        # weich: Catmull-Rom
        pts = []
        n = len(roh)
        for i in range(n):
            p0, p1, p2, p3 = roh[i - 1], roh[i], roh[(i + 1) % n], roh[(i + 2) % n]
            for k in range(12):
                t = k / 12
                x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t * t + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t ** 3)
                y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t * t + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t ** 3)
                pts.append((cx + x * s, unten + y * s))
        return pts
    m.poly(flamme(204, 340, 150), w=5, fuellen="flaeche")
    m.poly(flamme(204, 330, 62), w=4, ebene="akzent", fuellen="akzent_flaeche")
    for a in (-40, 0, 40):
        r0, r1 = 168, 196
        cx, cy = 204, 250
        ra = math.radians(a - 90)
        m.linie([(cx + r0 * math.cos(ra), cy + r0 * math.sin(ra)), (cx + r1 * math.cos(ra), cy + r1 * math.sin(ra))], 7, "akzent")
    return m


def hebel_diagnostik():
    m = Motiv(408, 408)
    m.kreis(186, 180, 112, w=6)
    m.kreis(186, 180, 98, w=3)
    m.linie([(266, 260), (352, 346)], 16)
    # Person in der Linse
    m.person(186, 118, s=0.62, w=4)
    m.kreis(186, 222, 9, w=0, fuellen="akzent_flaeche")
    return m


def hebel_talent():
    m = Motiv(408, 408)
    stufen = [(70, 320), (140, 270), (210, 220), (280, 170)]
    pts = [(50, 340), (70, 340)]
    for x, y in stufen:
        pts += [(x, y), (x + 70, y)]
    pts.append((350, 170))
    m.linie(pts, 5)
    for x, y in stufen:
        m.rechteck(x, y, x + 70, 340, w=0, fuellen="flaeche", radius=0)
    # Stern über der obersten Stufe
    cx, cy, ra, ri = 315, 92, 42, 18
    stern = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r = ra if i % 2 == 0 else ri
        stern.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    m.poly(stern, w=4, ebene="akzent", fuellen="akzent_flaeche")
    return m


def hebel_gesundheit():
    m = Motiv(408, 408)
    herz = []
    for i in range(121):
        t = i / 120 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        herz.append((204 + x * 8.4, 196 + y * 8.4))
    m.poly(herz, w=6, fuellen="flaeche")
    puls = [(40, 210), (140, 210), (160, 170), (185, 268), (212, 128), (236, 236), (252, 210), (368, 210)]
    m.linie(puls, 6, "akzent")
    return m


def hebel_coaching():
    m = Motiv(408, 408)
    m.person(150, 138, s=0.92)
    m.person(276, 190, s=0.7)
    # Weg nach vorn: gepunkteter Bogen mit Pfeil
    pts = [(206 + 160 * math.cos(math.radians(a)), 168 + 128 * math.sin(math.radians(a))) for a in range(205, 330, 3)]
    for i in range(0, len(pts) - 1, 3):
        m.linie([pts[i], pts[i + 1]], 6, "akzent")
    ex, ey = pts[-1]
    m.poly([(ex + 16, ey + 2), (ex - 10, ey - 18), (ex - 4, ey + 16)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


def szene_platz():
    m = Motiv(408, 408)
    zellen = [(60, 70), (190, 70), (60, 210), (190, 210)]
    for i, (x, y) in enumerate(zellen):
        if i == 3:
            m.rechteck(x, y, x + 116, y + 126, w=4, ebene="akzent", radius=10)
            m.linie([(248, 262), (248, 262)], 0)
            # Fragezeichen
            m.bogen(248, 252, 16, 16, 180, 400, 5, "akzent")
            m.linie([(248, 268), (248, 284)], 5, "akzent")
            m.kreis(248, 300, 3, w=0, fuellen="akzent_flaeche")
        else:
            m.rechteck(x, y, x + 116, y + 126, w=3, radius=10)
            m.person(x + 58, y + 18, s=0.48, w=3)
    m.person(352, 150, s=0.62, w=4)
    pts = [(352 - 40 + 4 * i, 300 + 0.6 * i) for i in range(0)]
    return m


def szene_giesskanne():
    m = Motiv(408, 408)
    # Kanne, leicht geneigt: Körper, Griff, langer Ausguss mit Brause
    def dreh(pts, cx, cy, grad):
        a = math.radians(grad)
        return [(cx + (x - cx) * math.cos(a) - (y - cy) * math.sin(a), cy + (x - cx) * math.sin(a) + (y - cy) * math.cos(a)) for x, y in pts]
    cx, cy, g = 120, 140, 18
    koerper = dreh([(60, 100), (170, 100), (162, 190), (68, 190)], cx, cy, g)
    m.poly(koerper, w=5, fuellen="flaeche")
    griff = dreh([(60 + 0 * i, 0) for i in range(0)], cx, cy, g)
    pts = [(60 - 34 * math.sin(math.radians(t)), 145 - 40 * math.cos(math.radians(t))) for t in range(0, 181, 10)]
    m.linie(dreh(pts, cx, cy, g), 5)
    m.linie(dreh([(166, 175), (250, 110)], cx, cy, g), 7)
    brause = dreh([(244, 96), (266, 124)], cx, cy, g)
    m.linie(brause, 10)
    # Tropfen: fallen nur auf die mittlere Pflanze
    rng = random.Random(3)
    bx, by = (brause[0][0] + brause[1][0]) / 2, (brause[0][1] + brause[1][1]) / 2
    for _ in range(46):
        t = rng.random()
        x = bx + 6 + rng.uniform(-18, 26) * (0.4 + t)
        y = by + 14 + t * 150
        m.kreis(x, y, rng.uniform(2.6, 4.4), w=0, fuellen="akzent_flaeche" if rng.random() < 0.3 else "flaeche")
    # Pflanzen unterschiedlich gross: nur eine wächst
    boden = 352
    for x, hoehe, akzent in ((54, 34, False), (140, 44, False), (262, 130, True), (350, 40, False)):
        eb = "akzent" if akzent else "strich"
        m.linie([(x, boden), (x, boden - hoehe)], 4.5, eb)
        for f, seite in ((0.45, -1), (0.7, 1), (0.92, -1)):
            if hoehe < 60 and f > 0.8:
                continue
            y = boden - hoehe * f
            m.poly([(x, y), (x + seite * 28, y - 18), (x + seite * 10, y + 4)], w=3.5, ebene=eb)
    m.linie([(24, 354), (384, 354)], 4)
    return m


def szene_talente():
    m = Motiv(408, 408)
    stufen = [(40, 330), (130, 270), (220, 210), (310, 150)]
    pts = [(20, 360), (40, 360)]
    for x, y in stufen:
        pts += [(x, y), (x + 90, y)]
    pts.append((400, 150))
    m.linie(pts, 4)
    for i, (x, y) in enumerate(stufen[:3]):
        m.person(x + 45, y - 118, s=0.46, w=3)
    # oberste Stufe leer: Umriss in Plum, gestrichelt
    x, y = stufen[3]
    cx, top = x + 45, y - 118
    for a in range(0, 360, 30):
        m.bogen(cx, top + 15.6, 15.6, 15.6, a, a + 16, 3.5, "akzent", n=6)
    for a in range(180, 360, 24):
        m.bogen(cx, top + 70, 36, 30, a, a + 12, 3.5, "akzent", n=6)
    return m


def szene_zahlen():
    m = Motiv(408, 408)
    m.person(120, 110, s=0.9)
    # Balken fallen
    for i, hoehe in enumerate((190, 150, 112, 70)):
        x = 230 + i * 40
        m.rechteck(x, 330 - hoehe, x + 28, 330, w=3, fuellen="flaeche", radius=3)
    m.linie([(214, 332), (396, 332)], 4)
    m.linie([(236, 110), (372, 236)], 6, "akzent")
    m.poly([(384, 248), (352, 238), (374, 216)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


def header():
    m = Motiv(1000, 624)
    m.person(360, 40, s=3.0, w=7)
    # Entwicklungsweg: von der Schulter nach oben rechts, drei Stationen, Pfeil
    def bahn(t):
        return 600 + 340 * t, 520 - 430 * (t ** 1.5)
    pts = [bahn(i / 80) for i in range(81)]
    for i in range(0, 80, 2):
        m.linie([pts[i], pts[i + 1]], 9, "akzent")
    for t in (0.3, 0.6, 0.88):
        x, y = bahn(t)
        m.kreis(x, y, 16, w=6, ebene="akzent")
    ex, ey = pts[-1]
    m.poly([(ex + 30, ey - 30), (ex - 30, ey - 6), (ex + 8, ey + 30)], w=4, ebene="akzent", fuellen="akzent_flaeche")
    # Potenzial: Funken um den Kopf
    rng = random.Random(11)
    for _ in range(40):
        a = rng.uniform(195, 345)
        r = rng.uniform(128, 190)
        m.kreis(360 + r * math.cos(math.radians(a)), 142 + r * math.sin(math.radians(a)), rng.uniform(2.5, 5), w=0,
                fuellen="akzent_flaeche" if rng.random() < 0.45 else "flaeche")
    return m


# ---------------------------------------------------------------- Führung & Teams (Runde 129)

def fu_header():
    m = Motiv(1000, 624)
    # Führungsperson vorn, zwei Teammitglieder dahinter, gemeinsamer Weg nach oben
    m.person(200, 170, s=2.0, w=6)
    m.person(640, 170, s=2.0, w=6)
    m.person(420, 70, s=2.6, w=7)
    def bahn(t):
        return 720 + 220 * t, 300 - 240 * (t ** 1.5)
    pts = [bahn(i / 60) for i in range(61)]
    for i in range(0, 60, 2):
        m.linie([pts[i], pts[i + 1]], 9, "akzent")
    for t in (0.35, 0.7):
        x, y = bahn(t)
        m.kreis(x, y, 15, w=6, ebene="akzent")
    ex, ey = pts[-1]
    m.poly([(ex + 22, ey - 32), (ex - 26, ey - 8), (ex + 14, ey + 22)], w=4, ebene="akzent", fuellen="akzent_flaeche")
    return m


def fu_hebel_kompetenz():
    m = Motiv(408, 408)
    m.person(180, 110, s=1.0)
    # Abzeichen mit Stern an der Brust
    cx, cy, ra, ri = 268, 270, 30, 13
    stern = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r = ra if i % 2 == 0 else ri
        stern.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    m.kreis(cx, cy, 44, w=4, ebene="akzent")
    m.poly(stern, w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


def fu_hebel_team():
    m = Motiv(408, 408)
    pos = [(204, 96), (96, 210), (312, 210), (150, 320), (258, 320)]
    for i, (x, y) in enumerate(pos):
        for (x2, y2) in pos[i + 1:]:
            m.linie([(x, y), (x2, y2)], 2.5, "strich")
    for i, (x, y) in enumerate(pos):
        m.kreis(x, y, 34, w=5, fuellen="flaeche")
        m.bogen(x, y + 8, 12, 9, 25, 155, 3)
    m.kreis(204, 96, 34, w=5, ebene="akzent")
    return m


def fu_hebel_diagnose():
    m = Motiv(408, 408)
    # Netzdiagramm mit Profil in Plum
    cx, cy, r = 204, 210, 140
    n = 6
    for ring in (0.35, 0.7, 1.0):
        pts = [(cx + r * ring * math.cos(math.radians(-90 + i * 60)), cy + r * ring * math.sin(math.radians(-90 + i * 60))) for i in range(n)]
        m.poly(pts, w=3 if ring < 1 else 5)
    for i in range(n):
        a = math.radians(-90 + i * 60)
        m.linie([(cx, cy), (cx + r * math.cos(a), cy + r * math.sin(a))], 2.5)
    werte = [0.9, 0.55, 0.75, 0.45, 0.85, 0.6]
    prof = [(cx + r * v * math.cos(math.radians(-90 + i * 60)), cy + r * v * math.sin(math.radians(-90 + i * 60))) for i, v in enumerate(werte)]
    m.poly(prof, w=6, ebene="akzent", fuellen="flaeche")
    for x, y in prof:
        m.kreis(x, y, 8, w=0, fuellen="akzent_flaeche")
    return m


def fu_hebel_motivation():
    m = Motiv(408, 408)
    m.person(204, 150, s=0.95)
    # Strahlen nach oben: Antrieb geben
    for a in (-60, -30, 0, 30, 60):
        ra = math.radians(a - 90)
        x0, y0 = 204 + 120 * math.cos(ra), 182 + 120 * math.sin(ra)
        x1, y1 = 204 + 165 * math.cos(ra), 182 + 165 * math.sin(ra)
        m.linie([(x0, y0), (x1, y1)], 7, "akzent")
    return m


def fu_hebel_sparring():
    m = Motiv(408, 408)
    # Zwei Personen im Profil, einander zugewandt, dazwischen Sprechblase
    def profil(cx, top, s, richtung):
        rk = 34 * s
        m.kreis(cx, top + rk, rk, w=5, fuellen="flaeche")
        hals = top + 2 * rk
        pts = [(cx - 70 * s * richtung, hals + 110 * s), (cx - 60 * s * richtung, hals + 30 * s), (cx, hals + 12 * s), (cx + 60 * s * richtung, hals + 30 * s), (cx + 70 * s * richtung, hals + 110 * s)]
        m.poly(pts, w=0, fuellen="flaeche")
        m.linie(pts, 5)
    profil(110, 130, 0.9, 1)
    profil(298, 130, 0.9, -1)
    m.rechteck(160, 50, 248, 104, w=4, ebene="akzent", radius=14)
    m.poly([(196, 104), (214, 104), (200, 122)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


def fu_szene_hybrid():
    m = Motiv(408, 408)
    # Bildschirm mit Person, davor eine Person: Nähe auf Distanz
    m.rechteck(170, 70, 380, 230, w=5, radius=8)
    m.linie([(250, 230), (300, 230)], 4)
    m.linie([(240, 262), (310, 262)], 5)
    m.linie([(275, 232), (275, 262)], 5)
    m.person(275, 100, s=0.55, w=3)
    m.person(110, 180, s=0.82)
    # Verbindung (Wellen) in Plum
    for r in (22, 36, 50):
        m.bogen(178, 200, r, r, -40, 40, 3.5, "akzent", n=20)
    return m


def fu_szene_einzel():
    m = Motiv(408, 408)
    # Ein Einzelkämpfer weit vorn, die anderen getrennt dahinter
    m.person(320, 120, s=0.8)
    for x in (60, 150):
        m.person(x, 210, s=0.58, w=3)
    m.linie([(20, 352), (390, 352)], 4)
    # Lücke in Plum zwischen Team und Einzelkämpfer
    for k in range(5):
        y = 150 + k * 40
        m.linie([(236, y), (236, y + 18)], 4, "akzent")
    return m


def fu_szene_messen():
    m = Motiv(408, 408)
    # Zielscheibe, Pfeile daneben: Massnahmen ohne Messung
    for r in (130, 92, 54):
        m.kreis(204, 200, r, w=4)
    m.kreis(204, 200, 18, w=0, fuellen="akzent_flaeche")
    for (x, y, a) in ((70, 70, 35), (360, 110, 150), (330, 350, 220)):
        ra = math.radians(a)
        m.linie([(x, y), (x + 70 * math.cos(ra), y + 70 * math.sin(ra))], 5, "akzent")
        m.poly([(x, y), (x + 18 * math.cos(ra + 0.5), y + 18 * math.sin(ra + 0.5)), (x + 18 * math.cos(ra - 0.5), y + 18 * math.sin(ra - 0.5))], w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


def fu_szene_spitze():
    m = Motiv(408, 408)
    # Oberste Stufe: Führungsperson mit Gegenüber im Gespräch
    pts = [(20, 360), (90, 360), (90, 300), (170, 300), (170, 240), (400, 240)]
    m.linie(pts, 4)
    m.person(230, 96, s=0.62)
    m.person(340, 108, s=0.55, w=3)
    m.rechteck(262, 34, 318, 72, w=3.5, ebene="akzent", radius=10)
    m.poly([(284, 72), (296, 72), (286, 86)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    return m


# ---------------------------------------------------------------- Recruiting & Mitarbeiterbindung (Runde 130)

def re_header():
    m = Motiv(1000, 624)
    # Lebenszyklus: Ring mit vier Stationen, Person in der Mitte, Pfeile im Uhrzeigersinn
    cx, cy, r = 520, 312, 250
    for a0 in (200, 290, 20, 110):
        m.bogen(cx, cy, r, r, a0 + 13, a0 + 77, 11)
        a1 = math.radians(a0 + 78)
        ex, ey = cx + r * math.cos(a1), cy + r * math.sin(a1)
        t = a1 + math.pi / 2
        m.poly([(ex + 28 * math.cos(t), ey + 28 * math.sin(t)), (ex - 24 * math.cos(a1 - 0.6), ey - 24 * math.sin(a1 - 0.6)), (ex + 24 * math.cos(a1 + 0.6), ey + 24 * math.sin(a1 + 0.6))], w=6, fuellen="flaeche")
    for i, a in enumerate((200, 290, 20, 110)):
        x, y = cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))
        m.kreis(x, y, 38, w=8, ebene="akzent" if i == 3 else "strich", fuellen="akzent_flaeche" if i == 3 else "flaeche")
    m.person(cx, 196, s=1.6, w=7)
    return m


def re_hebel_recruiting():
    m = Motiv(408, 408)
    # Magnet zieht Personen an
    m.bogen(130, 170, 70, 70, 90, 270, 18)
    m.linie([(130, 100), (190, 100)], 18)
    m.linie([(130, 240), (190, 240)], 18)
    m.linie([(176, 100), (204, 100)], 18, "akzent")
    m.linie([(176, 240), (204, 240)], 18, "akzent")
    m.person(320, 110, s=0.55, w=3)
    m.person(300, 250, s=0.45, w=3)
    for k in range(3):
        m.bogen(232, 170, 18 + k * 14, 30 + k * 14, -50, 50, 3, "akzent", n=12)
    return m


def re_hebel_onboarding():
    m = Motiv(408, 408)
    # Weg mit drei Etappen 30, 60, 90 Tage und Ziel
    pts = [(40, 320), (130, 300), (180, 240), (260, 220), (300, 160), (370, 120)]
    for i in range(len(pts) - 1):
        for k in range(0, 8, 2):
            a, b = k / 8, (k + 1) / 8
            (x0, y0), (x1, y1) = pts[i], pts[i + 1]
            m.linie([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)], 6)
    for (x, y) in (pts[1], pts[3], pts[4]):
        m.kreis(x, y, 18, w=5, fuellen="flaeche")
    m.linie([(370, 120), (370, 50)], 5, "akzent")
    m.poly([(370, 50), (410, 64), (370, 80)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    m.person(70, 196, s=0.55, w=3)
    return m


def re_hebel_bindung():
    m = Motiv(408, 408)
    # Anker
    m.kreis(204, 86, 26, w=7)
    m.linie([(204, 112), (204, 330)], 9)
    m.linie([(150, 160), (258, 160)], 9)
    m.bogen(204, 250, 120, 90, 10, 170, 9)
    for x, d in ((86, -1), (322, 1)):
        m.poly([(x, 266), (x + 34 * d, 252), (x + 6 * d, 236)], w=4, ebene="akzent", fuellen="akzent_flaeche")
    return m


def re_szene_bewerbung():
    m = Motiv(408, 408)
    # Wartereihe: fünf Stühle, nur einer besetzt
    for i in range(5):
        x = 40 + i * 70
        m.linie([(x, 300), (x + 50, 300)], 4)
        m.linie([(x + 4, 300), (x + 4, 350)], 3)
        m.linie([(x + 46, 300), (x + 46, 350)], 3)
        m.linie([(x + 4, 300), (x + 4, 240)], 3)
    m.person(205, 150, s=0.62, w=3)
    m.rechteck(290, 60, 380, 130, w=3.5, ebene="akzent", radius=8)
    m.linie([(304, 84), (366, 84)], 3, "akzent")
    m.linie([(304, 104), (346, 104)], 3, "akzent")
    return m


def re_szene_einarbeitung():
    m = Motiv(408, 408)
    # Sanduhr neben einer Person am Pult
    m.poly([(250, 70), (350, 70), (300, 190)], w=4)
    m.poly([(300, 190), (250, 310), (350, 310)], w=4, fuellen="flaeche")
    m.linie([(236, 70), (364, 70)], 6)
    m.linie([(236, 310), (364, 310)], 6)
    for k in range(6):
        m.kreis(300, 200 + k * 14, 3, w=0, fuellen="akzent_flaeche")
    m.person(110, 140, s=0.72)
    return m


def re_szene_perspektive():
    m = Motiv(408, 408)
    # Weg endet vor einer Wand, Person davor
    m.linie([(20, 340), (300, 340)], 4)
    for k in range(5):
        y = 120 + k * 46
        m.linie([(310, y), (390, y)], 4)
        m.linie([(350 if k % 2 else 330, y), (350 if k % 2 else 330, y + 46)], 3)
    m.rechteck(310, 120, 390, 340, w=4, radius=2)
    m.person(200, 150, s=0.7)
    m.bogen(250, 120, 22, 22, 200, 400, 4, "akzent", n=20)
    m.kreis(258, 160, 3.5, w=0, fuellen="akzent_flaeche")
    return m


def re_szene_abwerben():
    m = Motiv(408, 408)
    # Person geht aus der eigenen Tür zu einem anderen Gebäude
    m.rechteck(30, 110, 150, 340, w=4, radius=2)
    m.rechteck(70, 230, 110, 340, w=3, radius=2)
    m.poly([(290, 340), (290, 150), (340, 110), (390, 150), (390, 340)], w=4)
    m.person(200, 180, s=0.5, w=3)
    pts = [(150, 330), (220, 316), (280, 300)]
    for i in range(0, 2):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        for k in range(0, 6, 2):
            a, b = k / 6, (k + 1) / 6
            m.linie([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)], 5, "akzent")
    m.poly([(286, 298), (266, 288), (270, 310)], w=3, ebene="akzent", fuellen="akzent_flaeche")
    m.linie([(20, 342), (396, 342)], 4)
    return m


SZ = {"strich_abstand": 2.7, "r_strich": (1.05, 2.0), "r_flaeche": (0.7, 1.35)}

BILDER = [
    ("mp-hebel-motivation-hell", hebel_motivation, "hell", {}),
    ("mp-hebel-diagnostik-frei", hebel_diagnostik, "frei", {}),
    ("mp-hebel-talent-hell", hebel_talent, "hell", {}),
    ("mp-hebel-gesundheit-frei", hebel_gesundheit, "frei", {}),
    ("mp-hebel-coaching-hell", hebel_coaching, "hell", {}),
    ("mp-szene-platz", szene_platz, "szene", SZ),
    ("mp-szene-giesskanne", szene_giesskanne, "szene", SZ),
    ("mp-szene-talente", szene_talente, "szene", SZ),
    ("mp-szene-zahlen", szene_zahlen, "szene", SZ),
    ("fu-header-fuehrung", fu_header, "frei", {"strich_abstand": 3.6, "flaeche_abstand": 6.0, "r_strich": (1.4, 2.8), "r_flaeche": (1.0, 2.0), "auslauf": (0.35, 0.95)}),
    ("fu-hebel-kompetenz-hell", fu_hebel_kompetenz, "hell", {}),
    ("fu-hebel-team-frei", fu_hebel_team, "frei", {}),
    ("fu-hebel-diagnose-hell", fu_hebel_diagnose, "hell", {}),
    ("fu-hebel-motivation-frei", fu_hebel_motivation, "frei", {}),
    ("fu-hebel-sparring-hell", fu_hebel_sparring, "hell", {}),
    ("fu-szene-hybrid", fu_szene_hybrid, "szene", SZ),
    ("fu-szene-einzel", fu_szene_einzel, "szene", SZ),
    ("fu-szene-messen", fu_szene_messen, "szene", SZ),
    ("fu-szene-spitze", fu_szene_spitze, "szene", SZ),
    ("re-header-lebenszyklus", re_header, "frei", {"strich_abstand": 3.6, "flaeche_abstand": 6.0, "r_strich": (1.4, 2.8), "r_flaeche": (1.0, 2.0), "auslauf": (0.35, 0.95)}),
    ("re-hebel-recruiting-hell", re_hebel_recruiting, "hell", {}),
    ("re-hebel-onboarding-frei", re_hebel_onboarding, "frei", {}),
    ("re-hebel-bindung-hell", re_hebel_bindung, "hell", {}),
    ("re-szene-bewerbung", re_szene_bewerbung, "szene", SZ),
    ("re-szene-einarbeitung", re_szene_einarbeitung, "szene", SZ),
    ("re-szene-perspektive", re_szene_perspektive, "szene", SZ),
    ("re-szene-abwerben", re_szene_abwerben, "szene", SZ),
    ("mp-header-potenzial", header, "frei", {"strich_abstand": 3.6, "flaeche_abstand": 6.0, "r_strich": (1.4, 2.8), "r_flaeche": (1.0, 2.0), "auslauf": (0.35, 0.95)}),
]


if __name__ == "__main__":
    ziel = Path(sys.argv[1] if len(sys.argv) > 1 else "figuren/mitarbeiterperformance")
    ziel.mkdir(parents=True, exist_ok=True)
    nur = set(sys.argv[2:])
    for name, fn, pal, opt in BILDER:
        if nur and name not in nur:
            continue
        n = rendern(fn(), pal, ziel / f"{name}.png", **opt)
        print(name, n)
