# ArPage UI Design Spec

---

## Design Language

**Name:** E-Ink Editorial

高对比度、纯灰阶的印刷风格。页面背景呈冷灰白而非纯白，模拟墨水屏的微胶囊底色；所有阴影均为 2–6px 硬边错位（no blur），而非高斯柔化，形成类印章的几何压感。字体以 Playfair Display 作为展示级字体，Lora 作为正文衬线字体，共同构成报纸排版气质。

---

## Design Philosophy

1. **消除一切颜色，只用黑白灰传达层级。** 任何信息差异通过灰度深浅和字重区分，不依赖色彩编码。
2. **阴影是几何压痕，不是光学模糊。** 使用 `Xpx Ypx 0 #hex`（零 blur）而非 `rgba(…)` 高斯阴影；阴影值越大，元素层级越高。
3. **边框是结构，不是装饰。** 容器边框用 `1px solid`，交互 hover/focus 升为 `1.5px` 且颜色加深至 `#111111`，用线的重量传达当前状态。
4. **细颗粒纹理作为背景噪声，而非肌理。** 背景叠加稀疏黑色微粒（dithering），模拟 e-ink 微胶囊物理质感，不使用暖色 grain。
5. **字体排版即设计核心。** 分组标题、Logo 用 Playfair Display（衬线展示）；卡片标题、正文、按钮用 Lora；键位提示用 Space Mono；三种字体分工明确，不混用。

---

## Color System

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Ink Black | `#111111` | Logo, 正文、按钮填充、focus 边框、所有强调元素 |
| Primary hover | Dark Gray | `#2A2A2A` | Primary 按钮 hover 态 |
| Surface | Cool White | `#F4F4F2` | 卡片背景、输入框、弹窗、下拉菜单 |
| Background | E-Ink Gray | `#E8E8E5` | 页面底色 |
| Section | Light Gray | `#E2E2E2` | 置顶区背景、hover 浮层背景 |
| On-primary | Off-White | `#E8E8E5` | Primary 按钮上的文字 |
| On-surface | Ink Black | `#111111` | 卡片标题、表单输入值 |
| Secondary text | Mid Gray | `#777777` | 域名、斜体副文本 |
| Muted | Light Gray Text | `#999999` | 数量统计、placeholder、分组计数 |
| Disabled | Pale Gray | `#AAAAAA` | 禁用边框色、⋯ 默认色、虚线 ghost 元素 |
| Border default | Gray Border | `#CCCCCC` | 卡片边框、输入框边框 |
| Border section | Mid Border | `#BBBBBB` | 分组 header 分隔线、topbar 边框、置顶区边框 |
| Divider | Thin Line | `#DDDDDD` | 下拉菜单内分割线 |
| Label text | Dim Gray | `#555555` | 表单 label、ghost 按钮文字 |
| Error / Danger | Ink Black | `#111111` | 删除按钮（与 Primary 颜色相同，通过 label 区分） |
| Overlay | Black Veil | `rgba(0,0,0,0.5)` | 弹窗背景遮罩 |
| Icon hover bg | Ghost Bg | `rgba(0,0,0,0.06)` | topbar 图标 hover 背景 |

---

## Typography System

| Style | Font | Size | Weight | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|---|
| Display | Playfair Display | 36px | 700 | 1.2 | -1px | 登录页 Logo |
| Logo | Playfair Display | 22px | 700 | 1 | -0.5px | Topbar Logo |
| Heading 1 | Playfair Display | 15px | 600 | 1.4 | 0 | 分组名称 |
| Pin Label | Playfair Display | 11px | 600 | 1 | 1.5px | 置顶区标签（全大写） |
| Body | Lora | 15px | 400 | 1.5 | 0 | 搜索框输入 |
| Body small | Lora | 14px | 400/500 | 1.5 | 0 | 按钮文字、表单输入值 |
| Card title | Lora | 13px | 500 | 1.3 | 0 | 书签卡片标题 |
| Domain | Lora (italic) | 11px | 400 | 1 | 0 | 书签域名 |
| Label | Lora | 12px | 500 | 1 | 0.5px | 表单字段 label |
| Caption | Lora | 12px | 400 | 1 | 0 | ghost 按钮文字、下拉选项 |
| Mono | Space Mono | 10–11px | 400/700 | 1.4 | 1.5–3px | 键位提示、状态标签 |
| Subtext italic | Lora (italic) | 13–14px | 400 | 1.7 | 0 | 空状态说明文字 |

