// 「保存图片」按浏览器环境的行为：
//  (a) iPhone 微信内置浏览器 → 弹窗是 dataURL 的 <img>、显示「长按图片保存到相册」、不下载、全程不产生 blob: 地址、不调分享
//  (b) iOS Safari（桩 navigator.share/canShare）→ 点「保存图片」调用 share 且带一个 PNG File、不下载；无 canShare 时只提示长按
//  (c) 桌面 Chrome → 触发真实下载
// 用法：node test/save-modes.js [url]   截图到 shots/wechat/，导出的图供 scripts/qr-decode.py 解码
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = process.argv[2] || fileUrl('dist/index.html'), OUT = shotsDir('wechat');
const UA = {
  wechat: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003133) NetType/WIFI Language/zh_CN',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
};
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++ };

// 页面脚本之前注入：记录 createObjectURL 调用；可选地装上 share/canShare 桩
function init(opt){
  window.__blobUrls = [];
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = o => { const u = orig(o); window.__blobUrls.push(u); return u };
  window.__shareCalls = [];
  if (opt.share) {
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: d => !!(d && d.files && d.files.length && d.files.every(f => f instanceof File)) });
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: d => {
      window.__shareCalls.push({ n: d.files ? d.files.length : 0, isFile: !!(d.files && d.files[0] instanceof File), type: d.files && d.files[0] && d.files[0].type, size: d.files && d.files[0] && d.files[0].size });
      return Promise.resolve(); } });
  } else {
    // 微信 / 旧版 iOS：没有 navigator.share
    try { delete Navigator.prototype.share; delete Navigator.prototype.canShare } catch (_) {}
  }
}

async function open(b, { ua, mobile, share, vp = { width: 390, height: 844 } }){
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile, userAgent: ua, reducedMotion: 'reduce', acceptDownloads: true });
  await ctx.addInitScript(init, { share });
  const p = await ctx.newPage(); const errs = [], downloads = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  p.on('download', d => downloads.push(d));
  await p.goto(URL); await p.waitForTimeout(700);
  return { ctx, p, errs, downloads };
}
async function toModal(p){
  await p.click('#speedBtn'); await p.waitForTimeout(400);
  await p.click('.qcard:not(.out) .opt[data-q="SP"]'); await p.waitForTimeout(400);
  await p.click('.qcard:not(.out) .opt[data-q="PH"]'); await p.waitForTimeout(1200);
  await p.click('#shareBtn'); await p.waitForSelector('#shareModal.open');
  await p.waitForFunction(() => { const i = document.getElementById('posterImg'); return i.src && i.complete && i.naturalWidth > 0 }, null, { timeout: 15000 });
  await p.waitForTimeout(400);
}
const vis = (p, sel) => p.$eval(sel, e => !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0);
const saveDataUrl = async (p, file) => { const src = await p.getAttribute('#posterImg', 'src'); fs.writeFileSync(file, Buffer.from(src.split(',')[1], 'base64')); return src };

