// 「预览版」标记：运行时按域名判断——正式域名 socrates-pig.000555.best 不显示，其它域名（pages.dev 预览、localhost、本地文件）都显示。
// 用 Playwright 路由把同一份 dist/index.html 分别挂到「正式域名」和「预览域名」上（不发真实网络请求）。
// 用法：node test/preview-badge.js [真实预览地址]   传地址时额外检查该地址并截图到 shots/preview/cover.png
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path');
const { launch, fileUrl, shotsDir, ROOT } = require('./env');
const LIVE = process.argv[2] || null, OUT = shotsDir('preview');
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'));
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++ };

async function check(b, url, { route = true, shot = null } = {}){
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (route) await ctx.route(u => /^https:\/\/(socrates-pig\.000555\.best|preview\.socrates-pig\.pages\.dev|localhost)/.test(u.href),
    r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: HTML }));
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const e = document.getElementById('previewBadge'), g = document.getElementById('ghCorner');
    const cs = e && getComputedStyle(e), br = e && e.getBoundingClientRect(), gr = g && g.getBoundingClientRect();
    return { host: location.hostname, exists: !!e, hidden: e ? e.hidden : null, text: e && e.textContent.trim(),
      visible: !!e && !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && br.width > 0 && br.height > 0 && br.top >= 0 && br.left >= 0,
      pe: cs && cs.pointerEvents, fixed: cs && cs.position === 'fixed', bg: cs && cs.backgroundColor, color: cs && cs.color,
      overlapsGh: !!(br && gr && gr.width && !(br.right <= gr.left || br.left >= gr.right || br.bottom <= gr.top || br.top >= gr.bottom)) } });
  if (shot) await p.screenshot({ path: shot });
  await ctx.close();
  return { ...r, errs };
}

(async () => {
  const b = await launch(chromium);
  console.log('== 正式域名（路由模拟）');
  const prod = await check(b, 'https://socrates-pig.000555.best/');
  ok(prod.exists && prod.host === 'socrates-pig.000555.best' && prod.hidden === true && !prod.visible, `prod host: badge hidden ${JSON.stringify({ host: prod.host, hidden: prod.hidden, visible: prod.visible })}`);
  ok(prod.errs.length === 0, 'prod: no page errors ' + prod.errs.join(' | '));
  for (const url of ['https://preview.socrates-pig.pages.dev/', 'https://localhost/', fileUrl('dist/index.html')]) {
    console.log('== ' + url);
    const r = await check(b, url);
    ok(r.visible && r.text === '预览版', `badge visible 「${r.text}」 on host "${r.host}"`);
    ok(r.fixed && r.pe === 'none', `fixed pill, pointer-events:${r.pe}`);
    ok(!r.overlapsGh, 'does not overlap the GitHub corner');
    ok(r.errs.length === 0, 'no page errors ' + r.errs.join(' | '));
  }
  // 结果图（canvas）里不画「预览版」：绘制代码里不应出现这几个字
  const src = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'src/chart.js'), 'utf8');
  ok(!/fillText\([^)]*预览版/.test(src) && (src.match(/预览版/g) || []).length <= 2, 'poster canvas code never draws 预览版');
  if (LIVE) {
    console.log('== live ' + LIVE);
    const r = await check(b, LIVE, { route: false, shot: OUT + 'cover.png' });
    ok(r.visible && r.text === '预览版', `live preview: badge visible on "${r.host}" -> ${OUT}cover.png`);
  }
  await b.close();
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
