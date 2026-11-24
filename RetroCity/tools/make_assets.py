#!/usr/bin/env python3
"""
Генератор оригинальных 2D-ассетов RetroCity (вид строго сверху).
Всё рисуется кодом (Pillow + numpy) с 4x суперсэмплингом — внешних картинок не используется.

Запуск:  python3 tools/make_assets.py
Результат: assets/*.png + assets/manifest.json
"""
import json, math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'assets'))
os.makedirs(os.path.join(OUT, 'ui'), exist_ok=True)

SS = 4            # суперсэмплинг
FRAME = 64        # кадр персонажа, px
PED_UNITS = 3.0   # кадр персонажа = 3 мировых единицы
CAR_PPU = 20      # пикселей на единицу у машин
TILE = 64         # тайл земли = 4 единицы (16 px/ед)
MAN = {}
import sys as _sys; _sys.path.insert(0, HERE)
import assets_extra as EX


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + tuple(c[3:])


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ell_pts(cx, cy, rx, ry, rot=0.0, n=32):
    c, s = math.cos(rot), math.sin(rot)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts


class Cv:
    """Холст с суперсэмплингом; координаты — в итоговых пикселях."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def _p(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def poly(self, pts, fill=None, line=None, lw=1.0):
        self.d.polygon(self._p(pts), fill=fill)
        if line:
            self.d.line(self._p(list(pts) + [pts[0]]), fill=line, width=max(1, int(lw * SS)), joint='curve')

    def ell(self, cx, cy, rx, ry, fill=None, line=None, lw=1.0, rot=0.0):
        self.poly(ell_pts(cx, cy, rx, ry, rot), fill, line, lw)

    def rect(self, x0, y0, x1, y1, fill=None, line=None, lw=1.0, r=0):
        if x1 < x0: x0, x1 = x1, x0
        if y1 < y0: y0, y1 = y1, y0
        box = [x0 * SS, y0 * SS, x1 * SS, y1 * SS]
        wd = max(1, int(lw * SS)) if line else 0
        if r > 0:
            self.d.rounded_rectangle(box, radius=r * SS, fill=fill, outline=line, width=wd)
        else:
            self.d.rectangle(box, fill=fill, outline=line, width=wd)

    def line(self, pts, fill, w=1.0):
        self.d.line(self._p(pts), fill=fill, width=max(1, int(w * SS)), joint='curve')

    def limb(self, p0, p1, w, fill, line=None):
        if line:
            self._cap(p0, p1, w + 1.5, line)
        self._cap(p0, p1, w, fill)

    def _cap(self, p0, p1, w, fill):
        self.line([p0, p1], fill, w)
        for p in (p0, p1):
            self.ell(p[0], p[1], w / 2, w / 2, fill)

    def done(self):
        return self.im.resize((self.w, self.h), Image.LANCZOS)


# ───────────────────────── ЛЮДИ (вид сверху, лицом на восток) ─────────────────────────
SKINS = [(246, 210, 180), (234, 188, 152), (212, 162, 122), (182, 130, 94), (142, 98, 68), (106, 72, 52)]
HAIRC = [(28, 22, 20), (52, 34, 22), (86, 58, 32), (140, 100, 50), (198, 162, 92), (150, 50, 32), (122, 122, 126), (214, 214, 218)]
TOPC = [(180, 52, 52), (52, 96, 170), (60, 140, 88), (214, 170, 50), (122, 72, 152), (222, 222, 226), (50, 50, 58),
        (198, 112, 50), (70, 150, 160), (162, 62, 112), (102, 112, 62), (232, 142, 162), (120, 140, 190)]
PANTC = [(40, 44, 60), (60, 70, 98), (82, 66, 50), (30, 30, 34), (112, 112, 118), (72, 92, 72), (132, 102, 72)]


def person_dead(cv, cx, cy, sp, S):
    skin, top, pants, shoes, hair = sp['skin'], sp['top'], sp['pants'], sp['shoes'], sp['hair']
    ol = lambda c: shade(c, .42)
    bw = sp.get('build', 1.0)
    # ноги вразброс
    cv.limb((cx - 5 * S, cy - 1), (cx - 16 * S, cy - 6 * S), 6 * S, pants, ol(pants))
    cv.limb((cx - 5 * S, cy + 1), (cx - 15 * S, cy + 7 * S), 6 * S, pants, ol(pants))
    cv.ell(cx - 18 * S, cy - 7 * S, 4 * S, 3 * S, fill=shoes, rot=.5)
    cv.ell(cx - 17 * S, cy + 8 * S, 4 * S, 3 * S, fill=shoes, rot=-.5)
    # руки в стороны
    cv.limb((cx + 1, cy - 8 * S), (cx + 7 * S, cy - 17 * S * bw), 5 * S, top, ol(top))
    cv.limb((cx + 1, cy + 8 * S), (cx + 3 * S, cy + 18 * S * bw), 5 * S, top, ol(top))
    cv.ell(cx + 8 * S, cy - 18 * S * bw, 2.6 * S, 2.6 * S, fill=skin)
    cv.ell(cx + 3 * S, cy + 19 * S * bw, 2.6 * S, 2.6 * S, fill=skin)
    cv.ell(cx, cy, 6.8 * S, 11 * S * bw, fill=top, line=ol(top), rot=.15)
    cv.ell(cx + 8 * S, cy + 2 * S, 6.2 * S, 6.2 * S, fill=skin, line=shade(skin, .55), lw=.9)
    cv.ell(cx + 7 * S, cy + 2 * S, 6.2 * S, 6.0 * S, fill=hair if sp.get('hairstyle') != 'bald' else skin)


def head(cv, hxc, cy, sp, S, sway=0.0):
    skin, hair, top = sp['skin'], sp['hair'], sp['top']
    style, hat = sp.get('hairstyle', 'short'), sp.get('hat')
    R = 6.5 * S
    ol = lambda c: shade(c, .45)
    if sp.get('detail') == 'hoodie' and hat != 'hoodup':
        cv.ell(hxc - 5 * S, cy, 5.5 * S, 8 * S, fill=shade(top, .82), line=ol(top), lw=.8)
    if style in ('long', 'longwave'):
        cv.ell(hxc - 4.5 * S, cy + sway * .8, 8.5 * S, 10.5 * S, fill=hair, line=ol(hair), lw=.8)
        for sg in (-1, 1):
            cv.ell(hxc - 8.5 * S, cy + sg * 9.5 * S + sway * .5, 6.5 * S, 3.4 * S, fill=hair, line=ol(hair), lw=.6, rot=sg * .5)
    if style == 'ponytail':
        cv.ell(hxc - 10.5 * S, cy + sway * 2.0, 6 * S, 2.8 * S, fill=hair, line=ol(hair), lw=.8, rot=sway * .25)
        cv.ell(hxc - 5.8 * S, cy, 1.4 * S, 1.4 * S, fill=(205, 60, 72))
    if hat == 'hoodup':
        cv.poly([(hxc + 6 * S, cy - 8 * S), (hxc - 3 * S, cy - 11 * S), (hxc - 15 * S, cy), (hxc - 3 * S, cy + 11 * S),
                 (hxc + 6 * S, cy + 8 * S)], fill=shade(top, .9), line=ol(top), lw=.9)
    cv.ell(hxc, cy, R, R * 1.02, fill=skin, line=shade(skin, .55), lw=.9)
    for sg in (-1, 1):
        cv.ell(hxc - .3 * S, cy + sg * (R - .2 * S), 1.6 * S, 2.0 * S, fill=shade(skin, .92))
    cv.ell(hxc + R - .6 * S, cy, 1.7 * S, 1.5 * S, fill=shade(skin, .93))
    if style in ('short', 'ponytail', 'bun', 'side'):
        cv.ell(hxc - 1.4 * S, cy, R * .97, R * 1.0, fill=hair, line=ol(hair), lw=.7)
        if style == 'side':
            cv.line([(hxc + 3.5 * S, cy - 5 * S), (hxc + 1 * S, cy + 2 * S)], shade(hair, 1.45), .9)
        if style == 'bun':
            cv.ell(hxc - 5.2 * S, cy, 3.6 * S, 3.6 * S, fill=hair, line=ol(hair), lw=.7)
    elif style == 'buzz':
        cv.ell(hxc - .8 * S, cy, R * .97, R * 1.0, fill=mix(skin, hair, .72))
    elif style in ('long', 'longwave'):
        cv.ell(hxc - 2.2 * S, cy, R * .98, R * 1.02, fill=hair, line=ol(hair), lw=.7)
        cv.line([(hxc + 4 * S, cy - 1 * S), (hxc - 3 * S, cy - 4 * S)], shade(hair, 1.4), .8)
    elif style == 'curly':
        for i in range(10):
            a = 2 * math.pi * i / 10
            cv.ell(hxc - 1 * S + math.cos(a) * 5.2 * S, cy + math.sin(a) * 5.4 * S, 3.1 * S, 3.1 * S, fill=hair, line=ol(hair), lw=.5)
        cv.ell(hxc - 1 * S, cy, 5.4 * S, 5.4 * S, fill=hair)
    elif style == 'bald':
        cv.ell(hxc - 1 * S, cy - 1.5 * S, 2.6 * S, 1.8 * S, fill=shade(skin, 1.08))
    # головные уборы
    if hat == 'cap':
        c = sp.get('hatc', top)
        cv.ell(hxc - .6 * S, cy, 7.7 * S, 7.9 * S, fill=c, line=ol(c), lw=.9)
        cv.rect(hxc + 4 * S, cy - 5.2 * S, hxc + 12 * S, cy + 5.2 * S, fill=shade(c, .7), line=ol(c), lw=.8, r=3 * S)
        cv.ell(hxc - .6 * S, cy, 1.4 * S, 1.4 * S, fill=shade(c, 1.35))
    elif hat == 'beanie':
        c = sp.get('hatc', (214, 112, 40))
        cv.ell(hxc - .8 * S, cy, 8 * S, 8.2 * S, fill=c, line=ol(c), lw=.9)
        cv.ell(hxc - .8 * S, cy, 6.4 * S, 6.6 * S, line=shade(c, .72), lw=.8)
        cv.ell(hxc - 1.5 * S, cy, 1.9 * S, 1.9 * S, fill=shade(c, 1.3))
    elif hat == 'scarf':
        c = sp.get('hatc', (150, 60, 70))
        cv.ell(hxc - 1.2 * S, cy, 7.9 * S, 8.1 * S, fill=c, line=ol(c), lw=.9)
        cv.ell(hxc - 9 * S, cy, 2.8 * S, 3.4 * S, fill=shade(c, .85), line=ol(c), lw=.7)
        cv.line([(hxc + 2 * S, cy - 5 * S), (hxc - 5 * S, cy + 1 * S)], shade(c, 1.3), .9)
    elif hat == 'brim':
        c = sp.get('hatc', (226, 200, 140))
        cv.ell(hxc, cy, 11.8 * S, 11.8 * S, fill=c, line=ol(c), lw=.9)
        cv.ell(hxc, cy, 6.2 * S, 6.2 * S, fill=shade(c, .88), line=ol(c), lw=.7)
    elif hat == 'band':
        c = sp.get('hatc', (240, 240, 240))
        cv.line([(hxc + 1 * S, cy - 6.1 * S), (hxc + 1 * S, cy + 6.1 * S)], c, 2.0)
    elif hat == 'copcap':
        c = (30, 48, 98)
        cv.ell(hxc - .6 * S, cy, 7.8 * S, 8.0 * S, fill=c, line=ol(c), lw=.9)
        cv.rect(hxc + 4 * S, cy - 5 * S, hxc + 11.5 * S, cy + 5 * S, fill=(14, 18, 30), r=3 * S)
        cv.ell(hxc + 1.2 * S, cy, 1.6 * S, 1.6 * S, fill=(232, 200, 70))


def person(cv, cx, cy, sp, ph=0.0, stride=0.0, punch=0.0, aim=0.0, lean=0.0, breathe=0.0, sc=1.0, dead=False):
    S = sc
    if dead:
        return person_dead(cv, cx, cy, sp, S)
    skin, top, trim, pants, shoes = sp['skin'], sp['top'], sp['trim'], sp['pants'], sp['shoes']
    ol = lambda c: shade(c, .42)
    bw = sp.get('build', 1.0)
    sh = 11.0 * bw * S * (1 + breathe * .025)
    s1 = math.sin(ph) * stride
    # ноги (вид сверху: ступни выходят вперёд/назад из-под корпуса)
    for sg in (-1, 1):
        off = 9.0 * S * s1 * (-sg) + (1.2 * S if stride == 0 else 0)
        fy = cy + sg * 4.4 * S
        fx = cx - .5 * S + off
        cv.limb((cx - 1 * S, fy), (fx, fy), 6.0 * S, pants, ol(pants))
        cv.ell(fx + 2.2 * S, fy, 4.6 * S, 3.3 * S, fill=shoes, line=ol(shoes), lw=.8)
    # руки
    hands = []
    for sg in (-1, 1):
        off = 9.0 * S * s1 * (-sg)
        hx_ = cx - off * .85 + 1.2 * S
        hy_ = cy + sg * (sh + 1.4 * S - (1.2 * S if stride > .8 else 0))
        if punch > 0:
            if sg == 1:
                hx_, hy_ = cx + (8 + 14 * punch) * S, cy + (7 - 3.5 * punch) * S
            else:
                hx_, hy_ = cx + 5 * S, cy - 8 * S
        if aim > 0:
            hx_, hy_ = cx + (12 + 2 * sg) * S, cy + sg * 1.6 * S
        hands.append((sg, hx_, hy_))
    twist = .14 * math.sin(ph) * stride + punch * .25
    for sg, hx_, hy_ in hands:
        cv.limb((cx, cy + sg * (sh - 2 * S)), (hx_, hy_), 5.2 * S, top, ol(top))
        cv.ell(hx_ + 1 * S, hy_, 2.7 * S, 2.7 * S, fill=skin, line=shade(skin, .55), lw=.6)
        if sp.get('detail') == 'stripes' and not aim and not punch:
            mx, my = (cx + hx_) / 2, (cy + sg * (sh - 2 * S) + hy_) / 2
            cv.line([(mx, my - 2.4 * S), (mx, my + 2.4 * S)], trim, 1.5)
    if aim > 0:
        gx = cx + 12 * S
        cv.rect(gx, cy - 1.8 * S, gx + 11 * S, cy + 1.8 * S, fill=(36, 38, 44), line=(10, 10, 12), lw=.7, r=1)
        cv.rect(gx + 8 * S, cy - 1.0 * S, gx + 11 * S, cy + 1.0 * S, fill=(90, 92, 100))
    # сумка через плечо
    if sp.get('bag') == 'handbag':
        cv.line([(cx - 1 * S, cy - sh + 2 * S), (cx, cy + sh - 1 * S)], sp.get('bagc', (120, 70, 40)), 1.3)
        cv.rect(cx - 3.5 * S, cy + sh + 1.2 * S, cx + 3.5 * S, cy + sh + 7 * S, fill=sp.get('bagc', (120, 70, 40)),
                line=ol(sp.get('bagc', (120, 70, 40))), lw=.8, r=1.5 * S)
    # корпус
    cv.ell(cx - .5 * S, cy, 6.4 * S, sh, fill=top, line=ol(top), lw=1.0, rot=twist)
    cv.line([(cx - 5 * S, cy), (cx + 4 * S, cy)], shade(top, .72), .8)
    if sp.get('detail') == 'collar' or sp.get('detail') == 'stripes':
        cv.ell(cx + 1.6 * S, cy, 5.4 * S, 5.8 * S, fill=trim, line=ol(trim), lw=.7)
    if sp.get('detail') == 'stripes':
        for dx in (-2.5, 2.0):
            cv.line([(cx + dx * S, cy - sh + 1.5 * S), (cx + dx * S, cy + sh - 1.5 * S)], trim, 1.2)
    if sp.get('bag') == 'backpack':
        bc = sp.get('bagc', (70, 90, 60))
        cv.rect(cx - 10.5 * S, cy - 6.4 * S, cx - 2.5 * S, cy + 6.4 * S, fill=bc, line=ol(bc), lw=.9, r=2 * S)
        cv.line([(cx - 8 * S, cy - 4 * S), (cx - 4 * S, cy - 4 * S)], shade(bc, 1.3), .8)
    head(cv, cx + (1.8 + lean * 1.6) * S, cy + math.sin(ph) * stride * .6, sp, S, sway=-math.sin(ph) * stride)


# ───────────────────────── ГЕРОИ ─────────────────────────
HEROES = {
    'viktor': dict(skin=(232, 184, 152), hair=(42, 26, 10), top=(42, 74, 138), trim=(228, 222, 150), pants=(26, 42, 74),
                   shoes=(26, 26, 30), build=1.05, hairstyle='side', hat='cap', hatc=(52, 52, 60), detail='stripes'),
    'marina': dict(skin=(240, 200, 168), hair=(74, 32, 16), top=(138, 42, 90), trim=(250, 214, 226), pants=(58, 26, 42),
                   shoes=(36, 22, 28), build=.84, hairstyle='ponytail', detail='collar'),
    'igor': dict(skin=(212, 168, 120), hair=(26, 26, 26), top=(80, 82, 88), trim=(180, 180, 186), pants=(42, 42, 46),
                 shoes=(20, 20, 20), build=1.3, hairstyle='buzz', detail='hoodie'),
    'lena': dict(skin=(240, 208, 176), hair=(138, 96, 48), top=(42, 106, 90), trim=(236, 232, 214), pants=(26, 58, 58),
                 shoes=(60, 36, 30), build=.88, hairstyle='long', detail='collar', bag='handbag', bagc=(120, 78, 40)),
    'ruslan': dict(skin=(200, 152, 104), hair=(26, 10, 10), top=(106, 58, 26), trim=(214, 160, 64), pants=(58, 42, 26),
                   shoes=(30, 22, 16), build=1.12, hairstyle='curly', hat='beanie', hatc=(216, 116, 36), detail='zip'),
    'sofia': dict(skin=(232, 192, 160), hair=(26, 26, 30), top=(58, 42, 90), trim=(180, 150, 230), pants=(26, 26, 42),
                  shoes=(22, 20, 30), build=.86, hairstyle='short', hat='hoodup', detail='zip'),
}

ANIMS = [('idle', 4), ('walk', 8), ('run', 8), ('punch', 4), ('aim', 2), ('dead', 1)]


def hero_frame(sp, anim, i, n):
    cv = Cv(FRAME, FRAME)
    c = FRAME / 2
    if anim == 'idle':
        person(cv, c, c, sp, ph=0, stride=0, breathe=math.sin(2 * math.pi * i / n))
    elif anim == 'walk':
        person(cv, c, c, sp, ph=2 * math.pi * i / n, stride=.62)
    elif anim == 'run':
        person(cv, c, c, sp, ph=2 * math.pi * i / n, stride=1.0, lean=1.0)
    elif anim == 'punch':
        person(cv, c, c, sp, punch=[.35, 1.0, .75, .2][i], stride=0)
    elif anim == 'aim':
        person(cv, c - 2, c, sp, aim=1.0 if i == 0 else .9, stride=0, lean=0.4 * i)
    elif anim == 'dead':
        person(cv, c, c, sp, dead=True)
    return cv.done()


def make_heroes():
    man = {}
    for hid, sp in HEROES.items():
        cols = max(n for _, n in ANIMS)
        sheet = Image.new('RGBA', (cols * FRAME, len(ANIMS) * FRAME), (0, 0, 0, 0))
        rows = {}
        for r, (anim, n) in enumerate(ANIMS):
            rows[anim] = [r, n]
            for i in range(n):
                sheet.paste(hero_frame(sp, anim, i, n), (i * FRAME, r * FRAME))
        fn = 'hero_%s.png' % hid
        sheet.save(os.path.join(OUT, fn))
        man[hid] = dict(file=fn, rows=rows)
        # портрет
        pc = Cv(160, 160)
        pc.ell(80, 84, 66, 66, fill=(30, 36, 58, 255))
        pc.ell(80, 84, 66, 66, line=(255, 204, 0, 255), lw=2)
        pc.ell(82, 90, 46, 46, fill=(0, 0, 0, 70))
        person(pc, 80, 82, sp, ph=0, stride=0, sc=2.35)
        # портрет: персонаж лицом «вверх» (читается как вид на героя сверху)
        pimg = pc.done()
        bg = Image.new('RGBA', (160, 160), (16, 20, 34, 255))
        bd = ImageDraw.Draw(bg)
        for k in range(0, 160, 16):
            bd.line([(k, 0), (k, 160)], fill=(26, 34, 56, 255))
            bd.line([(0, k), (160, k)], fill=(26, 34, 56, 255))
        bg.alpha_composite(pimg.rotate(90, resample=Image.BICUBIC))
        bg.save(os.path.join(OUT, 'ui', 'portrait_%s.png' % hid))
    MAN['heroes'] = man


# ───────────────────────── ПРОХОЖИЕ ─────────────────────────
def make_npcs(n=40, seed=7):
    rng = random.Random(seed)
    variants = []
    for i in range(n):
        female = rng.random() < .5
        age = rng.choices(['young', 'adult', 'senior'], [.34, .46, .2])[0]
        skin = rng.choice(SKINS)
        if age == 'senior':
            hair = rng.choice([HAIRC[6], HAIRC[7], HAIRC[6], HAIRC[1]])
        else:
            hair = rng.choice(HAIRC[:6])
        if female:
            style = rng.choice(['long', 'longwave', 'ponytail', 'bun', 'short', 'curly'])
            build = rng.uniform(.82, .96)
        else:
            style = rng.choice(['short', 'short', 'buzz', 'bald', 'curly', 'side'])
            build = rng.uniform(.98, 1.22)
        if age == 'young':
            top = rng.choice(TOPC)
        elif age == 'adult':
            top = shade(rng.choice(TOPC), rng.uniform(.62, .95))
        else:
            top = shade(rng.choice(TOPC), rng.uniform(.55, .8))
        sp = dict(skin=skin, hair=hair, hairstyle=style, top=top, pants=rng.choice(PANTC), shoes=shade(rng.choice(PANTC), .6),
                  trim=mix(top, (240, 240, 240), .55), build=build, detail=rng.choice(['zip', 'collar', 'stripes', 'hoodie', 'zip']))
        hatr = rng.random()
        if age == 'senior':
            if female and hatr < .55:
                sp['hat'] = 'scarf'; sp['hatc'] = rng.choice([(150, 60, 70), (70, 100, 140), (170, 150, 90)])
            elif not female and hatr < .45:
                sp['hat'] = 'cap'; sp['hatc'] = rng.choice([(84, 78, 70), (60, 66, 80)])
            sp['detail'] = 'zip'
        else:
            if hatr < .13 and not female:
                sp['hat'] = 'cap'; sp['hatc'] = rng.choice(TOPC)
            elif hatr < .22:
                sp['hat'] = 'beanie'; sp['hatc'] = rng.choice(TOPC)
            elif hatr < .30 and female:
                sp['hat'] = 'brim'
            elif hatr < .36 and age == 'young':
                sp['hat'] = 'band'
        br = rng.random()
        if br < .3 and age != 'senior':
            sp['bag'] = 'backpack'; sp['bagc'] = rng.choice([(70, 90, 60), (60, 60, 70), (150, 70, 50), (60, 90, 140)])
        elif br < .55 and female:
            sp['bag'] = 'handbag'; sp['bagc'] = rng.choice([(120, 78, 40), (30, 30, 34), (170, 50, 60)])
        scale = {'young': .98, 'adult': 1.0, 'senior': .95}[age]
        if sp.get('detail') == 'hoodie' and sp.get('hat') in ('scarf', 'brim'):
            sp['detail'] = 'zip'
        variants.append(dict(sp=sp, gender='f' if female else 'm', age=age, scale=scale, role='civ'))
    # полицейские
    cop_m = dict(skin=(226, 180, 146), hair=(40, 30, 24), top=(40, 62, 120), trim=(232, 232, 240), pants=(24, 30, 52), shoes=(14, 14, 16),
                 build=1.12, hairstyle='short', hat='copcap', detail='stripes')
    cop_f = dict(cop_m, skin=(240, 200, 168), hair=(74, 40, 20), build=.9, hairstyle='ponytail')
    variants.append(dict(sp=cop_m, gender='m', age='adult', scale=1.0, role='cop'))
    variants.append(dict(sp=cop_f, gender='f', age='adult', scale=1.0, role='cop'))
    cols = 2 + 6 + 6
    sheet = Image.new('RGBA', (cols * FRAME, len(variants) * FRAME), (0, 0, 0, 0))
    c = FRAME / 2
    meta = []
    for r, v in enumerate(variants):
        sp = v['sp']
        frames = []
        cv = Cv(FRAME, FRAME); person(cv, c, c, sp, stride=0); frames.append(cv.done())
        cv = Cv(FRAME, FRAME); person(cv, c, c, sp, dead=True); frames.append(cv.done())
        for k in range(6):
            cv = Cv(FRAME, FRAME); person(cv, c, c, sp, ph=2 * math.pi * k / 6, stride=.6); frames.append(cv.done())
        for k in range(6):
            cv = Cv(FRAME, FRAME); person(cv, c, c, sp, ph=2 * math.pi * k / 6, stride=1.0, lean=1.0); frames.append(cv.done())
        for k, f in enumerate(frames):
            sheet.paste(f, (k * FRAME, r * FRAME))
        meta.append(dict(gender=v['gender'], age=v['age'], scale=v['scale'], role=v['role']))
    sheet.save(os.path.join(OUT, 'npcs.png'))
    MAN['npcs'] = dict(file='npcs.png', variants=meta, layout=dict(idle=[0, 1], dead=[1, 1], walk=[2, 6], run=[8, 6]))


# ───────────────────────── ТРАНСПОРТ (вид сверху, носом на восток) ─────────────────────────
PAL = dict(red='#c8282d', blue='#2f5fa8', white='#e6e8ea', black='#2a2c30', silver='#a9b0b8', green='#2f7d4f', yellow='#e2b52a',
           orange='#d9702a', teal='#2e8c88', brown='#7a5234', purple='#6d3f8c', gray='#6c727a', olive='#5a6a3a')
CARS = {
    'sedan':     dict(l=4.5, w=2.2, colors=['blue', 'silver', 'white', 'black', 'red', 'green', 'gray', 'teal'], fw=.79, wl=14, wt=6),
    'sport':     dict(l=4.3, w=2.1, colors=['red', 'yellow', 'blue', 'white', 'black', 'orange'], fw=.78, wl=14, wt=7),
    'taxi':      dict(l=4.6, w=2.2, colors=['yellow'], fw=.79, wl=14, wt=6),
    'van':       dict(l=5.2, w=2.3, colors=['white', 'gray', 'blue', 'red', 'silver'], fw=.83, wl=15, wt=6.5),
    'truck':     dict(l=7.0, w=2.5, colors=['green', 'blue', 'orange'], fw=.9, wl=17, wt=7),
    'police':    dict(l=4.6, w=2.2, colors=['white'], fw=.79, wl=14, wt=6),
    'bus':       dict(l=9.0, w=2.6, colors=['orange', 'blue', 'red'], fw=.9, wl=18, wt=7),
    'suv':       dict(l=4.8, w=2.3, colors=['green', 'black', 'white', 'silver', 'brown', 'blue'], fw=.8, wl=16, wt=7),
    'muscle':    dict(l=4.7, w=2.2, colors=['red', 'black', 'blue', 'orange', 'white'], fw=.79, wl=15, wt=7),
    'compact':   dict(l=3.6, w=1.9, colors=['teal', 'yellow', 'red', 'white', 'purple', 'orange', 'blue', 'green'], fw=.78, wl=12, wt=5.5),
    'tank':      dict(l=6.5, w=3.2, colors=['olive'], fw=0, wl=0, wt=0),
    'moto':      dict(l=2.2, w=.8, colors=['black', 'red', 'blue', 'silver'], fw=0, wl=0, wt=0),
    'fire':      dict(l=7.5, w=2.5, colors=['red'], fw=.9, wl=17, wt=7),
    'ambulance': dict(l=5.5, w=2.3, colors=['white'], fw=.82, wl=15, wt=6.5),
}
CARS.update(EX.CARS_EXTRA)
PAL.update(dict(darkgray='#44484e'))
PAD = 6


def car_base(L, W, body, c0, c1, roof=None, glass=(36, 54, 76), rad=.3, wheel_x=.19, mirrors=True, rear_w=14):
    cv = Cv(L + 2 * PAD, W + 2 * PAD)
    x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
    ol = shade(body, .35)
    wx = x0 + L * wheel_x
    for yy in (y0 - 1.6, y1 - 4.4):
        cv.rect(wx - rear_w / 2, yy, wx + rear_w / 2, yy + 6, fill=(22, 22, 24), r=2.5)
    cv.rect(x0, y0, x1, y1, fill=body, line=ol, lw=1.3, r=W * rad)
    cv.rect(x0 + 3, y0 + W * .2, x1 - 3, y1 - W * .2, fill=shade(body, 1.1), r=W * .18)
    gx0, gx1 = x0 + L * c0, x0 + L * c1
    cv.rect(gx0, y0 + W * .12, gx1, y1 - W * .12, fill=glass, line=shade(glass, .5), lw=.8, r=W * .14)
    cv.line([(gx1 - 4, y0 + W * .2), (gx1 - 9, y0 + W * .5)], (120, 150, 180), 1.2)
    roof = roof or shade(body, 1.06)
    cv.rect(gx0 + L * .08, y0 + W * .2, gx1 - L * .10, y1 - W * .2, fill=roof, line=shade(roof, .6), lw=.8, r=W * .08)
    for yy in (y0 + W * .17, y1 - W * .17):
        cv.ell(x1 - 2.6, yy, 2.6, 3.4, fill=(255, 244, 190), line=(150, 130, 70), lw=.6)
        cv.ell(x0 + 2.2, yy, 2.0, 3.2, fill=(204, 28, 40), line=(90, 10, 16), lw=.6)
    if mirrors:
        for yy in (y0 - 1.6, y1 + 1.6):
            cv.ell(gx1 - L * .02, yy, 2.6, 1.7, fill=shade(body, .7))
    return cv, (x0, y0, x1, y1, gx0, gx1)


def car_sprite(kind, color):
    sp = CARS[kind]
    L, W = int(round(sp['l'] * CAR_PPU)), int(round(sp['w'] * CAR_PPU))
    body = hexc(PAL[color])
    if kind in ('sedan', 'taxi', 'police'):
        cv, (x0, y0, x1, y1, gx0, gx1) = car_base(L, W, body, .27, .63)
        if kind == 'taxi':
            for k in range(0, int(L * .62), 8):
                for yy, c in ((y0 + 1.5, 0), (y1 - 4.5, 0)):
                    if (k // 8) % 2 == 0:
                        cv.rect(x0 + L * .18 + k, yy, x0 + L * .18 + k + 4, yy + 3, fill=(20, 20, 20))
            cx_ = (gx0 + gx1) / 2 - 3
            cv.rect(cx_ - 4, y0 + W * .5 - 8, cx_ + 4, y0 + W * .5 + 8, fill=(255, 238, 190), line=(30, 30, 30), lw=.8, r=2)
        if kind == 'police':
            cv.rect(x0 + 6, y0 + W * .31, x1 - 6, y0 + W * .31 + 3.4, fill=(30, 74, 176))
            cv.rect(x0 + 6, y1 - W * .31 - 3.4, x1 - 6, y1 - W * .31, fill=(30, 74, 176))
            cv.rect(x0 + L * .66, y0 + W * .38, x0 + L * .88, y1 - W * .38, fill=(28, 66, 160))
    elif kind == 'sport':
        cv, (x0, y0, x1, y1, gx0, gx1) = car_base(L, W, body, .33, .62, roof=shade(body, .8), rad=.34)
        cv.rect(x0 - 1, y0 + 5, x0 + 6, y1 - 5, fill=shade(body, .55), line=(10, 10, 12), lw=.8, r=1.5)
        for yy in (-3.6, 1.2):
            cv.rect(x0 + 8, y0 + W / 2 + yy, x1 - 6, y0 + W / 2 + yy + 2.4, fill=(236, 236, 240))
    elif kind == 'suv':
        cv, (x0, y0, x1, y1, gx0, gx1) = car_base(L, W, body, .24, .67, rad=.27)
        for yy in (y0 + W * .2, y1 - W * .2):
            cv.line([(gx0 + L * .1, yy), (gx1 - L * .13, yy)], (30, 30, 34), 1.8)
    elif kind == 'muscle':
        cv, (x0, y0, x1, y1, gx0, gx1) = car_base(L, W, body, .38, .67, rad=.26)
        sc = (24, 24, 26) if color in ('white', 'red', 'orange') else (236, 236, 240)
        for yy in (-5.5, 1.5):
            cv.rect(x0 + 3, y0 + W / 2 + yy, x1 - 3, y0 + W / 2 + yy + 4, fill=sc)
        cv.rect(x0 + L * .72, y0 + W * .36, x0 + L * .9, y1 - W * .36, fill=(20, 20, 22), r=2)
    elif kind == 'compact':
        cv, (x0, y0, x1, y1, gx0, gx1) = car_base(L, W, body, .22, .70, rad=.38, rear_w=12)
    elif kind == 'van':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in (x0 + L * .2, ):
            for yy in (y0 - 1.6, y1 - 4.4):
                cv.rect(xx - 7.5, yy, xx + 7.5, yy + 6, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0, x1, y1, fill=body, line=shade(body, .35), lw=1.3, r=W * .16)
        cv.rect(x0 + 3, y0 + 3, x0 + L * .72, y1 - 3, fill=shade(body, 1.07), line=shade(body, .7), lw=.8, r=3)
        for k in range(1, 6):
            cv.line([(x0 + L * .72 * k / 6, y0 + 4), (x0 + L * .72 * k / 6, y1 - 4)], shade(body, .85), .8)
        cv.rect(x0 + L * .76, y0 + W * .13, x0 + L * .93, y1 - W * .13, fill=(36, 54, 76), line=(18, 26, 38), lw=.8, r=4)
        cv.rect(x0 + L * .43, y0 + W * .4, x0 + L * .55, y1 - W * .4, fill=shade(body, .8), r=2)
        for yy in (y0 + W * .17, y1 - W * .17):
            cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190)); cv.ell(x0 + 2, yy, 2, 3.2, fill=(204, 28, 40))
        for yy in (y0 - 1.6, y1 + 1.6):
            cv.ell(x0 + L * .76, yy, 2.6, 1.7, fill=shade(body, .7))
    elif kind == 'truck':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in (x0 + L * .13, x0 + L * .27):
            for yy in (y0 - 1.6, y1 - 4.8):
                cv.rect(xx - 8, yy, xx + 8, yy + 6.4, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0 + 2, x0 + L * .72, y1 - 2, fill=(60, 62, 66), line=(20, 20, 22), lw=1.2, r=2)
        tarp = shade(body, .8)
        cv.rect(x0 + 3, y0 + 5, x0 + L * .70, y1 - 5, fill=tarp, line=shade(tarp, .55), lw=.9, r=4)
        for k in range(1, 8):
            cv.line([(x0 + 3 + (L * .67) * k / 8, y0 + 6), (x0 + 3 + (L * .67) * k / 8, y1 - 6)], shade(tarp, .72), 1.0)
        cv.rect(x0 + L * .73, y0, x1, y1, fill=body, line=shade(body, .35), lw=1.3, r=W * .22)
        cv.rect(x0 + L * .85, y0 + W * .13, x0 + L * .97, y1 - W * .13, fill=(36, 54, 76), line=(18, 26, 38), lw=.8, r=4)
        cv.rect(x0 + L * .76, y0 + W * .2, x0 + L * .84, y1 - W * .2, fill=shade(body, 1.12), r=2)
        for yy in (y0 + W * .17, y1 - W * .17):
            cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190)); cv.ell(x0 + 2, yy, 2, 3.2, fill=(204, 28, 40))
    elif kind == 'bus':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in (x0 + L * .2, x0 + L * .38):
            for yy in (y0 - 1.6, y1 - 4.8):
                cv.rect(xx - 9, yy, xx + 9, yy + 6.4, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0, x1, y1, fill=body, line=shade(body, .35), lw=1.4, r=W * .16)
        cv.rect(x0 + 4, y0 + 4, x1 - 4, y1 - 4, fill=shade(body, 1.14), line=shade(body, .7), lw=.8, r=3)
        for xx in (x0 + L * .25, x0 + L * .55):
            cv.rect(xx, y0 + W * .32, xx + 16, y1 - W * .32, fill=(205, 210, 216), line=(90, 94, 100), lw=.8, r=2)
            cv.line([(xx + 8, y0 + W * .32), (xx + 8, y1 - W * .32)], (110, 114, 120), .8)
        for k in range(10):
            xx = x0 + 10 + k * (L - 36) / 10
            for yy in (y0 + 1.6, y1 - 5.6):
                cv.rect(xx, yy, xx + (L - 36) / 10 - 2, yy + 4, fill=(36, 54, 76))
        cv.rect(x0 + L * .9, y0 + W * .1, x1 - 1.5, y1 - W * .1, fill=(36, 54, 76), line=(18, 26, 38), lw=.8, r=5)
        for yy in (y0 + W * .17, y1 - W * .17):
            cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190)); cv.ell(x0 + 2, yy, 2, 3.2, fill=(204, 28, 40))
    elif kind in ('fire', 'ambulance'):
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in ((x0 + L * .14, x0 + L * .28) if kind == 'fire' else (x0 + L * .2,)):
            for yy in (y0 - 1.6, y1 - 4.8):
                cv.rect(xx - 8, yy, xx + 8, yy + 6.4, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0, x1, y1, fill=body, line=shade(body, .35), lw=1.3, r=W * .18)
        cv.rect(x0 + 3, y0 + 3, x0 + L * .74, y1 - 3, fill=shade(body, 1.06), line=shade(body, .7), lw=.8, r=3)
        cv.rect(x0 + L * .76, y0 + W * .13, x0 + L * .93, y1 - W * .13, fill=(36, 54, 76), line=(18, 26, 38), lw=.8, r=4)
        if kind == 'fire':
            for yy in (-6, 6):
                cv.rect(x0 + 8, y0 + W / 2 + yy - 1.5, x0 + L * .72, y0 + W / 2 + yy + 1.5, fill=(190, 192, 196), line=(90, 92, 96), lw=.6)
            for k in range(1, 22):
                xx = x0 + 8 + (L * .72 - 8) * k / 22
                cv.line([(xx, y0 + W / 2 - 6), (xx, y0 + W / 2 + 6)], (150, 152, 156), .8)
            cv.rect(x0 + 4, y0 + 2, x1 - 4, y0 + 5, fill=(240, 240, 240)); cv.rect(x0 + 4, y1 - 5, x1 - 4, y1 - 2, fill=(240, 240, 240))
        else:
            cv.rect(x0 + 4, y0 + W * .33, x0 + L * .72, y0 + W * .33 + 4, fill=(210, 40, 44)); cv.rect(x0 + 4, y1 - W * .33 - 4, x0 + L * .72, y1 - W * .33, fill=(210, 40, 44))
            cx_, cy_ = x0 + L * .38, y0 + W / 2
            cv.rect(cx_ - 3.5, cy_ - 11, cx_ + 3.5, cy_ + 11, fill=(214, 36, 42)); cv.rect(cx_ - 11, cy_ - 3.5, cx_ + 11, cy_ + 3.5, fill=(214, 36, 42))
        for yy in (y0 + W * .17, y1 - W * .17):
            cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190)); cv.ell(x0 + 2, yy, 2, 3.2, fill=(204, 28, 40))
    elif kind == 'tank':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        hull = L - 30
        for yy in (y0, y1 - 15):
            cv.rect(x0, yy, x0 + hull, yy + 15, fill=(34, 36, 32), line=(12, 12, 10), lw=1.2, r=6)
            for k in range(0, int(hull) - 6, 6):
                cv.line([(x0 + 4 + k, yy + 1), (x0 + 4 + k, yy + 14)], (70, 72, 64), 1.2)
        cv.poly([(x0 + 4, y0 + 10), (x0 + hull - 6, y0 + 10), (x0 + hull + 2, y0 + W * .38), (x0 + hull + 2, y1 - W * .38), (x0 + hull - 6, y1 - 10), (x0 + 4, y1 - 10)],
                fill=body, line=shade(body, .4), lw=1.3)
        cv.rect(x0 + 8, y0 + W * .28, x0 + 22, y1 - W * .28, fill=shade(body, .78), r=2)
        tx, ty = x0 + hull * .5, y0 + W / 2
        cv.rect(tx, ty - 3.2, x1 - 2, ty + 3.2, fill=shade(body, .62), line=(12, 14, 10), lw=1.0, r=1.5)
        cv.rect(x1 - 8, ty - 4.6, x1 - 2, ty + 4.6, fill=(30, 32, 28), r=1)
        cv.ell(tx, ty, 17, 15, fill=shade(body, 1.12), line=shade(body, .4), lw=1.3)
        cv.ell(tx - 3, ty, 7, 7, fill=shade(body, .82), line=shade(body, .4), lw=1.0)
        cv.ell(tx - 10, ty - 8, 3, 3, fill=(30, 32, 28))
    elif kind == 'moto':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        cy_ = y0 + W / 2
        cv.ell(x0 + 8, cy_, 8, 2.6, fill=(18, 18, 20)); cv.ell(x1 - 6, cy_, 8, 2.6, fill=(18, 18, 20))
        cv.line([(x0 + 8, cy_), (x1 - 8, cy_)], (60, 62, 68), 3)
        cv.ell(x0 + L * .55, cy_, 9, 4.6, fill=body, line=shade(body, .4), lw=.9)
        cv.ell(x0 + L * .35, cy_, 6, 3.4, fill=(36, 34, 36), line=(12, 12, 12), lw=.8)
        cv.line([(x1 - 11, cy_ - 7.5), (x1 - 11, cy_ + 7.5)], (180, 182, 190), 2.0)
        cv.ell(x1 - 3, cy_, 2.4, 2.6, fill=(255, 244, 190))
        cv.ell(x0 + 1.5, cy_, 1.6, 2.0, fill=(204, 28, 40))
    else:
        return EX.car_sprite_extra(sys.modules[__name__], kind, color, sp)
    return cv.done()


def shelf_pack(items, width=2048, gap=2):
    """items: list of (key, PIL image). Возвращает (sheet, {key:(x,y,w,h)})."""
    items = sorted(items, key=lambda kv: -kv[1].height)
    x = y = rowh = 0
    pos = {}
    for k, im in items:
        if x + im.width + gap > width:
            x, y, rowh = 0, y + rowh + gap, 0
        pos[k] = (x, y, im.width, im.height)
        x += im.width + gap
        rowh = max(rowh, im.height)
    sheet = Image.new('RGBA', (width, y + rowh + gap), (0, 0, 0, 0))
    for k, im in items:
        sheet.paste(im, pos[k][:2])
    return sheet, pos


def make_vehicles():
    items = []
    for kind, sp in CARS.items():
        for ci, col in enumerate(sp['colors']):
            items.append(((kind, ci), car_sprite(kind, col)))
    sheet, pos = shelf_pack(items)
    sheet.save(os.path.join(OUT, 'vehicles.png'))
    man = {}
    for kind, sp in CARS.items():
        man[kind] = dict(l=sp['l'], w=sp['w'], fw=sp['fw'], wl=sp['wl'], wt=sp['wt'], pad=PAD,
                         colors=[dict(name=c, rect=list(pos[(kind, i)])) for i, c in enumerate(sp['colors'])])
    MAN['vehicles'] = dict(file='vehicles.png', ppu=CAR_PPU, types=man)


# ───────────────────────── ТАЙЛЫ ─────────────────────────
def tnoise(size, seed, cells=(4, 8, 16), amps=(1, .6, .35)):
    rng = np.random.default_rng(seed)
    acc = np.zeros((size, size), np.float32)
    for c, a in zip(cells, amps):
        g = rng.random((c, c)).astype(np.float32)
        t = np.tile(g, (3, 3))
        im = Image.fromarray((t * 255).astype(np.uint8)).resize((size * 3, size * 3), Image.BICUBIC)
        acc += np.asarray(im, dtype=np.float32)[size:2 * size, size:2 * size] / 255 * a
    return acc / sum(amps)


def tile_base(base, var, seed, speck=6, cells=(3, 6, 12), amps=(1, .7, .4)):
    n = tnoise(TILE, seed, cells, amps)
    rng = np.random.default_rng(seed + 99)
    sp = (rng.random((TILE, TILE)).astype(np.float32) - .5) * speck * 2
    arr = np.zeros((TILE, TILE, 4), np.float32)
    arr[:, :, 3] = 255
    for k in range(3):
        arr[:, :, k] = base[k] + (n - .5) * var * 2 + sp
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')


def wrap_line(d, pts, fill, w=1):
    for ox in (-TILE, 0, TILE):
        for oy in (-TILE, 0, TILE):
            d.line([(x + ox, y + oy) for x, y in pts], fill=fill, width=w)


def make_tiles():
    T = {}
    rng = random.Random(5)
    # асфальт
    im = tile_base((58, 60, 66), 7, 11, speck=7); d = ImageDraw.Draw(im)
    for _ in range(3):
        x, y = rng.randint(0, 63), rng.randint(0, 63)
        pts = [(x, y)]
        for _ in range(5):
            x += rng.randint(-8, 8); y += rng.randint(2, 9); pts.append((x, y))
        wrap_line(d, pts, (36, 38, 42, 255), 1)
    for _ in range(14):
        x, y = rng.randint(0, 63), rng.randint(0, 63)
        d.point((x, y), fill=(98, 100, 106, 255))
    T['asphalt'] = im
    T['parking'] = tile_base((74, 76, 82), 6, 12, speck=6)
    # тротуар (плиты 1x1 ед.)
    im = tile_base((178, 174, 166), 5, 13, speck=4); d = ImageDraw.Draw(im)
    arr = np.asarray(im).astype(np.int16)
    for sx in range(4):
        for sy in range(4):
            dv = rng.randint(-7, 7)
            arr[sy * 16:(sy + 1) * 16, sx * 16:(sx + 1) * 16, :3] += dv
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA'); d = ImageDraw.Draw(im)
    for k in range(0, 64, 16):
        d.line([(k, 0), (k, 63)], fill=(132, 128, 122, 255)); d.line([(0, k), (63, k)], fill=(132, 128, 122, 255))
        d.line([(k + 1, 0), (k + 1, 63)], fill=(196, 192, 184, 255)); d.line([(0, k + 1), (63, k + 1)], fill=(196, 192, 184, 255))
    T['sidewalk'] = im
    # трава
    for nm, base, sd in (('grass', (84, 130, 62), 21), ('grass2', (96, 138, 66), 22)):
        im = tile_base(base, 12, sd, speck=9, cells=(2, 5, 10)); d = ImageDraw.Draw(im)
        for _ in range(60):
            x, y = rng.randint(0, 63), rng.randint(0, 63)
            c = (58, 100, 44, 255) if rng.random() < .5 else (118, 162, 80, 255)
            wrap_line(d, [(x, y), (x + rng.randint(-1, 1), y - rng.randint(1, 3))], c, 1)
        T[nm] = im
    T['concrete'] = tile_base((150, 150, 146), 8, 31, speck=5)
    d = ImageDraw.Draw(T['concrete'])
    for k in (0, 32):
        wrap_line(d, [(k, 0), (k, 63)], (112, 112, 108, 255)); wrap_line(d, [(0, k), (63, k)], (112, 112, 108, 255))
    T['gravel'] = tile_base((124, 116, 104), 9, 32, speck=22, cells=(4, 8, 16))
    T['dirt'] = tile_base((112, 90, 64), 11, 33, speck=10)
    T['ballast'] = tile_base((100, 94, 88), 8, 34, speck=24, cells=(4, 8, 16))
    # брусчатка площади
    im = tile_base((178, 160, 134), 5, 35, speck=3); d = ImageDraw.Draw(im)
    for r in range(8):
        off = 8 if r % 2 else 0
        y = r * 8
        d.line([(0, y), (63, y)], fill=(130, 116, 96, 255))
        for x in range(off, 64 + 16, 16):
            d.line([(x % 64, y), (x % 64, y + 7)], fill=(130, 116, 96, 255))
            c = rng.randint(-10, 10)
            d.rectangle([(x + 1) % 64, y + 1, min(63, (x + 1) % 64 + 13), y + 6], fill=(178 + c, 160 + c, 134 + c, 255)) if (x + 1) % 64 < 50 else None
    T['plaza'] = im
    # крыши
    im = tile_base((98, 102, 108), 7, 41, speck=6); d = ImageDraw.Draw(im)
    for _ in range(5):
        x, y = rng.randint(0, 50), rng.randint(0, 50)
        d.rectangle([x, y, x + rng.randint(6, 12), y + rng.randint(6, 12)], fill=(88, 92, 98, 255))
    T['roof_tar'] = im
    for nm, col, sd in (('roof_red', (156, 74, 54), 42), ('roof_brown', (112, 86, 66), 43), ('roof_slate', (88, 96, 112), 44)):
        im = tile_base(col, 8, sd, speck=5); d = ImageDraw.Draw(im)
        for r in range(0, 64, 6):
            d.line([(0, r), (63, r)], fill=shade(col, .62) + (255,), width=1)
            off = 4 if (r // 6) % 2 else 0
            for x in range(off, 64, 8):
                d.line([(x, r), (x, min(63, r + 5))], fill=shade(col, .78) + (255,))
        T[nm] = im
    im = tile_base((78, 94, 114), 5, 45, speck=4); d = ImageDraw.Draw(im)
    for x in range(0, 64, 8):
        d.line([(x, 0), (x, 63)], fill=(52, 64, 82, 255), width=1); d.line([(x + 1, 0), (x + 1, 63)], fill=(110, 128, 150, 255), width=1)
    T['roof_metal'] = im
    T['roof_light'] = tile_base((176, 176, 172), 6, 46, speck=9, cells=(4, 8, 16))
    T['roof_green'] = tile_base((92, 124, 84), 8, 47, speck=8)
    # вода
    im = tile_base((38, 96, 146), 10, 51, speck=3, cells=(2, 4, 8)); d = ImageDraw.Draw(im)
    for r in range(6):
        y0_ = r * 11 + 3
        pts = [(x, y0_ + math.sin((x / 64) * 2 * math.pi * 2 + r) * 2.2) for x in range(0, 65, 4)]
        d.line(pts, fill=(104, 170, 214, 110), width=1)
    T['water'] = im
    ov = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for _ in range(22):
        x, y = rng.randint(0, 63), rng.randint(0, 63)
        ln = rng.randint(3, 8)
        wrap_line(d, [(x, y), (x + ln, y)], (230, 244, 255, rng.randint(60, 130)), 1)
    T['ripple'] = ov
    T.update(EX.extra_tiles(sys.modules[__name__]))
    names = list(T.keys())
    cols = 8
    sheet = Image.new('RGBA', (cols * TILE, ((len(names) + cols - 1) // cols) * TILE), (0, 0, 0, 0))
    idx = {}
    for i, n in enumerate(names):
        sheet.paste(T[n], ((i % cols) * TILE, (i // cols) * TILE)); idx[n] = i
    sheet.save(os.path.join(OUT, 'tiles.png'))
    MAN['tiles'] = dict(file='tiles.png', size=TILE, cols=cols, index=idx, ppu=16)


# ───────────────────────── ПРОПЫ ─────────────────────────
def tree_img(px, base, seed, lumps=9):
    cv = Cv(px, px); c = px / 2; rng = random.Random(seed)
    cv.ell(c, c, c * .97, c * .97, fill=shade(base, .52))
    for i in range(lumps):
        a = 2 * math.pi * i / lumps + rng.random() * .5
        r = c * .52
        cv.ell(c + math.cos(a) * r, c + math.sin(a) * r, c * (.42 + rng.random() * .12), c * (.42 + rng.random() * .12), fill=shade(base, .74 + rng.random() * .18))
    for i in range(lumps - 2):
        a = 2 * math.pi * i / (lumps - 2) + rng.random() * .6
        r = c * .26
        cv.ell(c + math.cos(a) * r, c + math.sin(a) * r, c * (.36 + rng.random() * .1), c * (.36 + rng.random() * .1), fill=shade(base, .92 + rng.random() * .2))
    cv.ell(c * .82, c * .8, c * .3, c * .26, fill=shade(base, 1.28))
    return cv.done()


def pine_img(px, base):
    cv = Cv(px, px); c = px / 2
    pts = [(c + math.cos(math.pi * i / 8) * (c * .96 if i % 2 == 0 else c * .52), c + math.sin(math.pi * i / 8) * (c * .96 if i % 2 == 0 else c * .52)) for i in range(16)]
    cv.poly(pts, fill=shade(base, .62), line=shade(base, .4), lw=1)
    pts2 = [(c + math.cos(math.pi * i / 8 + .2) * (c * .66 if i % 2 == 0 else c * .34), c + math.sin(math.pi * i / 8 + .2) * (c * .66 if i % 2 == 0 else c * .34)) for i in range(16)]
    cv.poly(pts2, fill=shade(base, .92))
    cv.ell(c * .86, c * .84, c * .2, c * .18, fill=shade(base, 1.25))
    return cv.done()


def wicon(wid, w=96, h=48):
    cv = Cv(w, h); out = (14, 14, 18)
    lite, mid, dark = (228, 230, 236), (150, 154, 164), (58, 62, 72)
    if wid == 'fists':
        for (x, y) in ((30, 28), (60, 20)):
            cv.ell(x, y, 15, 12, fill=(236, 190, 156), line=(110, 70, 50), lw=1.4)
            for k in range(4):
                cv.line([(x + 5, y - 8 + k * 5), (x + 12, y - 8 + k * 5)], (150, 100, 76), 1.2)
    elif wid == 'bat':
        cv.poly([(14, 40), (18, 43), (80, 14), (76, 8)], fill=(176, 130, 76), line=(70, 44, 20), lw=1.4)
        cv.line([(22, 39), (76, 13)], (214, 170, 110), 1.2)
        cv.ell(14, 41, 4, 4, fill=(90, 60, 30), line=(40, 26, 12), lw=1)
    elif wid == 'pistol':
        cv.rect(22, 12, 74, 25, fill=mid, line=out, lw=1.6, r=2)
        cv.rect(22, 12, 74, 16, fill=lite, r=2)
        cv.poly([(26, 25), (42, 25), (38, 44), (24, 44)], fill=dark, line=out, lw=1.6)
        cv.ell(46, 29, 6, 5, line=out, lw=1.6)
        cv.rect(74, 15, 82, 22, fill=dark, line=out, lw=1.4)
    elif wid == 'smg':
        cv.rect(12, 14, 74, 26, fill=mid, line=out, lw=1.6, r=2)
        cv.rect(12, 14, 74, 18, fill=lite, r=2)
        cv.rect(34, 26, 44, 46, fill=dark, line=out, lw=1.6)
        cv.rect(54, 26, 60, 36, fill=dark, line=out, lw=1.4)
        cv.rect(74, 17, 90, 23, fill=dark, line=out, lw=1.4)
        cv.poly([(12, 16), (4, 18), (4, 30), (14, 26)], fill=dark, line=out, lw=1.4)
    elif wid == 'shotgun':
        cv.rect(8, 15, 90, 21, fill=mid, line=out, lw=1.5, r=2)
        cv.rect(8, 22, 90, 26, fill=dark, line=out, lw=1.2, r=2)
        cv.rect(42, 22, 62, 31, fill=(150, 100, 56), line=out, lw=1.5, r=2)
        cv.poly([(60, 15), (86, 16), (92, 28), (64, 30)], fill=(170, 118, 66), line=out, lw=1.5)
    elif wid == 'special':
        cv.rect(14, 12, 70, 32, fill=(70, 100, 208), line=out, lw=1.6, r=9)
        cv.rect(14, 12, 70, 18, fill=(120, 150, 240), r=6)
        cv.ell(34, 22, 6, 6, fill=(120, 240, 255), line=(20, 80, 100), lw=1.4)
        cv.rect(70, 16, 90, 28, fill=(120, 240, 255), line=out, lw=1.4, r=3)
        cv.poly([(26, 32), (40, 32), (36, 44), (26, 44)], fill=dark, line=out, lw=1.5)
    return cv.done()


def radial(px, color, power=1.8):
    y, x = np.mgrid[0:px, 0:px].astype(np.float32)
    d = np.sqrt((x - px / 2) ** 2 + (y - px / 2) ** 2) / (px / 2)
    a = np.clip(1 - d, 0, 1) ** power
    arr = np.zeros((px, px, 4), np.uint8)
    arr[:, :, 0], arr[:, :, 1], arr[:, :, 2] = color
    arr[:, :, 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def make_props():
    P = {}   # name -> (img, ppu)
    pp = 16
    P['tree_oak'] = (tree_img(120, (70, 128, 56), 1), pp)
    P['tree_oak2'] = (tree_img(104, (58, 112, 60), 2), pp)
    P['tree_birch'] = (tree_img(88, (126, 164, 66), 3, 8), pp)
    P['tree_maple'] = (tree_img(96, (190, 98, 44), 4), pp)
    P['tree_pine'] = (pine_img(80, (40, 96, 62)), pp)
    P['bush'] = (tree_img(38, (66, 122, 52), 5, 6), pp)
    P['bush2'] = (tree_img(34, (90, 138, 58), 6, 6), pp)
    # лавка / урна / гидрант / фонарь
    cv = Cv(40, 15); cv.rect(1, 1, 39, 14, fill=(84, 60, 40), line=(34, 24, 14), lw=1, r=2)
    for k in range(3, 14, 3):
        cv.line([(2, k), (38, k)], (120, 90, 58), 1)
    P['bench'] = (cv.done(), pp)
    cv = Cv(14, 14); cv.ell(7, 7, 6, 6, fill=(54, 84, 62), line=(20, 34, 24), lw=1); cv.ell(7, 7, 3.6, 3.6, fill=(26, 40, 30))
    P['bin'] = (cv.done(), pp)
    cv = Cv(12, 12); cv.ell(6, 6, 5, 5, fill=(200, 44, 36), line=(80, 14, 12), lw=1); cv.ell(6, 6, 2, 2, fill=(236, 200, 60))
    P['hydrant'] = (cv.done(), pp)
    cv = Cv(14, 14); cv.ell(7, 7, 5.5, 5.5, fill=(88, 92, 98), line=(24, 26, 30), lw=1.2); cv.ell(7, 7, 2.4, 2.4, fill=(230, 226, 190))
    P['lamp'] = (cv.done(), pp)
    cv = Cv(18, 18); cv.ell(9, 9, 8, 8, fill=(84, 86, 92), line=(34, 36, 40), lw=1)
    for k in range(-5, 6, 3):
        cv.line([(4, 9 + k), (14, 9 + k)], (60, 62, 68), 1)
    P['manhole'] = (cv.done(), pp)
    # фонтан
    cv = Cv(136, 136); c = 68
    cv.ell(c, c, 66, 66, fill=(170, 168, 160), line=(80, 78, 72), lw=2); cv.ell(c, c, 58, 58, fill=(138, 136, 128), line=(80, 78, 72), lw=1.4)
    cv.ell(c, c, 52, 52, fill=(62, 128, 184), line=(30, 80, 120), lw=1.4)
    for r in (40, 28, 16):
        cv.ell(c, c, r, r, line=(150, 206, 240), lw=1.2)
    cv.ell(c, c, 11, 11, fill=(190, 188, 180), line=(80, 78, 72), lw=1.4); cv.ell(c, c, 6, 6, fill=(220, 240, 255))
    P['fountain'] = (cv.done(), pp)
    # крышные объекты
    cv = Cv(36, 30); cv.rect(1, 1, 35, 29, fill=(168, 172, 178), line=(60, 64, 70), lw=1.2, r=2); cv.ell(18, 15, 10, 10, fill=(60, 64, 70), line=(30, 32, 36), lw=1)
    for a in range(0, 360, 60):
        cv.line([(18, 15), (18 + 9 * math.cos(math.radians(a)), 15 + 9 * math.sin(math.radians(a)))], (150, 154, 160), 1.6)
    P['ac'] = (cv.done(), pp)
    cv = Cv(16, 16); cv.ell(8, 8, 7, 7, fill=(150, 154, 160), line=(50, 54, 60), lw=1.2); cv.ell(8, 8, 4, 4, fill=(60, 64, 70))
    P['vent'] = (cv.done(), pp)
    cv = Cv(50, 34); cv.rect(1, 1, 49, 33, fill=(150, 154, 160), line=(50, 54, 60), lw=1.2, r=2); cv.rect(4, 4, 46, 30, fill=(122, 176, 206), line=(60, 90, 110), lw=1)
    for k in (15, 26, 37):
        cv.line([(k, 4), (k, 30)], (170, 206, 226), 1)
    cv.line([(4, 17), (46, 17)], (170, 206, 226), 1); cv.line([(12, 6), (22, 14)], (230, 244, 252), 1.4)
    P['skylight'] = (cv.done(), pp)
    cv = Cv(60, 60); c = 30; cv.ell(c, c, 29, 29, fill=(124, 92, 60), line=(50, 36, 22), lw=1.4)
    for r in (22, 14):
        cv.ell(c, c, r, r, line=(84, 60, 38), lw=1.2)
    cv.ell(c, c, 6, 6, fill=(90, 66, 42))
    P['watertank'] = (cv.done(), pp)
    cv = Cv(200, 200); c = 100
    cv.rect(2, 2, 198, 198, fill=(48, 52, 58), line=(240, 240, 240), lw=3, r=10); cv.ell(c, c, 74, 74, line=(244, 204, 40), lw=5)
    cv.line([(70, 60), (70, 140)], (244, 204, 40), 9); cv.line([(130, 60), (130, 140)], (244, 204, 40), 9); cv.line([(70, 100), (130, 100)], (244, 204, 40), 9)
    P['helipad'] = (cv.done(), pp)
    cv = Cv(100, 52); cv.rect(1, 1, 99, 51, fill=(40, 70, 130), line=(180, 186, 196), lw=1.6)
    for k in range(1, 6):
        cv.line([(k * 100 / 6, 1), (k * 100 / 6, 51)], (130, 160, 210), 1)
    for k in range(1, 3):
        cv.line([(1, k * 52 / 3), (99, k * 52 / 3)], (130, 160, 210), 1)
    P['solar'] = (cv.done(), pp)
    cv = Cv(36, 36); c = 18; cv.ell(c, c, 17, 17, fill=(150, 76, 60), line=(60, 28, 22), lw=1.4); cv.ell(c, c, 10, 10, fill=(40, 36, 36), line=(20, 18, 18), lw=1)
    P['chimney'] = (cv.done(), pp)
    cv = Cv(56, 56); c = 28; cv.ell(c, c, 27, 27, fill=(190, 190, 194), line=(70, 70, 76), lw=1.6)
    for r, col in ((20, (200, 60, 52)), (13, (235, 235, 238)), (7, (60, 60, 66))):
        cv.ell(c, c, r, r, fill=col)
    P['stack'] = (cv.done(), pp)
    cv = Cv(176, 176); c = 88; cv.ell(c, c, 86, 86, fill=(170, 174, 180), line=(60, 64, 70), lw=2); cv.ell(c, c, 74, 74, fill=(196, 200, 206), line=(110, 114, 120), lw=1.4)
    cv.ell(c, c, 22, 22, fill=(150, 154, 160), line=(70, 74, 80), lw=1.4); cv.line([(c, c - 74), (c, c + 74)], (120, 124, 130), 3); cv.ell(c + 40, c - 30, 7, 7, fill=(120, 124, 130))
    P['silo'] = (cv.done(), pp)
    for i, (nm, col) in enumerate((('red', (190, 56, 44)), ('blue', (48, 92, 168)), ('green', (56, 128, 84)), ('orange', (214, 130, 44)), ('gray', (120, 126, 134)), ('yellow', (214, 180, 50)))):
        cv = Cv(96, 38); cv.rect(1, 1, 95, 37, fill=col, line=shade(col, .4), lw=1.4, r=1)
        for k in range(4, 92, 5):
            cv.line([(k, 3), (k, 35)], shade(col, .8), 1)
        cv.rect(1, 1, 5, 37, fill=shade(col, .7)); cv.rect(91, 1, 95, 37, fill=shade(col, .7))
        P['container_' + nm] = (cv.done(), pp)
    cv = Cv(24, 24); cv.rect(1, 1, 23, 23, fill=(160, 120, 70), line=(70, 46, 24), lw=1.2); cv.line([(2, 2), (22, 22)], (110, 78, 44), 1.4); cv.line([(22, 2), (2, 22)], (110, 78, 44), 1.4)
    P['crate'] = (cv.done(), pp)
    cv = Cv(16, 16); cv.ell(8, 8, 7, 7, fill=(70, 100, 130), line=(24, 36, 50), lw=1.2); cv.ell(8, 8, 4.4, 4.4, line=(120, 150, 180), lw=1)
    P['barrel'] = (cv.done(), pp)
    cv = Cv(10, 10); cv.ell(5, 5, 4.4, 4.4, fill=(236, 120, 36), line=(120, 50, 10), lw=.8); cv.ell(5, 5, 2.2, 2.2, fill=(240, 240, 240))
    P['cone'] = (cv.done(), pp)
    cv = Cv(84, 8)
    for k in range(0, 84, 10):
        cv.rect(k, 1, min(84, k + 5), 7, fill=(216, 40, 40) if (k // 10) % 2 == 0 else (240, 240, 240))
    cv.rect(0, 1, 84, 7, line=(30, 30, 30), lw=1)
    P['gate'] = (cv.done(), pp)
    cv = Cv(56, 26); cv.rect(1, 1, 55, 25, fill=(70, 120, 58), line=(30, 60, 24), lw=1.2, r=4)
    rr = random.Random(9)
    for _ in range(26):
        x, y = rr.randint(4, 52), rr.randint(4, 22)
        cv.ell(x, y, 2, 2, fill=rr.choice([(240, 90, 120), (250, 214, 70), (240, 240, 244), (180, 100, 220)]))
    P['flowers'] = (cv.done(), pp)
    cv = Cv(64, 64); cv.rect(1, 1, 63, 63, fill=(120, 90, 56), line=(60, 40, 22), lw=1.6); cv.rect(5, 5, 59, 59, fill=(222, 196, 140), line=(170, 140, 90), lw=1)
    P['sandbox'] = (cv.done(), pp)
    cv = Cv(34, 34); c = 17; cv.ell(c, c, 15, 15, fill=(60, 64, 70), line=(20, 22, 26), lw=1.4); cv.ell(c, c, 9, 9, fill=(210, 60, 52)); cv.ell(c - 3, c - 3, 3, 3, fill=(250, 150, 140))
    P['sign_stop'] = (cv.done(), pp)
    # пикеапы
    P['pk_glow'] = (radial(96, (255, 232, 120)), pp)
    P['pk_glow_blue'] = (radial(96, (110, 220, 255)), pp)
    P['pk_glow_red'] = (radial(96, (255, 120, 110)), pp)
    for wid in ('bat', 'pistol', 'smg', 'shotgun', 'special'):
        ic = wicon(wid).resize((60, 30), Image.LANCZOS)
        cv = Image.new('RGBA', (60, 30), (0, 0, 0, 0)); cv.alpha_composite(ic)
        P['pk_' + wid] = (cv, pp)
    hc = Cv(44, 44); hc.rect(2, 2, 42, 42, fill=(244, 244, 246), line=(40, 40, 46), lw=2, r=8)
    hc.rect(18, 8, 26, 36, fill=(210, 40, 44)); hc.rect(8, 18, 36, 26, fill=(210, 40, 44))
    P['pk_health'] = (hc.done(), pp)
    cb = Cv(40, 24); cb.rect(1, 1, 39, 23, fill=(96, 168, 90), line=(30, 80, 30), lw=1.4, r=2)
    cb.ell(20, 12, 7, 7, fill=(60, 130, 60), line=(24, 70, 24), lw=1.2); cb.line([(20, 7), (20, 17)], (230, 250, 220), 1.6)
    P['pk_cash'] = (cb.done(), pp)
    P.update(EX.extra_props(sys.modules[__name__]))
    items = [(k, v[0]) for k, v in P.items()]
    sheet, pos = shelf_pack(items, 1024)
    sheet.save(os.path.join(OUT, 'props.png'))
    MAN['props'] = dict(file='props.png', items={k: dict(rect=list(pos[k]), ppu=P[k][1]) for k in P})
    for wid in ('fists', 'bat', 'pistol', 'smg', 'shotgun', 'special'):
        wicon(wid).save(os.path.join(OUT, 'ui', 'w_%s.png' % wid))


def make_interior():
    S = EX.make_interior(sys.modules[__name__])
    sheet, pos = shelf_pack(list(S.items()), 1024)
    sheet.save(os.path.join(OUT, 'interior.png'))
    MAN['interior'] = dict(file='interior.png', cell=EX.IT, ppu=16, items={k: list(v) for k, v in pos.items()})


def main():
    make_heroes(); print('heroes ok')
    make_npcs(); print('npcs ok')
    make_vehicles(); print('vehicles ok')
    make_tiles(); print('tiles ok')
    make_props(); print('props ok')
    make_interior(); print('interior ok')
    MAN['units'] = dict(ped=PED_UNITS, frame=FRAME)
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(MAN, f, ensure_ascii=False, indent=1)
    print('manifest written ->', OUT)


if __name__ == '__main__':
    main()
