// 分享流程：「生成结果图」总是先开预览弹窗；弹窗内「分享」按钮同步调用 navigator.share；不支持时没有按钮，只有提示（手机为「长按保存图片」）
// 另含：返回手势关弹窗、GitHub 角标隐藏、390x844 / 375x667 弹窗与结果页截图
const { chromium } = require('playwright-core');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = fileUrl('dist/index.html'), OUT = shotsDir('share-flow');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++ };

// 在页面脚本运行前注入 navigator.share / canShare 桩；mode: 'ok' | 'abort' | 'error'
function stub(mode){
  window.__shareCalls = []; window.__shareMode = mode;
  Object.defineProperty(Navigator.prototype, 'canShare', { configurable:true, value: d => !!(d && d.files && d.files.length && d.files.every(f => f instanceof File)) });
  Object.defineProperty(Navigator.prototype, 'share', { configurable:true, value: function(d){
    window.__shareCalls.push({ n: d.files.length, type: d.files[0] && d.files[0].type, size: d.files[0] && d.files[0].size, isFile: d.files[0] instanceof File,
      name: d.files[0] && d.files[0].name, title: d.title, text: d.text, active: navigator.userActivation ? navigator.userActivation.isActive : null });
    const m = window.__shareMode;
    if (m === 'abort') return Promise.reject(new DOMException('cancel', 'AbortError'));
    if (m === 'error') return Promise.reject(new DOMException('boom', 'NotAllowedError'));
    return Promise.resolve();
  }});
}

async function toResult(p){
  await p.goto(URL); await p.waitForTimeout(600);
  await p.click('#speedBtn'); await p.waitForTimeout(500);
  await p.click('.qcard:not(.out) .opt[data-q="SP"]'); await p.waitForTimeout(500);
  await p.click('.qcard:not(.out) .opt[data-q="PH"]'); await p.waitForTimeout(1200);
}
async function openPreview(p){
  await p.click('#shareBtn');
  await p.waitForSelector('#shareModal.open', { timeout: 5000 });
  await p.waitForFunction(() => { const i = document.getElementById('posterImg'); return i.src && i.complete && i.naturalWidth > 0 }, null, { timeout: 10000 });
  await p.waitForTimeout(500);
}
const vis = (p, sel) => p.$eval(sel, e => !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
const ghVisible = p => p.$eval('#ghCorner', e => { const cs = getComputedStyle(e); return cs.visibility === 'visible' && +cs.opacity > .5 });
const toastShown = p => p.$eval('#toast', e => e.classList.contains('show'));

async function page(b, vp, mode){
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  if (mode) await ctx.addInitScript(stub, mode);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  return { ctx, p, errs };
}

(async () => {
  const b = await launch(chromium);
  for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const tag = `${vp.width}x${vp.height}`;
    console.log('== ' + tag);

    // ---- 支持文件分享（桩） ----
    { const { ctx, p, errs } = await page(b, vp, 'ok');
      await toResult(p);
      await p.screenshot({ path: OUT + `${tag}-result-top.png` });
      const geo = await p.evaluate(() => { const c = document.getElementById('rcard').getBoundingClientRect(), g = document.getElementById('ghCorner').getBoundingClientRect();
        // 角标三角形：右上角，斜边 y = x - g.left；卡片右上圆角上最靠右上的点约为 (c.right - 8, c.top + 8)
        const x = c.right - 8, y = c.top + 8; return { cardTop: c.top, gBottom: g.bottom, inTri: x > g.left && y < g.bottom && (y - g.top) < (x - g.left) } });
      ok(!geo.inTri, `${tag} result card corner clears GitHub badge (card top ${geo.cardTop.toFixed(0)}px)`);
      // (a) 生成 → 打开弹窗，且没有调用 share
      await openPreview(p);
      ok(await p.evaluate(() => window.__shareCalls.length) === 0, `${tag} (a) 生成结果图 opens modal, share NOT called`);
      ok(await p.$eval('#posterImg', e => e.tagName === 'IMG'), `${tag} preview is <img>`);
      ok((await p.textContent('#shareTip')).trim() === '长按保存图片' && await vis(p, '#shareTip'), `${tag} hint 「长按保存图片」`);
      ok(await vis(p, '#nativeShareBtn') && await p.$('#saveBtn') === null, `${tag} only 「分享」 (no 保存图片)`);
      ok(!(await ghVisible(p)), `${tag} GitHub corner hidden in modal`);
      await p.screenshot({ path: OUT + `${tag}-modal-share.png` });
      // (b) 点「分享」：在点击处理中同步调用一次 share，带一个 PNG File
      const sync = await p.evaluate(() => { document.getElementById('nativeShareBtn').click(); return window.__shareCalls.length });
      ok(sync === 1, `${tag} (b) share called synchronously inside click (calls right after click(): ${sync})`);
      const c = await p.evaluate(() => window.__shareCalls[0]);
      ok(c && c.n === 1 && c.isFile && c.type === 'image/png' && c.size > 10000 && /\.png$/.test(c.name), `${tag} (b) one PNG File ${c && c.size}B ${c && c.name}`);
      ok(c && !!c.title && /快乐的猪/.test(c.text), `${tag} (b) title/text: ${c && c.text}`);
      // 真实触摸点击同样只调用一次（不经 await 画布）
      await p.tap('#nativeShareBtn'); await p.waitForTimeout(200);
      const c2 = await p.evaluate(() => window.__shareCalls[1]);
      ok(!!c2 && c2.active !== false, `${tag} (b) tap -> share with user activation (${c2 && c2.active})`);
      ok(await p.evaluate(() => window.__shareCalls.length) === 2, `${tag} each tap shares exactly once`);
      // AbortError 静默；其它错误也不弹 toast（不遮按钮）
      await p.evaluate(() => window.__shareMode = 'abort'); await p.tap('#nativeShareBtn'); await p.waitForTimeout(300);
      ok(!(await toastShown(p)), `${tag} AbortError silent (no toast)`);
      await p.evaluate(() => window.__shareMode = 'error'); await p.tap('#nativeShareBtn'); await p.waitForTimeout(300);
      ok(!(await toastShown(p)), `${tag} other share error -> no toast covering buttons`);
      ok(await p.$eval('#shareModal', e => e.classList.contains('open')), `${tag} modal stays open after share`);
      // 返回手势关闭弹窗，停在结果页
      await p.goBack(); await p.waitForTimeout(500);
      ok(!(await p.$eval('#shareModal', e => e.classList.contains('open'))) && await p.$eval('#result', e => e.classList.contains('active')), `${tag} back gesture closes modal, stays on result`);
      ok(await ghVisible(p), `${tag} GitHub corner back on result`);
      // 关闭按钮
      await openPreview(p); await p.click('#closeShare'); await p.waitForTimeout(450);
      ok(!(await p.$eval('#shareModal', e => e.classList.contains('open'))), `${tag} close button closes modal`);
      ok(errs.filter(e => !/share/.test(e)).length === 0, `${tag} no console errors ${errs.join(' | ')}`);
      await ctx.close(); }
  }
  await b.close();
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
