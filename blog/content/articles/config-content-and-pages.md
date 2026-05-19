---
title: 内容页面与写作指南
description: 说明文章 frontmatter、内容目录、页面组件和友情链接配置。
date: 2026-05-13
category: 配置
cover_display_mode: page-background
sticky: true
weight: 200
tags:
  - 配置
  - 页面
  - 内容
---

Filling 的内容统一放在 `blog/content/`。文章、单页和自定义目录都用 Markdown 编写。

## 内容目录

常用目录：

- `blog/content/articles/`：文章目录
- `blog/content/about.md`：关于页面
- `blog/content/<folder>/`：自定义内容目录，例如 `projects`

文章目录会参与：

- 首页文章流
- 文章列表
- 分类页
- 标签页
- 归档页
- 搜索索引

## 文章 frontmatter

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

- `title`：文章标题
- `date`：发布时间
- `updated`：更新时间
- `description`：文章摘要
- `category`：文章分类
- `tags`：标签数组
- `cover`：封面图
- `cover_display_mode`：单篇文章详情页封面模式
- `sticky`：是否置顶
- `featured`：是否精选
- `home_hidden`：是否从首页隐藏
- `weight`：排序权重，数值越大越靠前

`cover_display_mode` 可选值：

- `image`：详情页显示独立封面图
- `header-background`：封面作为文章头部背景
- `page-background`：封面作为整篇文章背景

## 首页文章逻辑

首页文章由 `site.toml` 的 `[home_articles]` 控制。

```toml
[home_articles]
mode = "latest"
page_size = 8
paginate = true
include_sticky = true
sticky_first = true
```

- `latest`：显示最新文章
- `featured`：只显示 `featured = true` 的文章
- `sticky`：只显示 `sticky = true` 的文章
- `mixed`：混合置顶、精选和指定文章

`/articles` 是全部文章页，不受首页筛选逻辑影响。

## 页面组件

页面在 `site.toml` 的 `[[menus.pages]]` 中注册。

单页：

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

目录页：

```toml
[[menus.pages]]
key = "projects"
title = "项目"
component = "grid"
folder = "projects"
```

内置页：

```toml
[[menus.pages]]
key = "archive"
component = "timeline"
```

常用组件：

- `context`：渲染单个 Markdown 文件
- `list`：目录内容列表
- `card`：目录内容卡片
- `grid`：目录内容网格
- `timeline`：目录内容时间线
- `friends`：友情链接页
- `guestbook`：留言板页
- `sponsor`：赞助页

页面开关：

- `visible = false`：页面可访问，但不显示在默认导航
- `enabled = false`：关闭页面路由和静态生成

## 友情链接

友链数据写在 `blog/config/links.toml`。

```toml
[[friend_links]]
name = "Vue.js"
url = "https://vuejs.org/"
description = "The Progressive JavaScript Framework"
tags = ["Vue", "Framework"]
```

字段：

- `name`：站点名称
- `url`：站点地址
- `description`：简介
- `avatar_url`：头像或 Logo
- `tags`：标签
- `location`：所属领域
- `note`：补充说明
- `weight`：排序权重
- `enabled = false`：隐藏该友链

启用友链页：

```toml
[[menus.pages]]
key = "friends"
title = "友链"
component = "friends"
```

## 可选互动配置

这些配置在 `blog/config/optional/`：

- `announcement.toml`：站点公告
- `guestbook.toml`：留言板说明和独立评论映射
- `sponsor.toml`：赞助区和赞助页
- `license.toml`：默认文章协议

### 公告

`optional/announcement.toml` 控制全站公告条。

常用字段：

- `enabled`：是否启用
- `title`：公告标题
- `content`：公告正文
- `link_text`：按钮文案
- `link_url`：按钮地址
- `dismissible`：是否允许关闭

### 留言板

留言板页面通过 `site.toml` 注册：

```toml
[[menus.pages]]
key = "guestbook"
title = "留言板"
component = "guestbook"
```

`optional/guestbook.toml` 控制留言板说明、规则、模板和留言板独立评论映射。

### 赞助页

赞助页通过 `site.toml` 注册：

```toml
[[menus.pages]]
key = "sponsor"
title = "赞助"
component = "sponsor"
visible = false
```

`optional/sponsor.toml` 控制赞助区文案、赞助方式和赞助者列表。

## 默认协议

`optional/license.toml` 控制文章默认协议。

单篇文章可覆盖：

```yaml
license:
  name: CC BY-NC-SA 4.0
  url: https://creativecommons.org/licenses/by-nc-sa/4.0/
```

单篇文章禁用默认协议：

```yaml
license: false
```
