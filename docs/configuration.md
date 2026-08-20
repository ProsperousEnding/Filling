# 配置说明

Filling 的用户配置位于 `blog/config/`。配置原则是：只写你要改的值，其余交给默认配置。

## 从哪里开始

大多数站点只需要按这个顺序修改：

1. `site.toml`：站点名称、域名、首页模式和自定义页面。
2. `profile.toml`：个人资料和社交链接。
3. `comment.toml`：评论服务。
4. `links.toml`：友情链接。

外观配置在 `theme.toml`、`background.toml` 和 `cover.toml`。统计、公告、留言板、赞助等低频功能在 `blog/config/optional/`。

最小 `site.toml` 示例：

```toml
title = "My Blog"
description = "记录我的学习与思考。"
site_url = "https://blog.example.com"

[home_articles]
mode = "latest"
```

## 通用规则

- 内容放在 `blog/content/`，文章放在 `blog/content/articles/`。
- 本地静态资源放在 `public/`，配置中写 `icons/avatar.png`，不要写 `public/icons/avatar.png`。
- 同一配置不要同时放在根目录和 `optional/`。
- 配置修改后开发环境会热更新，生产环境需要重新构建。
- 已有 TOML 文件语法错误、必填值缺失或字段值无效时，构建会明确报错。
- `[footer].snippet_html` 和 `[page].footer_html` 只能填写仓库维护者控制的可信 HTML。

可以单独检查配置：

```bash
pnpm build:config
```

## 站点与首页

`site.toml` 的常用部分：

```toml
title = "Filling"
subtitle = "内容系统与博客框架"
description = "一个基于 Vue 3 的静态博客与内容系统。"
site_url = "https://filling.initzo.com"

[seo]
og_image = "icons/points.png"

[features]
show_sidebar_on_articles = false

[home_articles]
mode = "mixed"

[footer]
text = "版权所有 © Filling"
note = "基于 Vue 3 构建"
```

`[home_articles].mode` 支持：

- `latest`：所有可见文章，默认按时间展示。
- `featured`：只显示 `featured = true` 或 `include_ids` 指定的文章。
- `sticky`：只显示 `sticky = true` 或 `include_ids` 指定的文章。
- `mixed`：按手动指定、置顶、精选、最新的顺序合并。

常用的进一步字段有 `page_size`、`paginate`、`sticky_first`、`categories`、`tags`、`include_ids`、`exclude_ids` 和 `fallback_to_latest`。`featured` 与 `sticky` 没有结果时默认不回退到最新文章。

## 个人资料与友链

`profile.toml`：

```toml
display_name = "Filling"
username = "prosperousEnding"
tagline = "记录前端工程化、静态博客和内容系统。"
avatar_url = "icons/points.png"

[[social_links]]
name = "GitHub"
url = "https://github.com/ProsperousEnding/Filling"
icon = "GH"
```

`links.toml`：

```toml
[[friend_links]]
name = "Vue.js"
url = "https://vuejs.org/"
description = "The Progressive JavaScript Framework"
tags = ["Vue", "Framework"]
```

多条链接可以用 `weight` 排序，用 `enabled = false` 临时隐藏。

## 页面与菜单

首页、文章、分类、标签、归档和搜索是内置页面，无需在 `site.toml` 重复注册。只有新增内容页时才写 `[[menus.pages]]`：

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

- `context`：单个 Markdown 文件，配置 `file`。
- `list`、`card`、`grid`、`timeline`：Markdown 目录，配置 `folder`。
- `friends`：友链页。

可见页面会自动进入桌面和移动菜单。自定义页默认进入“更多”，通常不需要写 `menu_group` 和 `menu_order`。

高级页面字段：

- `visible = false`：保留路由，不显示在默认菜单。
- `enabled = false`：关闭路由和静态生成。
- `path`：自定义静态路径。
- `menu_group = "primary" | "more"`：固定桌面菜单位置。
- `menu_order`：数值越小越靠前。

留言板和赞助页由各自的功能配置自动注册，不要再在 `site.toml` 写一份。

## 主题、背景与封面

`theme.toml` 用一个名称选中主题：

```toml
current_preset = "default"

[presets.default]
css_file = "themes/default.css"
js_file = "themes/default.js"
```

`background.toml` 使用默认渐变只需：

```toml
enabled = true
mode = "gradient"
```

图片背景需额外填写 `image`：

```toml
enabled = true
mode = "image"
image = "backgrounds/site-light.webp"
dark_image = "backgrounds/site-dark.webp"
```

`cover.toml` 默认已开启自动封面，普通用户只需选图源：

```toml
seeded_style = "mwm-anime"
```

