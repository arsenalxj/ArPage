# 书签导航页设计方案

## 目标

个人使用的书签导航页，部署到 Cloudflare，密码保护访问，支持分组管理、全局置顶、拖拽排序。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |
| 部署 | 推荐 Cloudflare Pages + Pages Functions（同域 `/api/*`）；也可用独立 Worker |
| 存储 | Cloudflare KV（单 key 存全量 JSON） |
| 密码 | Wrangler Secret（`PASSWORD`、`AUTH_SECRET`，不进代码库） |

## 数据结构

KV 存单个 key `"data"`，值为：

```typescript
interface AppData {
  version: number
  updatedAt: number
  groups: Group[]
  bookmarks: Bookmark[]
}

interface Group {
  id: string
  name: string
  order: number
  // collapsed 不进 KV，存 localStorage，key 为 `collapsed_<id>`
}

interface Bookmark {
  id: string
  groupId: string       // 必须属于某个组，即使处于置顶状态也保留原组 id
  title: string
  url: string
  favicon: string | null  // 服务端抓取后缓存的 favicon URL
  pinned: boolean
  order: number           // 未置顶时表示组内顺序
  pinnedOrder: number | null // 置顶时表示全局置顶区顺序，未置顶为 null
  createdAt: number
}
```

**数据初始化**：KV 中没有 `"data"` 时，Worker 返回空数据 `{ version: 1, updatedAt: Date.now(), groups: [], bookmarks: [] }`，前端显示空状态并引导创建第一个分组。

**并发写入**：前端写入时必须带上当前 `version`。Worker 保存前读取 KV，如果版本不一致返回 409，前端重新拉取数据并提示用户重试。该方案适合个人低频使用，只能降低覆盖风险，不提供真正的原子并发控制；如果后续变成多人或多设备高频编辑，应改用 Durable Object 或 D1 做串行写入。

**置顶逻辑**：`pinned: true` 的书签显示在页面顶部全局置顶区，同时保留在原 `groupId` 对应的分组中；取消置顶后仍停留在原组内，并将 `pinnedOrder` 设为 `null`。置顶区顺序由 `pinnedOrder` 控制，组内顺序由 `order` 控制，两者互不覆盖。

**服务端数据校验**：Worker 写入前必须校验 `id` 不重复、`groupId` 存在、`url` 为 `http/https`、`order`/`pinnedOrder` 为数字或 `null`、`title` 非空且长度不超过 120。校验失败返回 400，不写入 KV。

## API（Cloudflare Pages Functions / Worker）

除 `POST /api/auth` 登录接口外，其他 `/api/*` 接口都先过密码中间件，cookie 无效返回 401。

```
POST /api/auth              验证密码，成功设 httpOnly cookie（30天）
DELETE /api/auth            清除 cookie（登出）
GET  /api/bookmarks         返回全量 AppData
PUT  /api/bookmarks         带 version 校验的全量写入 KV，版本冲突返回 409
GET  /api/favicon?url=      服务端代理抓取 favicon
```

## 密码保护

- 密码和签名密钥存 Wrangler Secret（`PASSWORD`、`AUTH_SECRET`），不进 KV，不进 git
- 校验：`SHA-256(input) === SHA-256(env.PASSWORD)`（Worker 端用 SubtleCrypto）
- 登录成功后生成签名 token：`expires.signature`，其中 `signature = HMAC-SHA256(expires, env.AUTH_SECRET)`
- Cookie：`auth_token`，HttpOnly，Secure，SameSite=Strict，Path=/，Max-Age=2592000（30天）
- 校验 cookie 时必须验证签名和过期时间；登出时清除 cookie
- 未登录访问任何路由 → 重定向 `/login`

## Favicon 抓取策略（Worker 端执行，避免跨域）

```
1. 请求 <origin>/favicon.ico，200 且 Content-Type 为 image/* → 使用
2. 抓首页 HTML 前 10KB，解析 <link rel="icon"> 或 <link rel="shortcut icon">
3. 回退：https://www.google.com/s2/favicons?domain=<domain>&sz=64
4. 最终回退：前端展示默认 SVG 书签图标
```

抓取成功后 URL 缓存进书签的 `favicon` 字段，后续不重复请求。

安全边界：

- 只允许抓取 `http/https` URL
- 请求设置超时，限制重定向次数和响应体大小
- HTML 中的相对 icon 地址必须用页面 origin 转成绝对 URL
- favicon 抓取失败不阻塞书签保存，前端使用默认图标

## 搜索框行为

| 输入内容 | 行为 |
|---|---|
| 普通文字 | 实时过滤书签（标题 + URL 模糊匹配） |
| 普通文字 + Enter | 跳转 Google 搜索 |
| URL 格式（含 `.`、无空格） + Enter | 直接导航到该 URL |
| 空输入 + Enter | 无操作 |
| 页面任意位置按 `/` | 聚焦搜索框（非输入框内触发时拦截默认行为） |

搜索时书签过滤结果不按分组显示，统一平铺。无匹配时展示空状态，并显示「在 Google 搜索 xxx」的一键入口（等同于按 Enter）。

## 拖拽规则

| 操作 | 行为 |
|---|---|
| 拖拽书签（未置顶） | 组内排序或拖入其他组（更新 groupId + order） |
| 拖拽置顶书签 | 在全局置顶区内调整顺序（更新 pinnedOrder） |
| 拖拽组标题 | 调整组的顺序（更新 group.order） |

