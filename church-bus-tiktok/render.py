"""Animated 9:16 TikTok: Pacific Baptist Church bus route, "suspect" trend.

Run narration.py first (writes work/lines.json + voice wavs), then:
    python3 render.py            -> out/church_bus_route_v1.mp4
World shapes are drawn with cairo (antialiased); text is drawn with PIL.
"""
import json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
SLUG = "church_bus_route_v1"
FONT_BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
_fonts = {}


def font(size, path=FONT_BLACK):
    key = (size, path)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, size)
    return _fonts[key]


# ---------------------------------------------------------------- timeline
LINES = json.load(open("work/lines.json"))
t = 0.25
for ln in LINES:
    ln["start"], ln["end"] = t, t + ln["dur"]
    t = ln["end"] + 0.2
TOTAL = LINES[-1]["end"] + 1.5
NFRAMES = int(TOTAL * FPS)
L = {ln["key"]: ln for ln in LINES}
SCENES = []
for i, ln in enumerate(LINES):
    s = 0.0 if i == 0 else ln["start"] - 0.1
    e = TOTAL if i == len(LINES) - 1 else LINES[i + 1]["start"] - 0.1
    SCENES.append((ln["key"], s, e))

# word timings (proportional to word length within each narrated line)
WORDS = []
for ln in LINES:
    ws = ln["text"].replace("...", "…").split()
    wts = [len(w) + 2 for w in ws]
    tot, acc = sum(wts), 0
    span = ln["dur"] - 0.1
    for w, wt in zip(ws, wts):
        a = ln["start"] + 0.05 + span * acc / tot
        acc += wt
        WORDS.append(dict(w=w, s=a, e=ln["start"] + 0.05 + span * acc / tot, line=ln["key"]))

# caption pages: up to 3 words, break after punctuation
PAGES = []
for key in L:
    lw = [w for w in WORDS if w["line"] == key]
    cur = []
    for w in lw:
        cur.append(w)
        if len(cur) == 3 or w["w"][-1] in ".,!?:…":
            PAGES.append(cur)
            cur = []
    if cur:
        PAGES.append(cur)
for i, p in enumerate(PAGES):
    nxt = PAGES[i + 1][0]["s"] if i + 1 < len(PAGES) else TOTAL
    p_end = min(p[-1]["e"] + 0.35, nxt)
    PAGES[i] = dict(words=p, s=p[0]["s"], e=p_end)


def word_time(key, word):
    for w in WORDS:
        if w["line"] == key and w["w"].strip(".,!?:").lower() == word.lower():
            return w["s"]
    raise KeyError(word)


