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
| Delete Confirm | — | — | 弹窗内红色警示文字为深灰 `#444`，按钮仍为黑色 Primary |

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
| 页面进入 | fade + slide up 12px | 300ms | ease-out | 首次加载 |

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
