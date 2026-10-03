// 生成多种场景的结果图（实际 1080 宽）+ 弹窗实拍，检查比例/重叠/可读性
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = process.argv[2] || fileUrl('dist/index.html'), OUT = shotsDir('share');
const SC = [
  ['01-user-bug-A0-SP-same',  {mode:'full', A:0,     B:-0.28, want:'SP'}],   // 用户截图：思考50% 快乐36%
  ['02-SP-to-PH',             {mode:'full', A:0.70,  B:-0.84, want:'PH'}],
  ['03-SH-same-extreme',      {mode:'full', A:0.90,  B:0.92,  want:'SH'}],
  ['04-PP-to-SH',             {mode:'full', A:-0.60, B:-0.68, want:'SH'}],
  ['05-PH-to-SP',             {mode:'full', A:-0.85, B:0.76,  want:'SP'}],
  ['06-B0-PH-to-PP',          {mode:'full', A:-0.4,  B:0,     want:'PP'}],
  ['07-A0B0-SH-to-PP',        {mode:'full', A:0,     B:0,     want:'PP'}],
  ['08-PP-same-mid',          {mode:'full', A:-0.35, B:-0.45, want:'PP'}],
  ['09-speed-SP-to-SH',       {mode:'speed', cur:'SP', A:0.5, B:-0.5, want:'SH'}],
  ['10-speed-PH-same',        {mode:'speed', cur:'PH', A:-0.5, B:0.5, want:'PH'}],
];
(async () => {
  const b = await launch(chromium);
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()) });
  await p.goto(URL); await p.waitForTimeout(800);
  for (const [name, o] of SC) {
    const url = await p.evaluate(o => window.__SP.posterFor(o), o);
    const buf = Buffer.from(url.split(',')[1], 'base64'); fs.writeFileSync(OUT + name + '.png', buf);
    console.log(name, 'bytes', buf.length);
  }
  // 弹窗实拍：真实流程（速通 SP→SP），检查图片未被拉伸
  await p.click('#speedBtn'); await p.waitForTimeout(700);
  await p.click('.qcard:not(.out) .opt[data-q="SP"]'); await p.waitForTimeout(900);
  await p.click('.qcard:not(.out) .opt[data-q="SP"]'); await p.waitForTimeout(3500);
  await p.click('#shareBtn'); await p.waitForFunction(() => { const i=posterImg; return i.src && i.complete && i.naturalWidth>0 }); await p.waitForTimeout(700);
  const ratio = await p.evaluate(() => { const i = posterImg, r = i.getBoundingClientRect(); return { natural: +(i.naturalWidth/i.naturalHeight).toFixed(4), rendered: +(r.width/r.height).toFixed(4), w: r.width, h: r.height } });
  await p.screenshot({ path: OUT + 'modal-top.png' });
  await p.$eval('.posterbox', e => e.scrollTop = e.scrollHeight); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + 'modal-bottom.png' });
  const zoom = await p.evaluate(() => {
    const vp = document.querySelector('meta[name=viewport]').content;
    const ta = getComputedStyle(document.documentElement).touchAction;
    const ge = new Event('gesturestart', {cancelable:true}); document.dispatchEvent(ge);
    const t1 = new Touch({identifier:1, target:document.body, clientX:10, clientY:10}), t2 = new Touch({identifier:2, target:document.body, clientX:50, clientY:50});
    const tm = new TouchEvent('touchmove', {cancelable:true, touches:[t1,t2]}); document.dispatchEvent(tm);
    const tm1 = new TouchEvent('touchmove', {cancelable:true, touches:[t1]}); document.dispatchEvent(tm1);
    return { viewport: vp, touchAction: ta, gesturePrevented: ge.defaultPrevented, pinchPrevented: tm.defaultPrevented, singleScrollAllowed: !tm1.defaultPrevented };
  });
  console.log('modal img ratio', ratio, '\nzoom', zoom, '\nerrors', errs);
  await b.close();
  const bad = [];
  if (Math.abs(ratio.natural - ratio.rendered) > .005) bad.push('结果图在弹窗中被拉伸');
  if (!/maximum-scale=1/.test(zoom.viewport) || !/user-scalable=no/.test(zoom.viewport)) bad.push('viewport 未禁止缩放');
  if (zoom.touchAction !== 'manipulation') bad.push('touch-action 不是 manipulation');
  if (!zoom.gesturePrevented || !zoom.pinchPrevented || !zoom.singleScrollAllowed) bad.push('缩放手势拦截异常');
  if (errs.length) bad.push('控制台报错');
  console.log(bad.length ? 'FAILS: ' + bad.join('；') : 'ALL PASS');
  process.exit(bad.length ? 1 : 0);
})();
