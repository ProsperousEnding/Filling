---
title: 站点基础与外观配置
description: 用最少的 TOML 完成站点信息、个人资料、主题和文章封面配置。
date: 2026-05-13
updated: 2026-08-20
category: 配置
cover_display_mode: page-background
sticky: true
weight: 300
tags:
  - 配置
  - 站点
  - 外观
---

Filling 的配置遵循一个原则：只写需要修改的值。日常配置放在 `blog/config/`，低频功能放在 `blog/config/optional/`。

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

`page_size`、`categories`、`tags`、`include_ids` 和 `exclude_ids` 可进一步控制结果。`/articles` 始终是全部文章页，不受首页筛选影响。

## 新增页面

内置页面无需重复注册。新增 Markdown 页面时，在 `site.toml` 添加：

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

目录页面使用 `folder`，并可选择 `list`、`card`、`grid` 或 `timeline`。启用且可见的页面会自动进入菜单；自定义页面默认收进桌面端“更多”。

只有需要覆盖默认行为时才配置：

- `visible = false`：保留路由，但不显示菜单。
- `enabled = false`：同时关闭路由和静态生成。
- `menu_group = "primary" | "more"`：指定桌面菜单分组。
- `menu_order`：数值越小越靠前。

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

## 主题与背景

`theme.toml` 选择主题预设：

```toml
current_preset = "default"
```

`background.toml` 默认使用渐变。使用壁纸时只需：

```toml
enabled = true
mode = "image"
image = "backgrounds/site-light.webp"
dark_image = "backgrounds/site-dark.webp"
```

## 文章封面

`cover.toml` 已默认启用自动封面，当前站点使用 MWM 二次元图源：

```toml
seeded_style = "mwm-anime"
```

可选图源：

- `picsum`、`loremflickr`：摄影与风景。
- `mwm-anime`、`paugram-anime`、`dmoe-anime`：二次元图片。
- `mwm-scenery`：随机风景。
- `cataas`：随机猫咪。
- `paugram-bing`：Bing 每日壁纸。

站点中的所有自动封面统一使用 `seeded_style`，不会被访客浏览器中的本地选择覆盖。

详情页默认显示独立封面，也可设置为 `header-background` 或 `page-background`：

```toml
[detail]
display_mode = "page-background"
```

## 修改后检查

```bash
pnpm build:config
```

该命令会检查 TOML 语法、字段值和页面路由。完整字段见仓库中的 `docs/configuration.md`。