---

## Spacing System

Base unit: **8px**

| Token | Value | Usage |
|---|---|---|
| space-0.5 | 4px | 图标与文字的最小间距（⋯ 按钮内、kbd padding） |
| space-1 | 8px | 书签卡片内部 gap、grid 卡片间距 |
| space-1.5 | 10px | 卡片内 padding vertical、分组 header gap |
| space-2 | 14px | 卡片内 padding horizontal、分组 header bottom spacing |
| space-2.5 | 18px | 置顶区 padding、表单字段间距 |
| space-3 | 22–24px | 置顶区 padding horizontal、登录卡 divider margin |
| space-4 | 26–30px | 分组间距、搜索框 top padding |
| space-6 | 48px | 页面水平 padding、topbar padding |

---

## Border Radius

交互元素（按钮、输入框、卡片）统一用 `7px`；容器级（弹窗、下拉菜单、置顶区）用 `8–12px`；小型标签和提示用 `4–5px`；Favicon 方块用 `6px`。

| Token | Value | Usage |
|---|---|---|
| radius-xs | 4px | kbd 键位提示标签 |
| radius-sm | 5px | ⋯ 按钮、下拉菜单条目 |
| radius-md | 6px | Favicon 方块 |
| radius-base | 7px | 书签卡片、按钮、表单输入框 |
| radius-lg | 8px | 搜索框、置顶区、下拉菜单容器 |
| radius-xl | 12px | 弹窗（Modal）、登录卡片 |

---

## Shadows and Elevation（E-Ink 硬边阴影）

所有阴影 blur 为 0，通过 XY 偏移和颜色深度表达层级。阴影方向统一为右下（正值 X/Y）。

| Level | CSS box-shadow | Flutter BoxShadow | Usage |
|---|---|---|---|
| 0 | `none` | none | 卡片静止态、平铺 surface |
| 1 | `1px 1px 0 #CCCCCC` | offset(1,1), color #CCC, blur 0 | 搜索框默认态 |
| 2 | `2px 2px 0 #AAAAAA` | offset(2,2), color #AAA, blur 0 | 卡片 hover、输入框 focus |
| 2f | `2px 2px 0 #999999` | offset(2,2), color #999, blur 0 | focus 态（比 hover 更深） |
| 3 | `3px 3px 0 #BBBBBB` | offset(3,3), color #BBB, blur 0 | 下拉菜单 |
| 4 | `4px 4px 0 #AAAAAA` | offset(4,4), color #AAA, blur 0 | 拖拽中的书签卡片 |
| 5 | `5px 5px 0 #BBBBBB` | offset(5,5), color #BBB, blur 0 | Modal 弹窗 |
| 6 | `6px 6px 0 rgba(0,0,0,0.12)` | offset(6,6), color rgba(0,0,0,0.12), blur 0 | 屏幕截面外框（预览用） |

---

## Icon Language

**Style:** Outline（细描边，stroke-width 1.5–1.6）— 每个图标只有轮廓，无填充，与灰阶页面风格一致，避免视觉重量过重。

**Library:** 手写内联 SVG（Lucide 风格），`viewBox="0 0 18 18"` 或 `16 16`，圆角线端（`stroke-linecap="round"`）。

**Size scale:**
| 尺寸 | 用途 |
|---|---|
| 10px | 分组折叠箭头、置顶 pin 图标 |
| 13px | 下拉菜单条目图标 |
| 14px | 添加书签的 + 号 |
| 16px | Topbar 图标按钮 |
| 18px | 搜索框搜索图标 |

**Rule:** 图标单独出现时（如 topbar 操作区）宽 34px × 高 34px 的点击区，hover 时浮出 `rgba(0,0,0,0.06)` 背景；图标配文字时无需额外容器。

---

## Component Library

