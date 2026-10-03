"""结果图上下留白检查：测量首/末内容行，并模拟刘海/灵动岛 iPhone 全屏预览（按宽度铺满）。
用法：python scripts/notch-check.py <before.png> <after.png> <out-compare.png> [ref.png]
依赖：pillow numpy"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def content_rows(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    # 锐利边缘检测（文字、描边）：相邻像素差；背景渐变/光晕是平滑的，不会被当成内容
    dx = np.abs(np.diff(a, axis=1)).sum(axis=2); dy = np.abs(np.diff(a, axis=0)).sum(axis=2)
    edge = np.zeros(a.shape[:2], bool); edge[:, 1:] |= dx > 18; edge[1:, :] |= dy > 18
    rows = edge.sum(axis=1) > 2
    H, W = rows.shape[0], a.shape[1]
    top = int(np.argmax(rows)); bot = int(H - 1 - np.argmax(rows[::-1]))
    return W, H, top, H - 1 - bot

DEVICES = [('iPhone 15/16 Pro', 393, 852, 59, 34), ('iPhone Pro Max', 430, 932, 59, 34)]

def report(tag, path):
    W, H, t, b = content_rows(path)
    print(f'{tag}: {W}x{H}  top blank {t}px ({t/H*100:.2f}% H, {t/W:.4f} W)  bottom blank {b}px ({b/H*100:.2f}% H, {b/W:.4f} W)')
    res = []
    for name, sw, sh, st, sb in DEVICES:
        s = sw / W
        ft, fb = t * s, b * s                     # 按宽度铺满：滚到顶 / 滚到底
        fit = min(sw / W, sh / H); ah = H * fit; off = (sh - ah) / 2
        at, ab = off + t * fit, off + b * fit     # 整图适配（缩小看全图）
        ok = ft >= st and fb >= sb
        print(f'   {name} {sw}x{sh}: fit-width top {ft:.1f}pt (need {st}) bottom {fb:.1f}pt (need {sb}) -> {"OK" if ok else "COVERED"};'
              f'  aspect-fit top {at:.1f}pt bottom {ab:.1f}pt')
        res.append(ok)
    return (W, H, t, b), all(res)

def frame(img, sw, sh, st, sb, mode, scale=2):
    W, H = img.size; S = sw * scale
    k = S / W; rs = img.resize((S, round(H * k)), Image.LANCZOS)
    scr = Image.new('RGB', (S, sh * scale), (0, 0, 0))
    if mode == 'top': scr.paste(rs, (0, 0))
    else: scr.paste(rs, (0, sh * scale - rs.height))
    ov = Image.new('RGBA', scr.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.rectangle([0, 0, S, st * scale], fill=(255, 40, 60, 70))                       # 顶部安全区
    iw, ih, iy = 126 * scale, 37 * scale, 11 * scale                                 # 灵动岛
    d.rounded_rectangle([S/2 - iw/2, iy, S/2 + iw/2, iy + ih], radius=ih/2, fill=(0, 0, 0, 255))
    d.rectangle([0, (sh - sb) * scale, S, sh * scale], fill=(255, 40, 60, 70))       # 底部 Home 区
    bw = 134 * scale; d.rounded_rectangle([S/2 - bw/2, (sh - 13) * scale, S/2 + bw/2, (sh - 8) * scale], radius=3 * scale, fill=(255, 255, 255, 230))
    scr = Image.alpha_composite(scr.convert('RGBA'), ov)
    d = ImageDraw.Draw(scr); d.rounded_rectangle([0, 0, S - 1, sh * scale - 1], radius=48 * scale, outline=(120, 120, 130), width=4)
    return scr

def compare(before, after, out):
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 34)
    small = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 26)
    rows = []
    for tag, p in [('BEFORE 修改前', before), ('AFTER 修改后', after)]:
        im = Image.open(p).convert('RGB')
        fr = []
        for name, sw, sh, st, sb in DEVICES:
            for mode in ('top', 'bottom'):
                fr.append((f'{sw}×{sh} 滚到{"顶" if mode=="top" else "底"}', frame(im, sw, sh, st, sb, mode)))
        rows.append((tag, fr))
    gap, lab, head = 30, 50, 70
    cw = sum(f.width for _, f in rows[0][1]) + gap * (len(rows[0][1]) + 1)
    ch = head + sum(lab + max(f.height for _, f in r) + gap for _, r in rows) + 60
    canvas = Image.new('RGB', (cw, ch), (24, 22, 32)); d = ImageDraw.Draw(canvas)
    d.text((gap, 14), '结果图全屏预览（按宽度铺满）· 红色 = 灵动岛/状态栏安全区 59pt 与 Home 指示条 34pt', font=font, fill=(235, 232, 245))
    y = head
    for tag, fr in rows:
        d.text((gap, y + 4), tag, font=font, fill=(255, 210, 120) if 'BEFORE' in tag else (140, 230, 170))
        x = gap; y2 = y + lab
        for name, f in fr:
            canvas.paste(f, (x, y2)); d.text((x + 10, y2 + f.height + 4), name, font=small, fill=(200, 196, 215)); x += f.width + gap
        y = y2 + max(f.height for _, f in fr) + gap + 30
    canvas.save(out, optimize=True); print('saved', out, canvas.size)

if __name__ == '__main__':
    before, after, out = sys.argv[1:4]
    if len(sys.argv) > 4: report('REFERENCE', sys.argv[4])
    report('BEFORE', before); _, ok = report('AFTER', after)
    compare(before, after, out)
    sys.exit(0 if ok else 1)
