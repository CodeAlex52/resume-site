# 苏哲 · 个人简历站

![预览](assets/og.png)

深色单页简历站，服务于 AI 应用开发 / Agent 架构岗位投递。部署在 Cloudflare Pages，国内多数网络可直连；如遇个别运营商 DNS 污染或晚高峰波动，绑定自定义域名即可绕开 `pages.dev` 域名层。

线上地址：**https://suzhe-resume.pages.dev**

源码：https://github.com/CodeAlex52/resume-site

## 特点

- **首屏飞轮**：6 个项目不是平铺的卡片，而是一张会自动运转的飞轮。内容获客 → 导购转化 → 售后留存 → 数据沉淀 → 模型进化，06 平台底座在中心托住每一环；自动轮播、可暂停、可点节点看说明。
- **轻正文、重证据**：主页面只保留一句话与一个关键指标；完整项目描述、3 条要点、runtime 链路、代码位置与 EVIDENCE 收进右侧抽屉，点开再看。
- **6 条真实运行链路**：节点数据来自 `可以观测整体的运行链路，可调试/catalog.json`；点击链路节点可看该步实现说明与源码位置。
- **证据优先**：区分「生产口径」与「本地可复现边界」，不把目标态写成已完成。
- **全端自适应**：桌面双栏、平板紧凑头部、手机单栏；手机首屏即可看到完整飞轮与当前步骤说明。
- **零外部依赖**：无 CDN、无 Google Fonts、无构建步骤；纯 HTML/CSS/JS。
- **可打印**：内置 print 样式，浏览器直接打印 / 导出 PDF 也可读。

## 目录

```text
site/
├── index.html          # 页面结构 + 静态文案 + 飞轮 SVG
├── styles.css          # 深色主题、飞轮动画、抽屉、响应式、打印
├── data.js             # 6 个项目详情 + 运行链路节点 + 飞轮元数据
├── app.js              # 飞轮轮播 / 抽屉渲染 / 节点交互 / 导航高亮
├── assets/
│   ├── suzhe-resume.pdf
│   └── og.png
├── _headers            # Cloudflare Pages 安全与缓存响应头
├── robots.txt
└── sitemap.xml
```

## 本地预览

```bash
cd site
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173
```

## 更新内容

- 飞轮节点与文案：改 `data.js` 里的 `FLYWHEEL_META`；顺序改 `FLYWHEEL_ORDER`。
- 项目卡片一句话 / 指标：改 `index.html` 的 `.pcard`。
- 项目详情与运行链路：改 `data.js` 里的 `nodes`；字段为 `code / layer / title / label / endpoint / desc / source`。
- 替换简历 PDF：覆盖 `assets/suzhe-resume.pdf`。
- 替换社交分享图：覆盖 `assets/og.png`（建议 1200×630）。

## 部署

Cloudflare Pages 项目 `suzhe-resume` 已创建并绑定 `main` 为生产分支。后续更新：

```bash
npx wrangler pages deploy . --project-name suzhe-resume --branch main
```

首次创建项目（本仓库已完成，无需重复）：

```bash
# 若 wrangler 把项目创建成 Worker，请在 Cloudflare Dashboard
# Workers & Pages → Create → Pages → Direct Upload 新建名为 suzhe-resume 的项目
npx wrangler pages deploy . --project-name suzhe-resume --branch main
```

## 口径

- KEY RESULTS 数字为生产口径（来源：简历）。
- EVIDENCE 行标注本地可复现边界；本地未验证的部分明确写「未执行 / 目标态」。
- 不宣称 P6 已完成 Serverless 真机部署；当前为 Docker Compose，同一镜像不同启动命令。
