// 结果图弹窗：所有浏览器完全一样（以微信为准）——
//   JPEG dataURL 的 <img> + 唯一提示「长按保存图片」+「分享」（仅当 canShare({files}) 为真）；没有「保存图片」、不下载、不产生 blob:、从不弹 toast。
// 矩阵：iPhone 微信 / 安卓 Chrome / iOS Safari / 桌面 Chrome × canShare 有/无，逐项检查，并比较弹窗 DOM 在各浏览器下完全相同。
// 另含：微信下长按相关样式与事件检查、share 被拒（AbortError / 其它错误）不弹提示、375x667 排版、页脚截图。
// 用法：node test/save-modes.js [url]   截图到 shots/save-modes/（可用 SP_SHOTS 改目录）；wechat-preview.jpg 供 scripts/qr-decode.py 解码
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = process.argv[2] || fileUrl('dist/index.html'), OUT = shotsDir(process.env.SP_SHOTS || 'save-modes');
const UA = {
  wechat: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003133) NetType/WIFI Language/zh_CN',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
};
const ENV = {
  wechat:  { ua: UA.wechat,  mobile: true,  vp: { width: 390, height: 844 } },
  android: { ua: UA.android, mobile: true,  vp: { width: 412, height: 915 } },
  safari:  { ua: UA.safari,  mobile: true,  vp: { width: 390, height: 844 } },
  desktop: { ua: UA.desktop, mobile: false, vp: { width: 1280, height: 900 } },
};
const HINT = '长按保存图片';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++ };

// 页面脚本之前注入：记录 createObjectURL 调用；可选地装上 share/canShare 桩
function init(opt){
  window.__blobUrls = [];
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = o => { const u = orig(o); window.__blobUrls.push(u); return u };
  window.__shareCalls = [];
  if (opt.share) {
    // opt.shareErr：share 以该名字的 DOMException 拒绝
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: d => !!(d && d.files && d.files.length && d.files.every(f => f instanceof File)) });
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: d => {
      window.__shareCalls.push({ n: d.files ? d.files.length : 0, isFile: !!(d.files && d.files[0] instanceof File), type: d.files && d.files[0] && d.files[0].type, size: d.files && d.files[0] && d.files[0].size, name: d.files && d.files[0] && d.files[0].name });
      return opt.shareErr ? Promise.reject(new DOMException('stub', opt.shareErr)) : Promise.resolve(); } });
  } else {
    try { delete Navigator.prototype.share; delete Navigator.prototype.canShare } catch (_) {}
  }
}

async function open(b, { ua, mobile, share, shareErr = null, vp }){
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile, userAgent: ua, reducedMotion: 'reduce', acceptDownloads: true });
  await ctx.addInitScript(init, { share, shareErr });
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
  // 记录弹窗打开后 toast 是否出现过
  await p.evaluate(() => { window.__toastEver = false; const t = document.getElementById('toast');
    new MutationObserver(() => { if (t.classList.contains('show')) window.__toastEver = true }).observe(t, { attributes: true, attributeFilter: ['class'] }) });
}
const vis = (p, sel) => p.$eval(sel, e => !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0);
const toastEver = p => p.evaluate(() => window.__toastEver || document.getElementById('toast').classList.contains('show'));
const saveDataUrl = async (p, file) => { const src = await p.getAttribute('#posterImg', 'src'); fs.writeFileSync(file, Buffer.from(src.split(',')[1], 'base64')); return src };
// 弹窗 DOM（去掉图片 src、行内 aspect-ratio 和 hidden/disabled 状态）——各浏览器必须完全一致
const modalMarkup = p => p.$eval('#shareModal', m => { const c = m.cloneNode(true); c.querySelectorAll('[src]').forEach(e => e.removeAttribute('src')); c.querySelectorAll('[style]').forEach(e => e.removeAttribute('style'));
  c.querySelectorAll('[hidden],[disabled]').forEach(e => { e.removeAttribute('hidden'); e.removeAttribute('disabled') }); return c.outerHTML });

