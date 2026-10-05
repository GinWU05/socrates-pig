// 用法：node build.js —— 从 src/ 单一源码 + 主题 CSS 生成自包含单文件
// 输出：dist/index.html（正式，= 主题 1「深夜」）+ dist/archive/（5 个主题 + 选择页，仅存档）
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const QRCode = require('qrcode');
// 结果图里的二维码：构建时生成矩阵（运行时不需要任何库）
const SITE = 'https://socrates-pig.000555.best';
const qr = QRCode.create(SITE, { errorCorrectionLevel: 'M' });
const QR = { url: SITE, n: qr.modules.size, d: Array.from(qr.modules.data, b => b ? 1 : 0).join('') };
// 页脚版本：构建所用源码提交的短哈希（构建时自动写入，不手写）
// Cloudflare Pages 连 Git 构建时用 CF_PAGES_COMMIT_SHA；本地用 git describe（工作区有未提交改动时带 -dirty）；
// 不在 git 仓库时用 SP_COMMIT，否则 'dev'
const COMMIT = (() => {
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  try { return execSync('git describe --always --dirty --abbrev=7', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch (_) {}
  return process.env.SP_COMMIT || 'dev';
})();
if (!/^[\w.-]+$/.test(COMMIT)) throw new Error('bad commit id: ' + COMMIT);
const R = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
const tpl = R('src/app.html'), css = R('src/app.css'), js = R('src/app.js'), chartJs = R('src/chart.js');
const THEMES = ['1-dark','2-dusk','3-paper','4-aurora','5-contrast'];
const dist = path.join(__dirname, 'dist'), archive = path.join(dist, 'archive');
fs.rmSync(dist, {recursive:true, force:true});
fs.mkdirSync(archive, {recursive:true});
const fill = (s, map) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => { if(!(k in map)) throw new Error('missing ' + k); return map[k] });
const meta = [];
for (const id of THEMES) {
  const cfg = JSON.parse(R(`src/themes/${id}.json`));
  const html = fill(tpl, {
    APP_CSS: css, APP_JS: js, CHART_JS: chartJs, THEME_ID: id, THEME_CSS: R(`src/themes/${id}.css`),
    POSTER_JSON: JSON.stringify(cfg.poster), THEME_COLOR: cfg.color,
    QR_JSON: JSON.stringify(QR), COMMIT: COMMIT
  });
  if (/\{\{\w+\}\}/.test(html)) throw new Error('unfilled placeholder in ' + id);
  fs.writeFileSync(path.join(archive, id + '.html'), html);
  meta.push({id, ...cfg});
  if (id === '1-dark') fs.writeFileSync(path.join(dist, 'index.html'), html);
  console.log('built', id, (html.length/1024).toFixed(1) + 'KB');
}
// dist/archive/themes.html：存档用主题选择页（正式入口 dist/index.html = 主题 1，不链接存档）
const desc = {
  '1-dark':'深夜靛紫，柔光微弱，最耐看的默认款',
  '2-dusk':'暮色低饱和，灰粉与雾蓝，像傍晚的天',
  '3-paper':'暖白纸面、衬线标题，杂志排版风',
  '4-aurora':'深色毛玻璃，青紫极光缓慢流动',
  '5-contrast':'纯黑底配荧光黄绿，单一强调色高对比'
};
const sw = {'1-dark':['#13101f','#a99bff'],'2-dusk':['#34303d','#cfa6b4'],'3-paper':['#f1ede5','#5b3f78'],'4-aurora':['#0a1220','#7fe3cf'],'5-contrast':['#0b0b0c','#d6ff3f']};
const items = meta.map(m => `<a class="it" href="./${m.id}.html"><span class="sw" style="background:${sw[m.id][0]}"><i style="background:${sw[m.id][1]}"></i></span><span class="tx"><b>${m.id.split('-')[0]}. ${m.label}</b><small>${desc[m.id]}</small></span><span class="ar">→</span></a>`).join('\n    ');
const chooser = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#17142a"><title>选择主题 · 你是痛苦的苏格拉底，还是快乐的猪？</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden}
body{min-height:100vh;min-height:100dvh;background:#17142a;color:#ebe8f5;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;-webkit-font-smoothing:antialiased;
  padding:calc(28px + env(safe-area-inset-top,0px)) calc(18px + env(safe-area-inset-right,0px)) calc(28px + env(safe-area-inset-bottom,0px)) calc(18px + env(safe-area-inset-left,0px))}
main{max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
h1{font-family:"Songti SC","Noto Serif CJK SC",serif;font-size:26px;line-height:1.35}
p{font-size:14px;line-height:1.7;color:rgba(235,232,245,.7)}
.it{display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);color:inherit;text-decoration:none;transition:transform .2s,background .2s}
.it:active{transform:scale(.98)}
@media (hover:hover){.it:hover{background:rgba(255,255,255,.08)}}
.sw{flex:none;width:52px;height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.2);display:grid;place-items:center}
.sw i{width:18px;height:18px;border-radius:50%}
.tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.tx b{font-size:16px}.tx small{font-size:13px;color:rgba(235,232,245,.6);line-height:1.5}
.ar{color:rgba(235,232,245,.5)}
.it:focus-visible{outline:3px solid #a99bff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head><body><main>
  <h1>你是痛苦的苏格拉底，<br>还是快乐的猪？</h1>
  <p>同一份测验，五种视觉主题。每个都是完整、可离线使用的单文件，挑一个顺眼的。</p>
    ${items}
</main></body></html>`;
fs.writeFileSync(path.join(archive, 'themes.html'), chooser);
console.log('built dist/index.html (= 1-dark, 正式唯一皮肤) + dist/archive/ (5 主题 + 选择页)  commit=' + COMMIT + '  qr=v' + qr.version + '-M ' + QR.n + 'x' + QR.n);
