---
title: 内容页面与写作
description: 从文章 frontmatter 到自定义页面，快速了解 Filling 的内容组织方式。
date: 2026-05-13
updated: 2026-08-20
category: 配置
cover_display_mode: page-background
featured: true
weight: 200
tags:
  - 配置
  - 页面
  - 内容
---

Filling 的内容统一放在 `blog/content/`，文章、单页和自定义目录都使用 Markdown。

## 内容目录

```text
blog/content/
  articles/       # 博客文章
  about.md        # 单文件页面
  projects/       # 自定义内容目录
```

`articles/` 中的内容会进入首页、文章列表、分类、标签、归档和搜索索引。自定义目录只有注册成页面后才会显示。

## 写一篇文章

```yaml
---
title: 示例文章
date: 2026-08-20
updated: 2026-08-20
description: 用一句话说明文章解决的问题。
category: 前端
tags:
  - Vue
  - Vite
cover: images/demo-cover.webp
---

从这里开始写正文。
```

常用 frontmatter：

- `title`、`date`、`updated`、`description`：文章基本信息。
- `category`、`tags`：分类和标签。
- `cover`：本地资源路径或完整图片地址。
- `cover_display_mode`：`image`、`header-background` 或 `page-background`。
- `sticky`、`featured`、`home_hidden`、`weight`：首页筛选和排序。

没有填写 `cover` 时，框架会按 `cover.toml` 自动生成封面。

## 首页展示

首页由 `site.toml` 的 `[home_articles]` 控制：

```toml
[home_articles]
mode = "mixed"
page_size = 8
```

`latest` 显示全部可见文章，`featured` 和 `sticky` 只显示对应文章，`mixed` 会把手动指定、置顶、精选和最新内容合并为完整信息流。

需要精确控制时使用 `include_ids`、`exclude_ids`、`categories`、`tags` 等字段。精选或置顶模式没有结果时默认保持空状态；只有明确需要时才开启 `fallback_to_latest = true`。

## 注册内容页面

单文件页面：

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

目录页面：

```toml
[[menus.pages]]
key = "projects"
title = "项目"
component = "grid"
folder = "projects"
```

可用组件：

- `context`：单个 Markdown 文件。
- `list`、`card`、`grid`、`timeline`：目录内容。
- `friends`：友情链接。

页面会自动进入导航。`key` 必须唯一，目录页面只读取第一层 `.md` 文件；非法路径、重复路由或内容解析失败会在构建时直接报错。

## 友情链接

友链数据写在 `blog/config/links.toml`：

```toml
[[friend_links]]
name = "Vue.js"
url = "https://vuejs.org/"
description = "The Progressive JavaScript Framework"
tags = ["Vue", "Framework"]
```

使用 `weight` 排序，使用 `enabled = false` 临时隐藏。友链页面通过 `component = "friends"` 注册。

## 留言板、赞助与协议

这些功能位于 `blog/config/optional/`：

- `guestbook.toml`：`enabled = true` 时自动注册留言板和菜单。
- `sponsor.toml`：通过 `show = ["articles", "page"]` 选择显示位置。
- `license.toml`：设置默认文章协议。

单篇文章可通过 `license` 覆盖默认协议，也可设置 `license: false` 关闭。

## 修改后检查

```bash
pnpm build:config
pnpm build:content-index
```

完整配置字段见仓库中的 `docs/configuration.md`。
