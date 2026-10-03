// 结果图二维码：在 390x844 / 375x667 下真实走一遍流程导出结果图（PNG），供 Python 解码器验证
// 用法：node test/qr.js [url]   输出到 shots/qr/
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = process.argv[2] || fileUrl('dist/index.html'), OUT = shotsDir('qr');
(async () => {
  const b = await launch(chromium); const errs = [];
  for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const tag = `${vp.width}x${vp.height}`;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await p.goto(URL); await p.waitForTimeout(800);
    if (vp.width === 390) { await p.screenshot({ path: OUT + 'footer-cover.png' }); }
    await p.click('#speedBtn'); await p.waitForTimeout(500);
    await p.click('.qcard:not(.out) .opt[data-q="SP"]'); await p.waitForTimeout(500);
    await p.click('.qcard:not(.out) .opt[data-q="PH"]'); await p.waitForTimeout(1200);
    if (vp.width === 390) {
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
      await p.screenshot({ path: OUT + 'footer.png' }); await p.evaluate(() => scrollTo(0, 0));
    }
    await p.click('#shareBtn'); await p.waitForSelector('#shareModal.open');
    await p.waitForFunction(() => { const i = document.getElementById('posterImg'); return i.src && i.complete && i.naturalWidth > 0 });
    await p.waitForTimeout(500);
    await p.screenshot({ path: OUT + `modal-${tag}.png` });
    await p.$eval('.posterbox', e => e.scrollTop = e.scrollHeight); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + `modal-${tag}-bottom.png` });
    const b64 = await p.evaluate(async () => { const r = await fetch(document.getElementById('posterImg').src); const bl = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(bl) }) });
    fs.writeFileSync(OUT + `share-${tag}.png`, Buffer.from(b64, 'base64'));
    const ver = await p.$$eval('.ver', es => es.map(e => e.textContent));
    console.log(tag, 'exported', 'footer:', ver.join(' | '));
    await ctx.close();
  }
  await b.close();
  fs.copyFileSync(OUT + 'share-390x844.png', OUT + 'share.png');
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no console errors');
  process.exit(errs.length ? 1 : 0);
})();