| Component | Variants | States | Note |
|---|---|---|---|
| Button | Primary, Ghost, Danger | Default, Hover, Disabled | Danger 与 Primary 颜色相同（`#111`），仅 label 区分 |
| Input | Text Field, Search Bar | Empty, Focused, Filled, Disabled | Focus 加深边框到 `#111111` + `2px 2px 0 #999` 阴影 |
| Card | Bookmark Card, Ghost Add Card | Rest, Hover, Drag | Hover 升为 `#111` 边框 + level-2 阴影；Ghost 用虚线边框 |
| Favicon | Text Abbr | — | 26×26px，灰阶背景（`#111`–`#555`），白色文字 |
| Dropdown | Context Menu | Rest, Item Hover | `3px 3px 0 #BBBBBB`；条目 hover 背景 `#E2E2E2` |
| Modal | Add/Edit Bookmark, Create Group | Open (with overlay) | `5px 5px 0 #BBBBBB`；遮罩 `rgba(0,0,0,0.5)` |
| Group Header | Default, Collapsed | Rest, Hover action | 折叠态 border-bottom 改虚线，name 降透明度到 50% |
| Pinned Section | — | Empty (hidden), Populated | 背景 `#E2E2E2`，与卡片区形成灰度层差 |
| Search Bar | — | Empty, Focused, Filtering | 宽 660px 居中；Filtering 态显示匹配文字高亮（`rgba(0,0,0,0.1)` 底） |
| Kbd Hint | — | — | `background:#E2E2E2; border:1px solid #AAAAAA; border-radius:4px` |
| Inline Input | Group Rename | Editing | 复用 `.sa-field-input` 样式，内联替换对应文字节点；新建分组不使用内联输入 |
| Topbar Meta | IP Chip, Time | — | Topbar 中部，`ml-auto` 推至右侧。IP chip：`height 24px; padding 0 9px; border 1px solid #CCCCCC; border-radius 5px; background #E2E2E2`；IP 获取失败时不渲染。时间：`Space Mono 10px #777777`，始终显示，每秒刷新。 |
| Recent History | History Strip, History Item | Hidden, Populated, Hover | 页面底部区域。仅在收到扩展历史数据且存在未添加 URL 时渲染；无权限、无数据、无未添加项时完全隐藏，不显示空态。 |
| Delete Confirm | — | — | 弹窗内红色警示文字为深灰 `#444`，按钮仍为黑色 Primary |
| Pomodoro Timer | Expanded, Collapsed | Idle, Running, Paused, Editing | 悬浮右下角 `fixed bottom:24 right:24 z-40`；展开宽 `220px`，level-3 阴影；收起为单行 `40px` 高 |
| Weibo Hot Drawer | — | Loading, Populated, Refresh Failed, First-load Error | 左侧抽屉 `fixed left:0 top:0 h-screen z-50`；宽 `min(360px, calc(100vw-24px))`；右侧圆角 `8px`；level-3 阴影。Header 54px（火焰图标 + 标题 + 关闭按钮），榜单条目 44px 高可滚动，Footer 44px（更新时间 + 刷新按钮）。刷新失败时 footer 追加 `Lora 11px italic #444` "· 刷新失败"，按钮文字变"重试"。入口：搜索框右侧 34×34 火焰图标按钮。 |

---

## Page Layout Patterns

### 1. Full-Page Column（主页布局）

顶栏 + 搜索条 + 内容区竖向排列，水平 padding 48px。

```
┌──────────────────────────────────┐
│  [Logo]  [IP chip][time][icnbtn] │  ← topbar 54px
├──────────────────────────────────┤
│         [   Search Bar   ]       │  ← 搜索区 ~96px
├──────────────────────────────────┤
│  ┌──────────────────────────┐    │
│  │ 📌 置顶区                │    │  ← 置顶区（有置顶时显示）
│  └──────────────────────────┘    │
│  ─── 分组名 ──────────────────   │
│  [Card][Card][Card][+Add]        │  ← 书签 grid flex-wrap
│  ─── 分组名 ──────────────────   │
│  [Card][Card][+Add]              │
│  [+ 新建分组]                    │
│  ─── 最近浏览 ────────────────── │  ← 有扩展历史数据时显示
│  [History][History][History]      │
└──────────────────────────────────┘
```

### 2. Modal Overlay（弹窗布局）

