# Filling

Filling 是一个基于 Vue 3、Pinia 和 Vite 的静态博客框架。内容使用 Markdown 编写，站点通过 TOML 配置，构建结果可直接部署到 GitHub Pages。

![首页文章列表与侧边栏](./docs/screenshots/home-overview.png)

## 主要能力

- 文章、单页、自定义内容目录和自动生成的分类、标签、归档、搜索页。
- 自动菜单、响应式侧边栏、亮暗主题和多种文章列表布局。
- 文章封面回退、多个随机图源和详情页背景模式。
- giscus / utterances 评论、友链、留言板、赞助、公告和访问统计。
- Markdown Callout、Mermaid、KaTeX 和代码块增强。
- 静态导出、SEO 文件、GitHub Pages 部署和线上配置管理。

## 快速开始

需要 Node.js 和 pnpm：

```bash
pnpm install
pnpm dev
```

打开终端输出的本地地址即可预览。常用检查命令：

```bash
pnpm build:config # 检查并生成站点配置
pnpm build        # 构建静态站点到 dist/
pnpm check        # 运行 lint、测试和完整构建验证
```

## 内容与配置

日常使用主要修改两个目录：

```text
blog/
  config/          # TOML 站点配置
  content/         # Markdown 内容
public/            # 图片、图标、字体和主题资源
```

最小站点配置位于 `blog/config/site.toml`：

```toml
title = "My Blog"
description = "记录我的学习与思考。"
site_url = "https://blog.example.com"

[home_articles]
mode = "latest"
```

配置只需写需要覆盖的值，其余使用框架默认值。常用入口：

- `site.toml`：站点信息、首页、页面和菜单。
- `profile.toml`：侧边栏资料和社交链接。
- `theme.toml`、`background.toml`、`cover.toml`：主题、背景和文章封面。
- `comment.toml`：评论系统。
- `links.toml`：友情链接。
- `optional/`：统计、公告、字体、留言板、赞助等低频功能。

完整字段说明见 [配置参考](./docs/configuration.md)。

## 写文章

在 `blog/content/articles/` 新建 Markdown 文件：

```yaml
---
title: 示例文章
date: 2026-08-20
description: 用一句话说明文章解决的问题。
category: 前端
tags:
  - Vue
  - Vite
---

从这里开始写正文。
```

`sticky`、`featured`、`home_hidden` 和 `weight` 可控制首页展示；`cover` 和 `cover_display_mode` 可覆盖单篇文章的封面设置。

站内指南：

- [站点基础与外观配置](./blog/content/articles/config-site-and-theme.md)
- [内容页面与写作](./blog/content/articles/config-content-and-pages.md)
- [评论、统计与内容增强](./blog/content/articles/config-comments-and-analytics.md)

## 页面与菜单

首页、文章、分类、标签、归档和搜索页已经内置。新增内容页时，在 `site.toml` 注册：

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

启用且可见的页面会自动进入桌面和移动菜单。目录页面可使用 `list`、`card`、`grid` 或 `timeline` 组件。

## 线上管理

项目包含 `/admin/config` 管理页面和 Cloudflare Worker API。管理员通过 GitHub 登录后，可以在线修改允许范围内的 TOML 配置并提交到仓库；GitHub Actions 随后自动重建站点。

部署步骤、GitHub App 权限和 Cloudflare 变量见 [线上配置管理部署说明](./docs/online-admin-setup.md)。密钥只能存放在 Cloudflare Secret 中，不能写入仓库。

## 构建与部署

```bash
pnpm build
```

`dist/` 包含静态 HTML、资源、`404.html`、`sitemap.xml`、`robots.txt` 和 RSS。仓库内的 [GitHub Pages 工作流](./.github/workflows/deploy-pages.yml) 会在推送默认分支后自动构建和发布。

在仓库 `Settings > Pages` 中将 Source 设为 `GitHub Actions`。使用自定义域名时可配置仓库变量：

- `PAGES_SITE_URL`：正式站点地址。
- `PAGES_BASE_PATH`：通常为 `/`。

## 框架开发

核心代码位于 `src/framework/`，站点装配位于 `src/site/`。组件库构建命令：

```bash
pnpm build:lib
```

框架通过运行时上下文接收内容适配器、配置源和部署 base，不直接依赖当前站点的 `blog/` 目录。提交前请运行 `pnpm check`。

## License

[MIT](./LICENSE)

相关社区：[LINUX DO](https://linux.do/)
