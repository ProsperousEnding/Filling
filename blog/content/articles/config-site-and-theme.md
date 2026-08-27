---
title: 站点、主题与封面配置
description: 从站点信息到 MWM 自动封面，理清主题和文章封面的配置边界。
date: 2026-05-13
updated: 2026-08-28
category: 配置
cover_display_mode: page-background
sticky: true
weight: 300
tags:
  - 配置
  - 站点
  - 外观
---

Filling 的配置遵循一个原则：只写需要修改的值，其余交给框架默认配置。常用配置放在 `blog/config/`，低频功能放在 `blog/config/optional/`。

先分清两个外观概念：

- `theme.toml` 选择界面主题预设，并统一控制页面背景和组件视觉。
- `cover.toml` 只负责文章列表和文章详情页的封面。

页面背景属于主题，文章封面属于内容展示，两者不使用重复配置。

## 配置文件分工

| 文件 | 主要职责 |
| --- | --- |
| `site.toml` | 站点信息、SEO、页头、首页文章、菜单、侧边栏和页脚 |
| `profile.toml` | 侧边栏个人资料与社交链接 |
| `theme.toml` | 当前主题、页面背景和主题资源预设 |
| `cover.toml` | 自动封面图源、列表封面和详情页封面 |

完整文件说明可以直接查看 `blog/config/README.md`。

## 先配置站点

`site.toml` 是站点入口。一个可用的最小配置如下：

```toml
title = "Filling"
description = "一个基于 Vue 3 的静态博客与内容系统。"
site_url = "https://filling.initzo.com"

[home_articles]
mode = "mixed"
```

首页模式支持：

- `latest`：显示全部可见文章。
- `featured`：只显示精选或手动指定的文章。
- `sticky`：只显示置顶或手动指定的文章。
- `mixed`：依次合并手动指定、置顶、精选和最新文章。

`page_size`、`categories`、`tags`、`include_ids` 和 `exclude_ids` 可进一步控制结果。`/articles/` 始终是全部文章页，不受首页筛选影响。

## 个人资料

`profile.toml` 控制侧边栏资料：

```toml
display_name = "Filling"
username = "prosperousEnding"
tagline = "记录前端工程化、静态博客和内容系统。"
avatar_url = "icons/points.png"
website = "https://filling.initzo.com"

[[social_links]]
name = "GitHub"
url = "https://github.com/ProsperousEnding/Filling"
icon = "github"
show_name = false
```

本地资源路径相对于 `public/`，因此写 `icons/points.png`，不要写 `public/icons/points.png`。

## 选择主题

`theme.toml` 选择主题预设：

```toml
current_preset = "default"
```

当前仓库提供 `default`、`ocean` 和 `forest` 三个预设。预设 CSS 位于 `public/themes/`，名称必须对应 `[presets.<name>]`；只切换现有主题时修改 `current_preset` 即可，内置主题不加载重复的 JavaScript。
页面背景由对应主题 CSS 的 `--theme-body-background` 提供，会和文字、面板、控件一起切换。

## 文章封面

`cover.toml` 是封面的唯一配置入口。当前站点使用 MWM 二次元图源，并在文章列表与详情页显示封面：

```toml
enabled = true
fallback = "seeded"
seeded_style = "mwm-anime"
fixed = false
```

默认会在每次构建发布时打乱 MWM 图片池，并尽量避免同页文章出现重复封面；同一个已发布版本中的服务端 HTML 与客户端会保持一致，不会在接管后换图。希望每篇文章跨版本长期显示同一张图片时，在配置后台打开“固定文章封面”，或修改配置：

```toml
fixed = true

[source_urls]
mwm-anime = [
  "https://images.example.com/anime-cover-1.webp",
  "https://images.example.com/anime-cover-2.webp",
]

[list]
show_cover = true

[detail]
show_cover = true
display_mode = "image"
```

可选图源：

- `mwm-anime`、`paugram-anime`、`dmoe-anime`：二次元随机接口，直接使用时每次请求可能不同。
- `mwm-scenery`、`paugram-bing`：摄影或风景随机接口，也可以按需开启固定模式。
- `picsum`、`loremflickr`：原生支持稳定 seed 的摄影图源。
- `cataas`：猫咪图片。

所有自动封面统一使用 `seeded_style`。`fixed = false` 时随机打乱 `source_urls` 图片池；打开固定模式后，框架按文章标识稳定选择。没有配置图片池时才会直接使用随机接口。站点不存在第二套浏览器本地选择，访客也不会覆盖站点配置。当前图片池直接查看 `blog/config/cover.toml`；可选的 `image_proxy_url` 只应在图片服务已经部署可用后填写。

当前列表封面使用 `loading = "lazy"`，进入视口附近才开始请求；详情页封面使用 `loading = "eager"`，优先加载首屏图片。`placeholder = "gradient"` 只在图片请求期间显示跟随主题的占位背景，不是另一套壁纸或封面。`object_fit` 只控制图片在既定容器内的裁切方式，不改变封面来源。

详情页支持三种展示方式：

- `image`：在正文上方显示独立封面，也是当前默认配置。
- `header-background`：封面延伸为文章头部背景。
- `page-background`：封面作为文章详情页背景。

例如需要沉浸式页面背景时：

```toml
[detail]
display_mode = "page-background"
```

单篇文章可以通过 frontmatter 的 `cover` 指定图片，也可以用 `cover_display_mode` 单独覆盖详情页展示方式。没有写 `cover` 时才使用自动封面。

## 修改后检查

```bash
pnpm build:config
```

该命令会检查 TOML 语法、未知字段、无效枚举和页面路由。完整字段见仓库中的 `docs/configuration.md`。