主页面原地加遮罩，弹窗居中绝对定位，宽 500px，padding 36px。

```
┌──────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← overlay rgba(0,0,0,0.5)
│░░░┌─────────────────────────┐░░░│
│░░░│  [Title]           [×]  │░░░│  ← Modal 500px
│░░░│  [Field]                │░░░│
│░░░│  [Field]                │░░░│
│░░░│  [Cancel]   [Confirm]   │░░░│
│░░░└─────────────────────────┘░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────┘
```

### 3. Empty / Login（单列居中）

内容块居中，垂直居中于视口。

```
┌──────────────────────────────────┐
│                                  │
│         [Logo / Heading]         │
│         [Illustration]           │
│         [Description]            │
│            [CTA Button]          │
│                                  │
└──────────────────────────────────┘
```

### 4. Floating Panel（悬浮面板）

辅助工具（如番茄钟）悬浮在页面右下角，不随页面滚动，不遮挡 Modal。

```
┌──────────────────────────────────┐
│  [Logo]  [meta]          [icns]  │
├──────────────────────────────────┤
│         [   Search Bar   ]       │
├──────────────────────────────────┤
│  [Content area...]               │
│                                  │
│                    ┌──────────┐  │
│                    │ Floating │  │
│                    │  Panel   │  │
│                    └──────────┘  │
└──────────────────────────────────┘
         position: fixed; bottom: 24px; right: 24px; z-index: 40
         小屏: right: 12px; bottom: 12px; max-width: calc(100vw - 24px)
```

---

## Interaction and Animation

| Trigger | Animation | Duration | Curve | Note |
|---|---|---|---|---|
| 卡片 hover | border-color → `#111` + shadow level 0→2 | 120ms | ease-in-out | 仅 desktop，mobile 始终显示 ⋯ |
| ⋯ 按钮出现 | opacity 0 → 1 | 120ms | ease | 跟随卡片 hover |
| 按钮 hover | background color shift | 150ms | ease | Primary/Ghost/Danger 三种按钮 |
| 下拉条目 hover | background fade in | 100ms | ease | `#E2E2E2` 填充 |
| 输入框 focus | border → `#111111`，shadow level 0→2f | 即时（CSS transition 无需加） | — | 清晰状态切换 |
| 弹窗打开 | fade in + scale from 0.97 | 200ms | ease-out | 遮罩同步淡入 |
| 弹窗关闭 | fade out + scale to 0.97 | 150ms | ease-in | |
| 分组折叠 | 内容 height collapse | 200ms | ease-in-out | 折叠后 header 切虚线边框 |
| 拖拽提起 | shadow 升至 level 4，卡片保持固定宽高 | 100ms | ease | 不旋转、不缩放，避免拖动时 UI 变形或位置偏移 |
| 最近历史项 hover | dashed border → `#111`，背景 → `#F4F4F2`，shadow level 0→2 | 120ms | ease-in-out | 点击后打开新增书签弹窗并预填 URL/标题 |
| 页面进入 | fade + slide up 12px | 300ms | ease-out | 首次加载 |
| 番茄钟收起/展开 | height collapse/expand | 200ms | ease-in-out | 收起态保留时间和模式标签 |
| 番茄钟暂停指示 | 时间数字 opacity 降至 0.5 | 即时 | — | 通过透明度区分 running 和 paused |
| 热搜抽屉打开 | translateX(-100%) → translateX(0) + 遮罩淡入 | 200ms | ease-out | 遮罩 `rgba(0,0,0,0.5)` 同步淡入 |
| 热搜抽屉关闭 | translateX(0) → translateX(-100%) + 遮罩淡出 | 200ms | ease-out | Esc / 点击遮罩 / 关闭按钮 |

---

## Component States

**Button — Primary:** `background #111111; color #E8E8E5; border-radius 7px; padding 10px 24px`
- Hover: `background #2A2A2A`
- Disabled: `background #AAAAAA; cursor not-allowed`

**Button — Ghost:** `background transparent; color #555555; border 1.5px solid #CCCCCC; border-radius 7px`
- Hover: `border-color #888888; color #333333`
- Disabled: `color #AAAAAA; border-color #DDDDDD`

