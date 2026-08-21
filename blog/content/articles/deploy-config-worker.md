---
title: 部署配置后台与 Cloudflare Worker
description: 配置 GitHub App、Cloudflare Worker 和管理端 API，安全地在线修改并发布 TOML。
date: 2026-08-21
updated: 2026-08-21
category: 部署
cover_display_mode: page-background
featured: true
weight: 60
tags:
  - Cloudflare
  - Worker
  - GitHub
---

Filling 已包含 `/admin/config` 管理页面和 `worker/` 中的 Cloudflare Worker API。管理员通过 GitHub 登录，Worker 校验身份和配置内容，再将多个 TOML 修改合并为一次仓库提交。

整个链路由四部分组成：

1. GitHub Pages 托管博客与管理页面。
2. GitHub App 提供 OAuth 登录和仓库授权。
3. Cloudflare Worker 保存服务端密钥并调用 GitHub API。
4. 配置提交触发 GitHub Actions，重新构建并发布站点。

博客域名和 Worker 域名必须分开。例如博客使用 `https://blog.example.com`，Worker 可以使用 `https://filling-config-api.example.com`。

## 准备 GitHub App

在 GitHub 的 Developer settings 中创建 GitHub App，设置：

```text
Homepage URL: https://blog.example.com
Callback URL: https://filling-config-api.example.com/auth/github/callback
Webhook: Disabled
```

仓库权限只授予：

- `Contents: Read and write`：读取并提交允许修改的配置文件。
- `Actions: Read-only`：在管理页显示最近的部署状态。
- `Metadata: Read-only`：GitHub App 的基础权限。

安装 App 时只选择博客所在仓库，不要授权全部仓库。记录 App 的 Client ID 和安装地址末尾的 Installation ID。

当前 Worker 使用管理员授权后的 GitHub user access token，不使用 installation token，因此不需要生成或保存 GitHub App 私钥。

## 配置 Worker 名称与域名

先修改 `worker/wrangler.jsonc`：

```json
{
  "name": "filling-config-api",
  "main": "src/index.js",
  "keep_vars": true,
  "routes": [
    {
      "pattern": "filling-config-api.example.com",
      "custom_domain": true
    }
  ]
}
```

没有自定义域名时可以先使用 Cloudflare 提供的 `workers.dev` 地址，但 GitHub App Callback URL 和 `GITHUB_CALLBACK_URL` 必须同时使用该地址。

## 设置环境变量

在 Cloudflare Worker 的 Variables and Secrets 中添加普通变量：

| 变量 | 示例 | 用途 |
| --- | --- | --- |
| `ADMIN_GITHUB_USER_ID` | `12345678` | 唯一允许登录的 GitHub 数字用户 ID |
| `ADMIN_ORIGIN` | `https://blog.example.com` | 管理页面来源，只写协议和域名 |
| `GITHUB_BRANCH` | `main` | 配置提交目标分支 |
| `GITHUB_CALLBACK_URL` | `https://filling-config-api.example.com/auth/github/callback` | OAuth 回调完整地址 |
| `GITHUB_CLIENT_ID` | GitHub App Client ID | OAuth 公开客户端标识 |
| `GITHUB_INSTALLATION_ID` | App 安装 ID | 校验 App 是否安装到目标仓库 |
| `GITHUB_OWNER` | `your-name` | 仓库所有者 |
| `GITHUB_REPO` | `Filling` | 仓库名称 |

`ADMIN_ORIGIN` 不能包含路径或末尾 `/`。`GITHUB_CALLBACK_URL` 必须以 `/auth/github/callback` 结尾，并与 GitHub App 中的值完全一致。

以下两项必须使用 Secret 类型：

| Secret | 用途 |
| --- | --- |
| `GITHUB_CLIENT_SECRET` | GitHub App OAuth Client Secret |
| `SESSION_SECRET` | 加密和签名管理会话 |

生成会话密钥：

```bash
openssl rand -base64 32
```

Secret 只能写入 Cloudflare，不能放进 TOML、源码、截图或 Git 仓库。GitHub App 页面显示的 SHA-256 指纹也不是可用的私钥或 Secret。

## 部署 Worker

在项目根目录执行：

```bash
pnpm install
pnpm worker:check
pnpm exec wrangler login
pnpm worker:deploy
```

`worker:check` 先执行 Wrangler dry run，确认入口、配置和打包结果有效。`keep_vars = true` 会保留 Cloudflare Dashboard 中已经设置的变量和 Secret。

部署后检查健康接口：

```bash
curl https://filling-config-api.example.com/health
```

正确响应应包含：

```json
{
  "ok": true,
  "service": "filling-config-api",
  "configured": true,
  "missing": []
}
```

`configured: false` 表示仍有必填变量缺失，`missing` 会列出变量名，但不会暴露真实值。

## 连接管理页面

管理端默认 API 地址位于 `src/site/admin/adminApi.js`，也可以在构建时通过环境变量覆盖：

```bash
VITE_ADMIN_API_URL=https://filling-config-api.example.com pnpm build
```

使用 GitHub Pages 工作流时，需要把同一个变量传入构建步骤。完成站点发布后访问：

```text
https://blog.example.com/admin/config
```

登录后可以编辑受管理的 TOML、查看差异和校验结果，并将本次修改作为一个提交发布。远端分支已经变化时，Worker 会返回冲突而不是覆盖新提交。

## 本地联调

复制本地变量模板：

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

将其中的来源和回调改为本地地址，再分别启动 Worker 与站点：

```bash
pnpm worker:dev
```

```bash
VITE_ADMIN_API_URL=http://localhost:8787 pnpm dev
```

`worker/.dev.vars` 已被 Git 忽略，但仍然不要把真实 Secret 粘贴到日志或截图中。本地 OAuth 回调也必须在用于测试的 GitHub App 中登记。

## 常见问题

- `/health` 显示缺少变量：检查 Cloudflare 当前部署版本是否已经绑定最新变量。
- 登录后返回来源错误：确认 `ADMIN_ORIGIN` 与浏览器地址的协议、域名和端口完全一致。
- OAuth 回调失败：同时核对 GitHub App Callback URL 与 `GITHUB_CALLBACK_URL`。
- 登录后提示无权访问：检查 `ADMIN_GITHUB_USER_ID` 是否为数字 ID，以及 App 是否安装到目标仓库。
- 管理页请求了错误的域名：重新设置 `VITE_ADMIN_API_URL` 并构建站点。
- 发布时提示配置冲突：刷新管理页，基于最新提交重新修改。

Worker 只允许读写配置清单中的 TOML，不接受任意仓库路径，也不会修改源码和工作流。更完整的生产环境清单见仓库中的 `docs/online-admin-setup.md`。
