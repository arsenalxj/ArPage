# 浏览器新标签页扩展方案

## 目标

开发一个同时支持 Chrome/Edge 和 Firefox 的浏览器扩展，让用户打开新标签页时进入在线 ArPage 页面。

第一版采用跳转式实现：浏览器新标签页先加载扩展内置页面，再跳转到用户配置的在线 ArPage 地址。历史推荐不做实时刷新，只在 ArPage 标签页加载完成或用户切回 ArPage 标签页时，由扩展读取最近历史并发送给页面。如果历史权限不可用或没有可显示数据，页面底部不显示最近历史区域，不影响书签导航使用。

## 用户可见结果

- 安装扩展后，新标签页打开在线 ArPage。
- 用户可在扩展配置中填写 ArPage 地址。
- 未配置地址时，新标签页显示扩展内置配置引导。
- 页面底部最多显示最近 3 条未添加过的浏览历史。
- 用户切回已打开的 ArPage 标签页时，历史推荐刷新一次。
- 新标签页跳转到 ArPage 并加载完成后，历史推荐刷新一次。
- 如果历史权限不可用、浏览器不支持、扩展没有传入数据，历史区域不显示。
- 已有登录、书签分组、置顶、拖拽、搜索、favicon 抓取和保存逻辑保持不变。

## 推荐方案

采用跳转式扩展：

```text
浏览器打开新标签页
  -> 加载扩展内置 newtab.html
  -> 读取扩展本地存储中的 ArPage 地址
  -> 跳转到在线 ArPage
  -> 在线 ArPage 正常走现有登录和书签逻辑
```

历史推荐刷新流程：

```text
用户切回 ArPage 标签页，或 ArPage 标签页加载完成
  -> content script 注入后主动向 background 请求最近历史（pull 模式）
  -> background 读取最近 24 小时内、最多 20 条浏览历史
  -> background 返回历史数据给 content script
  -> content script 通过 window.postMessage 转发给 ArPage 页面
  -> ArPage 校验消息来源和格式后，过滤已存在书签，显示最多 3 条
```

浏览器扩展规范要求 `chrome_url_overrides.newtab` 指向扩展包内的 HTML 文件，不能直接指向远程 URL。因此扩展必须先接管新标签页，再通过脚本跳转到在线 ArPage。

## 为什么这样做

跳转式方案最接近 New Tab Override 的工作方式，职责清晰：扩展只负责新标签页入口，ArPage 继续负责产品体验和数据保存。

相比把 ArPage 打包进扩展，跳转式方案不需要处理跨域 Cookie、双构建产物、扩展内 API 地址切换，也不会把 Web 应用和扩展发布流程强绑定。

相比 iframe 桥接方案，跳转式方案不会受在线页面 iframe 安全策略影响，地址栏会显示真实 ArPage 地址，更符合用户对“打开新标签页就是我的导航页”的预期。

历史推荐选择“切回 ArPage 标签页时刷新”，而不是实时监听全部浏览行为，是为了降低打扰和复杂度。用户看到导航页时能获得较新的最近历史，但扩展不需要在每次访问新网页时都推动页面更新。

## 对用户的影响

- 用户安装扩展后，新标签页会直接进入自己的 ArPage。
- ArPage 仍部署在 Cloudflare Pages，原有登录 Cookie 和 KV 数据继续使用。
- 扩展失效或卸载后，只影响新标签页入口，不影响线上 ArPage 数据。
- 历史推荐只在 ArPage 标签页加载完成或被激活时刷新，不会实时打断页面。
- 如果浏览器提示扩展需要历史权限，用户拒绝后仍能使用新标签页跳转功能，只是不显示历史推荐。

## 替代方案

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 跳转式扩展 | 实现简单，地址栏是真实 ArPage 地址，接近 New Tab Override；可通过 content script 在页面激活时传递历史 | 需要 history、scripting 和动态 host 权限才能做历史推荐 | 采用 |
| iframe 桥接扩展 | 扩展可稳定把历史传给页面，页面不明显跳转 | 受 iframe 安全策略影响，地址栏是扩展地址 | 不采用 |
| 内置式扩展 | 历史读取和页面交互最直接 | 双构建、跨域登录、发布复杂度高 | 不采用 |

## 实现范围

