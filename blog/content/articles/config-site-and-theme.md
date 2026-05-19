---
title: 站点基础与外观配置指南
description: 说明 blog/config 根目录下的基础配置文件和常用字段。
date: 2026-05-13
category: 配置
cover_display_mode: page-background
sticky: true
weight: 300
tags:
  - 配置
  - 站点
  - 外观
---

Filling 的配置分成两层：

- `blog/config/`：日常最常改的基础配置
- `blog/config/optional/`：低频或高级细节配置

同一个配置只保留一份，不要同时创建 `cover.toml` 和 `optional/cover.toml` 这类同名文件。

## 配置文件位置

- 站点配置：`blog/config/`
- 可选配置：`blog/config/optional/`
- 文章目录：`blog/content/articles/`
- 静态资源：`public/`

配置里的本地资源路径相对于 `public/`，不要写 `public/` 前缀。

示例：

- `icons/points.png`
- `themes/default.css`
- `backgrounds/site-light.webp`

## 基础配置文件

根目录保留这些常用配置：

- `site.toml`：站点信息、SEO、页眉、侧边栏、页面、首页文章和页脚
- `profile.toml`：侧边栏个人资料卡
- `theme.toml`：主题预设
- `background.toml`：站点背景
- `cover.toml`：封面回退、图源切换和详情页背景
- `comment.toml`：评论系统
- `links.toml`：友情链接

## `site.toml`

`site.toml` 是站点总入口。普通使用只需要关注下面几类。

### 站点信息

```toml
title = "Filling"
subtitle = "内容系统与博客框架"
description = "一个基于 Vue 3 的静态博客与内容系统。"
site_url = "https://filling.initzo.com"
```

- `title`：站点名称
- `subtitle`：站点副标题
- `description`：站点描述
- `site_url`：生产环境站点根地址

### SEO

```toml
[seo]
lang = "zh-CN"
locale = "zh_CN"
robots = "index,follow"
og_image = "icons/points.png"
twitter_image = "icons/points.png"
```

- `lang`：页面语言
- `locale`：Open Graph locale
- `robots`：搜索引擎抓取策略
- `og_image`：默认 Open Graph 分享图
- `twitter_image`：默认 Twitter 分享图

### 页眉

```toml
[header.leading_visual]
visible = true
type = "dots"
title = "Filling"
title_size = "18"

[header.navbar]
show_title = false
```

- `visible`：是否显示左上角视觉元素
- `type`：视觉类型，常用 `dots` 或 `image`
- `title`：页眉品牌文字
- `show_title`：是否额外显示站点标题

### 侧边栏和文章页

```toml
[features]
sidebar_position = "right"
show_sidebar_on_articles = false
show_profile_in_sidebar = true

[sidebar]
desktop_components = ["profile", "announcement", "search", "categories", "tags", "latest-articles"]
```

- `sidebar_position`：侧边栏位置，可选 `left`、`right`、`hidden`
- `show_sidebar_on_articles`：文章详情页是否显示侧边栏
- `show_profile_in_sidebar`：侧边栏是否显示个人资料卡
- `desktop_components`：桌面端侧边栏模块顺序

### 首页文章

```toml
[home_articles]
mode = "latest"
page_size = 8
paginate = true
include_sticky = true
sticky_first = true
```

- `mode = "latest"`：首页显示最新文章
- `mode = "featured"`：只显示 `featured = true` 的文章
- `mode = "sticky"`：只显示 `sticky = true` 的文章
- `mode = "mixed"`：混合置顶、精选和指定文章
- `page_size`：首页每页数量
- `paginate`：是否启用首页分页
- `sticky_first`：置顶和权重是否优先排序

### 页面注册

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"

[[menus.pages]]
key = "friends"
title = "友链"
component = "friends"
```

- `key`：页面唯一标识
- `title`：页面标题
- `description`：页面说明
- `component`：页面组件
- `file`：单文件页面来源
- `folder`：目录型页面来源
- `visible = false`：保留页面路由，但不显示在默认导航里
- `enabled = false`：关闭页面路由和静态生成

常用组件：

- `context`：渲染单个 Markdown 文件
- `list`：目录内容列表
- `card`：目录内容卡片
- `grid`：目录内容网格
- `timeline`：目录内容时间线
- `friends`：友链页
- `guestbook`：留言板页
- `sponsor`：赞助页

### 页脚

```toml
[footer]
text = "版权所有 © Filling"
note = "基于 Vue3 + Pinia + Tailwind CSS 构建"
```

- `text`：页脚主文案
- `note`：页脚备注

## `profile.toml`

控制侧边栏个人资料卡。

```toml
display_name = "Filling"
username = "prosperousEnding"
tagline = "记录前端工程化、静态博客和内容系统。"
avatar_url = "icons/points.png"
bio = "专注于前端工程化、静态博客和内容系统。"
location = "Hangzhou, China"
website = "https://filling.initzo.com"

[[social_links]]
name = "GitHub"
url = "https://github.com/ProsperousEnding/Filling"
icon = "GH"
show_name = true
weight = 100
```

- `avatar_url` 可以是完整 URL，也可以是 `public/` 下的相对路径。
- `weight` 数值越大，社交链接越靠前。

## `theme.toml`

控制当前主题。

```toml
current_preset = "default"

[presets.default]
css_file = "themes/default.css"
js_file = "themes/default.js"
```

- `current_preset`：当前主题名
- `css_file`：主题 CSS，路径相对于 `public/`
- `js_file`：主题 JS，路径相对于 `public/`

## `background.toml`

控制站点背景。

```toml
enabled = true
mode = "gradient"
```

使用图片背景时：

```toml
enabled = true
mode = "image"
image = "backgrounds/site-light.webp"
dark_image = "backgrounds/site-dark.webp"
```

## `cover.toml`

控制文章封面回退和详情页封面行为。

```toml
enabled = true
fallback = "seeded"
seeded_style = "mwm-anime"

[source_switch]
enabled = true
sources = ["picsum", "cataas", "mwm-anime", "mwm-scenery", "xjh-acg", "bing-rand"]

[detail]
display_mode = "image"

[detail.page_background]
content_style = "transparent"
```

- `fallback = "seeded"`：文章没有封面时自动生成外部封面
- `seeded_style`：默认图源
- `source_switch.enabled`：是否显示图源切换按钮
- `detail.display_mode`：详情页封面模式
- `detail.page_background.content_style`：`page-background` 模式下正文样式，可选 `transparent` 或 `glass`

详情页封面模式：

- `image`：封面作为独立图片
- `header-background`：封面作为文章头部背景
- `page-background`：封面作为整篇文章固定背景

支持的图源：

- `picsum`
- `cataas`
- `mwm-anime`
- `mwm-scenery`
- `xjh-acg`
- `bing-rand`

## 可选配置

低频配置在 `blog/config/optional/`：

- `analytics.toml`：统计脚本
- `announcement.toml`：站点公告
- `code_block.toml`：代码块增强
- `font.toml`：字体配置
- `guestbook.toml`：留言板
- `license.toml`：默认协议
- `markdown.toml`：Markdown 增强
- `sponsor.toml`：赞助区和赞助页