**Button — Danger:** 视觉同 Primary（`background #111111`），语义上通过 label 区分（如「确认删除」），hover 为 `#333333`

**Input — Text Field:** `border 1.5px solid #AAAAAA; background #F4F4F2; height 44px; border-radius 7px`
- Focused: `border-color #111111; box-shadow 2px 2px 0 #999999`
- Error: `border-color #111111`（无彩色，通过错误提示文字传达）
- Disabled: `background #E2E2E2; color #AAAAAA`

**Bookmark Card:** `border 1px solid #CCCCCC; background #F4F4F2; border-radius 7px; box-shadow none`
- Hover: `border-color #111111; box-shadow 2px 2px 0 #AAAAAA; ⋯ 按钮 opacity 1`
- Drag active: `box-shadow 4px 4px 0 #AAAAAA; opacity 0.95`；卡片保持固定宽高，不旋转、不缩放
- Ghost Add: `border 1.5px dashed #AAAAAA; background transparent; color #AAAAAA`
- Ghost Add Hover: `border-color #111111; color #111111`

**Group Header:** `border-bottom 1px solid #BBBBBB`
- Collapsed: `border-bottom-style dashed; .sa-group-name opacity 0.5`
- Rename: 名称节点替换为内联 input，同 `.sa-field-input` 样式

**Create Group Modal:** 宽 `420px`，背景 `#F4F4F2`，边框 `1px solid #CCCCCC`，圆角 `12px`，padding `34px 34px 30px`，阴影 `5px 5px 0 #BBBBBB`。
- Header: 标题为 `20px Playfair Display 600`，不显示副文案。
- Input: 使用 `.sa-field-input`，聚焦时 `border-color #111111` + `2px 2px 0 #999999`。
- Helper: 右侧用 `Space Mono 10px #999999` 显示字数计数，不显示额外说明文案。
- Actions: 右下角并排 `取消` Ghost 按钮和 `创建分组` Primary 按钮。
- Usage: 空状态和已有分组页面都使用该 Modal；不调用系统 prompt，不再使用底部内联输入创建分组。

**Search Bar:** `border 1.5px solid #AAAAAA; box-shadow 1px 1px 0 #CCCCCC`
- Focused: `border-color #111111; box-shadow 2px 2px 0 #999999`
- Filtering: 匹配词用 `rgba(0,0,0,0.1)` 底色 highlight

**Pomodoro Timer — Expanded:** `width 220px; background #F4F4F2; border 1px solid #CCCCCC; border-radius 12px; box-shadow 3px 3px 0 #BBBBBB`
- Header: 图标（`#555`）+ 标题 `Lora 14px 500` + 收起按钮 `28×28px radius-sm`，底部 `1px solid #DDDDDD` 分隔线
- Mode tabs: 两个 `flex:1` 按钮，高 `30px`，`radius-sm 5px`。活跃态 `bg #111 color #E8E8E5 weight 500`；非活跃 `color #777`
- Time display: `Space Mono 32px 700 color #111 letter-spacing 2px`；idle 可点击编辑；running/paused 不可编辑
- Idle: 时间下方 `Lora 11px italic #999` 提示「点击数字编辑时长」
- Running: 时间下方 `Space Mono 10px uppercase tracking 1.5px #999` 显示「倒计时中」；tabs 加 `disabled` 样式（`opacity 0.4`）
- Paused: 同 Running 布局，时间数字 `opacity 0.5`，状态文字「已暂停」
- Editing: 时间数字替换为 inline input `64×40px; border 1.5px solid #111; shadow 2px 2px 0 #999; Space Mono 24px 700`，右侧 `Lora 13px #777`「分钟」
- Controls: 居中排列，主按钮 `height 34px; padding 0 20px; radius 7px`（Primary 或 Ghost），重置按钮 `34×34px` 图标按钮

**Pomodoro Timer — Collapsed:** `min-width 180px; height 40px; background #F4F4F2; border 1px solid #CCCCCC; border-radius 12px; box-shadow 3px 3px 0 #BBBBBB; padding 0 14px; inline-flex`
- 内容: 图标 `14px` + 时间 `Space Mono 14px 700 #111` + 模式 `Lora 11px #777` + 展开按钮 `28×28px ml-auto`

