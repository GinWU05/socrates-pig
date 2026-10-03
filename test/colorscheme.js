// 验证：系统深色/浅色、Chrome 强制深色（Auto Dark）下渲染完全一致
const { chromium } = require('playwright-core'); const fs = require('fs');
const { launch, fileUrl, shotsDir } = require('./env');
const URL = fileUrl('dist/index.html'), OUT = shotsDir('colorscheme');
const SIGN = [1,-1]; // 一路选到「痛苦的苏格拉底」，想成为「快乐的猪」
async function run(tag, colorScheme, forceDark){
  const args = [].concat(forceDark ? ['--blink-settings=forceDarkModeEnabled=true,forceDarkModeInversionAlgorithm=4', '--enable-features=WebContentsForceDark'] : []);
  const b = await launch(chromium, args);
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, reducedMotion:'reduce', colorScheme });
  await ctx.addInitScript(() => { let s = 42; Math.random = () => (s = (s*16807) % 2147483647) / 2147483647; });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()) });
  await p.goto(URL); await p.waitForTimeout(800);
  const info = await p.evaluate(() => ({ prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, rootScheme: getComputedStyle(document.documentElement).colorScheme,
    bodyBg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.body).color }));
  await p.screenshot({ path: OUT+`${tag}-cover.png` });
  await p.click('#startBtn'); await p.waitForTimeout(400);
  for (let i=0;i<14;i++){
    if (i===3) await p.screenshot({ path: OUT+`${tag}-question.png` });
    let sel;
    if (i<13){ const best = await p.evaluate(([i,sa,sb]) => { const q=__SP.QUESTIONS[i]; let bi=0,bv=-1e9; q.o.forEach((o,k)=>{const v=sa*(o[1].a||0)/(q.ma||1)+sb*(o[1].b||0)/(q.mb||1); if(v>bv){bv=v;bi=k}}); return bi }, [i, ...SIGN]); sel = `.qcard:not(.out) .opt[data-i="${best}"]` }
    else sel = '.qcard:not(.out) .opt[data-q="PH"]';
    await p.click(sel); await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
  await p.mouse.move(0,0);
  await p.screenshot({ path: OUT+`${tag}-result.png`, fullPage:true });
  await p.click('#shareBtn'); await p.waitForFunction(() => { const i=posterImg; return i.src && i.complete && i.naturalWidth>0 }); await p.waitForTimeout(300);
  const b64 = await p.evaluate(async () => { const r = await fetch(posterImg.src); const bl = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(bl) }) });
  fs.writeFileSync(OUT+`${tag}-poster.png`, Buffer.from(b64,'base64'));
  await b.close();
  return { tag, ...info, errs };
}
(async () => {
  const r = [];
  r.push(await run('light', 'light', false));
  r.push(await run('dark', 'dark', false));
  r.push(await run('forcedark', 'dark', true));
  console.log(JSON.stringify(r, null, 1));
  // 像素级比对：确定性渲染（reduced motion + 固定随机种子）下，深色/强制深色截图应与浅色逐字节一致
  let fails = 0;
  for (const shot of ['cover','question','result','poster']) {
    const base = fs.readFileSync(OUT + `light-${shot}.png`);
    for (const tag of ['dark','forcedark']) {
      const same = base.equals(fs.readFileSync(OUT + `${tag}-${shot}.png`));
      console.log(`  ${shot.padEnd(8)} light vs ${tag.padEnd(9)} ${same ? 'identical' : 'DIFFERENT'}`);
      if (!same) fails++;
    }
  }
  if (r.some(x => x.errs.length)) fails++;
  console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
