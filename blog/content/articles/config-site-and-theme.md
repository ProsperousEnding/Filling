---
title: 站点基础与外观配置指南
description: 说明 site.toml、theme.toml、profile.toml、font.toml、background.toml 和 cover.toml 的作用与字段。
date: 2026-05-13
category: 配置
cover_display_mode: page-background
tags:
  - 配置
  - 站点
  - 外观
---

## 配置文件位置

- 站点配置目录：`blog/config/`
- 文章目录：`blog/content/articles/`
- 本地静态资源目录：`public/`

配置文件里的本地资源路径相对于 `public/`。  
例如：

- `themes/default.css`
- `fonts/jetbrains-mono.woff2`
- `backgrounds/site-light.webp`

## `site.toml`

`site.toml` 控制站点结构、导航、布局、路由、分页和页脚。

### 顶层字段

- `title`：站点名称
- `subtitle`：站点副标题
- `description`：站点描述
- `site_url`：站点根地址

示例：

```toml
title = "Filling"
subtitle = "内容系统与博客框架"
description = "记录前端、静态博客和内容系统。"
site_url = "https://example.com"
```

### `[seo]`

控制页面默认 SEO 信息。

字段：

- `lang`：页面语言
- `locale`：Open Graph locale
- `robots`：默认 robots 指令
- `theme_color`：浏览器主题色
- `author`：站点作者
- `site_start_date`：建站日期
- `timezone`：默认时区
- `keywords`：默认关键词
- `favicon`：站点图标
- `apple_touch_icon`：移动端收藏图标
- `mask_icon`：Safari 固定标签图标
- `mask_icon_color`：Safari 固定标签颜色
- `og_image`：Open Graph 默认分享图
- `twitter_image`：Twitter 默认分享图
- `[seo.share_image]`：分享图策略

示例：

```toml
[seo]
lang = "zh-CN"
locale = "zh_CN"
robots = "index,follow"
author = "站点作者"
site_start_date = "2026-01-01"
timezone = "Asia/Shanghai"
keywords = ["Vue 3", "静态博客", "前端"]
favicon = "icons/favicon.png"
apple_touch_icon = "icons/apple-touch-icon.png"
mask_icon = "icons/safari-pinned-tab.svg"
mask_icon_color = "#2563eb"
og_image = "images/share/default-cover.png"
twitter_image = "images/share/twitter-card.png"
```

### `[seo.share_image]`

控制 `og:image` 和 `twitter:image`。

字段：

- `enabled`：是否输出分享图
- `prefer_page_image`：是否优先使用文章或页面封面
- `fallback`：无封面时的回退方式，可选 `site`、`seeded`、`none`
- `default_image`：站点默认分享图
- `twitter_image`：Twitter 专用分享图
- `twitter_card`：Twitter 卡片类型
- `seeded_width`：seeded 图宽度
- `seeded_height`：seeded 图高度
- `seeded_format`：seeded 图格式

优先级：

- 文章或页面 `cover` / `image` / `thumbnail`
- `default_image`
- `[seo].og_image`
- `fallback = "seeded"` 生成的图

示例：

```toml
[seo.share_image]
enabled = true
prefer_page_image = true
fallback = "seeded"
twitter_card = "summary_large_image"
seeded_width = 1200
seeded_height = 630
seeded_format = "webp"
```

### `[header.leading_visual]`

控制左上角品牌视觉区。

字段：

- `visible`：是否显示视觉区
- `type`：视觉类型，可选 `dots` 或 `image`
- `title`：品牌标题
- `title_size`：品牌字号

当 `type = "dots"` 时使用：

- `[header.leading_visual.dots].colors`：圆点颜色数组

当 `type = "image"` 时使用：

- `src`：图片路径
- `alt`：图片说明
- `width`：图片宽度
- `height`：图片高度

### `[header.navbar]`

控制顶部导航行为。

字段：

- `sticky`：是否吸顶
- `blur`：是否启用模糊背景
- `show_brand`：是否显示品牌区
- `show_title`：是否显示站点标题
- `show_description`：是否显示站点描述
- `show_desktop_menu`：是否显示桌面菜单
- `show_mobile_menu`：是否启用移动端菜单面板
- `show_search`：是否显示搜索按钮
- `show_theme_toggle`：是否显示主题切换按钮
- `show_sidebar_toggle`：是否显示移动端侧边栏按钮
- `show_mobile_menu_toggle`：是否显示移动端菜单按钮

