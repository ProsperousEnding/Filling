# 线上配置管理部署说明

本文记录 Filling 线上配置管理所需的 Cloudflare Worker 和 GitHub App 设置。管理端通过 GitHub OAuth 验证管理员，再由 Worker 读写允许范围内的 `blog/config/*.toml`，提交后交给现有 GitHub Actions 重新构建和发布站点。

项目已经包含 Worker API 和 `/admin/config` 管理页面。完成本页的变量配置、GitHub App 设置和 Worker 部署后即可使用。

## 服务地址

- 博客地址：`https://filling.initzo.com`
- Worker 正式地址：`https://filling-config-api.initzo.com`
- OAuth 回调地址：`https://filling-config-api.initzo.com/auth/github/callback`
- Worker 名称：`filling-config-api`

如果暂未启用自定义域名，可以临时使用 Cloudflare 提供的 `workers.dev` 地址，并将 GitHub App 的 Callback URL 和 `GITHUB_CALLBACK_URL` 同时改成对应地址。

不要将 `filling.initzo.com` 绑定到 Worker。博客继续由 GitHub Pages 托管，Worker 只使用独立的 `filling-config-api.initzo.com` 子域名。

## Cloudflare Worker

在 Cloudflare Dashboard 中进入 `Workers & Pages`，创建名为 `filling-config-api` 的 Worker。正式环境使用：

```text
Settings > Domains & Routes > Add > Custom Domain
```

绑定：

```text
filling-config-api.initzo.com
```

### 普通变量

在 `Settings > Variables and Secrets` 中以 `Text / Plaintext` 类型添加：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `ADMIN_GITHUB_USER_ID` | `90754592` | 管理员不可变 GitHub 数字 ID |
| `ADMIN_ORIGIN` | `https://filling.initzo.com` | 允许访问 API 的管理端来源，不加末尾 `/` |
| `GITHUB_APP_ID` | GitHub App 的 App ID | App 标识，可用于诊断 |
| `GITHUB_BRANCH` | `main` | 仓库默认分支，不能写成 `main4` |
| `GITHUB_CALLBACK_URL` | `https://filling-config-api.initzo.com/auth/github/callback` | 必须与 GitHub App Callback URL 完全一致 |
| `GITHUB_CLIENT_ID` | GitHub App 的 Client ID | OAuth 公开客户端标识 |
| `GITHUB_INSTALLATION_ID` | `155111352` | Filling 仓库上的 App 安装 ID |
| `GITHUB_OWNER` | `ProsperousEnding` | 仓库所有者 |
| `GITHUB_REPO` | `Filling` | 仓库名称 |

修改变量后需要保存并部署，使绑定进入当前 Worker 版本。

### 部署 Worker 代码

项目根目录已经提供 `worker/wrangler.jsonc`，其中 Worker 名称和自定义域名均为 `filling-config-api`。首次部署执行：

```bash
pnpm install
pnpm worker:check
pnpm exec wrangler login
pnpm worker:deploy
```

`keep_vars = true` 已开启，命令行部署不会清除 Cloudflare Dashboard 中已有的变量和 Secret。部署完成后检查：

```bash
curl https://filling-config-api.initzo.com/health
```

正常响应应包含 `"ok":true` 和 `"configured":true`，不会返回任何变量或密钥的真实值。

### Secret

以下变量必须选择 `Secret` 类型：

| Secret | 说明 |
| --- | --- |
| `GITHUB_CLIENT_SECRET` | GitHub App OAuth Client Secret |
| `SESSION_SECRET` | Worker 加密和签名管理会话所用的随机密钥 |

可以使用下面的命令生成 `SESSION_SECRET`：

```bash
openssl rand -base64 32
```

Secret 的真实值只能直接填写到 Cloudflare，禁止放入代码、TOML、普通环境变量、截图或 Git 仓库。

第一版管理后台使用管理员登录后取得的 GitHub user access token 提交配置，不使用 App installation token，因此不需要配置 `GITHUB_APP_PRIVATE_KEY`。GitHub App 页面显示的 `SHA256:...` 是公钥指纹，不是私钥，也不能作为 Secret 使用。

## GitHub App

在 GitHub 的以下位置创建 App：

```text
Settings > Developer settings > GitHub Apps > New GitHub App
```

建议设置：

| 设置 | 值 |
| --- | --- |
| GitHub App name | `Filling Config Admin`，名称被占用时使用其他唯一名称 |
| Homepage URL | `https://filling.initzo.com` |
| Callback URL | `https://filling-config-api.initzo.com/auth/github/callback` |
| Expire user authorization tokens | 开启 |
| Request user authorization during installation | 关闭，登录时单独授权 |
| Setup URL | 留空 |
| Webhook | 关闭 |
| Installation scope | `Only on this account` |

### 仓库权限

只授予：

```text
Contents: Read and write
Actions: Read-only
Metadata: Read-only
```

其他权限保持 `No access`。`Actions: Read-only` 仅用于管理端展示发布状态；`Contents: Read and write` 用于读取并提交允许修改的配置文件。

### 安装范围

在 GitHub App 设置中执行：

```text
Install App
> ProsperousEnding
> Only select repositories
> Filling
> Install
```

不要选择全部仓库。安装页面地址末尾的数字是 Installation ID，例如：

```text
https://github.com/settings/installations/155111352
```

对应 Cloudflare 变量为：

```text
GITHUB_INSTALLATION_ID=155111352
```

## 已实现的安全边界

Worker API 遵守以下约束：

- 只接受来自 `ADMIN_ORIGIN` 的跨域请求，并使用安全的 HttpOnly 会话 Cookie。
- OAuth 登录后使用不可变 GitHub 用户 ID 校验管理员，不能只比较用户名。
- 只允许读写明确列出的 `blog/config/*.toml`，禁止客户端传入任意仓库路径。
- 禁止修改 `.github/workflows/`、源码和其他仓库文件。
- 发布前执行字段、TOML 和跨配置依赖校验。
- 使用远端分支当前提交 ID 检测并发修改，冲突时拒绝覆盖。
- 多个配置文件的修改合并成一次提交，避免每个开关触发一次部署。
- 浏览器主题偏好保存在本地，不提交到仓库；文章封面图源由站点配置统一控制。

## 完成检查

- [ ] `https://filling-config-api.initzo.com` 可以访问 Worker。
- [ ] `/health` 返回 `ok: true` 和 `configured: true`。
- [ ] GitHub App Callback URL 与 `GITHUB_CALLBACK_URL` 完全一致。
- [ ] `GITHUB_BRANCH` 为 `main`。
- [ ] GitHub App 只安装到 `ProsperousEnding/Filling`。
- [ ] `Contents` 为读写权限，`Actions` 为只读权限。
- [ ] `GITHUB_CLIENT_SECRET` 和 `SESSION_SECRET` 使用 Cloudflare Secret 类型。
- [ ] Cloudflare 中没有填写 SHA-256 指纹或 PEM 私钥。
- [ ] 所有变量修改后已经保存并部署。
- [ ] `https://filling.initzo.com/admin/config` 可以打开并完成 GitHub 登录。

## 官方文档

- [Cloudflare Worker Dashboard 入门](https://developers.cloudflare.com/workers/get-started/dashboard/)
- [Cloudflare Worker 自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare Worker Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [注册 GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app)
- [GitHub App 最小权限](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
- [安装自己的 GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app)
- [GitHub App 安全建议](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app)
