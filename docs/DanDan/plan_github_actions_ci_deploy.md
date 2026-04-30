# GitHub Actions CI 与自动部署方案

## 目标

为当前 Cloudflare Pages 项目增加 GitHub Actions 流程：

- PR 到 `master` 时只执行 CI 构建检查，不部署。
- push 到 `master` 时先构建，构建成功后自动部署到 Cloudflare Pages。
- 部署失败不影响线上旧版本，Cloudflare Pages 保留上一次成功部署。

成功后，用户的影响是：合并代码后不需要手动运行部署命令，主站会自动更新；如果代码构建失败，会在 GitHub PR 或 Actions 页面提前暴露，不会把坏版本发到线上。

## 当前项目依据

| 项目事实 | 说明 |
| --- | --- |
| 项目根目录 | `D:\ai\ArPage` |
| 默认分支 | 使用 `master` |
| 前端构建命令 | `npm run build`，实际执行 `npm --prefix web run build` |
| Cloudflare 项目名 | `arpage` |
| 构建产物目录 | `web/dist` |
| 部署工具 | `wrangler` |
| 现有部署命令 | `npm run deploy`，包含构建和 `wrangler pages deploy` |
| 当前 workflow 状态 | 尚无 `.github/workflows` |

## 外部依赖与密钥

| 名称 | 放置位置 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Repository Secrets | 让 GitHub Actions 调用 Cloudflare Pages 部署 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Repository Secrets | 指定 Cloudflare 账号，避免账号歧义 |
| `PASSWORD` | Cloudflare Pages Secret | 运行时登录密码，不放入 GitHub |
| `AUTH_SECRET` | Cloudflare Pages Secret | 运行时 cookie 签名密钥，不放入 GitHub |

`PASSWORD` 和 `AUTH_SECRET` 是应用运行时 secret，只应通过 `wrangler pages secret put` 写入 Cloudflare Pages。GitHub Actions 部署不需要读取它们。

## 推荐方案

新增 `.github/workflows/ci-deploy.yml`，使用一个 workflow 覆盖 CI 和生产部署。

触发规则：

```yaml
on:
  pull_request:
    branches: [master]
  push:
    branches: [master]
```

执行逻辑：

1. 拉取代码。
2. 安装 Node.js。
3. 执行 `npm ci`（安装根目录工具依赖）。
4. 执行 `npm --prefix web ci`（安装 web 子包的前端依赖）。
5. 执行 `npm run build`。
6. 仅当事件是 `push` 且分支是 `master` 时，执行 Cloudflare Pages 部署。

部署命令使用：

```bash
npx wrangler pages deploy
```

部署步骤必须显式注入 GitHub Secrets：

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

原因是 GitHub Repository Secrets 不会自动暴露给 workflow。只有在部署 step 的 `env` 中显式映射后，Wrangler 才能读取 Cloudflare 凭据并完成部署。

`wrangler.toml` 已配置 `name = "arpage"` 和 `pages_build_output_dir = "web/dist"`，无需重复传参。

不用 `--commit-dirty=true`，因为该标志只影响 Cloudflare Pages 上的 commit 元信息标签，不做内容校验。CI 工作区无需标记 dirty，去掉后 wrangler 仅打印警告，不影响部署。

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 | 结论 |
| --- | --- | --- | --- | --- |
| GitHub Actions 直接用 Wrangler 部署 | 流程在仓库内可见，失败原因清楚，和现有技术栈一致 | 需要配置 Cloudflare Token | 当前项目 | 推荐 |
| 只做 CI，继续本地手动部署 | 风险最低，不碰生产 | 不能自动部署，仍依赖人工操作 | 自动部署还没准备好时 | 不采用 |
| Cloudflare Pages 连接 GitHub 自动部署 | Cloudflare 平台接管部署，配置简单 | CI 细节不完全在仓库内，排查链路分散 | 更偏平台化管理的团队 | 暂不采用 |

## 为什么这样做

选择 GitHub Actions 直接部署，是因为当前项目已经有 `wrangler`、`wrangler.toml`、`npm run build` 和 Cloudflare Pages 结构。新增 workflow 的改动面最小，不需要引入新平台，也不改变现有本地部署方式。

对用户的影响：

- 提交 PR 时能提前知道代码是否能构建。
- 合并到 `master` 后自动发布，不需要记命令。
- 部署失败时线上仍保留旧版本，不会出现半发布状态。
- GitHub Actions 页面能看到失败发生在安装、构建还是部署阶段。

## 不要做 / 应该做

| 不要做 | 应该做 |
| --- | --- |
| 不要把 `PASSWORD`、`AUTH_SECRET` 写进 GitHub Secrets 给 CI 读取 | 继续把它们作为 Cloudflare Pages runtime secrets |
| 不要在 PR 事件部署生产环境 | PR 只跑构建检查 |
| 不要监听错误分支 | workflow 固定监听 `master` |
| 不要在 workflow 中创建 KV 或修改 `wrangler.toml` | KV 和项目配置由本地初始化脚本或 Cloudflare 控制台维护 |
| 不要使用长期全权限 Cloudflare Token | 使用只覆盖 Pages 部署需要权限的 Token |

## 验收标准

1. 创建 PR 到 `master` 后，GitHub Actions 执行安装和构建，且不调用 Cloudflare 部署。
2. push 到 `master` 后，GitHub Actions 执行安装、构建和部署。
3. 构建失败时，部署步骤不会执行。
4. 部署失败时，Cloudflare Pages 线上旧版本保持可用。
5. workflow 文件中不出现 `PASSWORD`、`AUTH_SECRET` 或 `.dev.vars` 内容。
6. Actions 日志能清楚区分安装失败、构建失败和部署失败。

## 测试路径

| 路径 | 验证方式 | 预期结果 |
| --- | --- | --- |
| PR 构建成功 | 对 `master` 开 PR | `npm ci`、`npm --prefix web ci` 和 `npm run build` 成功，部署步骤跳过 |
| PR 构建失败 | 临时制造 TypeScript 构建错误并开 PR | Actions 失败，部署步骤跳过 |
| master 自动部署 | 合并或 push 到 `master` | 构建成功后部署到 Cloudflare Pages |
| Cloudflare Token 无效 | 移除或替换错误 token 后触发 push | 构建成功，部署步骤失败，线上旧版本不变 |

## 回滚方案

代码回滚：

- revert 触发问题的 commit，并 push 到 `master`，Actions 会重新部署回滚后的版本。

部署流程回滚：

- 删除或禁用 `.github/workflows/ci-deploy.yml` 后 push 到 `master`，自动部署停止。
- 如需立即恢复线上版本，可在 Cloudflare Pages 后台选择上一版成功部署并回滚。

数据回滚：

- 本方案不修改 KV 数据结构，不写入业务数据，不需要数据迁移或数据回滚。

## 后续实施步骤

1. 在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中添加 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。
2. 新增 `.github/workflows/ci-deploy.yml`。
3. 本地运行 `npm ci && npm --prefix web ci && npm run build` 验证构建链路。
4. 提交一个 PR 验证 CI 只构建不部署。
5. 合并到 `master` 验证自动部署。
