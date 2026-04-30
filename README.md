# ArPage

个人书签导航页，部署到 Cloudflare Pages + Pages Functions + KV。项目提供密码保护访问、分组管理、全局置顶、拖拽排序、书签增删改查和 favicon 自动抓取。

## 功能

- 密码登录：使用 httpOnly cookie 保存登录状态。
- 书签管理：支持新增、编辑、删除、搜索、打开书签和从菜单复制链接。
- 分组管理：支持新增、重命名、折叠、排序和删除空分组。
- 全局置顶：置顶书签会显示在顶部置顶区，同时保留在原分组内。
- 拖拽排序：支持组内排序、跨组移动、置顶区排序和分组排序。
- favicon 抓取：服务端代理获取网站图标，失败时不影响保存。
- 网站图标：提供浏览器标签页、移动端主屏和高清 PNG 图标。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |
| API | Cloudflare Pages Functions |
| 存储 | Cloudflare KV |
| 部署 | Cloudflare Pages + GitHub Actions |

## 目录结构

```text
/
├── functions/api/          Cloudflare Pages Functions
├── functions/_lib/         API 共享工具
├── web/src/                React 前端源码
├── web/public/             静态资源和网站图标
├── .github/workflows/      CI 与自动部署配置
├── docs/DanDan/            功能方案和 UI 设计文档
├── wrangler.toml           Cloudflare 配置
└── package.json            根项目脚本
```

## 本地开发

安装依赖：

```bash
npm install
cd web && npm install
```

启动前端开发服务器：

```bash
npm run dev:web
```

如果需要同时调试 Pages Functions，先构建或启动前端，再运行：

```bash
npm run dev:worker
```

本地 secrets 可放在 `.dev.vars`，不要提交到 git：

```env
PASSWORD=your-password
AUTH_SECRET=your-random-secret
```

## 构建

```bash
npm run build
```

## Cloudflare 配置

创建 KV：

```bash
wrangler kv:namespace create BOOKMARKS
```

把生成的 `id` 和 `preview_id` 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "BOOKMARKS"
id = "<your-kv-namespace-id>"
preview_id = "<your-preview-kv-namespace-id>"
```

设置 Pages secrets：

```bash
wrangler pages secret put PASSWORD
wrangler pages secret put AUTH_SECRET
```

## 部署

### 自动部署

推送到 `master` 后，GitHub Actions 会自动执行构建并部署到 Cloudflare Pages。PR 到 `master` 时只执行构建检查，不部署。

需要先在 GitHub Repository Secrets 中配置：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

`PASSWORD` 和 `AUTH_SECRET` 仍然是 Cloudflare Pages 运行时 secret，不需要放进 GitHub Actions。

### 手动部署

首次部署或需要自动准备 Pages/KV 时：

```bash
npm run deploy:cloudflare
```

脚本会检查 Wrangler 登录状态、创建或复用 Pages 项目、创建或复用 KV、更新 `wrangler.toml`、构建并部署。

如果 Pages 项目和 KV 已经准备好，也可以只构建并部署：

```bash
npm run deploy
```

## 设计文档

- 功能方案：`docs/DanDan/plan_bookmark_nav.md`
- CI 与自动部署方案：`docs/DanDan/plan_github_actions_ci_deploy.md`
- UI 规范：`docs/DanDan/ui-design-spec.md`
- UI 预览：`docs/DanDan/ui-preview.html`

## 注意事项

- `PASSWORD` 和 `AUTH_SECRET` 必须通过 Cloudflare secret 或本地 `.dev.vars` 配置，不要写进代码。
- 当前数据存储为 KV 单 key 全量 JSON，适合个人低频使用。
- 写入时通过 `version` 做冲突保护，多窗口同时编辑时可能需要刷新后重试。
