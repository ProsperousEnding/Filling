---
title: 内容页面与写作
description: 从文章 frontmatter 到菜单页面，了解内容目录、首页筛选与自动路由的现行规则。
date: 2026-05-13
updated: 2026-08-28
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
  projects/       # 按需创建的自定义内容目录
```

`articles/` 中的 Markdown 会自动进入文章列表、分类、标签、归档和搜索索引，并根据首页规则决定是否显示在首页。其他文件或目录只有注册成页面后才会生成路由。

## 写一篇文章

```yaml
---
title: 示例文章
slug: example-article
date: 2026-08-20
updated: 2026-08-20
description: 用一句话说明文章解决的问题。
category: 前端
tags:
  - Vue
  - Vite
cover: images/articles/demo-cover.webp
cover_display_mode: image
---

从这里开始写正文。
```

常用 frontmatter：

- `title`、`date`、`updated`、`description`：文章基本信息。
- `slug`：文章 URL 标识；省略时使用 Markdown 文件名。
- `category`、`tags`：分类和标签。
- `cover`：`public/` 下的相对路径或完整图片地址。
- `cover_display_mode`：`image`、`header-background` 或 `page-background`。
- `sticky`、`featured`、`home_hidden`、`weight`：首页筛选和排序。

本地图片示例对应 `public/images/articles/demo-cover.webp`。没有填写 `cover` 时，框架会按唯一的 `cover.toml` 配置自动生成封面。

## 首页展示

首页由 `site.toml` 的 `[home_articles]` 控制：

```toml
[home_articles]
mode = "mixed"
page_size = 8
```

`latest` 显示全部可见文章，`featured` 和 `sticky` 只显示对应文章，`mixed` 会把手动指定、置顶、精选和最新内容合并为完整信息流。

需要精确控制时使用 `include_ids`、`exclude_ids`、`categories`、`tags` 等字段。精选或置顶模式没有结果时默认保持空状态；只有明确需要时才开启 `fallback_to_latest = true`。

`home_hidden: true` 只会让文章离开首页，不会影响 `/articles/`、分类、标签、归档和搜索。

## 注册内容页面

首页、文章、分类、标签、归档和搜索属于内置页面，不要在 `site.toml` 重复注册。

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

启用且可见的页面会自动进入桌面和移动导航，自定义页面默认进入桌面端“更多”。`key` 必须唯一，目录页面只读取第一层 `.md` 文件；非法路径、重复路由或内容解析失败会在构建时直接报错。

文章和站内页面使用带尾斜杠的规范地址，例如 `/article/example-article/` 和 `/projects/`。直接访问不带尾斜杠的静态地址时会重定向到规范地址；自定义 `path` 也应写成静态站内路径，不能与内置页面或其他内容页重叠。

只有需要覆盖默认行为时才添加高级字段：

- `visible = false`：保留路由，但不显示菜单。
- `enabled = false`：关闭路由与静态生成。
- `path = "/projects/"`：覆盖页面路径，构建时会检查路径安全与冲突。
- `menu_group = "primary" | "more"`：指定桌面菜单分组。
- `menu_order`：数值越小越靠前。

## 友情链接

友链数据写在 `blog/config/links.toml`：

```toml
[[friend_links]]
name = "Vue.js"
url = "https://vuejs.org/"
description = "The Progressive JavaScript Framework"
tags = ["Vue", "Framework"]
```

使用 `weight` 排序，使用 `enabled = false` 临时隐藏。友链页面通过 `component = "friends"` 注册，但友链数据仍只维护在 `links.toml`。

## 留言板、赞助与协议

这些功能位于 `blog/config/optional/`：

- `guestbook.toml`：`enabled = true` 时自动注册留言板路由和菜单。
- `sponsor.toml`：通过 `show = ["articles", "page"]` 选择文章区或独立页面。
- `license.toml`：设置默认文章协议。

留言板与赞助页由各自配置负责，不要再在 `site.toml` 写一份同名菜单。

单篇文章可通过 `license` 覆盖默认协议，也可设置 `license: false` 关闭。

## 修改后检查

```bash
pnpm build:config
pnpm build:content-index
```

第一条检查配置与路由，第二条重新生成文章、页面和搜索索引。发布前可运行 `pnpm check` 完整验证。

生产构建会为首页、文章、分页和已启用的内容页面生成完整 HTML；浏览器加载 JavaScript 后会在现有内容上接管，不需要再维护另一份静态页面模板。
