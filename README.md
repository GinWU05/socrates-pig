# 你是痛苦的苏格拉底，还是快乐的猪？

> 「做一个不满足的人，胜过做一只满足的猪；做一个不满足的苏格拉底，胜过做一个满足的傻瓜。」
> —— 约翰·斯图尔特·密尔《功利主义》，1863

一个移动端 H5 小测验：用两个维度把人放进四个象限——**你习惯思考追问，还是享受当下？你此刻真实的感受，是痛苦还是快乐？**
测完告诉你「你现在是谁」「你想成为谁」，并给出几条温和、具体的建议，帮你更接近自己想要的样子。

- 🌐 在线体验：<https://socrates-pig.000555.best>
- 💻 源码仓库：<https://github.com/GinWU05/socrates-pig>
- 📦 源码分在 `src/`，构建后产出单个自包含的 `dist/index.html`（CSS / JS / SVG 全部内联）：**运行时零依赖、不加载任何 CDN 或外部资源、可离线打开**。开发时只用到 `playwright-core`（跑测试）和 `qrcode`（构建时生成结果图里的二维码矩阵）

<p align="center">
  <img src="docs/cover.png" width="230" alt="封面">
  <img src="docs/question.png" width="230" alt="答题页">
  <img src="docs/result.png" width="230" alt="结果页">
</p>

## 功能

- **完整版（14 题）**：13 道计分题，同时在两个维度上计分（每个选项可影响一个或两个维度）；第 14 题不计分——「如果可以选，你想成为这四个里的哪一个？」
- **速通版（2 题）**：直接自选「我现在是哪一个」「我想成为哪一个」，结果页标注「速通版·自评」，并可一键「做完整版」
- **四象限结果**：痛苦的苏格拉底 / 快乐的苏格拉底 / 痛苦的猪 / 快乐的猪，结果页显示「你现在是 X，你想成为 Y」
- **维度图**：自绘 SVG 象限图（渐变象限、同心网格、刻度、呼吸光点、从「现在」指向「想成为」的虚线弧箭头、图例），可切换 4 轴雷达图（思考 / 享受 / 痛苦 / 快乐）；完整版答题时，顶栏的迷你象限会实时显示当前位置
- **成长建议**：16 组内容——12 种 X → Y 的转变路径 + 4 种「保持现状」的健康建议，每组 3–4 条
- **结果图分享**：canvas 绘制 1080 宽高清长图（含象限图、现在/想成为、建议；完整版另含两轴得分）。点「生成结果图」总是先打开预览弹窗。**所有浏览器（微信等 App 内置浏览器、安卓、iOS Safari、桌面）看到的弹窗完全一样，以微信为准**，不按 UA 区分：
  - 结果图是 JPEG dataURL 的 `<img>`（质量 0.88，超过 800 KB 会依次缩到 900 / 750 宽），手机长按、桌面右键「图片另存为」都能保存；下面只有一行提示，不弹 toast、不闪烁。提示按输入能力决定（不看 UA）：电脑（`matchMedia('(hover: hover) and (pointer: fine)')` 成立且 `navigator.maxTouchPoints === 0`）显示「右键保存图片」，其它（手机、平板，包括接了触控板 / 妙控键盘、maxTouchPoints 为 5 的 iPad）显示「长按保存图片」；加载时设定，输入方式变化时更新
  - 「分享」按钮只按功能检测显示：打开弹窗时先生成 PNG File，`navigator.canShare({files:[file]})` 为真才显示，点击调用 `navigator.share`（带这个 PNG）；用户取消或其它错误都不弹提示。不支持就没有按钮
  - 没有「保存图片」按钮，也没有任何下载（不用 a[download]、不产生 blob: 地址）：微信里下载只会变成「文件」，安卓会进「下载」而不是相册。图片设为 `draggable=false`、`-webkit-user-drag:none`、`-webkit-touch-callout:default`；图片和外层容器都不加 transform / filter / 动画 / backdrop-filter，预览区里的触摸事件也不调用 `preventDefault`，免得 iPhone 微信长按变成拖动图片、不弹保存菜单
  - 系统分享在点击里同步调用 `navigator.share`（PNG File 打开弹窗时就已生成），满足 iOS 的用户手势要求。结果图上下各留一段背景（上 ≈ 0.174×宽、下 ≈ 0.256×宽），在刘海 / 灵动岛 iPhone 上全屏查看时，内容不会被状态栏和 Home 指示条挡住
