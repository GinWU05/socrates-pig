// node test/themes.js [index|1-dark|2-dusk|...]  —— 390x844 逐主题点测 + 截图
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const ALL = ['1-dark','2-dusk','3-paper','4-aurora','5-contrast','index'];
const THEMES = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const SHOTS = shotsDir('themes');
const NAMES = {SP:'痛苦的苏格拉底',SH:'快乐的苏格拉底',PP:'痛苦的猪',PH:'快乐的猪'};
const SIGN = {SP:[1,-1],SH:[1,1],PP:[-1,-1],PH:[-1,1]};
let fails = 0; const ok = (c, m) => { if(!c){ fails++; console.log('  FAIL', m) } };

async function newPage(browser, reduce){
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, reducedMotion: reduce?'reduce':'no-preference' });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()) });
  page.on('pageerror', e => errs.push('pageerror: '+e.message));
  return {ctx, page, errs};
}
async function runFull(page, target, want, shotPrefix, onQuiz){
  const W = reduceW(page);
  await page.click('#startBtn'); await page.waitForTimeout(W(900));
  const total = +(await page.textContent('#qTotal')); ok(total===14, 'total '+total);
  const [sa, sb] = SIGN[target];
  for (let i=0;i<total;i++){
    if (shotPrefix && i===3) await page.screenshot({ path: shotPrefix+'question.png' });
    if (onQuiz && i===3) await onQuiz();
    if (shotPrefix && i===total-1) await page.screenshot({ path: shotPrefix+'question-wish.png' });
    let sel;
    if (i < total-1) {
      const best = await page.evaluate(([i, sa, sb]) => {
        const q = window.__SP.QUESTIONS[i]; let bi=0, bv=-1e9;
        q.o.forEach((o,k)=>{ const v = sa*(o[1].a||0)/(q.ma||1) + sb*(o[1].b||0)/(q.mb||1); if(v>bv){bv=v;bi=k} }); return bi;
      }, [i, sa, sb]);
      sel = `.qcard:not(.out) .opt[data-i="${best}"]`;
    } else sel = `.qcard:not(.out) .opt[data-q="${want}"]`;
    await page.click(sel); await page.waitForTimeout(W(760));
  }
  await page.waitForTimeout(W(3400));
}
function reduceW(page){ return ms => page.__reduce ? Math.min(ms, 250) : ms }
async function checkResult(page, cur, want, speed){
  const r = await page.evaluate(() => window.__lastResult);
  const wish = (await page.textContent('#rWish')).trim();
  const title = await page.textContent('#rTitle');
  const kicker = await page.textContent('#rKicker');
  const fullHidden = await page.$eval('#fullBtn', e => e.hidden);
  const exp = cur===want ? `你现在是 ${NAMES[cur]}，你想成为的，也正是 ${NAMES[want]}` : `你现在是 ${NAMES[cur]}，你想成为 ${NAMES[want]}`;
  ok(r.cur===cur, `cur ${r.cur} != ${cur}`); ok(r.want===want, `want ${r.want}`); ok(wish===exp, `wish "${wish}"`);
  ok(title.includes(NAMES[cur]), 'title '+title);
  ok(speed ? kicker.includes('速通版·自评') : !kicker.includes('速通'), 'kicker '+kicker);
  ok(fullHidden === !speed, 'fullBtn hidden '+fullHidden);
  const tips = await page.$$eval('#tipsList li', l => l.length); ok(tips>=2 && tips<=4, 'tips '+tips);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth]);
  ok(sw[0]<=390 && sw[1]<=390, 'hscroll '+sw);
  return `${r.cur}->${r.want} A=${r.A.toFixed(2)} B=${r.B.toFixed(2)} tips=${tips}`;
}
// GitHub 角标：是否可见（封面/结果页可见，答题页与弹窗打开时隐藏）
const ghVisible = page => page.$eval('#ghCorner', e => { const cs = getComputedStyle(e); return cs.visibility === 'visible' && +cs.opacity > 0.5 });
async function share(page, file){
  const hasCanShare = await page.evaluate(() => !!navigator.canShare);
  await page.click('#shareBtn');
  await page.waitForSelector('#shareModal.open', {timeout:5000});
  await page.waitForFunction(() => { const i=document.getElementById('posterImg'); return i.src && i.complete && i.naturalWidth>0 }, null, {timeout:10000});
  await page.waitForTimeout(500);
  ok(!(await ghVisible(page)), 'gh corner hidden while share modal open');
  if (file) {
    await page.screenshot({ path: file.replace('.png','-modal.png') });
    const b64 = await page.evaluate(async () => { const r = await fetch(document.getElementById('posterImg').src); const b = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(b) }) });
    fs.writeFileSync(file, Buffer.from(b64,'base64'));
  }
  ok(await page.$('#saveBtn') === null && await page.$('#shareModal a[download]') === null, 'no 保存图片 / download link in modal');
  ok((await page.textContent('#shareTip')).trim() === '长按保存图片', 'hint 长按保存图片');
  ok(/^data:image\/jpeg;base64,/.test(await page.getAttribute('#posterImg','src')), 'preview is JPEG data: URL');
  await page.click('#closeShare'); await page.waitForTimeout(450);
  ok(await page.$eval('#shareModal', e => !e.classList.contains('open')), 'modal closed');
  return 'canShare='+hasCanShare+' modal ok';
}

