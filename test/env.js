// 测试公共配置：仓库路径 + 本机 Chrome 路径（不写死任何机器上的绝对路径）
// Chrome 路径优先取环境变量 CHROME_PATH，否则按系统尝试常见安装位置。
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');

const CANDIDATES = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
           '/Applications/Chromium.app/Contents/MacOS/Chromium',
           '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
  linux:  ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
  win32:  ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
           'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'],
};

function chromePath(){
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const hit = (CANDIDATES[process.platform] || []).find(p => fs.existsSync(p));
  if (hit) return hit;
  throw new Error('找不到 Chrome。请设置环境变量 CHROME_PATH，例如：\n  CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test');
}

// 启动浏览器（playwright-core 不自带浏览器，使用本机 Chrome）
const launch = (chromium, extraArgs = []) =>
  chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', ...extraArgs] });

// 仓库内相对路径 -> file:// URL
const fileUrl = rel => pathToFileURL(path.join(ROOT, rel)).href;

// shots/<sub>/ 输出目录（自动创建，已被 .gitignore 忽略）
function shotsDir(sub){
  const d = path.join(ROOT, 'shots', sub);
  fs.mkdirSync(d, { recursive: true });
  return d + path.sep;
}

module.exports = { ROOT, chromePath, launch, fileUrl, shotsDir };
