# 你是痛苦的苏格拉底，还是快乐的猪？

> 「做一个不满足的人，胜过做一只满足的猪；做不满足的苏格拉底，胜过做满足的傻瓜。」
> —— 约翰·斯图尔特·密尔《功利主义》

一个移动端 H5 小测验：用两个维度把人放进四个象限——**你习惯思考追问，还是享受当下？你此刻真实的感受，是痛苦还是快乐？**
测完告诉你「你现在是谁」「你想成为谁」，并给出几条温和、具体的建议，帮你更接近自己想要的样子。

- 🌐 在线体验：<https://socrates-pig.000555.best>（规划中）
- 📦 单个 HTML 文件，内联 CSS / JS，**零依赖、无 CDN、可离线使用**

<p align="center">
  <img src="docs/cover.png" width="230" alt="封面">
  <img src="docs/question.png" width="230" alt="答题页">
  <img src="docs/result.png" width="230" alt="结果页">
</p>

## 功能

- **完整版（14 题）**：13 道计分题，同时在两个维度上计分（每个选项可影响一个或两个维度）；第 14 题不计分——「如果可以选，你想成为这四个里的哪一个？」
- **速通版（2 题）**：直接自选「我现在是哪一个」「我想成为哪一个」，结果页标注「速通版·自评」，并可一键「做完整版」
- **四象限结果**：痛苦的苏格拉底 / 快乐的苏格拉底 / 痛苦的猪 / 快乐的猪，结果页显示「你现在是 X，你想成为 Y」
- **维度图**：自绘 SVG 象限图（渐变象限、同心网格、刻度、呼吸光点、从「现在」指向「想成为」的虚线弧箭头、图例），可切换 4 轴雷达图（思考 / 享受 / 痛苦 / 快乐）；答题时顶部有迷你象限实时显示位置
- **成长建议**：16 组内容——12 种 X → Y 的转变路径 + 4 种「保持现状」的健康建议，每组 3–4 条
- **结果图分享**：canvas 绘制 1080 宽高清长图（含象限图、现在/想成为、得分、建议）；支持 `navigator.share` 文件分享的设备直接调起系统分享，否则弹窗展示图片（可长按保存）+「保存图片」按钮
- **返回导航**：每个页面 `history.pushState`，手机返回手势 / 浏览器后退按页面回退；第 1 题返回封面；顶栏「回首页」按钮，有答题进度时轻提示「退出后本次答题进度会丢失」
- **固定配色**：唯一皮肤「深夜」靛紫；不跟随系统深浅色，阻止 Android Chrome 自动深色与 Dark Reader 等扩展改色（`color-scheme: only light`、`supported-color-schemes`、`darkreader-lock`）
- **禁止缩放**：`maximum-scale=1, user-scalable=no`、`touch-action: manipulation`，并拦截 iOS 双指缩放 / 双击放大
- **体验细节**：流畅动画且尊重 `prefers-reduced-motion`；适配刘海 / 底部安全区；无横向滚动；按钮有键盘焦点样式和 ARIA 标签

<p align="center">
  <img src="docs/chart.png" width="330" alt="维度图（象限视图）">
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
- 正好落在轴线上（A 或 B = 0）时，图上的点会略微偏进所属象限，避免压在分界线上
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
├── dist/                    # 构建产物（已提交，可直接部署）
│   ├── index.html           # 正式入口 = 主题 1「深夜」，自包含单文件
│   └── archive/             # 存档：5 个主题 + themes.html 选择页（正式入口不链接）
├── src/                     # 唯一源码
│   ├── app.html             # HTML 模板（含 {{占位符}}）
│   ├── app.css              # 公共样式（CSS 变量驱动）
│   ├── app.js               # 题目 / 计分 / 建议 / 导航 / 分享结果图
│   ├── chart.js             # 象限图、雷达图（SVG）+ 结果图里的象限图（canvas）
│   └── themes/              # 主题变量：<id>.css（页面）+ <id>.json（结果图配色）
├── test/                    # Playwright 测试（使用本机 Chrome）
│   ├── env.js               # 公共配置：路径、Chrome 位置
│   ├── themes.js            # 全流程点测 + 截图
│   ├── share.js             # 多场景结果图 + 弹窗比例 + 防缩放检查
│   └── colorscheme.js       # 浅色 / 深色 / 强制深色下逐字节比对截图
├── docs/                    # README 用截图
├── legacy/index.v1.html     # 旧版（单维度、5 档结果），仅留档
├── build.js                 # 构建脚本
└── package.json
```

## 构建与测试

需要 Node.js ≥ 18。

```bash
npm install          # 只装 playwright-core（不下载浏览器）
npm run build        # = node build.js，生成 dist/
npm test             # 构建 + 测正式入口 + 结果图/防缩放 + 深色模式锁定
npm run test:all     # 额外把 dist/archive/ 里的 5 个主题全测一遍
```

修改 `src/` 后必须重新构建，`dist/` 不要手改。

测试使用本机已安装的 Chrome（playwright-core 不自带浏览器）。默认会按系统查找常见安装位置（macOS：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`），找不到时请用环境变量指定：

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

测试在 390×844（iPhone 尺寸）下运行：

- `test/themes.js [index|1-dark|…]`：走完整版和速通版，检查四个象限都能到达、「想成为」文案、建议条数、维度图坐标、分享弹窗、返回 / 回首页 / 浏览器后退、确认弹窗、控制台无报错
- `test/share.js`：各象限、相同/不同愿望、A 或 B 正好为 0、速通版共 10 种场景的结果图，以及弹窗中图片不被拉伸、防缩放是否生效
- `test/colorscheme.js`：分别在浅色、深色、Chrome 强制深色下渲染，截图必须逐字节一致

截图输出到 `shots/`（已在 `.gitignore` 中忽略）。

本地预览：直接双击打开 `dist/index.html`，或 `npm run serve` 后在手机上访问局域网地址。

## 部署（Cloudflare Pages）

`dist/` 已提交到仓库，可直接作为静态站点部署：

| 设置 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | 留空（直接用已提交的 `dist/`）；也可以填 `node build.js` |
| Build output directory | `dist` |

自定义域名在 Pages 项目的 Custom domains 中绑定 `socrates-pig.000555.best`。`dist/archive/` 也会被部署（路径为 `/archive/`），但正式入口不会链接到它。