书签跨组拖动按鼠标指针所在分组判断目标区域；分组正文、书签空白处和分组下方间距都应作为可投放区域，避免只有卡片中心点命中时才生效。拖拽过程中只更新本地状态，**仅在 `onDragEnd` 触发后写入 KV**，避免大量并发请求和版本冲突。

## 书签 CRUD

- 新增入口：每个分组卡片列末尾有虚线 ghost 卡片「添加书签」，点击后打开弹窗并预选该分组；若无分组则提示先创建分组
- 新增/编辑弹窗行为：
  - 初始状态：URL 为空，无图标，标题为空，保存按钮禁用
  - URL 填入后：自动向 `/api/favicon` 发起请求，获取标题和图标（异步，不阻塞保存）
  - 分组下拉列表：仅显示现有分组，不含「新建分组」入口
  - 编辑时可手动点击「刷新图标」重新抓取 favicon
- 编辑：可修改标题、URL、所属组
- 删除：二次确认弹窗
- 置顶/取消置顶：通过卡片 `⋯` 菜单操作
- 操作入口：桌面端 hover 时卡片右侧浮出 `⋯` 按钮，点击展开下拉菜单（置顶、编辑、删除）；卡片本体整体可点跳转，避免误触
- 移动端：`⋯` 按钮始终可见（不依赖 hover）
- URL 不带协议但像域名时，保存前自动补 `https://`

## 分组 CRUD

- 新增：点击页面底部「新建分组」后出现内联输入框，回车确认、Esc 取消；确认后追加到分组列表末尾，分组名不能为空，长度不超过 40
- 重命名：点击分组头部「重命名」后分组名变为内联输入框，规则同上
- 删除：空分组可直接删除；非空分组默认禁止删除，并提示先移动或删除组内书签
- 折叠/展开：状态存 `localStorage`（key: `collapsed_<groupId>`），不写 KV，刷新页面后保持
- 排序：拖拽组标题后重排所有 `group.order`，避免出现重复顺序值


## 目录结构

```
/
├── functions/
│   └── api/
│       ├── auth.ts          POST 登录、DELETE 登出
│       ├── bookmarks.ts     GET/PUT 书签数据
│       ├── favicon.ts       favicon 代理抓取
│       └── _middleware.ts   `/api/*` 密码中间件，跳过 POST /api/auth
├── web/
│   └── src/
│       ├── components/
│       │   ├── LoginPage.tsx
│       │   ├── SearchBar.tsx
│       │   ├── BookmarkGrid.tsx    置顶区 + 分组列表
│       │   ├── BookmarkGroup.tsx   单个分组
│       │   ├── BookmarkCard.tsx    单个书签卡片
│       │   └── BookmarkModal.tsx   新增/编辑弹窗
│       ├── hooks/
│       │   └── useBookmarks.ts     数据获取与乐观更新
│       └── App.tsx
├── wrangler.toml
└── package.json             monorepo 根配置
```

如果改用独立 Worker，API 目录改为 `worker/src/`：`index.ts` 做路由入口和中间件，`auth.ts`、`bookmarks.ts`、`favicon.ts` 复用同样职责。

## 部署流程

0. `wrangler.toml` 根级配置（Pages + Pages Functions）：
   ```toml
   name = "arpage"
   pages_build_output_dir = "web/dist"

   [[kv_namespaces]]
   binding = "BOOKMARKS"
   id = "<your-kv-namespace-id>"
   ```
   本地开发用 `wrangler pages dev` 时，静态文件从 `web/dist` 读取，`/api/*` 由 `functions/` 处理。

1. Pages Functions 推荐命令：`wrangler pages secret put PASSWORD` 设置访问密码
2. Pages Functions 推荐命令：`wrangler pages secret put AUTH_SECRET` 设置 cookie 签名密钥
3. `wrangler kv:namespace create BOOKMARKS` 创建 KV 命名空间
4. 推荐使用 Cloudflare Pages + Pages Functions，同域提供 `/api/*`，避免跨域和 cookie domain 问题
5. 如果改用独立 Worker，secret 命令改用 `wrangler secret put PASSWORD` 和 `wrangler secret put AUTH_SECRET`，再执行 `wrangler deploy`，并配置 `VITE_API_BASE_URL`、CORS 白名单和 cookie domain

## 验收标准

- [ ] 未登录访问跳转登录页，密码正确后 cookie 存 30 天
- [ ] 登出后不能继续访问 API
- [ ] 书签增删改查正常，数据持久化到 KV
- [ ] KV 为空时能自动初始化，页面提示创建第一个分组
- [ ] 快速连续拖拽、编辑、置顶不会互相覆盖；版本冲突时提示重试
- [ ] favicon 三级回退全部生效
- [ ] favicon 抓取失败不影响书签保存
- [ ] 置顶书签显示在全局区，同时保留在原分组内
- [ ] 拖拽排序：组内、跨组、组间顺序均正确持久化
- [ ] 搜索过滤实时响应，Enter 跳 Google
- [ ] 分组折叠/展开状态持久化
- [ ] 分组新增、重命名、删除规则符合预期，非空分组不会被误删
- [ ] 移动端可完成新增、编辑、删除、置顶、搜索等核心操作
