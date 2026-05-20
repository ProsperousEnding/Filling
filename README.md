# Filling

Filling 是一个基于 Vue 3、Pinia 和 Vite 的静态博客与内容站框架。它把内容、配置和界面实现分开：文章写在 `blog/content`，站点行为写在 `blog/config`，框架代码放在 `src/framework`。

## 预览

![首页文章列表与侧边栏](./docs/screenshots/home-overview.png)

![文章详情 Page Background 效果](./docs/screenshots/article-page-background.png)

## 特性

- Markdown 驱动内容，支持文章、单页和自定义内容目录。
- 内置首页、文章、分类、标签、归档、搜索、友链、留言板和赞助页。
- 支持 `list`、`card`、`grid`、`timeline`、`context` 等页面组件。
- 支持文章封面回退、外部图源切换、详情页封面背景和 page background。
- 支持 giscus / utterances 评论、统计脚本、公告、赞助、默认协议、Markdown 增强和代码块增强。
- 支持运行时 SPA 与静态导出，构建产物可直接部署到 GitHub Pages。

## 快速开始

```bash
pnpm install
pnpm dev
```

常用命令：

```bash
pnpm dev                 # 本地开发
pnpm build               # 构建站点并生成静态 HTML
pnpm build:content-index # 仅重新生成内容索引
pnpm build:lib           # 构建组件库产物
```

## 目录结构

```text
blog/
  config/               # 用户配置
    site.toml           # 站点、导航、页面、首页文章、页脚
    profile.toml        # 侧边栏个人资料
    theme.toml          # 主题预设
    background.toml     # 站点背景
    cover.toml          # 封面和详情页背景
    comment.toml        # 评论系统
    links.toml          # 友情链接
    optional/           # 低频细节配置
  content/
    about.md
    articles/           # 文章目录
public/
  icons/
  themes/
src/
  framework/            # 框架核心
  site/                 # 站点装配入口
scripts/                # 内容索引和静态生成脚本
```

## 配置模型

`blog/config` 根目录只放常用基础配置。`blog/config/optional` 放低频功能配置，例如统计、公告、字体、代码块、Markdown 增强、留言板、赞助和默认协议。

同一个配置只保留一份。不要同时创建 `cover.toml` 和 `optional/cover.toml` 这类同名文件。

常用配置：

- `site.toml`：站点标题、SEO、页眉、侧边栏、分页、首页文章、页面注册和页脚。
- `profile.toml`：个人资料卡和社交链接。
- `theme.toml`：主题 CSS / JS 预设。
- `background.toml`：站点背景模式。
- `cover.toml`：文章封面回退、图源切换和详情页背景模式。
- `comment.toml`：giscus / utterances 评论。
- `links.toml`：友情链接数据。

完整说明见 [docs/configuration.md](./docs/configuration.md)。

## 写文章

文章放在 `blog/content/articles`，使用 Markdown + frontmatter：

```yaml
---
title: 示例文章
date: 2026-05-01
description: 一段摘要
category: CSS
tags:
  - Tailwind
  - 前端
cover: images/demo-cover.webp
cover_display_mode: page-background
---
```

常用字段：

- `title`：标题。
- `date` / `updated`：发布时间和更新时间。
- `description`：摘要。
- `category` / `tags`：分类和标签。
- `cover`：封面图，路径相对于 `public/` 或完整外链。
- `cover_display_mode`：详情页封面显示方式，可选 `image`、`header-background`、`page-background`。
- `sticky` / `featured` / `home_hidden` / `weight`：控制首页文章流。

## 页面

页面在 `site.toml` 的 `[[menus.pages]]` 中注册。

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"

[[menus.pages]]
key = "projects"
title = "项目"
component = "grid"
folder = "projects"
```

常用组件：

- `context`：渲染单个 Markdown 文件。
- `list`：目录内容列表。
- `card`：目录内容卡片。
- `grid`：目录内容网格。
- `timeline`：目录内容时间线。
- `friends`：友情链接页。
- `guestbook`：留言板页。
- `sponsor`：赞助页。

## 静态部署

构建：

```bash
pnpm build
```

产物输出到 `dist/`，包含静态 HTML、资源文件、`404.html`、`sitemap.xml`、`robots.txt`、`rss.xml` 和 `.nojekyll`。

仓库已提供 GitHub Pages 工作流：`.github/workflows/deploy-pages.yml`。

部署步骤：

1. 推送代码到 GitHub。
2. 打开仓库 `Settings > Pages`。
3. 将 `Build and deployment` 的 `Source` 设置为 `GitHub Actions`。
4. 推送默认分支后自动构建并部署。

如果使用自定义域名，建议设置仓库变量：

- `PAGES_SITE_URL`：正式域名，例如 `https://blog.example.com`。
- `PAGES_BASE_PATH`：通常为 `/`。

如果使用 GitHub 默认地址 `https://<user>.github.io/<repo>/`，保留仓库子路径即可。

## 开发说明

- Vue SFC 使用 `<script setup>` 和 Composition API。
- 内容索引由 `scripts/build-content-index.mjs` 生成。
- 静态页面由 `scripts/generate-static.mjs` 生成。
- 主题资源放在 `public/themes`，配置路径不要带 `public/` 前缀。
- 本地图片、字体、图标等静态资源都放在 `public/`。

## License

MIT