1. 新增 `extension/` 目录。
   - `extension/manifest.chrome.json`：Chrome/Edge Manifest V3 配置，使用 `background: { "service_worker": "background.js" }`。
   - `extension/manifest.firefox.json`：Firefox Manifest V3 配置，使用 `background: { "scripts": ["background.js"] }`，并包含 `browser_specific_settings`。
   - `extension/newtab.html`：新标签页入口页面。
   - `extension/newtab.js`：读取配置并跳转。
   - `extension/options.html`：配置 ArPage 地址。
   - `extension/options.js`：保存和校验 ArPage 地址；用户点击保存时通过 `chrome.permissions.request()` 动态申请对应域名的 host 权限；新权限授予并完成 content script 注册后，再移除旧域名权限和旧脚本注册。
   - `extension/background.js`：响应 content script 的历史请求，读取最近 24 小时内最多 20 条历史并返回；在 ArPage 地址配置成功后，通过 `chrome.scripting.registerContentScripts()` 为对应 origin 注册 `content-script.js`。
   - `extension/content-script.js`：注入后主动向 background 请求历史数据，通过 `window.postMessage` 转发给 ArPage 页面；ArPage 标签页被激活时重新请求一次。
   - `extension/icons/`：扩展图标。

2. 新增扩展构建脚本。
   - 扩展文件为纯 JS/HTML，无编译步骤。构建脚本只做：复制扩展源文件到输出目录，根据目标浏览器将对应 manifest 文件重命名为 `manifest.json`。
   - 输出 `dist/chrome/` 和 `dist/firefox/` 两个可手动加载的解压目录。

3. 轻改根 `package.json`。
   - 增加扩展构建命令。
   - 不改变现有 Web 构建命令含义。

4. 修改 ArPage 前端。
   - 增加历史推荐接收入口。
   - 只在收到有效历史数据时渲染底部历史区域。
   - 点击历史项时复用现有新增书签弹窗，预填 URL 和标题。
   - 保存书签后，已添加的历史项从推荐列表中消失。

## 历史推荐规则

扩展读取浏览器历史后，只向 ArPage 传递必要字段：

```typescript
interface RecentHistoryItem {
  title: string
  url: string
  lastVisitTime: number
}
```

ArPage 负责过滤：

- URL 必须是 `http` 或 `https`。
- URL 已存在于书签数据中时不显示。
- 最多显示 3 条。
- 没有可显示项目时不渲染历史区域。
- 点击历史项时打开现有新增书签弹窗，预填 URL 和标题。

历史查询参数：

- 扩展调用 `chrome.history.search` 时，`startTime` 为当前时间前 24 小时，`maxResults` 为 20。
- ArPage 端过滤后最多显示 3 条。

刷新触发条件：

- Content script 注入后（即 ArPage 标签页加载完成时）主动请求一次。
- 用户从其他标签页切回 ArPage 标签页时，content script 监听 `visibilitychange` 事件，重新请求一次。
- 不监听每一条历史变化，不做实时推送。
- 不在非 ArPage 标签页发送历史数据。

扩展权限：

```json
{
  "permissions": ["storage", "history", "scripting"],
  "optional_host_permissions": ["https://*/*", "http://*/*"]
}
```

`host_permissions` 不写死域名。用户在配置页填写 ArPage 地址并点击保存时，扩展通过 `chrome.permissions.request()` 动态申请对应 origin 的 host 权限（用于注入 content script）。权限请求必须发生在用户点击保存按钮的处理链路中，不能由后台自动触发。

权限授予后，扩展使用 `chrome.scripting.registerContentScripts()` 动态注册 `content-script.js`，`matches` 只包含当前 ArPage origin，例如 `https://example.com/*`。这样 content script 才会在在线 ArPage 页面加载时存在，并能主动向 background 请求历史数据。

用户修改 ArPage 地址时，采用可恢复顺序：

1. `options.js`：校验新地址并计算新 origin。
2. `options.js`：调用 `chrome.permissions.request()` 请求新 origin 的 host 权限（必须在用户点击事件链路中）。
3. `options.js`：权限授予后，通过 `chrome.runtime.sendMessage` 通知 `background.js` 注册新 origin 的 content script。
4. `background.js`：调用 `chrome.scripting.registerContentScripts()` 完成注册，返回结果。
5. `options.js`：收到注册成功后，保存新配置到 `chrome.storage.local`。
6. `options.js`：通知 `background.js` 移除旧 origin 的 content script 注册；`options.js` 移除旧 origin 的 host 权限。

如果新权限被拒绝或注册失败，保留旧配置、旧权限和旧 content script 注册不变。

## 不做什么

- 不把 ArPage 前端打包进扩展。
- 不把浏览器历史保存到 KV。
- 不上传历史记录到第三方服务。
- 不实时监听每一次浏览历史变化。
- 不在历史不可用时显示错误或占位。
- 不改变现有书签数据结构。
- 不改变现有登录、鉴权和部署方式。