- **禁止选字**：全站 `user-select:none`（含长按选字），只有 input / textarea / contenteditable 保持可选可输入；不在全局关闭长按菜单，结果预览图单独设为 `-webkit-touch-callout:default` 和 `-webkit-user-select:auto`，长按仍能弹出「保存图片」
- **结果图二维码**：结果图底部「来测测看」旁有一个指向 <https://socrates-pig.000555.best> 的二维码（版本 3、纠错等级 M、29×29 模块、每模块 8px、四周 4 模块白色静区，纯黑配纯白），可在微信里长按识别。矩阵在构建时由 `qrcode` 生成并内联进页面，运行时不依赖任何库
- **构建版本**：封面和结果页最底部有一行很淡的 `build <提交短哈希>`，由 `build.js` 在构建时自动写入：Cloudflare Pages 构建时取 `CF_PAGES_COMMIT_SHA` 的前 7 位，本地构建用 `git describe --always --dirty`（工作区有未提交改动时显示 `<哈希>-dirty`），不在 git 仓库时用环境变量 `SP_COMMIT`，再没有就显示 `dev`。`dist/` 不提交，所以页面上的哈希就是 GitHub 上那次源码提交
- **返回导航**：答题页左上角的返回箭头回到上一题，第 1 题时回到封面；右上角的房子图标（「回到首页」），已有答题进度时先确认「退出后本次答题进度会丢失」；结果页底部有「回到首页」。浏览器历史按「封面 → 答题/结果 → 结果图弹窗」三层记录（`history.pushState` / `popstate`），所以手机返回手势和浏览器后退会：先关掉结果图弹窗；答题中有进度时弹出退出确认（再按一次返回 = 取消）；没有进度或在结果页时回到封面。返回手势不会逐题后退
- **固定配色**：唯一皮肤「深夜」靛紫；不跟随系统深浅色，阻止 Android Chrome 自动深色与 Dark Reader 等扩展改色（`color-scheme: only light`、`supported-color-schemes`、`darkreader-lock`）
- **禁止缩放**：`maximum-scale=1, user-scalable=no`、`touch-action: manipulation`，并拦截 iOS 双指缩放 / 双击放大
- **GitHub 角标**：封面和结果页右上角有一个低调的主题色章鱼猫角标（悬停或点按时挥手），新标签页打开源码仓库；答题页、结果图弹窗和退出确认框打开时自动隐藏，也不会画进结果图
- **体验细节**：流畅动画且尊重 `prefers-reduced-motion`；适配刘海 / 底部安全区；无横向滚动；按钮有键盘焦点样式和 ARIA 标签

<p align="center">
  <img src="docs/chart.png" width="330" alt="维度图（象限视图）">
  <img src="docs/share-modal.png" width="230" alt="结果图预览弹窗">
  <img src="docs/share.png" width="230" alt="分享结果图">
</p>

## 计分方式

| 维度 | 正方向（+1） | 负方向（−1） |
| --- | --- | --- |
| A 轴：怎么活 | 🏛️ 苏格拉底 · 思考追问 | 🐷 猪 · 享受当下 |
| B 轴：感受如何 | 😊 快乐 | 😣 痛苦 |

- 13 道计分题中，10 题同时影响 A、B 两轴，3 题只测 B 轴（真实感受，例如「早上醒来的第一感觉」「一个人待着时的感觉」）
- 每个选项带 `{a, b}` 分值。某一轴的得分 = 该轴所选分值之和 ÷ 该轴每题最大绝对分值之和，归一化到 **[−1, 1]**
- 结果象限：`A ≥ 0` → 苏格拉底，否则 → 猪；`B ≥ 0` → 快乐，否则 → 痛苦
- 结果页的百分比：思考追问 = (A+1)/2，享受当下 = 1 − 思考追问；快乐 = (B+1)/2，痛苦 = 1 − 快乐
- 图上的点离轴线太近（|A| 或 |B| < 0.17，包括正好为 0）时，会被推到距轴线 0.17 的位置，落在所属象限内，不压在分界线上；只影响画点，不影响得分和结果
- 速通版不计分，点画在所选象限的中心，也不显示雷达图

| 结果 | 条件 | 一句话 |
| --- | --- | --- |
| 🏛️ 痛苦的苏格拉底 | A ≥ 0，B < 0 | 想得很深，也常常很累 |
| 💡 快乐的苏格拉底 | A ≥ 0，B ≥ 0 | 追问本身就让你快乐 |
| 🌧️ 痛苦的猪 | A < 0，B < 0 | 不想多想，却也不太开心 |
| 🐷 快乐的猪 | A < 0，B ≥ 0 | 活在当下，知足常乐 |

题目、选项分值、结果文案和建议都在 [`src/app.js`](src/app.js) 顶部的 `QUESTIONS` / `QUADS` / `TIPS` 中。

## 项目结构

