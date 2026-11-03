# 苏哲 · 个人简历站

深色单页简历站，服务于 AI 应用开发 / Agent 架构岗位投递。部署在 Cloudflare Pages，国内可直接访问。

线上地址：**https://suzhe-resume.pages.dev**

源码：https://github.com/CodeAlex52/resume-site

## 特点

- **6 条真实运行链路**：每个项目一张可交互流程图，节点数据来自 `可以观测整体的运行链路，可调试/catalog.json`，点击节点可看该步的实现说明与代码位置。
- **证据优先**：项目卡片区分「生产口径」与「本地可复现边界」，不把目标态写成已完成。
- **零外部依赖**：无 CDN、无 Google Fonts、无构建步骤；纯 HTML/CSS/JS，国内加载稳定。
- **可打印**：内置 print 样式，浏览器直接打印 / 导出 PDF 也可读。

## 目录

```text
site/
├── index.html          # 页面结构 + 静态文案
├── styles.css          # 深色主题、响应式、打印样式
├── data.js             # 6 个项目的文案与运行链路节点
├── app.js              # 项目卡片渲染 / 节点交互 / 导航高亮 / 复制邮箱
├── assets/
│   ├── suzhe-resume.pdf
│   └── og.png
├── _headers            # Cloudflare Pages 安全与缓存响应头
└── robots.txt
```

## 本地预览

```bash
cd site
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173
```

## 更新内容

- 简历正文 / 项目描述：改 `index.html` 或 `data.js`。
- 项目运行链路：改 `data.js` 里的 `nodes`；字段为 `code / layer / title / endpoint / desc / source`。
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