示例：

```toml
[header.navbar]
sticky = true
blur = true
show_description = false
show_search = true
show_theme_toggle = true
```

### `[features]`

控制站点级功能开关。

字段：

- `sidebar_position`：侧边栏位置，可选 `left`、`right`、`hidden`
- `sidebar_visible`：是否显示侧边栏
- `show_sidebar_on_articles`：是否在文章详情页显示侧边栏
- `show_category_count`：是否显示分类数量
- `show_tag_count`：是否显示标签数量
- `show_read_time`：是否显示阅读时长
- `show_outdated_notice`：是否显示过期提醒
- `outdated_threshold_days`：过期提醒阈值天数
- `show_profile_in_sidebar`：是否显示个人资料卡片

### `[sidebar]`

控制侧边栏组件顺序。

可选 component：

- `profile`：个人资料卡片
- `announcement`：公告卡片
- `search`：搜索框
- `categories`：分类模块
- `tags`：标签模块
- `latest-articles`：最新文章模块
- `friend-links`：友链模块
- `custom`：自定义 sidebar 菜单模块

字段：

- `desktop_components`：桌面端默认顺序
- `article_desktop_components`：文章页桌面端顺序
- `mobile_components`：移动端默认顺序
- `article_mobile_components`：文章页移动端顺序

示例：

```toml
[sidebar]
desktop_components = ["profile", "announcement", "search", "categories", "tags", "latest-articles"]
article_desktop_components = ["profile", "announcement", "categories", "latest-articles"]
mobile_components = ["profile", "search", "categories", "tags", "latest-articles"]
article_mobile_components = ["profile", "announcement", "search", "latest-articles"]
```

### `[page_layouts]`

控制内置页面布局。

支持页面：

- `home`
- `articles`
- `categories`
- `tags`
- `archive`

根级字段：

- `allow_switch`：是否允许切换布局
- `persist`：是否记住上次选择

页面级字段：

- `default`：默认布局
- `available`：可切换布局列表
- `allow_switch`：单页是否允许切换
- `columns`：常规屏列数
- `wide_columns`：宽屏列数

布局可选值：

- `list`：列表
- `card`：卡片
- `grid`：网格
- `timeline`：时间线

示例：

```toml
[page_layouts]
allow_switch = true
persist = true

[page_layouts.home]
available = ["list", "card", "grid"]
columns = 2
wide_columns = 3

[page_layouts.archive]
default = "timeline"
available = ["timeline", "grid", "list"]
```

### `[routing]`

控制内置页面路由。

字段：

- `articles`：文章列表路径
- `articles_page`：文章分页路径
- `article`：文章详情路径
- `categories`：分类列表路径
- `category`：分类详情路径
- `category_page`：分类分页路径
- `tags`：标签列表路径
- `tag`：标签详情路径
- `tag_page`：标签分页路径
- `archive`：归档页路径
- `archive_year`：按年归档路径
- `search`：搜索页路径

### `[pagination]`

字段：

- `page_size`：每页数量

## `[[menus.pages]]`

控制页面来源和页面组件。

字段：

- `key`：页面唯一标识
- `title`：页面标题
- `description`：页面说明
- `component`：页面组件类型
- `enabled`：是否注册页面路由
- `visible`：是否在默认 `blog-nav` 中显示
- `file`：单文件来源
- `folder`：目录来源

内置页面 key：

- `home`
- `articles`
- `categories`
- `tags`
- `archive`
- `search`

规则：

- `enabled = false`：不注册运行时路由，也不生成静态页面
- `visible = false`：保留路由，但默认导航不显示

`component` 可选值：

- `context`：渲染单个 Markdown 文件
- `list`：渲染目录列表
- `card`：渲染目录卡片
- `grid`：渲染目录网格
- `timeline`：渲染目录时间线
- `friends`：渲染友链页
- `guestbook`：渲染留言板页
- `sponsor`：渲染赞助页

示例：

```toml
[[menus.pages]]
key = "search"
title = "搜索"
enabled = true
visible = false
```

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

```toml
[[menus.pages]]
key = "projects"
title = "项目"
component = "grid"
folder = "projects"
```