const isActive = (page, id) => page.$eval('#'+id, e => e.classList.contains('active'));
const cfOpen = page => page.$eval('#confirm', e => e.classList.contains('open'));
const back = async page => { await page.evaluate(() => history.back()); await page.waitForTimeout(450) };
async function navTests(page, n){
  const W = t => page.waitForTimeout(t), opt = '.qcard:not(.out) .opt';
  // 1) 完整版第 1 题点返回 -> 首页（无进度，不确认）
  await page.click('#startBtn'); await W(300);
  ok(await isActive(page,'quiz'), 'nav1 quiz');
  ok((await page.getAttribute('#backBtn','aria-label'))==='返回首页', 'Q1 back label');
  await page.click('#backBtn'); await W(350);
  ok(await isActive(page,'cover') && !(await cfOpen(page)), 'nav1 Q1 back -> cover');
  // 2) 有进度点首页 -> 确认；继续答题留在原题；退出回首页
  await page.click('#startBtn'); await W(300);
  await page.click(opt); await W(400);
  ok((await page.textContent('#qNum'))==='2', 'nav2 on Q2');
  await page.click('#quizHomeBtn'); await W(350);
  ok(await cfOpen(page), 'nav2 confirm shown');
  ok((await page.textContent('#cfD')).includes('退出后本次答题进度会丢失'), 'nav2 confirm text');
  await page.screenshot({ path: SHOTS+`${n}-question-confirm.png` });
  await page.click('#cfStay'); await W(300);
  ok(!(await cfOpen(page)) && await isActive(page,'quiz') && (await page.textContent('#qNum'))==='2', 'nav2 stay keeps progress');
  await page.click('#quizHomeBtn'); await W(300); await page.click('#cfExit'); await W(400);
  ok(await isActive(page,'cover'), 'nav2 exit -> cover');
  // 3) 答完第1题再返回到第1题，再点返回 -> 确认
  await page.click('#startBtn'); await W(300); await page.click(opt); await W(400);
  await page.click('#backBtn'); await W(350); ok((await page.textContent('#qNum'))==='1', 'nav3 back to Q1');
  await page.click('#backBtn'); await W(300); ok(await cfOpen(page), 'nav3 Q1 back with progress -> confirm');
  await page.click('#cfExit'); await W(400); ok(await isActive(page,'cover'), 'nav3 -> cover');
  // 4) 浏览器/手势返回：无进度 -> 首页
  await page.click('#startBtn'); await W(300); await back(page);
  ok(await isActive(page,'cover'), 'nav4 history.back no progress -> cover');
  // 5) 有进度时手势返回 -> 确认（停在当前题）；再返回 = 取消；首页按钮退出
  await page.click('#startBtn'); await W(300); await page.click(opt); await W(400);
  await back(page); ok(await cfOpen(page) && await isActive(page,'quiz'), 'nav5 back with progress -> confirm, stay');
  await back(page); ok(!(await cfOpen(page)) && await isActive(page,'quiz') && (await page.textContent('#qNum'))==='2', 'nav5 second back cancels');
  await back(page); ok(await cfOpen(page), 'nav5 third back asks again');
  await page.click('#cfExit'); await W(400); ok(await isActive(page,'cover'), 'nav5 exit -> cover');
  // 6) 速通版：第1题返回 -> 首页；有进度首页按钮 -> 确认 -> 退出
  await page.click('#speedBtn'); await W(300); await page.click('#backBtn'); await W(350);
  ok(await isActive(page,'cover'), 'nav6 speed Q1 back -> cover');
  await page.click('#speedBtn'); await W(300); await page.click(`${opt}[data-q="SH"]`); await W(400);
  await page.click('#quizHomeBtn'); await W(300); ok(await cfOpen(page), 'nav6 speed confirm');
  await page.click('#cfExit'); await W(400); ok(await isActive(page,'cover'), 'nav6 speed exit -> cover');
  // 7) 结果页：手势返回先关分享弹窗，再回首页；结果页有回首页/再测按钮
  await page.click('#speedBtn'); await W(300); await page.click(`${opt}[data-q="PH"]`); await W(400); await page.click(`${opt}[data-q="SH"]`); await W(600);
  ok(await isActive(page,'result'), 'nav7 result');
  ok(await page.isVisible('#homeBtn') && await page.isVisible('#retryBtn'), 'nav7 result has home + retry');
  await page.click('#shareBtn'); await page.waitForSelector('#shareModal.open');
  await back(page); ok(await page.$eval('#shareModal', e => !e.classList.contains('open')) && await isActive(page,'result'), 'nav7 back closes modal');
  await back(page); ok(await isActive(page,'cover'), 'nav7 back from result -> cover');
  // 8) 结果页「回到首页」按钮，且关闭弹窗按钮后历史栈正确
  await page.click('#speedBtn'); await W(300); await page.click(`${opt}[data-q="SP"]`); await W(400); await page.click(`${opt}[data-q="SP"]`); await W(600);
  await page.click('#shareBtn'); await page.waitForSelector('#shareModal.open'); await page.click('#closeShare'); await W(400);
  await page.click('#homeBtn'); await W(500); ok(await isActive(page,'cover'), 'nav8 result home btn -> cover');
  ok(await page.evaluate(() => (history.state||{}).sp) === 'cover', 'nav8 history state cover');
  return 'nav ok';
}

