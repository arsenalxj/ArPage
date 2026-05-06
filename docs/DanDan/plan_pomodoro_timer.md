# 番茄钟计时器

## 目标

在书签导航页右下角添加悬浮番茄钟，支持专注/休息两种模式，倒计时结束推送系统通知。纯前端功能，不涉及 API 和 KV。

## 核心行为

### 两种模式

| 模式 | 默认时长 | localStorage key |
|------|---------|-----------------|
| 专注 | 25 分钟 | `pomodoro_focus_duration` |
| 休息 | 5 分钟 | `pomodoro_rest_duration` |

当前选中的模式持久化到 `pomodoro_mode`，值为 `focus` 或 `rest`。页面刷新后恢复上次选择的模式；如果 key 不存在或值非法，默认使用 `focus`。

### 计时器状态机

```
idle ──[开始]──▸ running ──[暂停]──▸ paused
 ▴                 │                   │
 │                 ▾                   │
 │            timeLeft === 0           │
 │           (通知 + 回到 idle)         │
 │                                     │
 └─────────[重置]──────────────────────┘
```

- **idle**：显示当前模式的预设时长，可切换模式、可编辑时长
- **running**：倒计时中，只能暂停或重置，不可切换模式、不可编辑时长
- **paused**：暂停中，可继续、可重置，不可切换模式、不可编辑时长
- 倒计时结束：发系统通知，状态回到 idle，不自动切换模式

### 时间精度

不依赖 `setInterval` 累减。启动时记录 `endTime = Date.now() + remainingMs`，每次 tick 用 `Math.max(0, endTime - Date.now())` 计算剩余时间。这样浏览器后台节流 interval 时，回到前台仍能显示正确时间。

### 时长编辑

- idle 状态下点击时间数字，数字变为 inline input（type=number）
- 输入范围：1–120 分钟，整数
- Enter 或失焦确认，Esc 取消
- 确认后写入 localStorage，更新显示

### 系统通知

- 点击「开启结束提醒」时调用 `Notification.requestPermission()`；「开始」只负责启动倒计时
- 调用前先判断 `typeof Notification !== 'undefined'`；不支持系统通知的浏览器静默跳过，不影响计时器运行
- 倒计时结束时：
  - 专注结束：`new Notification('专注结束', { body: '休息一下吧' })`
  - 休息结束：`new Notification('休息结束', { body: '开始下一轮专注' })`
- 只有 `Notification.permission === 'granted'` 时才创建通知
- 用户拒绝通知权限、当前环境不支持通知、或通知创建失败时静默跳过，不影响计时器功能

### 页面刷新持久化

计时状态存 localStorage，刷新后恢复。不跨设备、不存服务器。

**localStorage key：`pomodoro_timer_state`**，值为 JSON：

```typescript
interface TimerState {
  status: 'running' | 'paused'
  mode: 'focus' | 'rest'
  endTime: number    // running 时：目标结束时间戳（ms）
  remainingMs: number // paused 时：剩余毫秒数；running 时为 0（从 endTime 推算）
}
```

**写入时机：**
- 开始 / 继续：写入 `{ status: 'running', mode, endTime: Date.now() + remainingMs, remainingMs: 0 }`
- 暂停：写入 `{ status: 'paused', mode, endTime: 0, remainingMs }`
- 重置 / 倒计时结束：删除该 key

**页面加载恢复逻辑：**
1. 读取 `pomodoro_timer_state`，无值则 idle
2. 若 `status === 'running'`：
   - 计算 `remaining = endTime - Date.now()`
   - 若 `remaining > 0`：恢复 running 状态，继续倒计时
   - 若 `remaining <= 0`：说明离开期间已到时间——发通知、清除 key、回到 idle
3. 若 `status === 'paused'`：恢复 paused 状态，显示 `remainingMs`
4. 若 JSON 解析失败、字段缺失、`status/mode/endTime/remainingMs` 非法，清除 `pomodoro_timer_state` 并回到 idle

## UI 设计

### 定位

- `position: fixed; bottom: 24px; right: 24px; z-index: 40`
- z-index 低于 Modal overlay（z-50），高于页面内容
- 小屏幕适配：`right: 12px; bottom: 12px; max-width: calc(100vw - 24px)`
- 小屏幕默认收起，避免遮挡书签卡片和底部分组新增入口；桌面端默认展开