# ---------------------------------------------------------------- helpers
def hexc(h, a=1.0):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_back(x):
    x = clamp(x)
    c1 = 1.9
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def rrect(c, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    c.new_sub_path()
    c.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    c.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    c.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    c.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    c.close_path()


INK = "#1d1b26"


def paint(c, fillc, line=INK, lw=0):
    c.set_source_rgba(*hexc(fillc))
    if lw:
        c.fill_preserve()
        c.set_source_rgba(*hexc(line))
        c.set_line_width(lw)
        c.stroke()
    else:
        c.fill()


def surf_to_pil(surf):
    buf = np.ndarray((surf.get_height(), surf.get_width(), 4), np.uint8, surf.get_data()).copy()
    rgba = buf[..., [2, 1, 0, 3]].astype(np.float32)
    a = rgba[..., 3:4]
    rgba[..., :3] = np.where(a > 0, rgba[..., :3] * 255.0 / np.maximum(a, 1), 0)
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------- characters
KIDS = {
    "marcus": dict(skin="#8D5524", hair="#1a1a1a", shirt="#2E86FF", pants="#2f3a56", shoe="#FF3B3B", one_shoe=True),
    "twin": dict(skin="#E0AC69", hair="#5a3214", shirt="#2FCB71", pants="#26324f", shoe="#ffffff"),
    "lily": dict(skin="#F1C27D", hair="#d9902f", shirt="#ffffff", pants="#ffffff", shoe="#FF6FB5", ghost=True),
}
rng = random.Random(7)
SKINS = ["#8D5524", "#C68642", "#E0AC69", "#F1C27D", "#FFDBAC", "#6b4423"]
HAIRS = ["#1a1a1a", "#5a3214", "#d9902f", "#3b2314", "#b5651d", "#000000"]
EXTRA = [dict(skin=rng.choice(SKINS), hair=rng.choice(HAIRS)) for _ in range(12)]


def draw_kid(c, cx, fy, s, k, phase=0.0, moving=False, face=1):
    sw = math.sin(phase) * 0.55 if moving else 0.0
    hipy = fy - 48 * s
    # legs + shoes
    for side, sgn in ((-1, 1), (1, -1)):
        hx = cx + side * 9 * s
        fx = hx + math.sin(sw * sgn) * 30 * s
        c.set_line_cap(cairo.LINE_CAP_ROUND)
        c.move_to(hx, hipy)
        c.line_to(fx, fy - 9 * s)
        c.set_source_rgba(*hexc(INK))
        c.set_line_width(17 * s)
        c.stroke_preserve()
        c.set_source_rgba(*hexc(k["pants"]))
        c.set_line_width(11 * s)
        c.stroke()
        shoe = "#f4f4f4" if (k.get("one_shoe") and side == 1) else k["shoe"]
        c.save()
        c.translate(fx + 5 * s * face, fy - 5 * s)
        c.scale(1.0, 0.55)
        c.arc(0, 0, 13 * s, 0, 2 * math.pi)
        c.restore()
        paint(c, shoe, lw=3 * s)
    if k.get("ghost"):
        c.move_to(cx - 40 * s, fy - 22 * s)
        c.line_to(cx - 40 * s, fy - 120 * s)
        c.arc(cx, fy - 120 * s, 40 * s, math.pi, 2 * math.pi)
        c.line_to(cx + 40 * s, fy - 22 * s)
        for i in range(4):
            x1 = cx + 40 * s - (i + 1) * 20 * s
            c.curve_to(x1 + 14 * s, fy - 8 * s + (math.sin(phase * 2 + i) * 3 * s),
                       x1 + 6 * s, fy - 34 * s, x1, fy - 22 * s)
        c.close_path()
        paint(c, "#ffffff", lw=4 * s)
        for ex in (-13, 13):
            c.save()
            c.translate(cx + (ex + 4 * face) * s, fy - 122 * s)
            c.scale(1, 1.4)
            c.arc(0, 0, 6 * s, 0, 2 * math.pi)
            c.restore()
            paint(c, INK)
        c.save()
        c.translate(cx + 4 * face * s, fy - 100 * s)
        c.scale(1, 1.3)
        c.arc(0, 0, 5 * s, 0, 2 * math.pi)
        c.restore()
        paint(c, INK)
        return
    # arms
    for side, sgn in ((-1, -1), (1, 1)):
        sx, sy = cx + side * 22 * s, fy - 92 * s
        ex = cx + side * 32 * s + math.sin(sw * sgn) * 22 * s
        ey = fy - 58 * s
        c.move_to(sx, sy)
        c.line_to(ex, ey)
        c.set_source_rgba(*hexc(INK))
        c.set_line_width(16 * s)
        c.stroke_preserve()
        c.set_source_rgba(*hexc(k["shirt"]))
        c.set_line_width(10 * s)
        c.stroke()
        c.arc(ex, ey, 7 * s, 0, 2 * math.pi)
        paint(c, k["skin"], lw=3 * s)
    rrect(c, cx - 26 * s, fy - 102 * s, 52 * s, 60 * s, 16 * s)
    paint(c, k["shirt"], lw=4 * s)
    draw_head(c, cx, fy - 132 * s, 31 * s, k["skin"], k["hair"], face)


def draw_head(c, x, y, r, skin, hair, face=1, cap=None):
    c.arc(x, y, r, 0, 2 * math.pi)
    paint(c, skin, lw=r * 0.12)
    # hair cap
    c.arc(x, y - r * 0.08, r * 1.02, math.pi * 1.02, math.pi * 1.98)
    c.curve_to(x + r * 0.6, y - r * 0.45, x - r * 0.4, y - r * 0.6, x - r * 1.0, y - r * 0.1)
    c.close_path()
    paint(c, cap or hair, lw=r * 0.1)
    if cap:
        c.rectangle(x + face * r * 0.1 - r * 0.2, y - r * 0.55, face * r * 1.1, r * 0.22)
        paint(c, cap, lw=r * 0.08)
    for ex in (-0.33, 0.33):
        c.arc(x + (ex + 0.12 * face) * r, y + 0.05 * r, r * 0.12, 0, 2 * math.pi)
        paint(c, INK)
    c.arc(x + 0.12 * face * r, y + 0.28 * r, r * 0.32, 0.15 * math.pi, 0.85 * math.pi)
    c.set_source_rgba(*hexc(INK))
    c.set_line_width(r * 0.1)
    c.stroke()
    for ex in (-0.6, 0.6):
        c.arc(x + (ex + 0.12 * face) * r, y + 0.32 * r, r * 0.14, 0, 2 * math.pi)
        c.set_source_rgba(*hexc("#ff6f91", 0.35))
        c.fill()


# ---------------------------------------------------------------- scenery
GROUND = 1130          # house base / sidewalk top
ROAD_TOP, ROAD_BOT = 1175, 1400
BUS_X0, BUS_Y0 = 120, 993
DOOR_DX = 620
HOUSE_COLORS = [("#FF8A65", "#8E2C1E"), ("#7EC8E3", "#2B4C7E"), ("#B39DDB", "#4527A0"),
                ("#FFD54F", "#A0522D"), ("#81C784", "#2E5E3A"), ("#F48FB1", "#7B1F4B")]


def sky(c, top="#3D8BFF", bot="#FFD6A0"):
    g = cairo.LinearGradient(0, 0, 0, GROUND)
    g.add_color_stop_rgba(0, *hexc(top))
    g.add_color_stop_rgba(1, *hexc(bot))
    c.rectangle(0, 0, W, GROUND + 5)
    c.set_source(g)
    c.fill()


def sun(c, t):
    c.arc(860, 520, 95 + 4 * math.sin(t * 3), 0, 2 * math.pi)
    c.set_source_rgba(*hexc("#FFF3B0", 0.35))
    c.fill()
    c.arc(860, 520, 70, 0, 2 * math.pi)
    paint(c, "#FFE066")


def clouds(c, t, scroll):
    for i, (bx, by, sc) in enumerate(((100, 330, 1.0), (620, 250, 0.8), (1100, 420, 1.2), (1600, 300, 0.9))):
        x = (bx - scroll * 0.08 - t * 12) % 1900 - 300
        for dx, dy, r in ((0, 0, 50), (55, -20, 60), (115, 0, 48), (60, 18, 50)):
            c.arc(x + dx * sc, by + dy * sc, r * sc, 0, 2 * math.pi)
            c.set_source_rgba(1, 1, 1, 0.92)
            c.fill()


def hills(c, scroll):
    for layer, (col, base, amp, par) in enumerate((("#9ED9A0", 1000, 90, 0.18), ("#6CC070", 1060, 60, 0.35))):
        c.move_to(0, GROUND)
        for x in range(0, W + 41, 40):
            wx = x + scroll * par
            y = base - amp * (0.6 + 0.4 * math.sin(wx / 260 + layer)) - 25 * math.sin(wx / 97)
            c.line_to(x, y)
        c.line_to(W, GROUND)
        c.close_path()
        paint(c, col)


def house(c, x, i, base=GROUND, w=380):
    body, roof = HOUSE_COLORS[i % len(HOUSE_COLORS)]
    hh = 240
    c.move_to(x - w / 2 - 28, base - hh + 2)
    c.line_to(x, base - hh - 150)
    c.line_to(x + w / 2 + 28, base - hh + 2)
    c.close_path()
    paint(c, roof, lw=6)
    c.rectangle(x - w / 2, base - hh, w, hh)
    paint(c, body, lw=6)
    c.rectangle(x + w * 0.22, base - hh - 120, 40, 70)
    paint(c, roof, lw=5)
    rrect(c, x - 38, base - 140, 76, 140, 14)
    paint(c, "#6D4C41", lw=5)
    c.arc(x + 22, base - 70, 5, 0, 2 * math.pi)
    paint(c, "#FFD54F")
    for wx in (x - w / 2 + 30, x + w / 2 - 120):
        rrect(c, wx, base - 205, 90, 80, 8)
        paint(c, "#E3F2FD", lw=5)
        c.move_to(wx + 45, base - 205)
        c.line_to(wx + 45, base - 125)
        c.move_to(wx, base - 165)
        c.line_to(wx + 90, base - 165)
        c.set_source_rgba(*hexc(INK))
        c.set_line_width(4)
        c.stroke()


def tree(c, x, base=GROUND, s=1.0):
    c.rectangle(x - 14 * s, base - 120 * s, 28 * s, 120 * s)
    paint(c, "#795548", lw=4)
    for dx, dy, r in ((0, -190, 75), (-55, -140, 55), (55, -140, 55)):
        c.arc(x + dx * s, base + dy * s, r * s, 0, 2 * math.pi)
        paint(c, "#43A047", lw=5)


def street(c, scroll, front_scroll):
    c.rectangle(0, GROUND, W, ROAD_TOP - GROUND)
    paint(c, "#D7D3CC")
    c.rectangle(0, ROAD_TOP - 6, W, 8)
    paint(c, "#9E9A93")
    c.rectangle(0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP)
    paint(c, "#3A3D47")
    off = -(scroll % 160)
    for x in range(int(off) - 160, W + 160, 160):
        rrect(c, x, 1352, 90, 12, 6)
        paint(c, "#FFD54F")
    c.rectangle(0, ROAD_BOT, W, H - ROAD_BOT)
    paint(c, "#5CB860")
    c.rectangle(0, ROAD_BOT, W, 14)
    paint(c, "#4A9E4E")
    # foreground bushes + flowers (fast parallax)
    off = -(front_scroll % 520)
    for x in range(int(off) - 520, W + 520, 520):
        for dx, dy, r in ((0, 0, 70), (70, -20, 80), (150, 5, 65)):
            c.arc(x + dx, 1740 + dy, r, 0, 2 * math.pi)
            paint(c, "#3F8F43", lw=5)
        for fx, fy, col in ((300, 1610, "#FF6F91"), (360, 1640, "#FFD54F"), (420, 1600, "#ffffff")):
            c.arc(x + fx, fy, 11, 0, 2 * math.pi)
            paint(c, col, lw=3)


def draw_bus(c, x0, y0, heads, wheel_ang, t=0.0, party=False):
    bw, bh = 760, 290
    c.save()
    rrect(c, x0 + 6, y0 + 300, bw - 20, 30, 15)
    c.set_source_rgba(0, 0, 0, 0.22)
    c.fill()
    rrect(c, x0, y0, bw, bh, 42)
    paint(c, "#FFC21A", lw=7)
    rrect(c, x0 + bw - 30, y0 + 200, 50, 60, 10)          # bumper
    paint(c, "#55535e", lw=5)
    c.rectangle(x0 + 4, y0 + 148, bw - 8, 16)
    paint(c, INK)
    c.rectangle(x0 + 4, y0 + 236, bw - 8, 10)
    paint(c, INK)
    # windows
    for wi in range(6):
        wx = x0 + 34 + wi * 88
        rrect(c, wx, y0 + 38, 72, 92, 12)
        paint(c, "#BFE6FF", lw=5)
        c.save()
        rrect(c, wx, y0 + 38, 72, 92, 12)
        c.clip()
        for hi in range(2):
            k = heads.get(wi * 2 + hi)
            if k is None:
                continue
            bounce = (abs(math.sin(t * 6.3 + wi + hi * 1.7)) * 16) if party else 0
            hx = wx + 20 + hi * 32
            hy = y0 + 112 - bounce
            if k.get("ghost"):
                c.arc(hx, hy, 24, math.pi, 2 * math.pi)
                c.line_to(hx + 24, hy + 30)
                c.line_to(hx - 24, hy + 30)
                c.close_path()
                paint(c, "#ffffff", lw=3)
                for ex in (-8, 8):
                    c.arc(hx + ex, hy - 4, 4, 0, 2 * math.pi)
                    paint(c, INK)
            else:
                c.rectangle(hx - 16, hy + 18, 32, 30)
                paint(c, k.get("shirt", "#FF7043"), lw=3)
                draw_head(c, hx, hy, 21, k["skin"], k["hair"])
        c.restore()
        c.move_to(wx, y0 + 84)
        c.line_to(wx + 72, y0 + 84)
        c.set_source_rgba(*hexc(INK, 0.25))
        c.set_line_width(3)
        c.stroke()
    # door
    rrect(c, x0 + 585, y0 + 38, 70, 196, 8)
    paint(c, "#BFE6FF", lw=5)
    c.move_to(x0 + 620, y0 + 38)
    c.line_to(x0 + 620, y0 + 234)
    c.set_source_rgba(*hexc(INK))
    c.set_line_width(4)
    c.stroke()
    # windshield + driver
    rrect(c, x0 + 672, y0 + 38, 76, 100, 14)
    paint(c, "#BFE6FF", lw=5)
    c.save()
    rrect(c, x0 + 672, y0 + 38, 76, 100, 14)
    c.clip()
    c.rectangle(x0 + 690, y0 + 118, 40, 30)
    paint(c, "#37474F", lw=3)
    draw_head(c, x0 + 710, y0 + 100, 22, "#C68642", "#5d4037", face=1, cap="#1E88E5")
    c.restore()
    c.arc(x0 + 742, y0 + 190, 14, 0, 2 * math.pi)         # headlight
    paint(c, "#FFF59D", lw=4)
    rrect(c, x0 + 6, y0 + 175, 22, 36, 6)                 # tail light
    paint(c, "#FF5252", lw=3)
    # wheels
    for wx in (x0 + 160, x0 + 520):
        c.arc(wx, y0 + bh, 56, 0, 2 * math.pi)
        paint(c, INK)
        c.arc(wx, y0 + bh, 30, 0, 2 * math.pi)
        paint(c, "#B0BEC5", lw=5)
        for sp in range(5):
            a = wheel_ang + sp * 2 * math.pi / 5
            c.move_to(wx, y0 + bh)
            c.line_to(wx + math.cos(a) * 26, y0 + bh + math.sin(a) * 26)
        c.set_source_rgba(*hexc("#546E7A"))
        c.set_line_width(5)
        c.stroke()
    c.restore()


def draw_bus_text(img, x0, y0, z=1.0):
    d = ImageDraw.Draw(img)
    d.text((x0 + 300, y0 + 200), "PACIFIC BAPTIST CHURCH", font=font(40), fill=hexpil(INK), anchor="mm")


def hexpil(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


# ---------------------------------------------------------------- bus motion
STOPS = [("stop1", ["marcus"]), ("stop2", ["twin", "twin"]), ("stop3", ["lily"])]
BASE_V = 1150.0
STOP_INFO = []
for key, kids in STOPS:
    ts = L[key]["start"]
    STOP_INFO.append(dict(key=key, kids=kids, decel=(ts - 0.2, ts + 0.5), go=(ts + 2.4, ts + 3.1),
                          board=[ts + 1.55 + 0.3 * i for i in range(len(kids))]))


def vel_factor(t):
    f = 1.0
    for si in STOP_INFO:
        a, b = si["decel"]
        g0, g1 = si["go"]
        if a <= t < b:
            f *= 1 - smooth((t - a) / (b - a))
        elif b <= t < g0:
            f = 0.0
        elif g0 <= t < g1:
            f *= smooth((t - g0) / (g1 - g0))
    return f


DT = 1 / (FPS * 4)
_ts = np.arange(0, TOTAL + 1, DT)
_v = np.array([BASE_V * vel_factor(x) for x in _ts])
_S = np.concatenate([[0], np.cumsum(_v[:-1] * DT)])


def scroll_at(t):
    return float(np.interp(t, _ts, _S))


for si in STOP_INFO:
    si["house_wx"] = scroll_at(si["decel"][1]) + BUS_X0 + DOOR_DX
STOP_WX = [si["house_wx"] for si in STOP_INFO]

# slot assignment for heads in windows
SLOT_OF = {"marcus": [10], "twin": [8, 9], "lily": [6]}


def heads_at(t, party=False):
    heads = {}
    if party:
        for i in range(12):
            e = EXTRA[i]
            heads[i] = dict(skin=e["skin"], hair=e["hair"], shirt=rng_shirt(i))
    for si in STOP_INFO:
        used = {}
        for kname, bt in zip(si["kids"], si["board"]):
            if t >= bt or party:
                n = used.get(kname, 0)
                heads[SLOT_OF[kname][n]] = KIDS[kname]
                used[kname] = n + 1
    return heads


def rng_shirt(i):
    return ["#FF7043", "#AB47BC", "#26C6DA", "#FFCA28", "#EC407A", "#66BB6A"][i % 6]


# ---------------------------------------------------------------- overlays
def make_tape(text, length=2600):
    th = 104
    im = Image.new("RGBA", (length, th), hexpil("#FFD600"))
    d = ImageDraw.Draw(im)
    for x in range(-th, length, 60):
        d.polygon([(x, 0), (x + 30, 0), (x + 30 - 14, 12), (x - 14, 12)], fill=hexpil(INK))
        d.polygon([(x, th - 12), (x + 30, th - 12), (x + 16, th), (x - 14, th)], fill=hexpil(INK))
    f = font(54)
    seg = f"{text}  •  "
    sw = f.getlength(seg)
    x = 10
    while x < length:
        d.text((x, th / 2), seg, font=f, fill=hexpil(INK), anchor="lm")
        x += sw
    return im


TAPE1 = make_tape("SUNDAY BUS ROUTE")
TAPE2 = make_tape("SUSPECTS AT LARGE")


def paste_rot(base, im, cx, cy, ang, alpha=1.0, scale=1.0):
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    r = im.rotate(ang, resample=Image.BICUBIC, expand=True)
    if alpha < 1.0:
        a = r.getchannel("A").point(lambda v: int(v * alpha))
        r.putalpha(a)
    base.alpha_composite(r, (int(cx - r.width / 2), int(cy - r.height / 2)))


def fit_font(text, maxw, size):
    while size > 20 and font(size).getlength(text) > maxw:
        size -= 2
    return font(size)


def wrap(text, f, maxw):
    lines, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if f.getlength(trial) <= maxw:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def make_card(num_title, name, age, known, kids, placard):
    cw, ch = 900, 640
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, cw, ch)
    c = cairo.Context(surf)
    rrect(c, 4, 4, cw - 8, ch - 8, 36)
    paint(c, "#FFF8E7", lw=7)
    c.save()
    rrect(c, 4, 4, cw - 8, ch - 8, 36)
    c.clip()
    c.rectangle(0, 0, cw, 116)
    paint(c, INK)
    c.restore()
    # mugshot panel
    px, py, pw, ph = 34, 140, 396, 466
    c.save()
    rrect(c, px, py, pw, ph, 18)
    c.clip()
    c.rectangle(px, py, pw, ph)
    paint(c, "#C9D3DC")
    for i, yy in enumerate(range(py + 30, py + ph, 46)):
        c.move_to(px, yy)
        c.line_to(px + (pw if i % 2 == 0 else 60), yy)
        c.set_source_rgba(*hexc("#7d8a96"))
        c.set_line_width(3)
        c.stroke()
    n = len(kids)
    s = 2.5 if n == 1 else 1.85
    for i, k in enumerate(kids):
        cx = px + pw / 2 if n == 1 else px + pw * (0.28 + 0.44 * i)
        draw_kid(c, cx, py + ph + (110 if n == 1 else 70), s, KIDS[k], face=0)
    c.restore()
    rrect(c, px, py, pw, ph, 18)
    c.set_source_rgba(*hexc(INK))
    c.set_line_width(6)
    c.stroke()
    img = surf_to_pil(surf)
    d = ImageDraw.Draw(img)
    d.text((cw / 2, 60), num_title, font=fit_font(num_title, cw - 80, 66), fill=hexpil("#FFD600"), anchor="mm")
    # placard
    pf = font(30)
    pwid = pf.getlength(placard) + 40
    d.rounded_rectangle([px + pw / 2 - pwid / 2, py + ph - 70, px + pw / 2 + pwid / 2, py + ph - 22], 8, fill=hexpil(INK))
    d.text((px + pw / 2, py + ph - 46), placard, font=pf, fill=(255, 255, 255, 255), anchor="mm")
    rx, maxw = 462, cw - 462 - 34
    y = 150
    lab = font(28, FONT_BOLD)
    d.text((rx, y), "NAME", font=lab, fill=hexpil("#8a8577"))
    nf = fit_font(name, maxw, 64)
    for ln in wrap(name, nf, maxw) if nf.size < 48 else [name]:
        pass
    nlines = wrap(name, font(56), maxw) if font(64).getlength(name) > maxw else [name]
    nf = font(56) if len(nlines) > 1 else font(64)
    y += 34
    for ln in nlines:
        d.text((rx, y), ln, font=nf, fill=hexpil(INK))
        y += nf.size + 4
    y += 16
    d.text((rx, y), "AGE", font=lab, fill=hexpil("#8a8577"))
    d.text((rx, y + 32), age, font=font(52), fill=hexpil(INK))
    y += 110
    d.text((rx, y), "KNOWN FOR", font=lab, fill=hexpil("#8a8577"))
    y += 36
    kf = font(38, FONT_BOLD)
    for ln in wrap(known, kf, maxw):
        d.text((rx, y), ln, font=kf, fill=hexpil(INK))
        y += 48
    return img.rotate(2.5, resample=Image.BICUBIC, expand=True)


def make_stamp(text, size=86, color="#E53935"):
    f = font(size)
    tw = f.getlength(text)
    im = Image.new("RGBA", (int(tw + 80), int(size * 1.7)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([6, 6, im.width - 6, im.height - 6], 18, outline=hexpil(color), width=10)
    d.text((im.width / 2, im.height / 2 + 2), text, font=f, fill=hexpil(color), anchor="mm")
    return im


CARDS = {
    "stop1": make_card("SUSPECT #1", "MARCUS", "9", "Sprinting out the door with one shoe on", ["marcus"], "PBC BUS #1"),
    "stop2": make_card("SUSPECTS #2 & #3", "THE RIVERA TWINS", "7 & 7", "Fighting over the window seat", ["twin", "twin"], "PBC BUS #2-3"),
    "stop3": make_card("SUSPECT #4", "LILY", "6", "Still in her Halloween costume", ["lily"], "PBC BUS #4"),
}
STAMP_BOARD = make_stamp("BOARDED", 74, "#2E9E44")
STAMP_CLOSED = make_stamp("CASE CLOSED", 110)


def title(img, text, y, size=110, fill="#FFFFFF", stroke="#1d1b26", sw=10, alpha=1.0, scale=1.0, ang=0.0):
    f = font(int(size * scale))
    tw = f.getlength(text) + 2 * sw + 20
    im = Image.new("RGBA", (int(tw), int(f.size * 1.5)), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((im.width / 2, im.height / 2), text, font=f, fill=hexpil(fill),
                            stroke_width=sw, stroke_fill=hexpil(stroke), anchor="mm")
    paste_rot(img, im, W / 2, y, ang, alpha)


def pill_label(img, text, y, x=W / 2, size=60, bg="#FFFFFF", fg=INK, alpha=1.0, check=False):
    f = font(size)
    tw = f.getlength(text)
    pad = 34
    cw = 70 if check else 0
    im = Image.new("RGBA", (int(tw + 2 * pad + cw), int(size * 1.6)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, im.width - 1, im.height - 1], im.height // 2, fill=hexpil(bg), outline=hexpil(INK), width=6)
    if check:
        cx, cy = pad + 22, im.height / 2
        d.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=hexpil("#2E9E44"))
        d.line([(cx - 13, cy + 1), (cx - 3, cy + 12), (cx + 15, cy - 11)], fill=(255, 255, 255, 255), width=8, joint="curve")
    d.text((pad + cw + tw / 2, im.height / 2 + 2), text, font=f, fill=hexpil(fg), anchor="mm")
    paste_rot(img, im, x, y, 0, alpha)


def captions(img, t):
    for p in PAGES:
        if p["s"] <= t < p["e"]:
            break
    else:
        return
    words = [w["w"].upper().strip("…") for w in p["words"]]
    size = 92
    f = font(size)
    gap = 26
    while sum(f.getlength(w) for w in words) + gap * (len(words) - 1) + 80 > W - 80 and size > 50:
        size -= 4
        f = font(size)
    widths = [f.getlength(w) for w in words]
    total = sum(widths) + gap * (len(words) - 1)
    enter = ease_back((t - p["s"]) / 0.14)
    y = 1470 + (1 - enter) * 40
    d = ImageDraw.Draw(img)
    x = W / 2 - total / 2
    for w, ww, wd in zip(words, widths, p["words"]):
        active = wd["s"] <= t < wd["e"] + 0.02 or (wd is p["words"][-1] and t >= wd["s"])
        if active:
            d.rounded_rectangle([x - 18, y - size * 0.68, x + ww + 18, y + size * 0.66], 26,
                                fill=hexpil("#FFE14D"), outline=hexpil(INK), width=6)
            d.text((x + ww / 2, y), w, font=f, fill=hexpil(INK), anchor="mm")
        else:
            d.text((x + ww / 2, y), w, font=f, fill=(255, 255, 255, 255), anchor="mm",
                   stroke_width=9, stroke_fill=hexpil(INK))
        x += ww + gap


# ---------------------------------------------------------------- map
MAP_PTS = [(170, 1300), (430, 1250), (700, 1300), (900, 1180), (700, 1060), (420, 1100), (180, 980),
           (300, 840), (580, 880), (860, 800), (760, 650), (470, 640)]
CHURCH_PT = (230, 520)


def route_points(n=400):
    pts = MAP_PTS + [CHURCH_PT]
    out = []
    for i in range(len(pts) - 1):
        p0 = pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[min(i + 2, len(pts) - 1)]
        for k in range(20):
            u = k / 20
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u ** 3) for j in (0, 1)))
    out.append(CHURCH_PT)
    return out


ROUTE = route_points()


def draw_map(c, img_cb, t, ts, te):
    c.rectangle(0, 0, W, H)
    paint(c, "#FFF1D6")
    c.set_line_width(26)
    c.set_source_rgba(*hexc("#F3DEB5"))
    for x in range(-200, W + 200, 190):
        c.move_to(x, 0)
        c.line_to(x + 260, H)
    for y in range(160, H, 210):
        c.move_to(0, y)
        c.line_to(W, y - 90)
    c.stroke()
    c.arc(960, 1720, 190, 0, 2 * math.pi)
    paint(c, "#B8E3F2")
    c.arc(120, 700, 110, 0, 2 * math.pi)
    paint(c, "#C8E6C9")
    prog = smooth((t - ts - 0.1) / ((te - ts) * 0.78))
    n = max(2, int(prog * (len(ROUTE) - 1)) + 1)
    c.set_line_cap(cairo.LINE_CAP_ROUND)
    c.set_line_join(cairo.LINE_JOIN_ROUND)
    c.move_to(*ROUTE[0])
    for p in ROUTE[1:]:
        c.line_to(*p)
    c.set_source_rgba(*hexc("#1d1b26", 0.15))
    c.set_line_width(22)
    c.set_dash([2, 34])
    c.stroke()
    c.set_dash([])
    c.move_to(*ROUTE[0])
    for p in ROUTE[1:n]:
        c.line_to(*p)
    c.set_source_rgba(*hexc(INK))
    c.set_line_width(24)
    c.stroke_preserve()
    c.set_source_rgba(*hexc("#FF5A5F"))
    c.set_line_width(14)
    c.stroke()
    reached = 0
    for i, (x, y) in enumerate(MAP_PTS):
        ri = i * 20
        if ri <= n - 1:
            reached = i + 1
            pop = ease_back(((n - 1 - ri) / 20.0) * 1.2)
            r = 30 * clamp(pop, 0, 1.3)
            c.arc(x, y, r, 0, 2 * math.pi)
            paint(c, "#FFD600", lw=6)
    # church pin
    cx, cy = CHURCH_PT
    glow = 0.5 + 0.5 * math.sin(t * 8)
    c.arc(cx, cy, 80 + 10 * glow, 0, 2 * math.pi)
    c.set_source_rgba(*hexc("#FFE14D", 0.35))
    c.fill()
    mini_church(c, cx, cy + 50, 0.55)
    bx, by = ROUTE[n - 1]
    if n < len(ROUTE):
        nx, ny = ROUTE[min(n, len(ROUTE) - 1)]
    else:
        nx, ny = bx + 1, by
    ang = math.atan2(ny - by, nx - bx)
    c.save()
    c.translate(bx, by)
    c.rotate(ang)
    rrect(c, -48, -26, 96, 52, 12)
    paint(c, "#FFC21A", lw=6)
    for wxx in (-34, -10, 14):
        c.rectangle(wxx, -16, 18, 16)
        paint(c, "#BFE6FF", lw=3)
    c.restore()
    return reached, prog


def mini_church(c, cx, base, s):
    w, h = 300 * s, 220 * s
    c.move_to(cx - w / 2 - 20 * s, base - h)
    c.line_to(cx, base - h - 120 * s)
    c.line_to(cx + w / 2 + 20 * s, base - h)
    c.close_path()
    paint(c, "#C62828", lw=6 * s + 2)
    c.rectangle(cx - w / 2, base - h, w, h)
    paint(c, "#FFFFFF", lw=6 * s + 2)
    c.rectangle(cx - 45 * s, base - h - 230 * s, 90 * s, 160 * s)
    paint(c, "#FFFFFF", lw=6 * s + 2)
    c.move_to(cx - 60 * s, base - h - 225 * s)
    c.line_to(cx, base - h - 320 * s)
    c.line_to(cx + 60 * s, base - h - 225 * s)
    c.close_path()
    paint(c, "#C62828", lw=6 * s + 2)
    c.rectangle(cx - 5 * s, base - h - 400 * s, 10 * s, 85 * s)
    c.rectangle(cx - 28 * s, base - h - 375 * s, 56 * s, 10 * s)
    paint(c, "#FFD600", lw=3 * s + 1)
    rrect(c, cx - 45 * s, base - 130 * s, 90 * s, 130 * s, 40 * s)
    paint(c, "#8D3B2F", lw=5 * s + 2)
    c.arc(cx, base - h - 160 * s, 24 * s, 0, 2 * math.pi)
    paint(c, "#90CAF9", lw=4 * s + 1)
    for wx in (cx - w / 2 + 30 * s, cx + w / 2 - 80 * s):
        rrect(c, wx, base - h + 40 * s, 50 * s, 90 * s, 25 * s)
        paint(c, "#90CAF9", lw=4 * s + 1)


# ---------------------------------------------------------------- frame
CONFETTI = [(rng.uniform(0, W), rng.uniform(-600, 0), rng.uniform(250, 520), rng.uniform(0, 6.28),
             rng.choice(["#FF5A5F", "#FFD600", "#2E86FF", "#2FCB71", "#AB47BC", "#ffffff"])) for _ in range(140)]
FLASH_AT = [L[k]["start"] - 0.1 for k in ("intro", "stop1", "party", "map", "church")]
PUNCH_AT = FLASH_AT + [0.0]
BPM = 120


def scene_at(t):
    for key, s, e in SCENES:
        if s <= t < e:
            return key, s, e
    return SCENES[-1]


def render(fi):
    t = fi / FPS
    key, ss, se = scene_at(t)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    S = scroll_at(t)
    moving = vel_factor(t) > 0.05
    zoom, zc = 1.0, (W / 2, H / 2)
    overlay = []        # deferred PIL draws
    after_bus_kids = []

    if key in ("hook", "intro", "stop1", "stop2", "stop3", "party"):
        dawn = clamp(t / 12)
        top = mix("#2A5FC9", "#3D9BFF", dawn)
        bot = mix("#FFB27A", "#FFE6B8", dawn)
        sky(c, top, bot)
        sun(c, t)
        clouds(c, t, S)
        hills(c, S)
        objs = []
        for k in range(int((S - 800) // 820), int((S + W + 800) // 820) + 1):
            hx = k * 820 + 300
            if all(abs(hx - sx) > 760 for sx in STOP_WX):
                objs.append(("house", hx, k))
            tx = k * 820 + 710
            if all(abs(tx - sx) > 330 for sx in STOP_WX):
                objs.append(("tree", tx, k))
        for i, sx in enumerate(STOP_WX):
            objs.append(("house", sx, i + 3))
        for kind, wx, k in objs:
            x = wx - S
            if -500 < x < W + 500:
                (house(c, x, k) if kind == "house" else tree(c, x, s=1.0 + 0.15 * (k % 3)))
        street(c, S, S * 1.6)
        party = key == "party"
        bob = (math.sin(t * 22) * 3 if moving else 0)
        x0, y0 = BUS_X0, BUS_Y0 + bob
        door = (x0 + DOOR_DX, 1335)
        # kids running from house to bus
        behind, front = [], []
        for si in STOP_INFO:
            hx = si["house_wx"] - S
            for j, (kname, bt) in enumerate(zip(si["kids"], si["board"])):
                rs = bt - 1.05
                if rs <= t < bt:
                    u = smooth((t - rs) / (bt - rs))
                    sx, sy = hx + (j * 50 - 25 if len(si["kids"]) > 1 else 0), GROUND + 4
                    px = sx + (door[0] - sx) * u
                    py = sy + (door[1] - 40 - sy) * u
                    hop = abs(math.sin(u * math.pi * 3)) * 22
                    sc = 1.0 + 0.12 * u
                    entry = (px, py - hop, sc, KIDS[kname], (t - rs) * 16, 1 if door[0] > sx else -1)
                    front.append(entry)
        for e in behind:
            draw_kid(c, e[0], e[1], e[2], e[3], e[4], True, e[5])
        draw_bus(c, x0, y0, heads_at(t, party), S / 56.0, t, party)
        for e in front:
            draw_kid(c, e[0], e[1], e[2], e[3], e[4], True, e[5])
        if party:
            for i in range(10):
                ph = (t * 0.9 + i * 0.37) % 1.0
                nx = x0 + 70 + (i * 71) % 560 + math.sin(ph * 9 + i) * 20
                ny = y0 + 30 - ph * 420
                overlay.append(("note", nx, ny, 1 - ph, i))
        img = surf_to_pil(surf)
        draw_bus_text(img, x0, y0)
        for o in overlay:
            note(img, *o[1:])
        # world-only zoom (overlays below stay put)
        wz, wc = 1.14, (W / 2, 1060)
        if key == "intro":
            lt = t - ss
            wz = 1.14 + 0.2 * smooth(lt / 0.6) - 0.2 * smooth((lt - (se - ss) + 0.5) / 0.5)
            wc = (500, 1150)
        elif party:
            beat = ((t - 0.25) * BPM / 60) % 1
            sh = math.exp(-beat * 9) * 12
            wz, wc = 1.18, (W / 2 + rng_jit(fi) * sh, 1060 + rng_jit(fi + 99) * sh)
        img = zoom_img(img, wz, wc)

        if key == "hook":
            u1 = ease_out((t - 0.05) / 0.45)
            paste_rot(img, TAPE1, W / 2 + (1 - u1) * 1400, 360, -7)
            u2 = ease_out((t - 0.35) / 0.45)
            paste_rot(img, TAPE2, W / 2 - (1 - u2) * 1400, 470, 5)
            if t > 0.9:
                title(img, "SUNDAY • 7:45 AM", 640, 92, alpha=clamp((t - 0.9) / 0.15),
                      scale=1 + 0.3 * (1 - ease_back((t - 0.9) / 0.25)))
        if key == "intro":
            if t > word_time("intro", "Let's"):
                u = (t - word_time("intro", "Let's"))
                title(img, "LET'S RIDE!", 470, 150, fill="#FFE14D", scale=1 + 0.5 * (1 - ease_back(u / 0.25)), ang=-4)
        elif key in CARDS:
            si = next(s for s in STOP_INFO if s["key"] == key)
            lt = t - ss
            enter = ease_back(lt / 0.4)
            leave = smooth((t - (se - 0.3)) / 0.3)
            cx = W / 2 + (1 - enter) * 1100 - leave * 1300
            paste_rot(img, CARDS[key], cx, 590, 0)
            bt = si["board"][-1] + 0.1
            if t >= bt:
                u = (t - bt) / 0.14
                paste_rot(img, STAMP_BOARD, cx - 215, 800, 12, alpha=clamp(u), scale=1 + 0.8 * (1 - ease_out(u)))
        elif party:
            for i, (wd, lab) in enumerate((("loud", "LOUD"), ("full", "FULL"), ("singing", "OFF KEY"))):
                wt = word_time("party", wd)
                if t >= wt:
                    u = ease_back((t - wt) / 0.25)
                    pill_label(img, lab, 330 + i * 135, x=W / 2 + (1 - u) * 900, size=64, check=True)
    elif key == "map":
        reached, prog = draw_map(c, None, t, ss, se)
        img = surf_to_pil(surf)
        kids_n = min(23, int(round(prog * 23)))
        pill_label(img, f"STOPS  {reached}/12", 300, x=290, size=56)
        pill_label(img, f"KIDS  {kids_n}/23", 300, x=800, size=56, bg="#FFE14D")
        if t >= word_time("map", "One"):
            u = t - word_time("map", "One")
            title(img, "ONE MISSION", 1470, 120, fill="#FF5A5F", scale=1 + 0.5 * (1 - ease_back(u / 0.25)), ang=-3)
    else:  # church
        lt = t - ss
        sky(c, "#4AA8FF", "#CDEBFF")
        sun(c, t)
        clouds(c, t, 0)
        hills(c, 3000)
        tree(c, 1010, s=1.1)
        mini_church(c, 800, GROUND, 1.25)
        street(c, 0, 0)
        arrive = ease_out(lt / 1.0)
        x0 = -820 + 590 * arrive
        moving = arrive < 0.98
        draw_bus(c, x0, BUS_Y0 + (math.sin(t * 22) * 3 if moving else 0), heads_at(t, True),
                 x0 / 56.0, t, party=not moving)
        door = (x0 + DOOR_DX, 1335)
        for i in range(12):
            rs = ss + 1.0 + i * 0.16
            if rs <= t < rs + 0.9:
                u = smooth((t - rs) / 0.9)
                e = EXTRA[i]
                k = dict(skin=e["skin"], hair=e["hair"], shirt=rng_shirt(i), pants="#2f3a56", shoe="#ffffff")
                if i == 3:
                    k = KIDS["lily"]
                if i == 0:
                    k = KIDS["marcus"]
                px = door[0] + (800 - door[0]) * u
                py = door[1] - 10 + (GROUND + 2 - door[1] + 10) * u
                draw_kid(c, px, py - abs(math.sin(u * 9)) * 16, 0.95 - 0.25 * u, k, (t - rs) * 16, True, 1)
        ct = word_time("church", "Case")
        if t >= ct:
            for (x, y, sp, ph, col) in CONFETTI:
                yy = y + (t - ct) * sp
                if yy < H:
                    c.save()
                    c.translate(x + math.sin(t * 3 + ph) * 30, yy)
                    c.rotate(t * 4 + ph)
                    c.rectangle(-9, -5, 18, 10)
                    c.set_source_rgba(*hexc(col))
                    c.fill()
                    c.restore()
        img = surf_to_pil(surf)
        draw_bus_text(img, x0, BUS_Y0)
        if t >= ct:
            u = (t - ct) / 0.16
            paste_rot(img, STAMP_CLOSED, W / 2, 700, 12, alpha=clamp(u), scale=1 + 1.2 * (1 - ease_out(u)))
            if u < 2.0:
                zc = (W / 2 + rng_jit(fi) * 14 * (1 - u / 2), H / 2)
                zoom = 1.03
        st = word_time("church", "See")
        if t >= st:
            u = t - st
            title(img, "SEE YOU NEXT SUNDAY", 330, 82, fill="#FFE14D", scale=1 + 0.4 * (1 - ease_back(u / 0.25)))
            pill_label(img, "PACIFIC BAPTIST CHURCH", 460, size=50, alpha=clamp(u / 0.2))

    # beat pulse + scene punch-in
    beat = ((t - 0.25) * BPM / 60) % 1
    zoom *= 1 + 0.012 * math.exp(-beat * 8)
    for pt in PUNCH_AT:
        if pt <= t < pt + 0.3:
            zoom *= 1 + 0.08 * (1 - ease_out((t - pt) / 0.3))
    img = zoom_img(img, zoom, zc)
    if not (key == "map" and t >= word_time("map", "One")):
        captions(img, t)
    for ft in FLASH_AT:
        if ft <= t < ft + 0.17:
            a = 1 - (t - ft) / 0.17
            img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(200 * a))))
    if t > TOTAL - 0.35:
        a = (t - (TOTAL - 0.35)) / 0.35
        img.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(140 * a))))
    return img.convert("RGB").tobytes()