(async () => {
  const browser = await launch(chromium);
  for (const id of THEMES) {
    const n = id.split('-')[0];
    const url = id==='index' ? fileUrl('dist/index.html') : fileUrl('dist/archive/' + id + '.html');
    console.log('== theme', id);
    // 1) normal motion: screenshots, full SP -> PH
    let {ctx, page, errs} = await newPage(browser, false);
    await page.goto(url); await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOTS+`${n}-cover.png` });
    await page.screenshot({ path: SHOTS+`${n}-cover-full.png`, fullPage:true });
    { const a = await page.$eval('#ghCorner', e => ({ href:e.href, target:e.target, rel:e.rel, label:e.getAttribute('aria-label'), r:e.getBoundingClientRect().right }));
      ok(await ghVisible(page), 'gh corner visible on cover');
      ok(a.href==='https://github.com/GinWU05/socrates-pig' && a.target==='_blank' && /noopener/.test(a.rel) && !!a.label, 'gh corner attrs ' + JSON.stringify(a));
      ok(Math.abs(a.r - 390) < 1, 'gh corner at right edge'); }
    await runFull(page, 'SP', 'PH', SHOTS+`${n}-`, async () => ok(!(await ghVisible(page)), 'gh corner hidden on quiz'));
    console.log('  full', await checkResult(page, 'SP', 'PH', false));
    ok(await ghVisible(page), 'gh corner visible on result');
    await page.screenshot({ path: SHOTS+`${n}-result.png`, fullPage:true });
    { const H = await page.evaluate(() => document.documentElement.scrollHeight); let k = 1;
      for (let y = 0; ; y += 700) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(250);
        await page.screenshot({ path: SHOTS+`${n}-result-${k++}.png` }); if (y + 844 >= H) break; }
      await page.evaluate(() => scrollTo(0, 0)); }
    // chart: quadrant element shot, radar tab, back
    ok(await page.$$eval('#cbox svg.qsvg.go', e => e.length) === 1, 'quad svg rendered+animated');
    const me = await page.getAttribute('#cme', 'transform'); ok(me && me !== 'translate(170 170)', 'point moved '+me);
    ok(await page.$eval('#ctabs', e => !e.hidden), 'tabs visible in full');
    await page.$eval('#qchart', e => e.scrollIntoView({block:'center'})); await page.waitForTimeout(300);
    await page.locator('#qchart').screenshot({ path: SHOTS+`${n}-chart.png` });
    await page.click('.ctab[data-v="radar"]'); await page.waitForTimeout(1600);
    ok(await page.$$eval('#cbox svg.rsvg', e => e.length) === 1, 'radar svg');
    await page.locator('#qchart').screenshot({ path: SHOTS+`${n}-chart-radar.png` });
    await page.click('.ctab[data-v="quad"]'); await page.waitForTimeout(300);
    ok(await page.$$eval('#cbox svg.qsvg:not(.rsvg)', e => e.length) === 1, 'back to quad');
    await page.evaluate(() => scrollTo(0, 0));
    console.log('  share', await share(page, SHOTS+`${n}-share.png`));
    // retry -> full again, quadrant SH, same wish
    await page.click('#retryBtn'); await page.waitForTimeout(900);
    ok((await page.textContent('#qTotal'))==='14', 'retry total');
    await page.click('#quizHomeBtn'); await page.waitForTimeout(900);
    ok(await isActive(page,'cover'), 'quiz home (no progress) -> cover');
    console.log('  errors', errs.length ? errs : 'none'); errs.length && fails++;
    await ctx.close();
    // 2) reduced motion: other quadrants + speed
    ({ctx, page, errs} = await newPage(browser, true)); page.__reduce = true;
    await page.goto(url); await page.waitForTimeout(400);
    console.log('  ' + await navTests(page, n));
    for (const [cur, want] of [['SH','SH'],['PP','SH'],['PH','SP']]) {
      await runFull(page, cur, want);
      console.log('  full', await checkResult(page, cur, want, false));
      await page.click('#homeBtn'); await page.waitForTimeout(300);
    }
    // speed: every self choice + desired
    for (const [cur, want] of [['SP','SH'],['SH','PP'],['PP','PP'],['PH','SP']]) {
      await page.click('#speedBtn'); await page.waitForTimeout(250);
      ok((await page.textContent('#qTotal'))==='2', 'speed total');
      await page.click(`.qcard:not(.out) .opt[data-q="${cur}"]`); await page.waitForTimeout(300);
      await page.click(`.qcard:not(.out) .opt[data-q="${want}"]`); await page.waitForTimeout(500);
      console.log('  speed', await checkResult(page, cur, want, true));
      ok(await page.$eval('#ctabs', e => e.hidden), 'tabs hidden in speed');
      { const t = await page.getAttribute('#cme','transform'); const exp = {SP:'translate(104 236)',SH:'translate(104 104)',PP:'translate(236 236)',PH:'translate(236 104)'}[cur]; ok(t===exp, `speed point ${t} != ${exp}`); }
      if (cur==='SP') { await page.screenshot({ path: SHOTS+`${n}-speed-result.png`, fullPage:true }); console.log('  speed share', await share(page, SHOTS+`${n}-share-speed.png`)); }
      await page.click('#homeBtn'); await page.waitForTimeout(300);
    }
    // speed -> 做完整版
    await page.click('#speedBtn'); await page.waitForTimeout(250);
    await page.click(`.qcard:not(.out) .opt[data-q="PH"]`); await page.waitForTimeout(300);
    await page.click(`.qcard:not(.out) .opt[data-q="PH"]`); await page.waitForTimeout(500);
    await page.click('#fullBtn'); await page.waitForTimeout(400);
    ok((await page.textContent('#qTotal'))==='14' && (await page.textContent('#qMode'))==='完整版', 'fullBtn -> full quiz');
    console.log('  errors(reduced)', errs.length ? errs : 'none'); errs.length && fails++;
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
