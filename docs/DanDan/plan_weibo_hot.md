# 微博热搜抽屉

## 目标

在书签导航页添加微博热搜功能。默认不显示，搜索框右侧提供入口按钮，点击后从左侧滑出抽屉展示热搜榜单。数据通过 Cloudflare Worker 代理获取，前端设 5 分钟冷却时间避免当前页面重复请求，Worker 侧再做短缓存降低上游请求频率。

## 数据来源

Worker 直接请求微博官方 AJAX 接口：

```
GET https://weibo.com/ajax/side/hotSearch
Headers:
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
  Referer: https://weibo.com/
```

返回结构（关键路径，微博字段可能变化，Worker 必须做容错解析）：

```json
{
  "ok": 1,
  "data": {
    "realtime": [
      {
        "word": "热搜词",
        "word_scheme": "#热搜词#",
        "num": 1234567,
        "label_name": "热/沸/新/爆",
        "rank": 0
      }
    ]
  }
}
```

### Worker 统一输出格式

```typescript
interface WeiboHotResponse {
  items: WeiboHotItem[]
  updatedAt: number // Unix timestamp ms
}

interface WeiboHotItem {
  rank: number       // 1-based
  title: string      // 热搜词
  hot: number | null // 热度数值
  url: string        // 微博搜索链接
  label: string | null // "热" | "沸" | "新" | "爆" | null
}
```

字段映射规则：
- `items` 最多返回 50 条。
- `rank` 使用数组下标 `index + 1`，不要直接使用微博返回的 `rank`，因为微博当前返回是 0-based。
- `title` 使用 `word`，为空时丢弃该条。
- `hot` 使用 `num ?? raw_hot ?? null`。
- `label` 只保留 `"热" | "沸" | "新" | "爆"`，其他值统一为 `null`。
- `url` 统一生成 `https://s.weibo.com/weibo?q=<encodeURIComponent(title)>`。

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/weibo-hot | 返回热搜榜单，受 middleware 鉴权保护 |

错误返回 `{ error: string }`，HTTP 502（上游失败）或 500（内部错误）。

Worker 实现约束：
- 只请求微博官方接口，不接入任何备用数据源。
- 使用 `AbortSignal.timeout(5000)` 设置 5 秒超时。
- 校验上游返回必须是 `ok === 1` 且 `data.realtime` 为数组，否则返回 502。
- 使用 `caches.default` 做 1-5 分钟短缓存，缓存 key 使用当前请求 URL。
- 缓存命中时直接返回统一格式数据；缓存未命中才请求微博。
- 不把上游原始异常、微博原始响应体暴露给前端。

## 前端缓存策略

- 首次打开抽屉时请求 `/api/weibo-hot`
- 数据缓存在组件 state 中，5 分钟内再次打开不重新请求
- 手动点击「刷新」按钮强制请求，无视冷却时间
- 冷却时间：5 分钟（300,000ms）
- 关闭抽屉不清除缓存；页面刷新后缓存重置
- 前端缓存只负责当前页面体验；跨页面刷新、跨标签页、跨设备的降频由 Worker 缓存负责

## UI 规范

### 入口按钮

位置：搜索框右侧，与搜索框同行。

```
[🔍  搜索书签…          / ] [火焰图标]
```

- 图标：16px outline 火焰 SVG，stroke-width 1.5
- 容器：34×34px，rounded-[7px]
- Hover：背景 `rgba(0,0,0,0.06)`
- 遵循 topbar 图标按钮的交互规范

### 左侧抽屉

- 定位：`position: fixed; top: 0; left: 0; height: 100vh; z-index: 50`
- 宽度：`min(360px, calc(100vw - 24px))`
- 背景：`#F4F4F2`
- 右边框：`1px solid #CCCCCC`
- 阴影：`3px 3px 0 #BBBBBB`（右侧硬边阴影）
- 动画：`transform: translateX(-100%) → translateX(0)`，200ms ease-out
- 遮罩：`rgba(0,0,0,0.5)`，点击关闭

#### 抽屉内部布局

```
┌──────────────────────────────┐
│  🔥 微博热搜            [×]  │  ← header 54px
│──────────────────────────────│
│                              │
│  1   热搜标题一        沸    │  ← 每条 44px 高
│  2   热搜标题二        热    │
│  3   热搜标题三              │
│  4   热搜标题四        新    │
│  ...                         │
│                              │
│──────────────────────────────│
│  更新于 12:30:45    [刷新]   │  ← footer 44px
└──────────────────────────────┘
```

#### Header

- 左侧：火焰图标（14px `#555`）+ 标题「微博热搜」`Playfair Display 15px 600`
- 右侧：关闭按钮 28×28px `radius-sm`
- 底部：`1px solid #DDDDDD` 分隔线

#### 榜单条目

- 高度：约 44px，`padding: 0 18px`
- 排名：`Space Mono 11px 700`，宽 24px
  - 前 3 名：`color #111`
  - 其余：`color #999`
- 标题：`Lora 13px 500 #111`，单行省略
- 标签：`Lora 11px 500`，`background #E2E2E2; padding 2px 6px; border-radius 4px; color #555`
- Hover：`background rgba(0,0,0,0.04)`
- 点击：新标签页打开 `https://s.weibo.com/weibo?q=<encodeURIComponent(title)>`
- 列表可滚动：`overflow-y: auto`，header 和 footer 固定

#### Footer

- 左侧：更新时间 `Space Mono 10px #999`
- 右侧：刷新按钮（Ghost 风格），`Lora 12px 500 #555`
- 顶部：`1px solid #DDDDDD` 分隔线

#### 状态

| 状态 | 显示 |
|------|------|
| Loading | 居中 `Space Mono 11px #999` 显示「加载中…」 |
| 数据正常 | 榜单列表 |
| 请求失败 | 居中错误提示 + 重试按钮 |

#### 快捷键

- `Esc`：关闭抽屉

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `functions/api/weibo-hot.ts` | 新建 | Worker 代理端点 |
| `web/src/components/WeiboHotDrawer.tsx` | 新建 | 抽屉组件 |
| `web/src/components/SearchBar.tsx` | 修改 | 增加搜索框右侧热搜入口按钮 |
| `web/src/App.tsx` | 修改 | 管理抽屉开关状态，引入抽屉组件 |

## 验收标准

1. 点击搜索框右侧火焰图标，左侧抽屉滑出
2. 首次打开时显示 loading → 数据加载完显示榜单
3. 5 分钟内关闭再打开，使用缓存数据不重新请求
4. 手动点刷新按钮，强制拉取最新数据
5. 点击榜单条目，新标签页打开微博搜索
6. 点击遮罩或关闭按钮或按 Esc，抽屉关闭
7. 微博接口不可用或返回结构异常时，接口返回 502，抽屉显示错误提示和重试按钮
8. 320px 宽度下抽屉不横向溢出，关闭按钮和刷新按钮仍可点击
9. Worker 连续请求命中短缓存，避免每次打开都请求微博上游
10. `cd web && npm run build` 通过
