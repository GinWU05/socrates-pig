"""解码结果图里的二维码，模拟微信长按识别。
解码器：zxing-cpp；OpenCV wechat_qrcode（微信开源的识别引擎，设置 WECHAT_MODELS=模型目录 时启用 CNN 检测 + 超分模型）。
变体：原图、50%、33% 缩小，以及 50% + JPEG 质量 70（模拟微信转发压缩）。
用法：python scripts/qr-decode.py <png>... [--expect URL]
依赖：pip install zxing-cpp opencv-contrib-python-headless pillow
模型：https://github.com/WeChatCV/opencv_3rdparty/tree/wechat_qrcode（detect/sr 的 .prototxt 与 .caffemodel）"""
import io, os, sys
from PIL import Image
import numpy as np, zxingcpp, cv2

args = sys.argv[1:]; expect = None
if '--expect' in args: i = args.index('--expect'); expect = args[i + 1]; del args[i:i + 2]
md = os.environ.get('WECHAT_MODELS')
if md:
    wx = cv2.wechat_qrcode_WeChatQRCode(*[os.path.join(md, f) for f in ('detect.prototxt', 'detect.caffemodel', 'sr.prototxt', 'sr.caffemodel')]); wxname = 'wechat(cnn)'
else:
    wx = cv2.wechat_qrcode_WeChatQRCode(); wxname = 'wechat(no-model)'

def variants(im):
    yield '100%', im
    for s in (.5, .33):
        yield f'{int(s*100)}%', im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    h = im.resize((im.width // 2, im.height // 2), Image.LANCZOS); b = io.BytesIO(); h.save(b, 'JPEG', quality=70)
    yield '50%+jpg70', Image.open(io.BytesIO(b.getvalue())).convert('RGB')

good = lambda t: t in (expect, expect + '/') if expect else bool(t)
ok_all = True
for path in args:
    im = Image.open(path).convert('RGB')
    for name, x in variants(im):
        z = [r.text for r in zxingcpp.read_barcodes(x) if r.format == zxingcpp.BarcodeFormat.QRCode]
        w, _ = wx.detectAndDecode(cv2.cvtColor(np.asarray(x), cv2.COLOR_RGB2BGR)); w = list(w)
        ok = bool(z) and all(map(good, z)) and bool(w) and all(map(good, w))
        ok_all &= ok
        print(f'{"OK  " if ok else "FAIL"} {os.path.basename(path)} @{name:<9} {x.width}x{x.height}  zxing={z}  {wxname}={w}')
sys.exit(0 if ok_all else 1)