(async () => {
  const b = await launch(chromium);
  const markups = {};

  // ---------- 矩阵：4 种浏览器 × canShare 有/无 ----------
  for (const [name, env] of Object.entries(ENV)) for (const share of [true, false]) {
    const tag = `${name}${share ? '+share' : ' no-share'}`;
    console.log('== ' + tag);
    const { ctx, p, errs, downloads } = await open(b, { ...env, share });
    await toModal(p);
    ok(await p.evaluate(() => !document.documentElement.hasAttribute('data-save')), `${tag}: no UA-based save mode`);
    const src = await p.getAttribute('#posterImg', 'src');
    ok(/^data:image\/jpeg;base64,/.test(src) && src.length < 1.1e6, `${tag}: preview is JPEG data: URL (${src.length} chars)`);
    ok(await p.$eval('#posterImg', i => i.draggable === false && i.getAttribute('draggable') === 'false'), `${tag}: img draggable=false`);
    ok(await p.$('#saveBtn') === null && await p.$('a[download]') === null, `${tag}: no 保存图片 button / download link in DOM`);
    const tip = (await p.textContent('#shareTip')).trim();
    ok(tip === HINT && await vis(p, '#shareTip'), `${tag}: hint exactly 「${tip}」`);
    ok(await p.$$eval('.modal .tip', es => es.filter(e => !e.hidden && e.getBoundingClientRect().height > 0).length) === 1, `${tag}: one hint line`);
    ok((await vis(p, '#nativeShareBtn')) === share, `${tag}: 「分享」 ${share ? 'visible' : 'hidden'}`);
    if (share) {
      const n = await p.evaluate(() => { document.getElementById('nativeShareBtn').click(); return window.__shareCalls.length });
      const c = await p.evaluate(() => window.__shareCalls[0]);
      ok(n === 1 && c && c.n === 1 && c.isFile && c.type === 'image/png' && /\.png$/.test(c.name) && c.size > 10000, `${tag}: 分享 -> share(PNG File) synchronously in click ${JSON.stringify(c)}`);
    }
    // 右键 / 长按：contextmenu 不被拦截（桌面右键「图片另存为」、手机长按菜单）
    ok(!(await p.evaluate(() => { const e = new MouseEvent('contextmenu', { cancelable: true, bubbles: true }); document.getElementById('posterImg').dispatchEvent(e); return e.defaultPrevented })), `${tag}: contextmenu on img not prevented`);
    if (env.mobile) await p.tap('#posterImg'); else await p.click('#posterImg');
    await p.waitForTimeout(800);
    ok(downloads.length === 0, `${tag}: no download`);
    const blob = await p.evaluate(() => ({ created: window.__blobUrls.length,
      inDom: (() => { const d = document.documentElement.cloneNode(true); d.querySelectorAll('script').forEach(s => s.remove()); return /blob:(https?:|null\/|file:)/.test(d.outerHTML) })(), // 真正的 blob 地址形如 blob:<origin>/<uuid>（CSS 变量 --blob: 不算）
      attrs: [...document.querySelectorAll('[src],[href]')].some(e => /^blob:/.test(e.getAttribute('src') || e.getAttribute('href') || '')) }));
    ok(blob.created === 0 && !blob.inDom && !blob.attrs, `${tag}: no blob: URL ${JSON.stringify(blob)}`);
    ok(!(await toastEver(p)), `${tag}: no toast`);
    markups[tag] = await modalMarkup(p);
    if (name === 'wechat' || name === 'desktop' || (name === 'safari' && share) || (name === 'android' && share)) {
      const shot = name === 'desktop' ? (share ? 'desktop-share.png' : 'desktop.png') : `${name}-${share ? 'share' : 'noshare'}.png`;
      await p.screenshot({ path: OUT + shot });
    }
    if (name === 'wechat' && share) {
      await saveDataUrl(p, OUT + 'wechat-preview.jpg');
      // ---- 微信：长按相关样式与事件（防止图片拖拽浮起、保证长按菜单）----
      const lp = await p.evaluate(() => {
        const i = document.getElementById('posterImg'), box = document.getElementById('posterBox'), sheet = i.closest('.sheet'), modal = document.getElementById('shareModal');
        const cs = e => getComputedStyle(e);
        return { userDrag: cs(i).webkitUserDrag, imgUserSelect: cs(i).userSelect, imgT: cs(i).transform, imgF: cs(i).filter, imgAnim: cs(i).animationName,
          boxT: cs(box).transform, boxF: cs(box).filter, sheetT: cs(sheet).transform, modalBackdrop: cs(modal).backdropFilter || cs(modal).webkitBackdropFilter || 'none', display: cs(i).display, pe: cs(i).pointerEvents };
      });
      ok(lp.userDrag === 'none', `img -webkit-user-drag: ${lp.userDrag}`);
      ok(lp.imgT === 'none' && lp.imgF === 'none' && lp.imgAnim === 'none' && lp.boxT === 'none' && lp.boxF === 'none' && lp.sheetT === 'none', `no transform/filter/animation on img/container/sheet ${JSON.stringify(lp)}`);
      ok(lp.modalBackdrop === 'none' && lp.display === 'block' && lp.pe !== 'none' && lp.imgUserSelect !== 'none', 'modal no backdrop-filter; img block, pointer-events on, user-select not none');
      const css = await p.evaluate(() => [...document.querySelectorAll('style')].map(s => s.textContent).join('\n'));
      ok(!/touch-callout\s*:\s*none/.test(css), 'no -webkit-touch-callout:none anywhere in page CSS');
      ok(/\.modal \.poster\{[^}]*-webkit-touch-callout:default/.test(css) && /\.modal \.posterbox\{-webkit-touch-callout:default\}/.test(css), 'img and its wrapper explicitly -webkit-touch-callout:default');
      const sel = await p.evaluate(() => { const inp = document.createElement('input'), ta = document.createElement('textarea'); document.body.append(inp, ta);
        const r = { body: getComputedStyle(document.body).userSelect, html: getComputedStyle(document.documentElement).userSelect, tip: getComputedStyle(document.getElementById('shareTip')).userSelect,
          title: getComputedStyle(document.getElementById('rTitle')).userSelect, input: getComputedStyle(inp).userSelect, textarea: getComputedStyle(ta).userSelect }; inp.remove(); ta.remove(); return r });
      ok(sel.body === 'none' && sel.html === 'none' && sel.tip === 'none' && sel.title === 'none', `site-wide text selection disabled ${JSON.stringify(sel)}`);
      ok(sel.input === 'text' && sel.textarea === 'text', 'input/textarea stay selectable (user-select:text)');
      const pd = await p.evaluate(() => { const i = document.getElementById('posterImg');
        const T = id => new Touch({ identifier: id, target: i, clientX: 100 + id, clientY: 200 });
        const fire = (type, touches) => { const e = new TouchEvent(type, { cancelable: true, bubbles: true, touches, targetTouches: touches, changedTouches: touches }); i.dispatchEvent(e); return e.defaultPrevented };
        const r = { start1: fire('touchstart', [T(1)]), start2: fire('touchstart', [T(1), T(2)]), move2: fire('touchmove', [T(1), T(2)]), end: fire('touchend', []), end2: fire('touchend', []) };
        const g = new Event('gesturestart', { cancelable: true, bubbles: true }); i.dispatchEvent(g); r.gesture = g.defaultPrevented;
        const d = new MouseEvent('dblclick', { cancelable: true, bubbles: true }); i.dispatchEvent(d); r.dblclick = d.defaultPrevented;
        const ds = new DragEvent('dragstart', { cancelable: true, bubbles: true }); i.dispatchEvent(ds); r.dragstart = ds.defaultPrevented;
        const o = new TouchEvent('touchstart', { cancelable: true, bubbles: true, touches: [new Touch({ identifier: 9, target: document.body, clientX: 5, clientY: 5 }), new Touch({ identifier: 8, target: document.body, clientX: 9, clientY: 9 })] }); document.body.dispatchEvent(o); r.outsidePinchBlocked = o.defaultPrevented;
        return r });
      ok(Object.entries(pd).every(([k, v]) => k === 'outsidePinchBlocked' ? v === true : v === false), `events on preview img not prevented ${JSON.stringify(pd)}`);
      // 页脚截图
      await p.click('#closeShare'); await p.waitForTimeout(400);
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
      await p.screenshot({ path: OUT + 'footer.png' });
      console.log('  footer:', (await p.$$eval('.ver', es => es.map(e => e.textContent))).join(' | '));
    }
    ok(errs.length === 0, `${tag}: no console errors ` + errs.join(' | '));
    await ctx.close();
  }
  // 弹窗 DOM 在 8 种组合下完全一致
  const vals = Object.values(markups), diff = Object.keys(markups).filter(k => markups[k] !== vals[0]);
  ok(vals.length === 8 && diff.length === 0, `identical modal markup across all UAs × canShare (${vals.length} runs${diff.length ? ', differs: ' + diff.join(', ') : ''})`);

  // ---------- share 被拒：AbortError 和其它错误都不弹提示 ----------
  console.log('== share rejected');
  for (const err of ['AbortError', 'NotAllowedError']) {
    const { ctx, p, downloads } = await open(b, { ...ENV.wechat, share: true, shareErr: err });
    await toModal(p);
    await p.evaluate(() => document.getElementById('nativeShareBtn').click()); await p.waitForTimeout(600);
    ok(!(await toastEver(p)) && (await p.textContent('#shareTip')).trim() === HINT && downloads.length === 0, `share rejects ${err} -> no toast, no download, hint still 「${HINT}」`);
    await ctx.close();
  }
  { // 375x667 排版
    const { ctx, p } = await open(b, { ...ENV.wechat, share: false, vp: { width: 375, height: 667 } });
    await toModal(p); await p.screenshot({ path: OUT + 'modal-375x667.png' });
    ok(await p.evaluate(() => { const r = document.getElementById('shareTip').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }), '375x667 hint on screen');
    await ctx.close();
  }

  await b.close();
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