**Recent History:** 页面内容底部区域，位于「新建分组」入口之后。容器 `margin-top 34px; padding-top 18px; border-top 1px solid #BBBBBB`。
- Header: 左侧为 `13px Playfair Display 600` 全大写标题，带 13px outline 历史图标；右侧为 `11px Lora italic #999999` 说明。
- Item: `border 1px dashed #AAAAAA; border-radius 7px; background transparent; padding 11px 12px; min-width 252px; max-width 330px; flex:1`。
- Hover: `border-color #111111; background #F4F4F2; box-shadow 2px 2px 0 #AAAAAA`；右侧加号按钮反转为黑底浅字。
- Icon: 26×26px，`background #E2E2E2; border 1px solid #CCCCCC; border-radius 6px`，内部使用 13px outline 图标。
- Text: 标题 `13px Lora 500 #111111` 单行省略；URL `11px Lora italic #777777` 单行省略。
- Hidden: 扩展未传历史、浏览器历史权限不可用、历史为空、或所有 URL 已存在于书签中时，不渲染整个 Recent History 区域。

**Weibo Hot Drawer:** `fixed left:0 top:0 h-screen z-50; width min(360px, calc(100vw-24px)); background #F4F4F2; border-right 1px solid #CCCCCC; border-radius 0 8px 8px 0; box-shadow 3px 3px 0 #BBBBBB`
- Header: 54px 高，火焰图标（`14px #555`）+ 标题 `Playfair Display 15px 600` + 关闭按钮 `28×28px radius-sm`，底部 `1px solid #DDDDDD` 分隔线
- Item: 44px 高，`padding 0 18px`。排名 `Space Mono 11px 700`（前 3 名 `#111`，其余 `#999`）+ 标题 `Lora 13px 500 #111` 单行省略 + 标签 `Lora 11px 500; bg #E2E2E2; padding 2px 6px; radius 4px; color #555`
- Item hover: `background rgba(0,0,0,0.04)`
- Footer: 44px 高，更新时间 `Space Mono 10px #999` + 刷新按钮 `Lora 12px 500 #555`，顶部 `1px solid #DDDDDD` 分隔线
- Footer refresh failed: 更新时间后追加 `Lora 11px italic #444` " · 刷新失败"，按钮文字变"重试"
- Loading: 居中 `Space Mono 11px #999` "加载中…"
- First-load error: 居中 `Lora 14px #777` 错误文字 + Ghost 重试按钮
- Entry button: 搜索框右侧，`34×34px rounded 7px; color #555; hover bg rgba(0,0,0,0.06)`，火焰 outline SVG 16px

---

## Design Inference Principles

> 需要新增界面但规范未覆盖时，按以下规则推断。

1. **当元素需要突出时，加深边框至 `#111111` 并升一级硬边阴影**，不引入新颜色。
2. **当两个操作并列时，主操作用 Primary 黑色按钮，次操作用 Ghost 边框按钮**，绝不出现两个 Primary 按钮并排。
3. **当需要表达错误状态时，边框加深至 `#111111` 并在下方追加 `12px Lora italic #444444` 错误提示文字**，不用彩色。
4. **当界面无数据时，展示居中 SVG 插图（`opacity 0.3`，`80px`）+ Playfair Display 标题 + Lora 说明 + 单个 Primary 按钮**，不展示空列表骨架。
5. **当操作不可逆（删除）时，弹出 Modal 二次确认**，不在原位置使用 toast 或单次点击。
6. **当新增交互元素（如标签、徽章）时，使用 `#E2E2E2` 背景 + `#555555` 文字 + `radius-sm 5px`**，与置顶区背景保持一致灰阶。
7. **当 icon 单独出现（无文字标签）时，容器为 34×34px 圆角 7px，hover 浮出 `rgba(0,0,0,0.06)` 背景**，确保点击区足够大。
8. **当文字需要特殊强调（如搜索高亮）时，使用 `rgba(0,0,0,0.1)` 底色 + `border-radius 2px`**，不用颜色。
9. **当浏览器扩展能力不可用时，隐藏依赖扩展的 UI 区域**，不要显示错误、占位或权限说明，避免导航页变成扩展设置页。
