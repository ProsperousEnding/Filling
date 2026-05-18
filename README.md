# Filling Blog Framework

一个基于 Vue 3、Pinia、Vite 的静态博客框架，内容来源于 `blog/content`，站点行为来源于 `blog/config`。

## 特性

- Markdown 内容驱动，支持文章和自定义内容目录
- 内置首页、文章、分类、标签、归档、搜索页面
- 菜单与页面组件配置化，可通过 `list / card / grid / timeline / context` 切换展现
- 支持主题自定义 CSS / JS
- 支持静态导出与 GitHub Pages 自动部署

## 快速开始

```bash
pnpm install
pnpm dev
```

常用命令：

```bash
pnpm dev
pnpm build
pnpm build:lib
pnpm build:content-index
```

## 项目结构

```text
blog/
  config/
    site.toml
    profile.toml
    theme.toml
    links.toml
  content/
    about.md
    articles/
    projects/
public/
  icons/
  themes/
src/
  framework/
  site/
scripts/
```

## 内容约定

- `blog/content/articles`：文章目录，会生成文章详情页，并参与文章列表、搜索、分类、标签、归档
- `blog/content/<自定义目录>`：可作为菜单页的数据源，例如 `projects`
- `blog/content/about.md`：可作为 `context` 类型页面的正文源文件

## 配置文件

完整配置说明见：

- [docs/configuration.md](./docs/configuration.md)

### `blog/config/site.toml`

控制站点标题、布局、路由、分页、菜单、页脚。

关键点：

- `site_url` 填站点根域名，不要带仓库子路径
- `[[menus.pages]]` 控制页面和页面组件
- `[[menus.header]]` / `[[menus.mobile_header]]` 控制顶部菜单
- `[[menus.sidebar]]` 控制侧边栏菜单模块

页面组件说明：

- `context`：渲染单个 Markdown 文件，配 `file`
- `list`：渲染目录内容，配 `folder`
- `card`：渲染目录内容卡片列表，配 `folder`
- `grid`：渲染目录内容网格，配 `folder`
- `timeline`：渲染目录内容时间线，配 `folder`

内置页面键：

- `home`
- `articles`
- `categories`
- `tags`
- `archive`
- `search`

页面开关：

- `enabled = false`：关闭页面路由和静态生成
- `visible = false`：保留页面路由，但从默认 `blog-nav` 中隐藏

自定义页面示例：

```toml
[[menus.pages]]
key = "search"
title = "搜索"
enabled = true
visible = false

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

### `blog/config/profile.toml`

控制侧边栏个人信息。

- `display_name`：展示名称
- `username`：用户名，会显示为 `@username`
- `tagline`：副标题
- `bio`：个人简介
- `avatar_url`：头像地址，可填远程 URL 或 `public/` 下相对路径
- `location` / `website`：侧边栏资料信息

### `blog/config/theme.toml`

控制当前主题与主题资源文件。

- `current_preset`：当前启用的主题
- `css_file` / `js_file`：全局兜底主题资源
- `[presets.xxx]`：主题预设

资源路径写法：

- 相对于 `public/`
- 例如 `themes/default.css`
- 不要写外部 URL

### `blog/config/links.toml`

控制友情链接数据。只有在侧边栏菜单使用 `source = "friend-links"` 时才会展示。

## 菜单系统

顶部菜单渲染器：

- `header-pill`
- `header-stack`

侧边栏渲染器：

- `sidebar-link`
- `sidebar-article`

菜单数据源：

- `blog-nav`
- `categories`
- `tags`
- `latest-articles`
- `friend-links`
- `custom`

示例：

```toml
[[menus.header]]
renderer = "header-pill"
source = "blog-nav"

[[menus.header.items]]
key = "content"
label = "内容"
children = ["articles", "categories", "tags", "archive"]

[[menus.header.items]]
page = "about"

[[menus.sidebar]]
title = "友情链接"
renderer = "sidebar-link"
source = "friend-links"
```

## GitHub Pages 部署

仓库已经包含 GitHub Actions 工作流：

- `.github/workflows/deploy-pages.yml`

使用方法：

1. 推送代码到 GitHub 仓库
2. 打开 `Settings > Pages`
3. 将 `Build and deployment` 的 `Source` 设置为 `GitHub Actions`
4. 推送到默认分支后会自动构建并部署

工作流会自动处理：

- 安装依赖
- 计算 GitHub Pages 的 `base path`
- 注入正确的 `site_url`
- 生成 `dist`
- 上传并部署到 GitHub Pages

可选仓库变量：

- `PAGES_BASE_PATH`：手动指定站点子路径
- `PAGES_SITE_URL`：手动指定站点根域名

如果你给 GitHub Pages 绑定了 Cloudflare 或其他自定义域名：

- `PAGES_SITE_URL` 请设置成你的正式域名，例如 `https://blog.example.com`
- `PAGES_BASE_PATH` 通常应该设置为 `/`
- 不要继续使用仓库子路径（例如 `/Filling/`），否则构建产物会去请求 `/Filling/assets/*`，在根域名部署下会直接 404

如果仍然使用 GitHub 默认地址 `https://<user>.github.io/<repo>/` 访问，则保留仓库子路径即可，不需要改成 `/`

## 主题资源

可将主题文件放到：

- `public/themes/*.css`
- `public/themes/*.js`

然后在 `blog/config/theme.toml` 中切换：

```toml
current_preset = "ocean"
```

## 构建说明

- `pnpm build` 会先执行 Vite 构建，再生成静态 HTML
- 构建产物位于 `dist/`
- 静态导出会额外生成 `404.html`、`sitemap.xml`、`robots.txt`、`rss.xml`、`.nojekyll`