def zoom_img(img, zoom, zc):
    if zoom <= 1.0005:
        return img
    cw, ch = W / zoom, H / zoom
    x0 = clamp(zc[0] - cw / 2, 0, W - cw)
    y0 = clamp(zc[1] - ch / 2, 0, H - ch)
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


def rng_jit(i):
    return math.sin(i * 12.9898) * 43758.5453 % 1 * 2 - 1


def mix(a, b, u):
    ca, cb = hexc(a), hexc(b)
    return "#" + "".join(f"{int((ca[i] + (cb[i] - ca[i]) * u) * 255):02x}" for i in range(3))


def note(img, x, y, alpha, i):
    sym = "♪♫♬"[i % 3]
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 76)
    ImageDraw.Draw(img).text((x, y), sym, font=f, fill=hexpil(["#FF5A5F", "#2E86FF", "#AB47BC"][i % 3], int(255 * alpha)),
                             stroke_width=4, stroke_fill=hexpil(INK, int(255 * alpha)), anchor="mm")


# ---------------------------------------------------------------- audio
SR = 48000


def build_audio():
    n = int(TOTAL * SR)
    tt = np.arange(n) / SR
    music = np.zeros(n)
    beat_len = 60 / BPM
    off = 0.25

    def add(buf, at, sig, g=1.0):
        i = int(at * SR)
        if i >= len(buf) or i < 0:
            return
        j = min(len(buf), i + len(sig))
        buf[i:j] += sig[:j - i] * g

    def env(d, k):
        x = np.arange(int(d * SR)) / SR
        return x, np.exp(-x * k)

    x, e = env(0.3, 18)
    kick = np.sin(2 * np.pi * (45 * x + 90 / 30 * (1 - np.exp(-x * 30)))) * e
    rs = np.random.RandomState(1)
    x, e = env(0.18, 22)
    clap = rs.randn(len(x)) * e
    clap = np.convolve(clap, np.ones(3) / 3, "same")
    x, e = env(0.05, 90)
    hat = np.diff(rs.randn(len(x) + 1)) * e
    roots = [130.81, 110.0, 87.31, 98.0]
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    nbeats = int((TOTAL - off) / beat_len) + 1
    for b in range(nbeats):
        at = off + b * beat_len
        bar = (b // 4) % 4
        add(music, at, kick, 0.9)
        if b % 2 == 1:
            add(music, at, clap, 0.35)
        add(music, at + beat_len / 2, hat, 0.22)
        add(music, at, hat, 0.08)
        for h in range(2):
            ft = roots[bar] * (1 if h == 0 else 2)
            x, e = env(beat_len / 2 * 0.9, 6)
            add(music, at + h * beat_len / 2, np.tanh(3 * np.sin(2 * np.pi * ft / 2 * x)) * e, 0.28)
        if b % 2 == 1:
            x, e = env(0.22, 10)
            st = sum(np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + np.sin(2 * np.pi * f * 2 * x) for f in chords[bar])
            st = np.convolve(st, np.ones(6) / 6, "same")
            add(music, at + beat_len / 2, st * e, 0.06)
    music[: int(off * SR)] *= 0
    fade = np.clip((TOTAL - tt) / 0.6, 0, 1)
    music *= fade

    voice = np.zeros(n)
    act = np.zeros(n)
    for ln in LINES:
        a, sr = sf.read(ln["path"])
        a = np.interp(np.arange(int(len(a) * SR / sr)) / SR, np.arange(len(a)) / sr, a)
        add(voice, ln["start"], a, 1.0)
        i0, i1 = int(ln["start"] * SR), int(ln["end"] * SR)
        act[i0:i1] = 1
    k = int(0.12 * SR)
    act = np.convolve(act, np.ones(k) / k, "same")
    music *= 0.32 * (1 - 0.45 * act)

    sfx = np.zeros(n)
    x, e = env(0.28, 4)
    horn = (np.tanh(2 * np.sin(2 * np.pi * 330 * x)) + np.tanh(2 * np.sin(2 * np.pi * 415 * x))) * np.minimum(1, (0.28 - x) * 30)
    for at in (0.02, 0.36):
        add(sfx, at, horn, 0.10)
    x, e = env(0.7, 6)
    ding = (np.sin(2 * np.pi * 1318.5 * x) + 0.6 * np.sin(2 * np.pi * 1975.5 * x)) * e
    x = np.arange(int(0.35 * SR)) / SR
    wh = np.convolve(rs.randn(len(x)), np.ones(25) / 25, "same") * np.sin(np.pi * x / 0.35) ** 2
    x, e = env(0.25, 14)
    thump = (np.sin(2 * np.pi * 70 * x) + 0.4 * rs.randn(len(x)) * np.exp(-x * 40)) * e
    x, e = env(0.08, 30)
    pop = np.sin(2 * np.pi * (500 * x + 4000 * x * x)) * e
    for si in STOP_INFO:
        add(sfx, L[si["key"]]["start"] - 0.05, wh, 0.9)
        for bt in si["board"]:
            add(sfx, bt, ding, 0.12)
        add(sfx, si["board"][-1] + 0.1, thump, 0.5)
    for wd in ("loud", "full", "singing"):
        add(sfx, word_time("party", wd), pop, 0.25)
    add(sfx, word_time("intro", "Let's"), pop, 0.25)
    add(sfx, word_time("map", "One"), thump, 0.45)
    add(sfx, word_time("church", "Case"), thump, 0.7)
    for at in (L["church"]["start"] + 0.9,):
        add(sfx, at, horn, 0.10)
        add(sfx, at + 0.32, horn, 0.10)
    for ft in FLASH_AT:
        add(sfx, ft - 0.12, wh, 0.6)
    mixd = voice + music + sfx
    mixd /= np.max(np.abs(mixd)) * 1.12
    sf.write("work/mix.wav", np.stack([mixd, mixd], 1).astype(np.float32), SR)


def write_srt():
    def ts(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    with open(f"out/{SLUG}.srt", "w") as f:
        for i, ln in enumerate(LINES, 1):
            f.write(f"{i}\n{ts(ln['start'])} --> {ts(ln['end'])}\n{ln['text']}\n\n")


if __name__ == "__main__":
    os.makedirs("out", exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "still":
        for tt in map(float, sys.argv[2:]):
            Image.frombytes("RGB", (W, H), render(int(tt * FPS))).save(f"work/still_{tt:05.2f}.jpg", quality=88)
        sys.exit()
    build_audio()
    write_srt()
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", "work/mix.wav",
                           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                           "-c:v", "libx264", "-profile:v", "high", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart",
                           f"out/{SLUG}.mp4"], stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for i, fr in enumerate(pool.imap(render, range(NFRAMES), chunksize=6)):
            ff.stdin.write(fr)
            if i % 150 == 0:
                print(f"frame {i}/{NFRAMES}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("done", TOTAL)