## 验收标准

1. Chrome/Edge 加载扩展后，新标签页跳转到已配置的 ArPage 地址。
2. Firefox 加载扩展后，新标签页跳转到已配置的 ArPage 地址。
3. 未配置 ArPage 地址时，新标签页显示配置入口，不进入空白页。
4. 配置页只接受 `http://` 或 `https://` 地址。
5. ArPage 未登录时仍显示现有登录页。
6. ArPage 已登录时正常显示书签导航页。
7. ArPage 标签页加载完成且用户已登录、书签数据已加载后，底部显示最近 3 条未添加过的浏览历史。
8. 从其他标签页切回 ArPage 标签页后，历史推荐刷新一次。
9. 历史权限不可用或无历史数据时，页面底部不显示历史区域。
10. 点击历史项后打开新增书签弹窗，并预填 URL 和标题。
11. 保存书签后，对应历史项不再显示。
12. 卸载或禁用扩展后，线上 ArPage 数据不受影响。
13. 现有 `npm run build` 通过。
14. 扩展构建命令能生成 Chrome/Edge 和 Firefox 可加载目录。

## 测试路径

- 正常路径：配置 ArPage 地址，打开新标签页，跳转到在线 ArPage。
- 未配置路径：清空扩展配置，打开新标签页，显示配置入口。
- 地址校验路径：输入非 `http/https` 地址，配置页阻止保存。
- 登录路径：未登录访问 ArPage 时显示登录页，登录后进入导航页。
- Chrome/Edge 路径：使用 `chrome://extensions` 加载解压目录并测试新标签页。
- Firefox 路径：使用 `about:debugging#/runtime/this-firefox` 临时加载扩展并测试新标签页。
- 历史刷新路径：打开其他网站后切回 ArPage 标签页，历史推荐刷新。
- 历史不可用路径：不给历史权限或不传历史数据，ArPage 不显示历史区域。
- 历史过滤路径：历史 URL 已存在于书签中时，不显示该历史项。
- 权限恢复路径：修改 ArPage 地址时拒绝新域名权限，旧地址、旧权限和旧历史推荐仍保持可用。
- 构建路径：运行现有 Web 构建和扩展构建命令，确认产物存在。

## 风险与处理

`chrome_url_overrides.newtab` 只能指向扩展内文件，不能直接写在线 ArPage 地址。处理方式是固定使用 `newtab.html` 做入口，然后由脚本跳转。

Chrome/Edge 和 Firefox 的扩展 JS API 命名存在差异（如 Firefox 支持 `browser.*` 返回 Promise，Chrome 使用 `chrome.*` 回调风格）。处理方式是在扩展脚本中使用极薄的兼容函数，优先使用 `browser.*`，不存在时回退到 `chrome.*`。

Chrome/Edge 和 Firefox 的 background manifest 也不同。Chrome/Edge Manifest V3 使用 `background.service_worker`；Firefox 当前不支持 `background.service_worker`，使用 `background.scripts`。因此保留两份 manifest：Chrome/Edge 版写 `background: { "service_worker": "background.js" }`，Firefox 版写 `background: { "scripts": ["background.js"] }`。`chrome_url_overrides` 两端通用，Firefox 版额外包含 `browser_specific_settings`。

历史权限会让浏览器显示更敏感的权限提示。处理方式是历史数据只在 ArPage 标签页加载完成或被激活时读取，并且只在本地传给 ArPage 页面，不保存到 KV，不上传第三方。

跳转式方案中，在线页面不能直接调用扩展 API。处理方式是使用 content script 作为桥接：content script 注入后主动向 background 请求历史数据（pull 模式，天然解决 content script 未就绪的时序问题），再通过 `window.postMessage` 转发给 ArPage 页面。ArPage 监听 message 事件时必须校验 `event.source === window` 和消息格式（检查约定的 `type` 字段），拒绝不符合格式的消息。历史区域默认隐藏，只在收到有效数据时出现。

新标签页跳转时会出现短暂闪烁。处理方式是 `newtab.html` 设置与 ArPage 一致的纸墨背景（`background: #E8E8E5`），body 内不放任何可见内容，减少视觉跳变。

## 回滚方案

删除 `extension/` 目录，移除根 `package.json` 中扩展构建命令即可回滚新标签页扩展能力。

移除 ArPage 前端中的历史推荐组件和消息接收逻辑即可去掉历史推荐。该功能不修改 KV 数据结构，不需要数据迁移。