```
socrates-pig/
├── dist/                    # 构建产物（不提交，.gitignore 已忽略；Cloudflare Pages 构建时生成）
│   ├── index.html           # 正式入口 = 主题 1「深夜」，自包含单文件
│   └── archive/             # 存档：5 个主题 + themes.html 选择页（正式入口不链接）
├── src/                     # 唯一源码（不能直接打开，需要构建）
│   ├── app.html             # HTML 模板（含 {{占位符}}）
│   ├── app.css              # 公共样式（CSS 变量驱动）
│   ├── app.js               # 题目 / 计分 / 建议 / 导航 / 分享结果图
│   ├── chart.js             # 象限图、雷达图（SVG）+ 结果图里的象限图（canvas）
│   └── themes/              # 主题变量：<id>.css（页面）+ <id>.json（结果图配色）
├── test/                    # Playwright 测试（使用本机 Chrome）
│   ├── env.js               # 公共配置：路径、Chrome 位置
│   ├── themes.js            # 全流程点测 + 截图
│   ├── share.js             # 多场景结果图 + 弹窗比例 + 防缩放检查
│   ├── share-flow.js        # 分享流程：先预览、「分享」同步调用、无文件分享时只显示保存
│   ├── save-modes.js        # 弹窗在 微信 / 安卓 / iOS Safari / 桌面 × 能否分享 下完全一致（无下载、只长按 +「分享」）
│   ├── colorscheme.js       # 浅色 / 深色 / 强制深色下逐字节比对截图
│   ├── preview-badge.js     # 「预览版」标记：正式域名不显示，其它域名显示
│   └── qr.js                # 导出结果图到 shots/qr/，配合 scripts/qr-decode.py 验证二维码
├── scripts/notch-check.py   # 结果图留白检查：模拟刘海屏全屏预览，生成前后对比图
├── scripts/qr-decode.py     # 结果图二维码解码（zxing + 微信开源识别引擎，含缩小 / JPEG 压缩变体）
├── docs/                    # README 用截图（cover / question / result / chart / share-modal / share）
├── legacy/index.v1.html     # 旧版（12 题、单维度、5 档结果），仅留档
├── build.js                 # 构建：把 src/ 内联进单个 HTML，输出到 dist/
├── shots/                   # 测试截图输出（.gitignore 忽略，不提交）
├── .gitignore
├── LICENSE                  # MIT
├── package.json
└── package-lock.json
```

## 构建与测试

需要 Node.js ≥ 18。

```bash
git clone https://github.com/GinWU05/socrates-pig.git && cd socrates-pig
npm install          # 只装 playwright-core（不下载浏览器）
npm run build        # = node build.js，生成 dist/
npm test             # 构建 + 测正式入口 + 结果图/防缩放 + 分享流程 + 各环境保存方式 + 深色模式锁定 + 预览版标记
npm run test:all     # 额外把 dist/archive/ 里的 5 个主题全测一遍
```

单独跑某一项：`npm run test:save-modes`、`npm run test:qr`、`npm run test:themes`（不带参数会测正式入口 + 5 个存档主题）、`npm run test:share`、`npm run test:share-flow`、`npm run test:colorscheme`、`npm run test:preview-badge`。这几个命令不会先构建，改了 `src/` 要先 `npm run build`。

修改 `src/` 后必须重新构建，`dist/` 不要手改。

