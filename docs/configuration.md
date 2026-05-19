# 配置说明

Filling 的用户配置位于 `blog/config`。

当前配置按使用频率分层：

- `blog/config/`：基础配置，普通用户日常主要修改这里。
- `blog/config/optional/`：可选细节配置，用到对应能力时再改。

同一个配置只保留一份。不要同时创建 `cover.toml` 和 `optional/cover.toml` 这类同名配置。

## 通用约定

- 内容文件放在 `blog/content`。
- 文章放在 `blog/content/articles`。
- 本地静态资源放在 `public`。
- 配置里的本地资源路径相对于 `public`，不要写 `public/` 前缀。
- 修改配置后，开发环境会热更新；生产环境需要重新构建。

示例资源路径：

```text
icons/points.png
themes/default.css
backgrounds/site-light.webp
fonts/jetbrains-mono.woff2
```

## 基础配置

### `site.toml`

站点总配置，控制站点信息、SEO、页眉、侧边栏、分页、首页文章、页面注册和页脚。

常用字段：

- `title`：站点名称
- `subtitle`：站点副标题
- `description`：站点描述
- `site_url`：生产环境站点根地址
- `[seo]`：默认 SEO 信息
- `[header.leading_visual]`：页眉品牌视觉区
- `[header.navbar]`：顶部导航显示开关
- `[features]`：站点级功能开关
- `[sidebar]`：侧边栏模块顺序
- `[pagination]`：分页数量
- `[home_articles]`：首页文章流
- `[[menus.pages]]`：页面注册
- `[footer]`：页脚

示例：

```toml
title = "Filling"
subtitle = "内容系统与博客框架"
description = "一个基于 Vue 3 的静态博客与内容系统。"
site_url = "https://filling.initzo.com"

[features]
sidebar_position = "right"
show_sidebar_on_articles = false

[home_articles]
mode = "latest"
page_size = 8
paginate = true
```

### 首页文章

`[home_articles]` 只影响首页，不影响 `/articles` 全部文章页。

- `mode = "latest"`：最新文章
- `mode = "featured"`：只显示 `featured = true` 的文章
- `mode = "sticky"`：只显示 `sticky = true` 的文章
- `mode = "mixed"`：混合置顶、精选和指定文章
- `page_size`：首页每页数量
- `paginate`：是否分页
- `include_sticky`：是否允许置顶文章出现在首页
- `sticky_first`：是否让置顶和权重优先

### 页面注册

页面在 `[[menus.pages]]` 中注册。

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

- `context`：渲染单个 Markdown 文件，配 `file`
- `list`：目录内容列表，配 `folder`
- `card`：目录内容卡片，配 `folder`
- `grid`：目录内容网格，配 `folder`
- `timeline`：目录内容时间线，配 `folder`
- `friends`：友链页
- `guestbook`：留言板页
- `sponsor`：赞助页

页面开关：

- `visible = false`：页面可访问，但不显示在默认导航。
- `enabled = false`：关闭路由和静态生成。

### `profile.toml`

侧边栏个人资料卡。

常用字段：

- `display_name`：展示名
- `username`：用户名
- `tagline`：副标题
- `avatar_url`：头像
- `bio`：简介
- `location`：地区
- `website`：个人网站
- `[[social_links]]`：社交链接

### `theme.toml`

主题预设。

```toml
current_preset = "default"

[presets.default]
css_file = "themes/default.css"
js_file = "themes/default.js"
```

### `background.toml`

站点背景。

```toml
enabled = true
mode = "gradient"
```

图片背景：

```toml
enabled = true
mode = "image"
image = "backgrounds/site-light.webp"
dark_image = "backgrounds/site-dark.webp"
```

### `cover.toml`

文章封面和详情页封面。

常用字段：

- `enabled`：是否启用封面回退
- `fallback`：回退方式，可选 `none`、`seeded`、`image`
- `seeded_style`：默认自动封面图源
- `[source_switch].enabled`：是否显示图源切换按钮
- `[source_switch].sources`：允许切换的图源
- `[detail].display_mode`：详情页封面模式
- `[detail.page_background].content_style`：page background 正文样式

详情页封面模式：

- `image`
- `header-background`
- `page-background`

`content_style` 可选值：

- `transparent`：正文更透明，容器感弱
- `glass`：正文保留毛玻璃效果

### `comment.toml`

文章评论配置。

当前支持：

- `giscus`
- `utterances`

giscus 必填字段：

- `repo`
- `repo_id`
- `category`
- `category_id`

示例：

```toml
enabled = true
provider = "giscus"

[giscus]
repo = "owner/repo"
repo_id = "R_xxx"
category = "Announcements"
category_id = "DIC_xxx"
mapping = "pathname"
```

### `links.toml`

友情链接。

```toml
[[friend_links]]
name = "Vue.js"
url = "https://vuejs.org/"
description = "The Progressive JavaScript Framework"
tags = ["Vue", "Framework"]
```

常用字段：

- `name`
- `url`
- `description`
- `avatar_url`
- `tags`
- `location`
- `note`
- `weight`
- `enabled`

## 可选配置

可选配置位于 `blog/config/optional`。

### `analytics.toml`

统计脚本。

当前支持：

- `umami`
- `plausible`
- `google_analytics`
- `clarity`

启用条件：

- 顶层 `enabled = true`
- 对应 provider 的 `enabled = true`
- provider 必填字段完整

### `announcement.toml`

站点公告。

常用字段：

- `enabled`
- `id`
- `title`
- `content`
- `link_text`
- `link_url`
- `dismissible`
- `variant`

### `code_block.toml`

代码块增强。

常用能力：

- 语言标签
- 文件名
- 复制按钮
- 行号
- 长代码折叠
- diff 增删行标记
- 按语言覆盖配置

### `font.toml`

字体配置。

支持：

- 字体预设
- 正文字体、标题字体、等宽字体
- 暗色模式字体覆盖
- 本地 `@font-face`
- preload 策略

### `guestbook.toml`

留言板说明区和独立评论映射。

留言板页面需要在 `site.toml` 中注册：

```toml
[[menus.pages]]
key = "guestbook"
title = "留言板"
component = "guestbook"
```

### `license.toml`

默认文章协议。

单篇文章可以覆盖：

```yaml
license:
  name: CC BY-NC-SA 4.0
  url: https://creativecommons.org/licenses/by-nc-sa/4.0/
```

单篇文章可以禁用默认协议：

```yaml
license: false
```

### `markdown.toml`

Markdown 增强。

支持：

- GitHub 风格 callout
- Mermaid 图表
- KaTeX 数学公式

### `sponsor.toml`

赞助区和赞助页。

赞助页需要在 `site.toml` 中注册：

```toml
[[menus.pages]]
key = "sponsor"
title = "赞助"
component = "sponsor"
visible = false
```

## 文章 Frontmatter

常用写法：

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

常用字段：

- `title`
- `date`
- `updated`
- `description`
- `category`
- `tags`
- `cover`
- `cover_display_mode`
- `sticky`
- `featured`
- `home_hidden`
- `weight`

别名：

- `updated_at` / `lastmod` / `last_modified`
- `image` / `thumbnail`
- `coverDisplayMode`
- `pinned` / `pin` / `top`
- `highlight` / `recommended` / `recommend`
- `hide_home` / `hideHome` / `exclude_home` / `excludeHome`
- `order` / `priority`

## 构建命令

```bash
pnpm dev
pnpm build
pnpm build:content-index
pnpm build:lib
```