(async () => {
  const b = await launch(chromium);

  // ---------- (a) iPhone 微信 ----------
  console.log('== (a) iPhone WeChat');
  { // 装上 share 桩：即使环境「有」share，微信模式下也不能用它
    const { ctx, p, errs, downloads } = await open(b, { ua: UA.wechat, mobile: true, share: true });
    ok(await p.evaluate(() => document.documentElement.dataset.save) === 'longpress', 'detected save mode = longpress');
    await p.screenshot({ path: OUT + 'cover.png' });
    await toModal(p);
    const src = await p.getAttribute('#posterImg', 'src');
    ok(/^data:image\/(png|jpeg);base64,/.test(src), `preview <img> src is a data: URL (${src.slice(0, 22)}…, ${(src.length / 1e6).toFixed(1)}MB)`);
    ok(await vis(p, '#posterImg'), 'preview image visible');
    const tip = await p.textContent('#shareTip');
    ok(tip.includes('长按图片保存到相册') && await vis(p, '#shareTip'), `hint visible: 「${tip}」`);
    ok(!(await vis(p, '#nativeShareBtn')), '「分享」 hidden in WeChat');
    const press = await p.evaluate(() => { const i = document.getElementById('posterImg'), r = i.getBoundingClientRect(), cs = getComputedStyle(i);
      const top = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight / 2));
      return { pe: cs.pointerEvents, callout: cs.webkitTouchCallout || '(n/a)', us: cs.userSelect || cs.webkitUserSelect, topIsImg: top === i, drag: i.draggable } });
    ok(press.pe !== 'none' && press.topIsImg && press.us !== 'none' && press.callout !== 'none', `image long-pressable ${JSON.stringify(press)}`);
    await p.screenshot({ path: OUT + 'modal.png' });
    // 点「保存图片」：不下载、闪提示
    const href = await p.getAttribute('#saveBtn', 'href'), dlAttr = await p.getAttribute('#saveBtn', 'download');
    ok(href === null && dlAttr === null, `保存图片 has no href/download (href=${href}, download=${dlAttr})`);
    await p.tap('#saveBtn'); await p.waitForTimeout(1500);
    ok(downloads.length === 0, `no download event (${downloads.length})`);
    ok(await p.$eval('#toast', e => e.classList.contains('show') && /长按/.test(e.textContent)), 'tap 保存图片 -> long-press hint toast');
    ok(await p.evaluate(() => window.__shareCalls.length) === 0, 'navigator.share never called');
    const blob = await p.evaluate(() => ({ created: window.__blobUrls.length,
      // DOM 里（去掉内联脚本源码后）是否出现 blob:；以及是否加载过 blob: 资源
      inDom: (() => { const d = document.documentElement.cloneNode(true); d.querySelectorAll('script').forEach(s => s.remove()); return /blob:(https?:|null\/|file:)/.test(d.outerHTML) })(), // 真正的 blob 地址形如 blob:<origin>/<uuid>（CSS 变量 --blob: 不算）
      loaded: performance.getEntriesByType('resource').some(r => /^blob:/.test(r.name)),
      attrs: [...document.querySelectorAll('[src],[href]')].some(e => /^blob:/.test(e.getAttribute('src') || e.getAttribute('href') || '')) }));
    ok(blob.created === 0 && !blob.inDom && !blob.attrs, `no blob: URL anywhere ${JSON.stringify(blob)}`);
    await saveDataUrl(p, OUT + 'wechat-img.png');
    // 页脚截图（结果页最底部）
    await p.click('#closeShare'); await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + 'footer.png' });
    const ver = await p.$$eval('.ver', es => es.map(e => e.textContent)); console.log('  footer:', ver.join(' | '));
    ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
    await ctx.close();
  }
  { // 375x667 也看一下排版
    const { ctx, p } = await open(b, { ua: UA.wechat, mobile: true, share: false, vp: { width: 375, height: 667 } });
    await toModal(p); await p.screenshot({ path: OUT + 'modal-375x667.png' });
    ok(await p.evaluate(() => { const r = document.getElementById('shareTip').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }), '375x667 hint on screen');
    await ctx.close();
  }

  // ---------- (b) iOS Safari ----------
  console.log('== (b) iOS Safari');
  { const { ctx, p, errs, downloads } = await open(b, { ua: UA.safari, mobile: true, share: true });
    ok(await p.evaluate(() => document.documentElement.dataset.save) === 'ios', 'detected save mode = ios');
    await toModal(p);
    ok(/^data:image\//.test(await p.getAttribute('#posterImg', 'src')), 'preview <img> src is a data: URL');
    ok(await p.getAttribute('#saveBtn', 'href') === null, '保存图片 is not a download link');
    const n = await p.evaluate(() => { document.getElementById('saveBtn').click(); return window.__shareCalls.length });
    ok(n === 1, `保存图片 -> navigator.share called synchronously (${n})`);
    const c = await p.evaluate(() => window.__shareCalls[0]);
    ok(c && c.n === 1 && c.isFile && c.type === 'image/png' && c.size > 10000, `share got one PNG File ${JSON.stringify(c)}`);
    await p.waitForTimeout(800);
    ok(downloads.length === 0, 'no download event');
    ok(await p.evaluate(() => window.__blobUrls.length) === 0, 'no blob: URL created');
    ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
    await ctx.close(); }
  { const { ctx, p, downloads } = await open(b, { ua: UA.safari, mobile: true, share: false });
    await toModal(p);
    await p.tap('#saveBtn'); await p.waitForTimeout(1200);
    ok(downloads.length === 0 && await p.$eval('#toast', e => e.classList.contains('show') && /长按/.test(e.textContent)), 'iOS without canShare: 保存图片 -> long-press hint, no download');
    await ctx.close(); }

  // ---------- (c) 桌面 Chrome ----------
  console.log('== (c) desktop Chrome');
  { const { ctx, p, errs } = await open(b, { ua: UA.desktop, mobile: false, share: false, vp: { width: 1280, height: 900 } });
    ok(await p.evaluate(() => document.documentElement.dataset.save) === 'download', 'detected save mode = download');
    await toModal(p);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.click('#saveBtn')]);
    const path = OUT + 'desktop-download.png'; await dl.saveAs(path);
    ok(/\.png$/.test(dl.suggestedFilename()) && fs.statSync(path).size > 10000, `download event: ${dl.suggestedFilename()} ${fs.statSync(path).size}B`);
    ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
    await ctx.close(); }

  await b.close();
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
