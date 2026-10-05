// 「保存图片」按浏览器环境的行为：
//  (a) iPhone 微信内置浏览器 → 弹窗是 JPEG dataURL 的 <img>、显示长按提示、「保存图片」不下载、全程不产生 blob: 地址；
//      「分享」按功能检测：canShare({files}) 为真 → 显示并调用 share（带 PNG File）；不支持 → 隐藏、只提示长按；
//      share 被拒：AbortError 静默，其它错误 → 长按提示
//  (b) iOS Safari（桩 navigator.share/canShare）→ 点「保存图片」调用 share 且带一个 PNG File、不下载；无 canShare 时只提示长按
//  (c) 桌面 Chrome → 触发真实下载
// 用法：node test/save-modes.js [url]   截图到 shots/wechat3/（可用 SP_SHOTS 改目录），导出的图供 scripts/qr-decode.py 解码
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = process.argv[2] || fileUrl('dist/index.html'), OUT = shotsDir(process.env.SP_SHOTS || 'wechat3');
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
    // opt.noFiles：有 share 但 canShare 不接受文件；opt.shareErr：share 以该名字的 DOMException 拒绝
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: d => !opt.noFiles && !!(d && d.files && d.files.length && d.files.every(f => f instanceof File)) });
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: d => {
      window.__shareCalls.push({ n: d.files ? d.files.length : 0, isFile: !!(d.files && d.files[0] instanceof File), type: d.files && d.files[0] && d.files[0].type, size: d.files && d.files[0] && d.files[0].size, name: d.files && d.files[0] && d.files[0].name });
      return opt.shareErr ? Promise.reject(new DOMException('stub', opt.shareErr)) : Promise.resolve(); } });
  } else {
    // 微信 / 旧版 iOS：没有 navigator.share
    try { delete Navigator.prototype.share; delete Navigator.prototype.canShare } catch (_) {}
  }
}

