"""Дополнительные ассеты расширения RetroCity (новые районы, порт, аэропорт, армия, ферма, интерьеры).
Подключается из make_assets.py (передаётся модуль M с Cv, shade, tile_base и т.д.)."""
import math, random
from PIL import Image, ImageDraw


# ───────────────────────── ТАЙЛЫ ─────────────────────────
def extra_tiles(M):
    T = {}
    rng = random.Random(901)
    tb = M.tile_base

    def furrows(base, dark, seed, horiz=True, step=8):
        im = tb(base, 8, seed, speck=7); d = ImageDraw.Draw(im)
        for k in range(0, 64, step):
            d.line([(0, k), (63, k)] if horiz else [(k, 0), (k, 63)], fill=dark + (255,), width=2)
        return im
    T['field_green'] = furrows((96, 150, 64), (70, 118, 50), 701)
    T['field_gold'] = furrows((206, 178, 82), (170, 140, 56), 702, horiz=False)
    T['field_plow'] = furrows((120, 88, 58), (86, 60, 40), 703)
    T['lawn_rich'] = tb((106, 162, 74), 7, 704, speck=7, cells=(2, 5, 10))
    # взлётная полоса и перрон
    im = tb((54, 56, 60), 5, 705, speck=6); d = ImageDraw.Draw(im)
    for _ in range(3):
        x, y = rng.randint(0, 63), rng.randint(0, 63); d.line([(x, y), (x + rng.randint(-6, 6), y + rng.randint(3, 9))], fill=(34, 36, 40, 255))
    T['runway'] = im
    T['apron'] = tb((172, 172, 164), 6, 706, speck=6)
    d = ImageDraw.Draw(T['apron'])
    for k in (0, 32): d.line([(k, 0), (k, 63)], fill=(130, 130, 124, 255)); d.line([(0, k), (63, k)], fill=(130, 130, 124, 255))
    T['sand'] = tb((216, 198, 148), 8, 707, speck=10)
    im = tb((118, 124, 130), 5, 708, speck=5); d = ImageDraw.Draw(im)
    for k in (0, 31): d.line([(k, 0), (k, 63)], fill=(78, 82, 88, 255)); d.line([(0, k), (63, k)], fill=(78, 82, 88, 255))
    d.rectangle([0, 0, 63, 3], fill=(226, 200, 60, 255)) if False else None
    T['quay'] = im
    im = tb((70, 160, 204), 6, 709, speck=3, cells=(2, 4, 8)); d = ImageDraw.Draw(im)
    for k in range(0, 64, 16): d.line([(k, 0), (k, 63)], fill=(210, 236, 248, 255)); d.line([(0, k), (63, k)], fill=(210, 236, 248, 255))
    T['pool'] = im
    im = tb((92, 100, 84), 5, 710, speck=6); d = ImageDraw.Draw(im)
    for k in (0, 32): d.line([(k, 0), (k, 63)], fill=(62, 70, 56, 255)); d.line([(0, k), (63, k)], fill=(62, 70, 56, 255))
    T['military_pad'] = im
    im = tb((150, 84, 64), 6, 711, speck=4); d = ImageDraw.Draw(im)
    for r in range(8):
        off = 8 if r % 2 else 0; y = r * 8
        d.line([(0, y), (63, y)], fill=(104, 56, 42, 255))
        for x in range(off, 72, 16): d.line([(x % 64, y), (x % 64, y + 7)], fill=(104, 56, 42, 255))
    T['brick'] = im
    im = tb((226, 222, 212), 3, 712, speck=3); d = ImageDraw.Draw(im)
    for sx in range(0, 64, 32):
        for sy in range(0, 64, 32):
            if ((sx + sy) // 32) % 2 == 0: d.rectangle([sx, sy, sx + 31, sy + 31], fill=(214, 210, 200, 255))
    for k in (0, 32): d.line([(k, 0), (k, 63)], fill=(176, 172, 164, 255)); d.line([(0, k), (63, k)], fill=(176, 172, 164, 255))
    T['tile_mall'] = im
    T['water_deep'] = tb((26, 76, 128), 8, 713, speck=3, cells=(2, 4, 8))
    d = ImageDraw.Draw(T['water_deep'])
    for r in range(6):
        y0 = r * 11 + 3; pts = [(x, y0 + math.sin((x / 64) * 4 * math.pi + r) * 2.2) for x in range(0, 65, 4)]
        d.line(pts, fill=(90, 150, 200, 100), width=1)
    T['dirt_road'] = tb((140, 112, 80), 9, 714, speck=14)
    T['asphalt_new'] = tb((46, 48, 54), 6, 715, speck=6)
    return T


# ───────────────────────── ПРОПЫ ─────────────────────────
def extra_props(M):
    Cv, shade = M.Cv, M.shade
    P = {}; pp = 16

    # остановка
    cv = Cv(64, 26); cv.rect(1, 1, 63, 25, fill=(96, 116, 138, 200), line=(40, 50, 62), lw=1.2, r=2)
    cv.rect(5, 12, 59, 21, fill=(120, 84, 52), line=(60, 40, 24), lw=1, r=1)
    for x in (4, 31, 59): cv.rect(x - 1, 1, x + 1, 25, fill=(60, 66, 74))
    P['busstop'] = (cv.done(), pp)
    # столик кафе с зонтом / без
    cv = Cv(44, 44); cv.ell(22, 22, 8, 8, fill=(236, 232, 220), line=(90, 86, 76), lw=1.2)
    for a in (0.6, 3.1, 4.9): cv.ell(22 + math.cos(a) * 15, 22 + math.sin(a) * 15, 4.5, 4.5, fill=(150, 98, 60), line=(70, 44, 26), lw=1)
    P['cafe_table'] = (cv.done(), pp)
    for nm, c1, c2 in (('umbrella_red', (214, 56, 52), (240, 232, 226)), ('umbrella_blue', (52, 98, 190), (240, 232, 226))):
        cv = Cv(76, 76)
        for i in range(8):
            a0, a1 = i * math.pi / 4, (i + 1) * math.pi / 4
            cv.poly([(38, 38), (38 + math.cos(a0) * 36, 38 + math.sin(a0) * 36), (38 + math.cos(a1) * 36, 38 + math.sin(a1) * 36)], fill=c1 if i % 2 == 0 else c2)
        cv.ell(38, 38, 2.4, 2.4, fill=(60, 60, 66)); cv.ell(38, 38, 36, 36, line=(80, 40, 40), lw=1)
        P[nm] = (cv.done(), pp)
    # колонка АЗС
    cv = Cv(22, 12); cv.rect(1, 1, 21, 11, fill=(206, 54, 48), line=(80, 20, 18), lw=1, r=2); cv.rect(4, 3, 18, 9, fill=(236, 236, 230)); cv.ell(11, 6, 2, 2, fill=(40, 40, 44))
    P['pump'] = (cv.done(), pp)
    # фонтан
    cv = Cv(128, 128); c = 64
    cv.ell(c, c, 62, 62, fill=(168, 164, 154), line=(90, 86, 78), lw=2); cv.ell(c, c, 54, 54, fill=(70, 150, 200)); cv.ell(c, c, 38, 38, fill=(90, 170, 214), line=(190, 226, 244), lw=1.5)
    cv.ell(c, c, 14, 14, fill=(178, 174, 164), line=(90, 86, 78), lw=1.5)
    for k in range(10): a = k * 0.628; cv.ell(c + math.cos(a) * 25, c + math.sin(a) * 25, 3, 3, fill=(230, 246, 255))
    cv.ell(c, c, 6, 6, fill=(240, 250, 255))
    P['fountain'] = (cv.done(), pp)
    # статуя / клумба-памятник
    cv = Cv(40, 40); cv.rect(4, 4, 36, 36, fill=(150, 146, 138), line=(80, 76, 70), lw=1.4, r=3); cv.ell(20, 20, 9, 9, fill=(196, 150, 70), line=(100, 70, 24), lw=1.2); cv.ell(18, 18, 3, 3, fill=(240, 210, 130))
    P['monument'] = (cv.done(), pp)
    # порт: кран, корабли
    cv = Cv(200, 44)
    cv.rect(4, 14, 196, 30, fill=(236, 170, 40), line=(120, 80, 10), lw=1.4)
    for x in range(10, 192, 12): cv.line([(x, 14), (x + 6, 30)], (140, 96, 16), 1)
    cv.rect(2, 4, 22, 40, fill=(210, 150, 34), line=(110, 74, 10), lw=1.4); cv.rect(178, 4, 198, 40, fill=(210, 150, 34), line=(110, 74, 10), lw=1.4)
    cv.rect(96, 8, 112, 36, fill=(70, 74, 80), line=(20, 22, 24), lw=1.2); cv.rect(100, 12, 108, 32, fill=(230, 80, 60))
    P['crane'] = (cv.done(), pp)
    L, Wd = 520, 120
    cv = Cv(L, Wd)
    cv.poly([(4, 20), (L - 70, 8), (L - 4, Wd / 2), (L - 70, Wd - 8), (4, Wd - 20)], fill=(52, 62, 84), line=(20, 24, 34), lw=2)
    cv.poly([(14, 28), (L - 74, 18), (L - 22, Wd / 2), (L - 74, Wd - 18), (14, Wd - 28)], fill=(96, 70, 54), line=(50, 36, 28), lw=1.4)
    ccols = [(200, 60, 52), (52, 96, 170), (60, 140, 88), (220, 150, 50), (150, 150, 156), (226, 200, 60)]
    rr = random.Random(5)
    for gx in range(24, L - 190, 28):
        for gy in range(32, Wd - 40, 14):
            cv.rect(gx, gy, gx + 26, gy + 12, fill=rr.choice(ccols), line=(24, 24, 28), lw=.8)
    cv.rect(L - 140, 22, L - 84, Wd - 22, fill=(226, 226, 230), line=(90, 90, 96), lw=1.6, r=3)
    cv.rect(L - 124, 34, L - 96, Wd - 34, fill=(70, 100, 140), r=2)
    P['ship_cargo'] = (cv.done(), pp)
    cv = Cv(240, 64)
    cv.poly([(4, 14), (200, 6), (236, 32), (200, 58), (4, 50)], fill=(238, 238, 240), line=(60, 64, 70), lw=2)
    cv.poly([(14, 20), (190, 14), (222, 32), (190, 50), (14, 44)], fill=(190, 150, 98), line=(100, 76, 44), lw=1.2)
    cv.rect(60, 22, 120, 42, fill=(240, 240, 244), line=(80, 84, 90), lw=1.2, r=3); cv.rect(120, 25, 140, 39, fill=(66, 98, 140))
    P['ship_small'] = (cv.done(), pp)
    # аэропорт
    cv = Cv(420, 380); cx, cy = 210, 190
    cv.poly([(20, cy - 8), (300, cy - 8), (390, cy - 2), (410, cy), (390, cy + 2), (300, cy + 8), (20, cy + 8)], fill=(238, 240, 244), line=(110, 114, 120), lw=1.6)
    cv.ell(cx + 150, cy, 130, 15, fill=(244, 246, 250), line=(110, 114, 120), lw=1.6)
    cv.poly([(190, cy - 10), (250, 20), (300, 20), (250, cy - 6)], fill=(226, 228, 234), line=(110, 114, 120), lw=1.6)
    cv.poly([(190, cy + 10), (250, 360), (300, 360), (250, cy + 6)], fill=(226, 228, 234), line=(110, 114, 120), lw=1.6)
    cv.poly([(20, cy - 6), (60, 100), (96, 100), (74, cy - 6)], fill=(214, 70, 60), line=(110, 30, 24), lw=1.4)
    cv.poly([(20, cy + 6), (60, 280), (96, 280), (74, cy + 6)], fill=(214, 70, 60), line=(110, 30, 24), lw=1.4)
    for yy in (90, 290): cv.ell(240, yy, 26, 10, fill=(150, 154, 160), line=(70, 72, 78), lw=1.2)
    for k in range(18): cv.ell(112 + k * 8, cy, 1.6, 4, fill=(60, 90, 130))
    cv.rect(380, cy - 4, 405, cy + 4, fill=(60, 90, 130), r=3)
    P['plane_jet'] = (cv.done(), pp)
    cv = Cv(150, 130); cx, cy = 75, 65
    cv.ell(cx, cy, 52, 9, fill=(238, 238, 242), line=(90, 92, 100), lw=1.4)
    cv.rect(cx - 8, 6, cx + 16, 124, fill=(236, 236, 240), line=(90, 92, 100), lw=1.4, r=3)
    cv.rect(cx - 50, cy - 24, cx - 36, cy + 24, fill=(222, 224, 230), line=(90, 92, 100), lw=1.2, r=2)
    cv.rect(cx - 8, cy - 4, cx + 6, cy + 4, fill=(60, 100, 160), r=2)
    cv.ell(cx + 54, cy, 3, 14, fill=(130, 130, 136)); cv.rect(cx - 8, 6, cx - 2, 124, fill=(214, 60, 50))
    P['plane_small'] = (cv.done(), pp)
    cv = Cv(150, 150); cx, cy = 75, 75
    cv.ell(cx, cy, 36, 13, fill=(70, 92, 70), line=(26, 38, 26), lw=1.4)
    cv.rect(cx - 80 + 40, cy - 3, cx - 36, cy + 3, fill=(60, 80, 60)); cv.rect(cx - 70, cy - 8, cx - 56, cy + 8, fill=(80, 100, 80), line=(26, 38, 26), lw=1)
    cv.ell(cx + 18, cy, 10, 8, fill=(60, 110, 150), line=(24, 40, 60), lw=1)
    for a in (0.4, 1.97, 3.54, 5.11): cv.line([(cx, cy), (cx + math.cos(a) * 70, cy + math.sin(a) * 70)], (28, 30, 28, 230), 4)
    cv.ell(cx, cy, 70, 70, line=(200, 200, 200, 80), lw=1); cv.ell(cx, cy, 5, 5, fill=(150, 150, 156))
    P['heli'] = (cv.done(), pp)
    # военное имущество
    cv = Cv(90, 90); cv.ell(45, 45, 40, 40, fill=(190, 194, 198), line=(84, 88, 92), lw=2); cv.ell(45, 45, 30, 30, fill=(214, 218, 222), line=(120, 124, 130), lw=1.2)
    for a in range(0, 360, 45): cv.line([(45, 45), (45 + math.cos(math.radians(a)) * 30, 45 + math.sin(math.radians(a)) * 30)], (130, 134, 140), 1)
    cv.ell(45, 45, 6, 6, fill=(220, 60, 50), line=(100, 20, 16), lw=1)
    P['radar'] = (cv.done(), pp)
    cv = Cv(84, 58); cv.poly([(2, 54), (42, 4), (82, 54)], fill=(98, 112, 72), line=(44, 54, 30), lw=1.6); cv.line([(42, 4), (42, 54)], (60, 70, 42), 1.4)
    P['tent'] = (cv.done(), pp)
    cv = Cv(56, 14); cv.rect(1, 1, 55, 13, fill=(176, 156, 112), line=(100, 84, 52), lw=1.2, r=6)
    for x in range(6, 52, 10): cv.line([(x, 2), (x, 12)], (130, 112, 76), 1)
    P['sandbags'] = (cv.done(), pp)
    cv = Cv(64, 12); cv.rect(1, 1, 63, 11, fill=(236, 236, 236), line=(60, 60, 64), lw=1.2)
    for x in range(0, 64, 16): cv.poly([(x, 1), (x + 8, 1), (x + 14, 11), (x + 6, 11)], fill=(220, 50, 40))
    P['barrier'] = (cv.done(), pp)
    cv = Cv(64, 6); cv.line([(0, 3), (64, 3)], (120, 126, 134), 2)
    for x in range(0, 64, 8): cv.line([(x, 0), (x + 4, 6)], (150, 154, 160), 0.8); cv.line([(x + 4, 0), (x, 6)], (150, 154, 160), 0.8)
    for x in (2, 62): cv.rect(x - 1, 0, x + 1, 6, fill=(70, 74, 80))
    P['fence'] = (cv.done(), pp)
    cv = Cv(6, 64); cv.line([(3, 0), (3, 64)], (120, 126, 134), 2)
    for y in range(0, 64, 8): cv.line([(0, y), (6, y + 4)], (150, 154, 160), 0.8); cv.line([(6, y), (0, y + 4)], (150, 154, 160), 0.8)
    for y in (2, 62): cv.rect(0, y - 1, 6, y + 1, fill=(70, 74, 80))
    P['fence_v'] = (cv.done(), pp)
    # ферма
    cv = Cv(32, 20); cv.rect(1, 1, 31, 19, fill=(222, 190, 90), line=(130, 100, 30), lw=1.2, r=8)
    for x in range(5, 30, 5): cv.line([(x, 2), (x, 18)], (170, 138, 50), 1)
    P['hay'] = (cv.done(), pp)
    cv = Cv(120, 120)
    cv.ell(60, 60, 12, 12, fill=(186, 170, 140), line=(90, 78, 56), lw=1.6)
    for a in (0.5, 2.07, 3.64, 5.21): cv.poly([(60 + math.cos(a) * 10, 60 + math.sin(a) * 10), (60 + math.cos(a + .18) * 54, 60 + math.sin(a + .18) * 54), (60 + math.cos(a - .12) * 54, 60 + math.sin(a - .12) * 54)], fill=(236, 230, 214), line=(100, 90, 70), lw=1)
    cv.ell(60, 60, 5, 5, fill=(120, 60, 40))
    P['windmill'] = (cv.done(), pp)
    # вертолётная площадка
    cv = Cv(96, 96); cv.ell(48, 48, 46, 46, fill=(86, 92, 100), line=(240, 240, 240), lw=3); cv.rect(30, 26, 38, 70, fill=(240, 240, 240)); cv.rect(58, 26, 66, 70, fill=(240, 240, 240)); cv.rect(30, 44, 66, 52, fill=(240, 240, 240))
    P['helipad'] = (cv.done(), pp)
    # пикап в магазине / лежак / парасоль
    cv = Cv(26, 12); cv.rect(1, 1, 25, 11, fill=(236, 230, 214), line=(150, 140, 110), lw=1, r=4); cv.rect(1, 1, 7, 11, fill=(214, 90, 70), r=3)
    P['lounger'] = (cv.done(), pp)
    cv = Cv(48, 20); cv.rect(1, 1, 47, 19, fill=(248, 244, 236), line=(60, 60, 66), lw=1.2); cv.rect(4, 4, 44, 16, fill=(230, 60, 60)); cv.rect(8, 7, 40, 13, fill=(250, 240, 240))
    P['billboard'] = (cv.done(), pp)
    return P


# ───────────────────────── НОВЫЙ ТРАНСПОРТ ─────────────────────────
CARS_EXTRA = {
    'pickup':  dict(l=5.0, w=2.2, colors=['red', 'blue', 'white', 'green', 'brown'], fw=.8, wl=15, wt=7),
    'limo':    dict(l=6.2, w=2.1, colors=['black', 'white'], fw=.8, wl=14, wt=6),
    'swat':    dict(l=5.4, w=2.4, colors=['black'], fw=.83, wl=15, wt=6.5),
    'mailvan': dict(l=4.8, w=2.2, colors=['yellow'], fw=.82, wl=14, wt=6),
    'jeep':    dict(l=4.1, w=2.0, colors=['olive'], fw=.8, wl=14, wt=7),
    'mtruck':  dict(l=7.4, w=2.6, colors=['olive'], fw=.9, wl=17, wt=7),
    'apc':     dict(l=6.4, w=2.9, colors=['olive'], fw=.9, wl=14, wt=7),
}


def car_sprite_extra(M, kind, color, sp):
    Cv, shade, PAD = M.Cv, M.shade, M.PAD
    L, W = int(round(sp['l'] * M.CAR_PPU)), int(round(sp['w'] * M.CAR_PPU))
    body = M.hexc(M.PAL[color])
    if kind == 'pickup':
        cv, (x0, y0, x1, y1, gx0, gx1) = M.car_base(L, W, body, .42, .62, rad=.24)
        cv.rect(x0 + 4, y0 + 4, x0 + L * .38, y1 - 4, fill=shade(body, .62), line=shade(body, .35), lw=1, r=2)
        cv.rect(x0 + 7, y0 + 7, x0 + L * .38 - 3, y1 - 7, fill=shade(body, .45), r=1)
    elif kind == 'limo':
        cv, (x0, y0, x1, y1, gx0, gx1) = M.car_base(L, W, body, .2, .78, rad=.3)
        for k in range(4): cv.line([(x0 + L * (.3 + k * .12), y0 + W * .16), (x0 + L * (.3 + k * .12), y1 - W * .16)], shade(body, .5), 1.2)
    elif kind == 'swat':
        cv, (x0, y0, x1, y1, gx0, gx1) = M.car_base(L, W, body, .74, .9, rad=.2, roof=(40, 42, 48))
        cv.rect(x0 + 3, y0 + 3, x0 + L * .72, y1 - 3, fill=(46, 48, 56), line=(14, 14, 18), lw=1, r=3)
        cv.rect(x0 + L * .35, y0 + W * .3, x0 + L * .52, y1 - W * .3, fill=(30, 74, 176))
        for yy in (y0 + W * .2, y1 - W * .2): cv.rect(x0 + 8, yy - 1.5, x0 + L * .66, yy + 1.5, fill=(236, 236, 240))
    elif kind == 'mailvan':
        cv, (x0, y0, x1, y1, gx0, gx1) = M.car_base(L, W, body, .72, .9, rad=.2, roof=(244, 244, 240))
        cv.rect(x0 + 3, y0 + 3, x0 + L * .7, y1 - 3, fill=(246, 246, 242), line=(150, 150, 140), lw=1, r=3)
        cv.rect(x0 + L * .2, y0 + W * .35, x0 + L * .55, y1 - W * .35, fill=(40, 90, 170))
    elif kind == 'jeep':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in (x0 + L * .22, x0 + L * .78):
            for yy in (y0 - 1.6, y1 - 4.4): cv.rect(xx - 7, yy, xx + 7, yy + 6, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0 + 2, x1, y1 - 2, fill=body, line=shade(body, .4), lw=1.3, r=4)
        cv.rect(x0 + L * .55, y0 + 5, x0 + L * .66, y1 - 5, fill=(70, 100, 130), line=(30, 40, 50), lw=.8)
        for yy in (y0 + W * .26, y1 - W * .26): cv.rect(x0 + L * .28, yy - 4, x0 + L * .48, yy + 4, fill=(60, 58, 52), r=2)
        cv.ell(x0 + L * .08, y0 + W / 2, 6, 6, fill=(30, 30, 32), line=(10, 10, 10), lw=1)
        cv.rect(x0 + L * .38, y0 + W / 2 - 1.5, x0 + L * .6, y0 + W / 2 + 1.5, fill=(34, 34, 32))
        for yy in (y0 + W * .2, y1 - W * .2): cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190)); cv.ell(x0 + 2, yy, 2, 3.2, fill=(204, 28, 40))
    elif kind == 'mtruck':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for xx in (x0 + L * .18, x0 + L * .32, x0 + L * .78):
            for yy in (y0 - 1.6, y1 - 4.8): cv.rect(xx - 8, yy, xx + 8, yy + 6.4, fill=(22, 22, 24), r=2.5)
        cv.rect(x0, y0 + 1, x0 + L * .72, y1 - 1, fill=(102, 112, 74), line=(44, 52, 30), lw=1.4, r=5)
        for k in range(1, 9): cv.line([(x0 + L * .72 * k / 9, y0 + 3), (x0 + L * .72 * k / 9, y1 - 3)], (70, 80, 50), 1.4)
        cv.rect(x0 + L * .74, y0 + 2, x1, y1 - 2, fill=body, line=shade(body, .4), lw=1.3, r=6)
        cv.rect(x0 + L * .84, y0 + W * .14, x0 + L * .95, y1 - W * .14, fill=(36, 54, 76), line=(18, 26, 38), lw=.8, r=3)
        for yy in (y0 + W * .18, y1 - W * .18): cv.ell(x1 - 2.4, yy, 2.4, 3.2, fill=(255, 244, 190))
    elif kind == 'apc':
        cv = Cv(L + 2 * PAD, W + 2 * PAD); x0, y0, x1, y1 = PAD, PAD, PAD + L, PAD + W
        for k in range(4):
            xx = x0 + L * (.14 + k * .22)
            for yy in (y0 - 1.2, y1 - 6.0): cv.rect(xx - 8, yy, xx + 8, yy + 7.2, fill=(22, 22, 24), r=3)
        cv.poly([(x0, y0 + 6), (x1 - 14, y0 + 2), (x1, y0 + W * .3), (x1, y1 - W * .3), (x1 - 14, y1 - 2), (x0, y1 - 6)], fill=body, line=shade(body, .4), lw=1.5)
        cv.rect(x0 + 6, y0 + 8, x0 + L * .56, y1 - 8, fill=shade(body, 1.1), line=shade(body, .5), lw=1, r=3)
        tx, ty = x0 + L * .38, y0 + W / 2
        cv.rect(tx, ty - 2.4, tx + 34, ty + 2.4, fill=(34, 36, 30), line=(12, 12, 10), lw=.8, r=1)
        cv.ell(tx, ty, 13, 12, fill=shade(body, 1.18), line=shade(body, .4), lw=1.2); cv.ell(tx - 2, ty, 5, 5, fill=shade(body, .7))
        cv.rect(x0 + L * .72, y0 + W * .22, x0 + L * .88, y1 - W * .22, fill=(40, 58, 76), r=3)
    else:
        raise ValueError(kind)
    return cv.done()