图源选择器默认不显示。需要允许访客在页面顶部选择自动封面图源时，再显式开启：

```toml
[source_switch]
enabled = true
```

内置图源有 `picsum`、`cataas`、`mwm-anime`、`mwm-scenery`、`paugram-anime`、`dmoe-anime`、`loremflickr` 和 `paugram-bing`。默认仍使用 `mwm-anime`。详情页封面可进一步配置 `[detail].display_mode = "image" | "header-background" | "page-background"`。

## 评论

选择 `provider` 即表示启用，无需再写一个 `enabled = true`：

```toml
provider = "giscus"

[giscus]
repo = "owner/repo"
repo_id = "R_xxx"
category = "Announcements"
category_id = "DIC_xxx"
```

giscus 上面四项都是必填值。使用 utterances 时最少填写：

```toml
provider = "utterances"

[utterances]
repo = "owner/repo"
```

需要临时关闭评论时才添加 `enabled = false`。

## 统计

`optional/analytics.toml` 一次只选一个服务：

```toml
provider = "umami"

[umami]
website_id = "your-website-id"
```

其他服务的最小配置：

```toml
provider = "google_analytics"

[google_analytics]
measurement_id = "G-XXXXXXXXXX"
```

```toml
provider = "clarity"

[clarity]
project_id = "your-project-id"
```

Plausible 使用 `provider = "plausible"` 和 `[plausible].domain`。可选的 `respect_dnt = true` 会尊重 Do Not Track，`track_localhost = true` 允许本地开发环境上报。

## 留言板

`optional/guestbook.toml` 的一个开关同时控制页面和默认菜单：

```toml
enabled = true
title = "欢迎留言"
description = "留下你想说的话。"
guidelines = ["请保持友好", "不要发布广告"]
```

留言默认继承 `comment.toml`。需要独立映射时再添加 `[comment]` 和 `[comment.giscus]`。页面标题、路径或菜单可见性可通过高级 `[page]` 覆盖。

## 赞助

`optional/sponsor.toml`：

```toml
enabled = true
show = ["articles", "page"]
title = "支持作者"
description = "如果内容对你有帮助，欢迎支持继续更新。"
```

- `show = ["articles"]`：只显示在文章底部。
- `show = ["page"]`：只生成独立赞助页和菜单。
- `show = ["articles", "page"]`：两处都显示。

赞助方式使用 `[[methods]]`，赞助者使用 `[[supporters]]`。当 `show` 包含 `page` 时，页面会自动注册。

## 其他可选功能

### 公告

`optional/announcement.toml` 填好 `title`、`content` 后把 `enabled` 改为 `true`。`id` 只在需要让用户看到已经关闭过的新公告时修改。

### 许可协议

`optional/license.toml` 填写 `name` 和 `url` 即启用：

```toml
name = "CC BY-NC-SA 4.0"
url = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
```

### 字体

`optional/font.toml` 最简单的用法：

```toml
enabled = true
preset = "sans" # system / sans / serif / mono
```

自定义字体栈、`[[faces]]` 和 preload 属于高级配置；建议将字体文件放在 `public/fonts/`。

### Markdown

Callout 默认开启。图表或数学公式用到时再改开关：

```toml
[mermaid]
enabled = true

[math]
enabled = true
```

### 代码块

代码块增强默认开启。`optional/code_block.toml` 只需写与默认值不同的覆盖：

```toml
[languages.bash]
show_line_numbers = false
wrap_long_lines = true

[languages.diff]
show_copy_button = false
show_line_numbers = false
```

## 旧配置兼容

旧项目可以继续使用：

- 统计的顶层 `enabled = true` 加 provider 子开关。
- 赞助的 `show_on_articles` 和 `page_enabled`。
- `site.toml` 中手动注册的 `guestbook` 和 `sponsor` 页面。

新配置建议使用本文的单入口写法，避免同一功能在多个文件重复开关。

## 文章 Frontmatter

```yaml
---
title: 示例文章
date: 2026-05-01
updated: 2026-05-10
description: 一段摘要
category: CSS
tags:
  - Tailwind
  - 前端
cover: images/demo-cover.webp
cover_display_mode: page-background
sticky: false
featured: false
---
```

`sticky`、`featured`、`home_hidden` 和 `weight` 用于首页筛选与排序。单篇文章还可以覆盖 `license`、`cover_display_mode` 等默认配置。

## 构建命令

```bash
pnpm dev
pnpm build:config
pnpm build:content-index
pnpm build
pnpm build:lib
pnpm check
```

`pnpm build` 输出站点到 `dist/`，`pnpm build:lib` 输出组件库到 `dist-lib/`。
