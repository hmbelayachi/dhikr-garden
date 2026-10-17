"""Generate original flat-design app icons for Dhikr Garden Grower.
Deep-green rounded square, gold crescent moon, small cream flower with gold center.
Pure PIL, no external assets."""
import math
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))

DEEP = (13, 77, 58, 255)        # deep garden green
DEEP_DARK = (9, 56, 43, 255)    # darker green for subtle shading
GOLD = (232, 184, 75, 255)      # gold crescent
CREAM = (255, 250, 238, 255)    # cream petals
LEAF = (46, 139, 87, 255)       # leaf green


def _draw_art(d, size, ox, oy, scale):
    """Draw crescent + flower + sparkles, centered at (ox, oy), scaled."""
    # --- gold crescent ---
    cx, cy = ox - scale * 0.10, oy - scale * 0.14
    cr = scale * 0.34
    d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=GOLD)
    # bite taken out to form the crescent
    bx, by = cx + cr * 0.52, cy - cr * 0.22
    br = cr * 0.88
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=DEEP)

    # --- small flower, lower right ---
    fx, fy = ox + scale * 0.22, oy + scale * 0.30
    pr = scale * 0.075
    for a in range(6):
        ang = a * 2 * math.pi / 6 - math.pi / 2
        px = fx + pr * 1.9 * math.cos(ang)
        py = fy + pr * 1.9 * math.sin(ang)
        d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=CREAM)
    d.ellipse([fx - pr * 0.95, fy - pr * 0.95,
               fx + pr * 0.95, fy + pr * 0.95], fill=GOLD)

    # --- little leaf under the flower ---
    lx, ly = fx - pr * 2.6, fy + pr * 1.6
    d.ellipse([lx - pr * 1.4, ly - pr * 0.55,
               lx + pr * 1.4, ly + pr * 0.55], fill=LEAF)

    # --- sparkles ---
    for (sx, sy, sr) in [(-0.34, -0.36, 0.028), (0.30, -0.28, 0.020),
                         (-0.16, 0.38, 0.018), (0.05, -0.42, 0.016)]:
        x, y = ox + sx * scale, oy + sy * scale
        r = sr * scale
        # 4-point sparkle: two thin ellipses
        d.ellipse([x - r * 2.6, y - r * 0.7, x + r * 2.6, y + r * 0.7], fill=CREAM)
        d.ellipse([x - r * 0.7, y - r * 2.6, x + r * 0.7, y + r * 2.6], fill=CREAM)


def make_icon(size, maskable=False, apple=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        # full-bleed background (maskable safe zone: art kept central)
        d.rectangle([0, 0, size, size], fill=DEEP)
        _draw_art(d, size, size / 2, size / 2, size * 0.62)
    else:
        d.rounded_rectangle([0, 0, size, size], radius=int(size * 0.225), fill=DEEP)
        # subtle inner shading ring
        inset = int(size * 0.03)
        d.rounded_rectangle([inset, inset, size - inset, size - inset],
                            radius=int(size * 0.20), outline=DEEP_DARK, width=max(1, size // 128))
        _draw_art(d, size, size / 2, size / 2, size * 0.80)
    if apple:
        # iOS wants opaque RGB
        bg = Image.new("RGB", (size, size), DEEP[:3])
        bg.paste(img, mask=img.split()[3])
        return bg
    return img


def main():
    jobs = [
        ("icon-192.png", 192, False, False),
        ("icon-512.png", 512, False, False),
        ("icon-maskable-512.png", 512, True, False),
        ("apple-touch-icon.png", 180, False, True),
    ]
    for name, size, maskable, apple in jobs:
        path = os.path.join(HERE, name)
        make_icon(size, maskable, apple).save(path)
        print("wrote", path, size)

    # verify
    for name, size, _, _ in jobs:
        path = os.path.join(HERE, name)
        im = Image.open(path)
        assert im.size == (size, size), (name, im.size)
        print("verified", name, im.size, im.mode)


if __name__ == "__main__":
    main()