# ───────────────────────── ИНТЕРЬЕРЫ ─────────────────────────
IT = 32   # клетка интерьера = 2 м (16 px/м)


def make_interior(M):
    """Возвращает dict name -> PIL.Image (полы 32x32 и мебель)."""
    from PIL import Image
    Cv, shade, tb = M.Cv, M.shade, M.tile_base
    S = {}
    rng = random.Random(55)

    def floor(name, base, line=None, checker=None, seed=1, var=5):
        im = tb(base, var, seed, speck=4).resize((IT, IT), Image.LANCZOS) if False else tb(base, var, seed, speck=4)
        d = ImageDraw.Draw(im)
        if checker:
            for sx in range(0, 64, 32):
                for sy in range(0, 64, 32):
                    if ((sx + sy) // 32) % 2 == 0: d.rectangle([sx, sy, sx + 31, sy + 31], fill=checker + (255,))
        if line:
            for k in (0, 32): d.line([(k, 0), (k, 63)], fill=line + (255,)); d.line([(0, k), (63, k)], fill=line + (255,))
        S[name] = im.resize((IT, IT), Image.LANCZOS)
    floor('floor_wood', (150, 106, 66), (104, 70, 40), seed=801)
    d = ImageDraw.Draw(S['floor_wood'])
    for y in range(0, IT, 8): d.line([(0, y), (IT, y)], fill=(112, 78, 46, 255))
    floor('floor_tile', (214, 218, 220), (170, 176, 180), seed=802, var=3)
    floor('floor_checker', (226, 226, 222), (160, 160, 156), checker=(60, 64, 70), seed=803, var=2)
    floor('floor_carpet_red', (140, 44, 52), None, seed=804, var=6)
    floor('floor_carpet_blue', (50, 70, 120), None, seed=805, var=6)
    floor('floor_hospital', (176, 214, 206), (132, 176, 168), seed=806, var=3)
    floor('floor_concrete', (116, 118, 118), (84, 86, 86), seed=807, var=7)
    floor('floor_marble', (230, 224, 214), (190, 182, 170), checker=(214, 206, 194), seed=808, var=3)
    floor('floor_kitchen', (200, 190, 170), (150, 140, 120), checker=(176, 166, 146), seed=809, var=3)
    im = Image.new('RGBA', (IT, IT), (34, 36, 44, 255)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, IT - 1, 3], fill=(78, 82, 94, 255)); d.rectangle([0, IT - 3, IT - 1, IT - 1], fill=(20, 22, 28, 255))
    for k in range(0, IT, 8): d.line([(k, 4), (k, IT - 4)], fill=(44, 46, 56, 255))
    S['wall'] = im
    im = Image.new('RGBA', (IT, IT), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([2, 2, IT - 3, IT - 3], fill=(226, 190, 60, 160), outline=(120, 90, 10, 255)); d.polygon([(16, 5), (26, 16), (6, 16)], fill=(90, 60, 4, 255)); d.rectangle([13, 15, 19, 26], fill=(90, 60, 4, 255))
    S['exit_mat'] = im

    def item(name, w, h, fn):
        cv = Cv(w, h); fn(cv, w, h); S[name] = cv.done()
    wood, dwood = (150, 104, 62), (84, 56, 32)
    item('bed_double', 40, 52, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=dwood, line=(40, 26, 14), lw=1.2, r=3), c.rect(3, 12, w - 3, h - 3, fill=(86, 120, 176), line=(40, 60, 100), lw=1, r=2), c.rect(4, 3, 18, 12, fill=(240, 240, 244), r=3), c.rect(w - 18, 3, w - 4, 12, fill=(240, 240, 244), r=3)))
    item('bed_single', 28, 52, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=dwood, line=(40, 26, 14), lw=1.2, r=3), c.rect(3, 12, w - 3, h - 3, fill=(176, 90, 80), line=(100, 40, 36), lw=1, r=2), c.rect(5, 3, w - 5, 12, fill=(240, 240, 244), r=3)))
    item('sofa', 58, 28, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(98, 72, 110), line=(40, 28, 50), lw=1.2, r=5), c.rect(4, 11, w - 4, h - 3, fill=(124, 94, 138), r=4), c.line([(w / 2, 11), (w / 2, h - 3)], (80, 56, 92), 1)))
    item('armchair', 28, 28, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(160, 84, 62), line=(70, 34, 24), lw=1.2, r=6), c.rect(5, 8, w - 5, h - 4, fill=(190, 108, 82), r=4)))
    item('table_round', 38, 38, lambda c, w, h: (c.ell(19, 19, 17, 17, fill=wood, line=dwood, lw=1.4), c.ell(19, 19, 11, 11, fill=(170, 124, 80))))
    item('table_rect', 52, 30, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=wood, line=dwood, lw=1.4, r=2), c.rect(4, 4, w - 4, h - 4, fill=(172, 126, 82))))
    item('chair', 14, 14, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(122, 84, 52), line=(60, 38, 22), lw=1, r=3), c.rect(1, 1, 4, h - 1, fill=(90, 60, 36))))
    item('wardrobe', 46, 20, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(118, 88, 60), line=(50, 36, 22), lw=1.2), c.line([(w / 2, 2), (w / 2, h - 2)], (60, 44, 28), 1)))
    item('fridge', 22, 22, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(232, 234, 238), line=(110, 114, 120), lw=1.2, r=2), c.line([(3, h / 2), (w - 3, h / 2)], (150, 154, 160), 1)))
    item('stove', 22, 22, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(60, 62, 68), line=(24, 26, 30), lw=1.2, r=2), [c.ell(6 + 10 * i, 6 + 10 * j, 3.4, 3.4, fill=(30, 30, 34), line=(150, 150, 156), lw=.8) for i in (0, 1) for j in (0, 1)]))
    item('sink', 30, 20, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(206, 208, 212), line=(110, 114, 120), lw=1.2, r=2), c.rect(5, 4, w - 5, h - 4, fill=(150, 176, 196), line=(90, 110, 124), lw=1, r=3)))
    item('counter', 64, 22, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(130, 98, 64), line=(60, 44, 26), lw=1.4, r=2), c.rect(1, 1, w - 1, 8, fill=(206, 180, 140), line=(120, 96, 64), lw=1)))
    item('register', 16, 14, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(70, 74, 80), line=(20, 22, 26), lw=1, r=2), c.rect(3, 3, w - 3, 7, fill=(120, 220, 140)), c.rect(3, 9, w - 3, 12, fill=(150, 154, 160))))
    gc = [(214, 70, 60), (240, 200, 70), (84, 170, 100), (80, 130, 210), (236, 236, 230), (190, 110, 60)]

    def shelf(c, w, h, cols=gc, seed=3):
        r = random.Random(seed); c.rect(1, 1, w - 1, h - 1, fill=(104, 108, 116), line=(36, 38, 44), lw=1.2)
        for x in range(3, w - 5, 6): c.rect(x, 3, x + 4, h - 3, fill=r.choice(cols), line=(40, 40, 44), lw=.5)
    item('shelf_food', 64, 16, lambda c, w, h: shelf(c, w, h))
    item('shelf_drink', 64, 16, lambda c, w, h: shelf(c, w, h, [(60, 140, 210), (220, 70, 60), (70, 170, 90), (240, 200, 60)], 4))
    item('shelf_med', 64, 16, lambda c, w, h: shelf(c, w, h, [(240, 240, 244), (210, 60, 60), (90, 160, 210)], 5))
    item('rack_clothes', 64, 16, lambda c, w, h: shelf(c, w, h, [(52, 96, 170), (180, 52, 52), (60, 140, 88), (50, 50, 58), (214, 170, 50)], 6))
    item('rack_weapons', 64, 16, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(70, 66, 60), line=(24, 22, 20), lw=1.2), [c.rect(4 + i * 10, 4, 12 + i * 10, 9, fill=(34, 34, 38), r=1) for i in range(6)], [c.rect(4 + i * 10, 11, 10 + i * 10, 14, fill=(60, 50, 40)) for i in range(6)]))
    item('shelf_tools', 64, 16, lambda c, w, h: shelf(c, w, h, [(214, 120, 40), (130, 134, 140), (60, 90, 150), (220, 60, 50)], 7))
    item('tv', 26, 10, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(24, 26, 30), line=(60, 62, 68), lw=1), c.rect(3, 3, w - 3, h - 3, fill=(60, 120, 170))))
    item('plant', 20, 20, lambda c, w, h: (c.ell(10, 10, 9, 9, fill=(52, 120, 60), line=(24, 70, 30), lw=1), c.ell(8, 8, 5, 5, fill=(84, 156, 80)), c.ell(10, 10, 3, 3, fill=(130, 90, 60))))
    item('rug', 76, 52, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(160, 56, 60), line=(90, 28, 32), lw=1.4, r=3), c.rect(6, 6, w - 6, h - 6, fill=(196, 148, 80), r=2), c.rect(10, 10, w - 10, h - 10, fill=(150, 52, 56), r=2)))
    item('desk', 52, 28, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(120, 96, 70), line=(52, 40, 28), lw=1.3, r=2), c.rect(w - 24, 4, w - 6, 16, fill=(36, 40, 46), line=(10, 10, 12), lw=1, r=1), c.rect(w - 22, 6, w - 8, 13, fill=(100, 170, 220)), c.rect(6, 6, 18, 20, fill=(236, 232, 214))))
    item('office_chair', 16, 16, lambda c, w, h: (c.ell(8, 8, 7, 7, fill=(54, 58, 66), line=(20, 22, 26), lw=1), c.ell(8, 8, 3, 3, fill=(90, 94, 102))))
    item('hosp_bed', 28, 52, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(214, 220, 226), line=(100, 110, 120), lw=1.3, r=3), c.rect(3, 14, w - 3, h - 3, fill=(168, 220, 214), line=(90, 150, 144), lw=1, r=2), c.rect(5, 3, w - 5, 12, fill=(250, 250, 252), r=3)))
    item('med_cab', 36, 14, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(236, 240, 244), line=(120, 128, 136), lw=1.2), c.rect(w / 2 - 2, 3, w / 2 + 2, h - 3, fill=(210, 50, 56)), c.rect(w / 2 - 5, h / 2 - 2, w / 2 + 5, h / 2 + 2, fill=(210, 50, 56))))
    item('reception', 76, 24, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(236, 232, 224), line=(110, 100, 86), lw=1.4, r=3), c.rect(1, 1, w - 1, 9, fill=(60, 110, 160), line=(30, 60, 100), lw=1)))
    item('cell_bars', 64, 8, lambda c, w, h: (c.rect(0, 2, w, 6, fill=(60, 64, 72)), [c.rect(x, 0, x + 2, h, fill=(150, 154, 162)) for x in range(2, w, 7)]))
    item('bunk', 28, 52, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(72, 76, 84), line=(24, 26, 30), lw=1.2, r=2), c.rect(3, 12, w - 3, h - 3, fill=(120, 124, 110), r=2), c.rect(5, 3, w - 5, 11, fill=(200, 200, 196), r=3)))
    item('vault', 60, 60, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(98, 102, 110), line=(30, 32, 36), lw=2, r=6), c.ell(30, 30, 20, 20, fill=(146, 150, 158), line=(40, 42, 46), lw=2), c.ell(30, 30, 6, 6, fill=(230, 200, 60), line=(100, 80, 10), lw=1), [c.line([(30, 30), (30 + math.cos(a) * 18, 30 + math.sin(a) * 18)], (60, 62, 66), 2) for a in (0, 1.57, 3.14, 4.71)]))
    item('atm', 18, 18, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(60, 66, 76), line=(20, 22, 26), lw=1.2, r=2), c.rect(3, 3, w - 3, 9, fill=(100, 200, 140)), c.rect(5, 12, w - 5, 15, fill=(24, 26, 30))))
    item('platform', 100, 56, lambda c, w, h: (c.ell(w / 2, h / 2, w / 2 - 2, h / 2 - 2, fill=(206, 208, 212), line=(90, 94, 100), lw=2), c.ell(w / 2, h / 2, w / 2 - 10, h / 2 - 8, fill=(176, 180, 186), line=(120, 124, 130), lw=1.2)))
    item('lift', 60, 44, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(214, 168, 40), line=(100, 76, 8), lw=1.4, r=3), c.rect(6, 6, 18, h - 6, fill=(74, 78, 84)), c.rect(w - 18, 6, w - 6, h - 6, fill=(74, 78, 84)), [c.line([(22 + i * 8, 4), (22 + i * 8 + 5, h - 4)], (120, 90, 10), 1.5) for i in range(4)]))
    item('bench_tools', 64, 20, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(150, 120, 80), line=(60, 44, 26), lw=1.3), [c.rect(5 + i * 12, 4, 12 + i * 12, 14, fill=[(214, 60, 50), (60, 90, 150), (130, 134, 140), (230, 190, 50)][i % 4], r=1) for i in range(5)]))
    item('tires', 20, 20, lambda c, w, h: (c.ell(10, 10, 9, 9, fill=(26, 26, 28), line=(8, 8, 10), lw=1), c.ell(10, 10, 4, 4, fill=(110, 112, 118))))
    item('booth', 56, 40, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(168, 56, 52), line=(80, 24, 22), lw=1.3, r=4), c.rect(10, 10, w - 10, h - 10, fill=(236, 232, 220), line=(120, 110, 96), lw=1, r=2)))
    item('bar_counter', 96, 22, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(96, 62, 40), line=(40, 24, 14), lw=1.4, r=3), c.rect(1, 1, w - 1, 9, fill=(190, 150, 100), line=(110, 80, 50), lw=1)))
    item('stool', 12, 12, lambda c, w, h: (c.ell(6, 6, 5, 5, fill=(190, 60, 54), line=(80, 24, 22), lw=1)))
    item('kitchen_range', 52, 24, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(190, 194, 200), line=(80, 84, 90), lw=1.3, r=2), [c.ell(10 + 16 * i, 12, 5, 5, fill=(40, 42, 46), line=(120, 124, 130), lw=1) for i in range(3)]))
    item('vending', 20, 16, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(60, 120, 190), line=(20, 40, 70), lw=1.3, r=2), c.rect(4, 3, w - 4, h - 5, fill=(200, 230, 250))))
    item('mannequin', 16, 16, lambda c, w, h: (c.ell(8, 8, 7, 5, fill=(232, 228, 220), line=(110, 106, 98), lw=1), c.ell(8, 8, 3, 3, fill=(210, 206, 198))))
    item('toilet', 18, 22, lambda c, w, h: (c.rect(1, 1, w - 1, 8, fill=(236, 238, 240), line=(110, 114, 120), lw=1), c.ell(9, 15, 6, 6, fill=(242, 244, 246), line=(110, 114, 120), lw=1)))
    item('crate_int', 24, 24, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(172, 128, 76), line=(80, 56, 28), lw=1.3), c.line([(1, 1), (w - 1, h - 1)], (110, 80, 44), 1.4), c.line([(w - 1, 1), (1, h - 1)], (110, 80, 44), 1.4)))
    item('oil_barrel', 14, 14, lambda c, w, h: (c.ell(7, 7, 6, 6, fill=(60, 90, 140), line=(20, 30, 50), lw=1), c.ell(7, 7, 3, 3, fill=(40, 62, 100))))
    item('terminal', 22, 18, lambda c, w, h: (c.rect(1, 1, w - 1, h - 1, fill=(44, 50, 60), line=(16, 18, 22), lw=1.2, r=2), c.rect(3, 3, w - 3, h - 6, fill=(90, 220, 150)), c.rect(5, h - 5, w - 5, h - 2, fill=(130, 134, 140))))
    return S