```toml
[[menus.pages]]
key = "guestbook"
title = "留言板"
component = "guestbook"
```

```toml
[[menus.pages]]
key = "sponsor"
title = "赞助"
component = "sponsor"
```

## `[[menus.header]]` / `[[menus.mobile_header]]`

控制顶部菜单。

字段：

- `renderer`：菜单渲染器，如 `header-pill`、`header-stack`
- `source`：菜单数据源，如 `blog-nav`、`custom`
- `items`：菜单项列表

菜单项字段：

- `page`：引用页面 key
- `label`：菜单文字
- `target`：链接地址
- `icon`：前缀文本
- `description`：子项说明
- `children`：子菜单列表

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

[[menus.header.items]]
label = "GitHub"
target = "https://github.com/ProsperousEnding"
```

## `[[menus.sidebar]]`

控制侧边栏菜单模块。

字段：

- `renderer`：模块渲染器，如 `sidebar-link`、`sidebar-article`
- `source`：模块数据源，可选 `categories`、`tags`、`latest-articles`、`friend-links`、`custom`

## `profile.toml`

控制个人资料卡片。

字段：

- `display_name`：展示名称
- `username`：用户名
- `tagline`：副标题
- `bio`：简介
- `avatar_url`：头像地址
- `location`：地理位置
- `website`：个人网站

显示开关：

```toml
[display]
show_avatar = true
show_name = true
show_username = true
show_tagline = true
show_bio = true
show_location = true
show_website = true
show_social_links = true
```

社交链接通过 `[[social_links]]` 配置：

```toml
[[social_links]]
name = "GitHub"
url = "https://github.com/ProsperousEnding"
icon = "GH"
show_name = true
enabled = true
weight = 100
```

字段说明：

- `icon`：社交链接图标文本。
- `show_name`：是否显示链接名称。
- `enabled`：是否启用该链接。
- `weight`：排序权重，数字越大越靠前。

## `theme.toml`

控制主题资源文件。

字段：

- `current_preset`：当前启用的预设名
- `css_file`：兜底 CSS 文件
- `js_file`：兜底 JS 文件
- `[presets.xxx]`：主题预设定义

示例：

```toml
current_preset = "ocean"

[presets.ocean]
css_file = "themes/ocean.css"
js_file = "themes/ocean.js"
```

## `font.toml`

控制字体栈、字体预设和本地 `@font-face`。

### 顶层字段

- `enabled`：是否启用字体配置
- `preset`：当前字体预设名，内置值为 `system`、`sans`、`serif`、`mono`
- `current_preset`：`preset` 的别名
- `preload`：字体预加载策略，可选 `marked`、`all`、`none`
- `base_size`：根字号，纯数字按 `px` 处理

### `[families]`

字段：

- `sans`：正文字体栈
- `heading`：标题字体栈
- `serif`：衬线字体栈
- `mono`：等宽字体栈

### `[dark_families]`

字段和 `[families]` 一致，只用于暗色模式覆盖。只填需要变化的字段。

### `[presets.xxx]`

自定义字体预设。字段：

- `base_size`：当前预设的根字号
- `preload`：当前预设的预加载策略
- `[presets.xxx.families]`：当前预设的亮色字体栈
- `[presets.xxx.dark_families]`：当前预设的暗色字体栈覆盖
- `[[presets.xxx.faces]]`：当前预设携带的字体文件

### `[[faces]]`

字段：

- `family`：字体名称
- `src`：字体文件路径
- `weight`：字重
- `style`：字体样式
- `display`：字体显示策略
- `preload`：是否预加载

示例：

```toml
enabled = true
preset = "sans"
preload = "marked"
base_size = "16px"

[families]
sans = "\"PingFang SC\", \"Microsoft YaHei\", sans-serif"
heading = "\"PingFang SC\", \"Microsoft YaHei\", sans-serif"
mono = "\"JetBrains Mono\", monospace"

[dark_families]
heading = "\"PingFang SC\", \"Microsoft YaHei\", sans-serif"

[presets.reading]
base_size = "17px"

[presets.reading.families]
heading = "\"Noto Serif CJK SC\", \"Source Han Serif SC\", Georgia, serif"