### 展开态（默认）

```
┌──────────────────────────────┐
│  ⏱ 番茄钟               [─]  │  ← header，[─] 收起按钮
├──────────────────────────────┤
│   [  专注  ] [  休息  ]       │  ← 模式切换 tab
│                              │
│          25:00               │  ← 大号时间（idle 可点击编辑）
│                              │
│     [ ▶ 开始 ]  [ ↺ ]        │  ← 控制按钮
└──────────────────────────────┘
```

- 宽度：220px
- 背景：`#F4F4F2`（Surface）
- 边框：`1px solid #CCCCCC`
- 圆角：`12px`（radius-xl）
- 阴影：`3px 3px 0 #BBBBBB`（level 3，与 dropdown 同级）

### 收起态

```
┌────────────────────────┐
│  ⏱  25:00  专注   [□]  │  ← 单行，[□] 展开按钮
└────────────────────────┘
```

- 单行高度约 40px
- 显示：图标 + 剩余时间 + 当前模式 + 展开按钮
- running 时时间实时更新
- idle 时显示预设时长

### 收起/展开状态

- 桌面端默认展开
- 小屏幕默认收起
- 收起/展开状态存 `useState`，不持久化（刷新后按当前屏幕尺寸恢复默认状态）

### 视觉规范

| 元素 | 规范 |
|------|------|
| 标题「番茄钟」 | Lora 14px 500 |
| 模式 tab（活跃） | Lora 12px 500，bg #111，color #E8E8E5，radius 5px |
| 模式 tab（非活跃） | Lora 12px 400，color #777，hover color #333 |
| 时间数字 | Space Mono 32px 700，color #111 |
| 时间数字（收起态） | Space Mono 14px 700，color #111 |
| 模式标签（收起态） | Lora 11px 400，color #777 |
| 开始/继续按钮 | Primary 按钮样式，bg #111，color #E8E8E5，Lora 13px |
| 暂停按钮 | Ghost 按钮样式，border 1.5px solid #CCCCCC |
| 重置按钮 | 图标按钮，34x34px，hover bg rgba(0,0,0,0.06) |
| 时长输入框 | 复用 input focus 样式：border #111，shadow 2px 2px 0 #999 |
| 收起/展开按钮 | 图标按钮，hover bg rgba(0,0,0,0.06) |

### 计时器图标

内联 SVG，outline 风格，stroke-width 1.5，viewBox 16x16。圆形表盘 + 两根指针 + 顶部两个小铃铛弧线。

## 文件变更

| 文件 | 变更 |
|------|------|
| `web/src/components/PomodoroTimer.tsx` | 新建，番茄钟完整组件 |
| `web/src/App.tsx` | 引入 PomodoroTimer，渲染在主容器内 |

不新建 hook 文件——计时器逻辑与 UI 紧耦合且只有一个消费者，拆分 hook 是过度抽象。

## 验收标准

1. 展开态：能切换专注/休息模式，点击时间数字能编辑时长（1-120 分钟）
2. 编辑后的时长刷新页面仍保留（localStorage）
2a. 切换后的当前模式刷新页面仍保留；非法 `pomodoro_mode` 自动回退到专注模式
3. 点击开始后倒计时正确运行，切到其他标签页再回来时间仍准确
3a. 倒计时运行中刷新页面，计时器恢复 running 并继续倒计时
3b. 暂停中刷新页面，计时器恢复 paused 并显示正确剩余时间
3c. 离开页面期间倒计时结束，重新打开后发通知并回到 idle
3d. `pomodoro_timer_state` 为空、损坏或字段非法时，不报错，自动清除该状态并回到 idle
4. 暂停后可继续，重置后回到当前模式的预设时长
5. 倒计时结束推送系统通知（需用户授权），计时器回到 idle
6. 收起态显示剩余时间和当前模式，展开按钮可还原完整面板
7. 视觉风格与页面一致：灰阶、硬边阴影、Lora/Space Mono 字体
8. running/paused 状态下不可切换模式、不可编辑时长
9. 窄屏下番茄钟不超出视口，不遮挡主要操作区域，默认以收起态显示
