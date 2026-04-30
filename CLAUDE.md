# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概况

个人书签导航页，部署到 Cloudflare Pages + Workers + KV。密码保护（httpOnly cookie），支持分组、全局置顶、拖拽排序、书签增删改查、自动抓取 favicon。

设计文档：
- 功能方案：`docs/DanDan/plan_bookmark_nav.md`
- UI 规范：`docs/DanDan/ui-design-spec.md`
- UI 效果图：`docs/DanDan/ui-preview.html`

## 规划目录结构

```
/
├── functions/api/          Cloudflare Pages Functions（API 层）
│   ├── _middleware.ts      /api/* 密码鉴权中间件，放行 POST /api/auth
│   ├── auth.ts             POST 登录 / DELETE 登出
│   ├── bookmarks.ts        GET/PUT 全量书签数据
│   └── favicon.ts          GET favicon 代理抓取
├── web/src/                React 前端
│   ├── components/
│   │   ├── LoginPage.tsx
│   │   ├── SearchBar.tsx
│   │   ├── BookmarkGrid.tsx   置顶区 + 分组列表
│   │   ├── BookmarkGroup.tsx  单个分组
│   │   ├── BookmarkCard.tsx   单个书签卡片
│   │   └── BookmarkModal.tsx  新增/编辑弹窗
│   ├── hooks/
│   │   └── useBookmarks.ts    数据获取与乐观更新
│   └── App.tsx
├── wrangler.toml
└── package.json            monorepo 根配置
```

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **拖拽**：@dnd-kit/core + @dnd-kit/sortable
- **部署**：Cloudflare Pages（前端）+ Pages Functions（API）
- **存储**：Cloudflare KV，单 key `"data"` 存全量 JSON

## 核心数据结构

```typescript
interface AppData { version: number; updatedAt: number; groups: Group[]; bookmarks: Bookmark[] }
interface Group { id: string; name: string; order: number }
interface Bookmark {
  id: string; groupId: string; title: string; url: string;
  favicon: string | null; pinned: boolean;
  order: number; pinnedOrder: number | null; createdAt: number
}
```

- `collapsed` 状态只存 localStorage（key: `collapsed_<groupId>`），不写 KV
- `groupId` 永远不为 null；置顶书签保留 groupId，并同时显示在置顶区和原分组内；取消置顶后仍留在该组

## API 设计

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth | 验证密码，设 httpOnly cookie（30天） |
| DELETE | /api/auth | 登出，清除 cookie |
| GET | /api/bookmarks | 返回全量 AppData |
| PUT | /api/bookmarks | 带 version 的全量写入，版本冲突返回 409 |
| GET | /api/favicon?url= | 服务端代理抓取 favicon |

- 写入前 Worker 必须校验：id 不重复、groupId 存在、url 为 http/https、title 非空且 ≤120 字
- 并发写入保护：前端带 version，Worker 检查版本冲突返回 409，前端重新拉取后重试

## 密码与 Cookie

- `PASSWORD`（SHA-256 校验）和 `AUTH_SECRET`（HMAC-SHA256 签名）存 Wrangler Secret，不进代码
- Token 格式：`expires.signature`，其中 `signature = HMAC-SHA256(expires, AUTH_SECRET)`
- Cookie：`auth_token`，HttpOnly，Secure，SameSite=Strict，Path=/，Max-Age=2592000

## Favicon 抓取顺序

1. 请求 `<origin>/favicon.ico`（200 + image/\*）
2. 抓首页 HTML 前 10KB，解析 `<link rel="icon">`
3. 回退 Google S2：`https://www.google.com/s2/favicons?domain=<domain>&sz=64`
4. 最终回退：前端默认 SVG 图标

抓取失败不阻塞书签保存。只允许 http/https URL，设超时，限制重定向次数和响应体大小。

## 关键行为约定

- **拖拽**：只在 `onDragEnd` 后写 KV，拖拽过程只更新本地状态；书签跨组拖动按鼠标指针所在分组判断目标区域
- **搜索**：输入时实时过滤（标题 + URL 模糊匹配）；Enter 跳 Google；页面任意位置按 `/` 聚焦搜索框
- **书签新增入口**：每组 grid 末尾的虚线 ghost 卡片，点击后预选该组打开弹窗
- **分组新增**：页面底部内联输入框，Enter 确认，Esc 取消
- **非空分组**：不允许直接删除，提示先移动或删除组内书签

## 部署命令（实现后）

```bash
# 本地开发
wrangler pages dev web/dist --kv BOOKMARKS

# 设置 Secrets
wrangler pages secret put PASSWORD
wrangler pages secret put AUTH_SECRET

# 创建 KV 命名空间
wrangler kv:namespace create BOOKMARKS

# 构建前端
cd web && npm run build
```

`wrangler.toml` 关键配置：
```toml
name = "arpage"
pages_build_output_dir = "web/dist"

[[kv_namespaces]]
binding = "BOOKMARKS"
id = "<your-kv-namespace-id>"
```