[[faces]]
family = "JetBrains Mono"
src = "fonts/jetbrains-mono-regular.woff2"
weight = "400"
style = "normal"
display = "swap"
preload = true
```

## `background.toml`

控制站点背景层。

字段：

- `enabled`：是否启用背景层
- `mode`：背景模式，可选 `none`、`gradient`、`image`
- `gradient_light`：亮色渐变背景
- `gradient_dark`：暗色渐变背景
- `image`：亮色背景图
- `dark_image`：暗色背景图
- `overlay_light`：亮色叠加层
- `overlay_dark`：暗色叠加层
- `position`：背景位置
- `size`：背景尺寸
- `repeat`：背景重复方式
- `attachment`：背景附着方式
- `opacity`：整体透明度

示例：

```toml
enabled = true
mode = "image"
image = "backgrounds/site-light.webp"
dark_image = "backgrounds/site-dark.webp"
overlay_light = "linear-gradient(180deg, rgba(248, 250, 252, 0.62), rgba(255, 255, 255, 0.88))"
overlay_dark = "linear-gradient(180deg, rgba(2, 6, 23, 0.52), rgba(15, 23, 42, 0.84))"
opacity = 0.92
```

## `cover.toml`

控制文章封面回退策略、列表封面和详情页封面行为。

### 顶层字段

- `enabled`：是否启用封面回退
- `fallback`：回退方式，可选 `none`、`seeded`、`image`
- `fallback_image`：固定默认图
- `seeded_width`：seed 图宽度
- `seeded_height`：seed 图高度
- `seeded_format`：seed 图格式
- `seeded_style`：自动封面默认图源，可选 `picsum`、`cataas`、`mwm-anime`、`mwm-scenery`、`xjh-acg`、`bing-rand`

### 内置封面图源

- `picsum`：Picsum 随机照片
- `cataas`：Cataas 猫图
- `mwm-anime`：MWM 二次元随机图
- `mwm-scenery`：MWM 风景随机图
- `xjh-acg`：XJH ACG 随机图
- `bing-rand`：Bing 随机图

### `[source_switch]`

字段：

- `enabled`：是否在页头显示封面图源切换按钮
- `storage_key`：浏览器本地存储 key
- `sources`：按钮循环切换的图源列表

### `[source_switch.labels]`

字段：

- 每个 key 对应按钮显示文案

### `[detail]`

字段：

- `show_cover`：是否显示主封面
- `show_related_cover`：是否显示相关文章封面
- `display_mode`：详情页主封面显示方式，可选 `image`、`header-background`、`page-background`，其中 `page-background` 会把封面作为固定背景
- `loading`：加载策略
- `aspect_ratio`：封面比例
- `object_fit`：图片填充方式
- `placeholder`：无封面时的占位方式

### `[list]`

字段：

- `show_cover`：是否在列表和卡片中显示封面
- `loading`：加载策略
- `aspect_ratio`：列表封面比例
- `object_fit`：图片填充方式
- `placeholder`：无封面时的占位方式

### `[detail.watermark]`

字段：

- `enabled`：是否启用详情页封面水印
- `text`：水印文字
- `position`：位置，可选 `top-left`、`top-right`、`bottom-left`、`bottom-right`
- `opacity`：透明度，范围 `0-1`

### 封面加载顺序

1. frontmatter 的 `cover`
2. frontmatter 的 `image`
3. frontmatter 的 `thumbnail`
4. `cover.toml` 的回退策略

示例：

```toml
enabled = true
fallback = "seeded"
seeded_style = "picsum"

[source_switch]
enabled = true
storage_key = "vue-blog-cover-source"
sources = ["picsum", "cataas", "mwm-anime", "mwm-scenery", "xjh-acg", "bing-rand"]

[source_switch.labels]
picsum = "Picsum"
cataas = "Cataas"
mwm-anime = "MWM 二次元"
mwm-scenery = "MWM 风景"
xjh-acg = "XJH ACG"
bing-rand = "Bing 随机"

[list]
show_cover = true
loading = "lazy"
aspect_ratio = "16 / 9"
object_fit = "cover"
placeholder = "gradient"

[detail]
show_cover = true
show_related_cover = true
display_mode = "image"
loading = "eager"
object_fit = "cover"

[detail.watermark]
enabled = false
text = "Filling"
position = "bottom-right"
opacity = 0.72
```