async function open(b, { ua, mobile, share, noFiles = false, shareErr = null, vp = { width: 390, height: 844 } }){
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile, userAgent: ua, reducedMotion: 'reduce', acceptDownloads: true });
  await ctx.addInitScript(init, { share, noFiles, shareErr });
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
  { // 微信 + 支持文件分享（桩 canShare 为真）：「分享」可见并可用；「保存图片」仍不下载、只提示长按
    const { ctx, p, errs, downloads } = await open(b, { ua: UA.wechat, mobile: true, share: true });
    ok(await p.evaluate(() => document.documentElement.dataset.save) === 'longpress', 'detected save mode = longpress');
    await p.screenshot({ path: OUT + 'cover.png' });
    await toModal(p);
    const src = await p.getAttribute('#posterImg', 'src');
    ok(/^data:image\/jpeg;base64,/.test(src), `preview <img> src is a JPEG data: URL (${src.slice(0, 23)}…)`);
    ok(src.length < 1.1e6, `preview dataURL small enough: ${src.length} chars (${(src.length / 1024).toFixed(0)} KB)`);
    const dims = await p.$eval('#posterImg', i => [i.naturalWidth, i.naturalHeight]); console.log('  preview image', dims.join('x'));
    // 防止 iOS 图片拖拽浮起 + 保证长按菜单：draggable=false、-webkit-user-drag:none、图片和容器无 transform/filter/动画、弹窗不用 backdrop-filter
    const lp = await p.evaluate(() => {
      const i = document.getElementById('posterImg'), box = document.getElementById('posterBox'), sheet = i.closest('.sheet'), modal = document.getElementById('shareModal');
      const cs = e => getComputedStyle(e);
      const anc = []; for (let e = i.parentElement; e; e = e.parentElement) anc.push({ tag: e.tagName.toLowerCase() + (e.id ? '#' + e.id : e.className ? '.' + String(e.className).split(' ')[0] : ''), us: cs(e).userSelect, callout: cs(e).webkitTouchCallout });
      return { draggableProp: i.draggable, draggableAttr: i.getAttribute('draggable'), userDrag: cs(i).webkitUserDrag, imgUserSelect: cs(i).userSelect,
        imgT: cs(i).transform, imgF: cs(i).filter, imgAnim: cs(i).animationName, boxT: cs(box).transform, boxF: cs(box).filter, sheetT: cs(sheet).transform,
        modalBackdrop: cs(modal).backdropFilter || cs(modal).webkitBackdropFilter || 'none', display: cs(i).display, width: i.style.width || cs(i).width, ancestors: anc };
    });
    ok(lp.draggableProp === false && lp.draggableAttr === 'false', `img draggable=false (prop ${lp.draggableProp}, attr ${lp.draggableAttr})`);
    ok(lp.userDrag === 'none', `img -webkit-user-drag: ${lp.userDrag}`);
    ok(lp.imgT === 'none' && lp.imgF === 'none' && lp.imgAnim === 'none' && lp.boxT === 'none' && lp.boxF === 'none' && lp.sheetT === 'none', `no transform/filter/animation on img/container/sheet ${JSON.stringify({ i: lp.imgT, f: lp.imgF, a: lp.imgAnim, b: lp.boxT, bf: lp.boxF, s: lp.sheetT })}`);
    ok(lp.modalBackdrop === 'none', `modal backdrop-filter: ${lp.modalBackdrop}`);
    ok(lp.display === 'block', 'img display:block, width 100%, height auto');
    ok(lp.imgUserSelect !== 'none', `img user-select: ${lp.imgUserSelect}`);
    // Chromium 不计算 -webkit-touch-callout：若能计算，图片与所有祖先都不能是 none；否则检查页面 CSS 源码
    const calloutComputable = lp.ancestors.some(a => a.callout !== undefined);
    if (calloutComputable) ok(lp.ancestors.every(a => a.callout !== 'none'), 'touch-callout not none on img ancestors');
    const css = await p.evaluate(() => [...document.querySelectorAll('style')].map(s => s.textContent).join('\n'));
    ok(!/touch-callout\s*:\s*none/.test(css), 'no -webkit-touch-callout:none anywhere in page CSS');
    ok(/\.modal \.poster\{[^}]*-webkit-touch-callout:default/.test(css) && /\.modal \.posterbox\{-webkit-touch-callout:default\}/.test(css), 'img and its wrapper explicitly -webkit-touch-callout:default');
    // 全站禁止文字选择；输入控件可选可输入
    const sel = await p.evaluate(() => { const inp = document.createElement('input'), ta = document.createElement('textarea'); document.body.append(inp, ta);
      const r = { body: getComputedStyle(document.body).userSelect, html: getComputedStyle(document.documentElement).userSelect, tip: getComputedStyle(document.getElementById('shareTip')).userSelect,
        title: getComputedStyle(document.getElementById('rTitle')).userSelect, input: getComputedStyle(inp).userSelect, textarea: getComputedStyle(ta).userSelect }; inp.remove(); ta.remove(); return r });
    ok(sel.body === 'none' && sel.html === 'none' && sel.tip === 'none' && sel.title === 'none', `site-wide text selection disabled ${JSON.stringify(sel)}`);
    ok(sel.input === 'text' && sel.textarea === 'text', 'input/textarea stay selectable (user-select:text)');
    // 预览区内的触摸 / 手势 / 双击事件不会被 preventDefault（单指、双指、快速连点都试）
    const pd = await p.evaluate(() => { const i = document.getElementById('posterImg');
      const T = id => new Touch({ identifier: id, target: i, clientX: 100 + id, clientY: 200 });
      const fire = (type, touches) => { const e = new TouchEvent(type, { cancelable: true, bubbles: true, touches, targetTouches: touches, changedTouches: touches }); i.dispatchEvent(e); return e.defaultPrevented };
      const r = { start1: fire('touchstart', [T(1)]), start2: fire('touchstart', [T(1), T(2)]), move2: fire('touchmove', [T(1), T(2)]), end: fire('touchend', []), end2: fire('touchend', []) };
      const g = new Event('gesturestart', { cancelable: true, bubbles: true }); i.dispatchEvent(g); r.gesture = g.defaultPrevented;
      const d = new MouseEvent('dblclick', { cancelable: true, bubbles: true }); i.dispatchEvent(d); r.dblclick = d.defaultPrevented;
      const c = new MouseEvent('contextmenu', { cancelable: true, bubbles: true }); i.dispatchEvent(c); r.contextmenu = c.defaultPrevented;
      const ds = new DragEvent('dragstart', { cancelable: true, bubbles: true }); i.dispatchEvent(ds); r.dragstart = ds.defaultPrevented;
      // 对照：预览区外双指仍会被拦截（防缩放没被破坏）
      const o = new TouchEvent('touchstart', { cancelable: true, bubbles: true, touches: [new Touch({ identifier: 9, target: document.body, clientX: 5, clientY: 5 }), new Touch({ identifier: 8, target: document.body, clientX: 9, clientY: 9 })] }); document.body.dispatchEvent(o); r.outsidePinchBlocked = o.defaultPrevented;
      return r });
    ok(Object.entries(pd).every(([k, v]) => k === 'outsidePinchBlocked' ? v === true : v === false), `events on preview img not prevented ${JSON.stringify(pd)}`);
    ok(await vis(p, '#posterImg'), 'preview image visible');
    const tip = await p.textContent('#shareTip');
    ok(tip.includes('长按图片保存到相册') && tip.includes('分享') && await vis(p, '#shareTip'), `hint visible (mentions 分享): 「${tip}」`);
    const tip2 = await p.textContent('#shareTip2');
    ok(tip2.includes('若长按无反应，可截图保存') && await vis(p, '#shareTip2'), `secondary hint visible: 「${tip2}」`);
    ok(await vis(p, '#nativeShareBtn') && !(await p.$eval('#nativeShareBtn', e => e.disabled)), '「分享」 visible & enabled in WeChat when canShare({files}) is true');
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
    ok(await p.evaluate(() => window.__shareCalls.length) === 0, '保存图片 does not call navigator.share in WeChat');
    // 点「分享」：在点击处理里同步调用 navigator.share，带一个 PNG File；不下载
    const n = await p.evaluate(() => { document.getElementById('nativeShareBtn').click(); return window.__shareCalls.length });
    ok(n === 1, `分享 -> navigator.share called synchronously in click (${n})`);
    const c = await p.evaluate(() => window.__shareCalls[0]);
    ok(c && c.n === 1 && c.isFile && c.type === 'image/png' && /\.png$/.test(c.name) && c.size > 10000, `share got one PNG File ${JSON.stringify(c)}`);
    await p.waitForTimeout(800);
    ok(downloads.length === 0, 'no download after 分享');
    const blob = await p.evaluate(() => ({ created: window.__blobUrls.length,
      // DOM 里（去掉内联脚本源码后）是否出现 blob:；以及是否加载过 blob: 资源
      inDom: (() => { const d = document.documentElement.cloneNode(true); d.querySelectorAll('script').forEach(s => s.remove()); return /blob:(https?:|null\/|file:)/.test(d.outerHTML) })(), // 真正的 blob 地址形如 blob:<origin>/<uuid>（CSS 变量 --blob: 不算）
      loaded: performance.getEntriesByType('resource').some(r => /^blob:/.test(r.name)),
      attrs: [...document.querySelectorAll('[src],[href]')].some(e => /^blob:/.test(e.getAttribute('src') || e.getAttribute('href') || '')) }));
    ok(blob.created === 0 && !blob.inDom && !blob.attrs, `no blob: URL anywhere ${JSON.stringify(blob)}`);
    await saveDataUrl(p, OUT + 'wechat-preview.jpg');
    // 页脚截图（结果页最底部）
    await p.click('#closeShare'); await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + 'footer.png' });
    const ver = await p.$$eval('.ver', es => es.map(e => e.textContent)); console.log('  footer:', ver.join(' | '));
    ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
    await ctx.close();
  }
  { // 微信 + 没有 navigator.share：「分享」隐藏，只提示长按，「保存图片」不下载
    const { ctx, p, errs, downloads } = await open(b, { ua: UA.wechat, mobile: true, share: false });
    await toModal(p);
    ok(/^data:image\/jpeg;base64,/.test(await p.getAttribute('#posterImg', 'src')), 'no-share: preview still JPEG data: URL');
    ok(!(await vis(p, '#nativeShareBtn')), 'no-share: 「分享」 hidden');
    const tip = await p.textContent('#shareTip');
    ok(tip.includes('长按图片保存到相册') && !tip.includes('分享') && await vis(p, '#shareTip') && await vis(p, '#shareTip2'), `no-share: long-press hints visible 「${tip}」`);
    await p.screenshot({ path: OUT + 'modal-noshare.png' });
    await p.tap('#saveBtn'); await p.waitForTimeout(1200);
    ok(downloads.length === 0 && await p.$eval('#toast', e => e.classList.contains('show') && /长按/.test(e.textContent)), 'no-share: 保存图片 -> long-press toast, no download');
    ok(await p.evaluate(() => window.__blobUrls.length) === 0, 'no-share: no blob: URL created');
    ok(errs.length === 0, 'no-share: no console errors ' + errs.join(' | '));
    await ctx.close();
  }
  { // 微信 + 有 share 但 canShare 不接受文件：「分享」隐藏
    const { ctx, p } = await open(b, { ua: UA.wechat, mobile: true, share: true, noFiles: true });
    await toModal(p);
    ok(!(await vis(p, '#nativeShareBtn')), 'canShare({files}) false: 「分享」 hidden');
    await ctx.close();
  }
  { // share 被拒：AbortError（用户取消）静默；其它错误 → 长按提示
    for (const [err, expectToast] of [['AbortError', false], ['NotAllowedError', true]]) {
      const { ctx, p, downloads } = await open(b, { ua: UA.wechat, mobile: true, share: true, shareErr: err });
      await toModal(p);
      await p.evaluate(() => document.getElementById('nativeShareBtn').click()); await p.waitForTimeout(600);
      const t = await p.$eval('#toast', e => e.classList.contains('show') ? e.textContent : '');
      ok(expectToast ? /长按/.test(t) : t === '', `share rejects ${err} -> ${expectToast ? 'long-press toast' : 'silent'} 「${t}」`);
      ok(downloads.length === 0, `share rejects ${err} -> no download`);
      await ctx.close();
    }
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
    ok(!(await vis(p, '#shareTip2')), 'secondary screenshot hint only in WeChat-type browsers');
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