测试使用本机已安装的 Chrome（playwright-core 不自带浏览器）。默认会按系统查找常见安装位置（macOS：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`），找不到时请用环境变量指定：

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

测试默认在 390×844（iPhone 尺寸）下运行，`share-flow.js` 另外测 375×667：

- `test/themes.js [index|1-dark|…]`：走完整版和速通版，检查四个象限都能到达、「想成为」文案、建议条数、维度图坐标、分享弹窗、返回 / 回首页 / 浏览器后退、确认弹窗、控制台无报错
- `test/share.js`：各象限、相同/不同愿望、A 或 B 正好为 0、速通版共 10 种场景的结果图，以及弹窗中图片不被拉伸、防缩放是否生效
- `test/share-flow.js`：用桩模拟 `navigator.share` / `canShare`，验证点「生成结果图」只开弹窗不分享、点「分享」同步调用一次且带一个 PNG 文件、取消和出错都不弹提示、没有「保存图片」、无文件分享时没有按钮只有提示，并在 390×844 和 375×667 下截图
- `test/save-modes.js [url]`：iPhone 微信、安卓 Chrome、iOS Safari、iPad、iPad + 触控板（有悬停和精确指针、maxTouchPoints 为 5）、桌面 Chrome 各自在「有 / 没有 `canShare` 文件分享」（桩）下打开弹窗，逐项检查：预览图是 JPEG dataURL（小于约 1.1M 字符）且不可拖拽、DOM 里没有「保存图片」和下载链接、唯一提示正好是「长按保存图片」（桌面为「右键保存图片」）、「分享」仅在 canShare 时显示且点击会同步调用 share 并带一个 PNG 文件、右键 / 长按（contextmenu）不被拦截、不下载、没有 blob: 地址、没有 toast；12 种组合的弹窗 DOM 必须完全相同（只允许提示文字不同）。微信下还检查：图片及容器没有 transform 等、页面 CSS 没有 `touch-callout:none` 且图片和容器明确为 default、全站正文 `user-select:none` 而 input/textarea 为 `text`、预览图上的 touch/gesture/dblclick 等事件没被 preventDefault；share 被拒（AbortError 或其它错误）都不弹提示。截图输出到 `shots/save-modes/`（`wechat.png`、`wechat-noshare.png`、`desktop.png` 等；用环境变量 `SP_SHOTS` 可以换目录），可以传线上地址测线上
- `test/colorscheme.js`：分别在浅色、深色、Chrome 强制深色下渲染，截图必须逐字节一致
- `test/preview-badge.js [预览地址]`：用 Playwright 路由把同一份 `dist/index.html` 挂到正式域名和预览域名上，正式域名下「预览版」必须隐藏，`preview.socrates-pig.pages.dev`、localhost、本地文件下必须显示，并且不挡点击、不压 GitHub 角标；传真实预览地址时额外检查并截图到 `shots/preview/cover.png`

截图输出到 `shots/`（已在 `.gitignore` 中忽略）。

二维码识别检查（可选，需要 Python）：

```bash
pip install zxing-cpp "opencv-contrib-python-headless<5" pillow
npm run test:qr     # 导出 shots/qr/share-390x844.png 等
# 可选：下载微信识别模型（WeChatCV/opencv_3rdparty 的 wechat_qrcode 分支：detect/sr 的 .prototxt 与 .caffemodel）
WECHAT_MODELS=模型目录 python scripts/qr-decode.py shots/qr/share-*.png --expect https://socrates-pig.000555.best
```

结果图留白检查（可选，需要 Python 和 `pip install pillow numpy`）：

```bash
python scripts/notch-check.py 旧图.png 新图.png 对比图.png
```

脚本会测量首行和末行内容到图片边缘的距离，按 393×852 / 430×932 两种机型（顶部 59pt、底部 34pt 安全区）模拟「按宽度铺满」的全屏预览，内容被挡住时返回非 0。

本地预览：直接双击打开 `dist/index.html`，或 `npm run serve`（端口 5173）后在手机上访问局域网地址。注意：`navigator.share` 只在 HTTPS（或 localhost）下可用，用 `http://局域网IP` 打开时弹窗里没有「分享」按钮，只有提示「长按保存图片」，这是正常的；部署到 HTTPS 后才会出现。

## 部署（Cloudflare Pages：先预览，确认后再上线）

Pages 项目 `socrates-pig` **连接 GitHub 仓库自动构建**，本机不出产物、不手动上传。项目设置：

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Preview branches | 包含 `preview`（其它分支也可以开，地址为 `<分支名>.socrates-pig.pages.dev`） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node 版本 | 由仓库根目录 `.node-version`（22）指定 |

| 环境 | 地址 | 触发方式 |
| --- | --- | --- |
| 预览 | 固定地址 <https://preview.socrates-pig.pages.dev>（总是 `preview` 分支最新一次构建）；每次构建另有一个固定不变的 `https://<部署ID>.socrates-pig.pages.dev` | 推送到 `preview` 分支 |
| 正式 | <https://socrates-pig.000555.best>（Custom domains 中绑定；对应 Pages 地址 socrates-pig.pages.dev） | 推送到 `main` 分支 |

页面在运行时判断域名：只要不是 `socrates-pig.000555.best`（预览地址、localhost、本地文件），页面顶部居中就会显示黄色的「预览版」标记。这个标记只在页面上，不会画进结果图。

每次改动的流程：

1. 改源码 → `npm test` 全部通过 → 提交源码（中文说明）。
2. 推到预览分支：`git push origin HEAD:preview`（`preview` 分支只跟着 `main` 快进，不在上面单独提交）。
3. 等 Cloudflare 构建完成，在手机上（包括微信里）打开 <https://preview.socrates-pig.pages.dev> 测试：页脚哈希等于刚才的提交，有「预览版」标记。可以用 `node test/save-modes.js https://preview.socrates-pig.pages.dev/` 测预览站。
4. 确认说「上线」后推送 `main`：`git push origin main`。因为 `preview` 和 `main` 指向同一个提交，正式站的页脚哈希和预览站一致。然后检查正式站页脚哈希、没有「预览版」标记。

构建日志和每次部署对应的环境（Production / Preview）、分支、提交，在 Cloudflare 后台 Pages 项目的 Deployments 里看，也可以用 `npx -y wrangler pages deployment list --project-name socrates-pig`。

`dist/archive/` 也会一起部署（例如 `/archive/themes.html`），但正式入口不链接到它。

## 许可证

[MIT](LICENSE) © 2026 GinWU05
