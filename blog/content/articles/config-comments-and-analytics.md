---
title: 评论与统计接入指南
description: 说明 comment.toml 和 analytics.toml 的字段、启用条件和配置完成条件。
date: 2026-05-13
category: 配置
cover_display_mode: page-background
tags:
  - 配置
  - 评论
  - 统计
---

## `comment.toml`

控制评论系统。

顶层字段：

- `enabled`：是否启用评论区
- `provider`：评论提供商
- `title`：评论区标题
- `description`：标题下说明
- `not_ready_text`：配置不完整时的提示文案

当前支持的 provider：

- `giscus`：基于 GitHub Discussions
- `utterances`：基于 GitHub Issues

## `giscus`

字段：

- `repo`：仓库名
- `repo_id`：仓库 ID
- `category`：Discussion 分类名
- `category_id`：Discussion 分类 ID
- `mapping`：页面映射方式
- `term`：固定话题标识
- `strict`：是否严格匹配
- `reactions_enabled`：是否启用 reactions
- `emit_metadata`：是否同步 discussion 元数据
- `input_position`：输入框位置
- `lang`：评论区语言
- `loading`：加载策略
- `theme`：亮色主题
- `dark_theme`：暗色主题

### 配置完成条件

必须同时满足：

- `repo`
- `repo_id`
- `category`
- `category_id`

当 `mapping = "specific"` 时，还必须有：

- `term`

### `mapping` 可选值

- `pathname`：按路径映射
- `url`：按完整 URL 映射
- `title`：按标题映射
- `og:title`：按 OG 标题映射
- `specific`：固定映射到指定 term

### `input_position` 可选值

- `top`：输入框在顶部
- `bottom`：输入框在底部

### `loading` 可选值

- `lazy`：懒加载
- `eager`：立即加载

### 留言板独立映射

留言板默认继承 `comment.toml`。如果希望留言板固定到一个独立 Discussion，在 `guestbook.toml` 里配置：

```toml
[comment]
enabled = true
title = "开始留言"
description = "这里的评论会单独归到留言板。"
provider = "giscus"

[comment.giscus]
mapping = "specific"
term = "guestbook"
```

`repo`、`repo_id`、`category`、`category_id` 不写时继承 `comment.toml`。

示例：

```toml
enabled = true
provider = "giscus"
title = "评论"
description = "欢迎通过 GitHub Discussions 留下你的看法。"

[giscus]
repo = "owner/repo"
repo_id = "R_xxx"
category = "Announcements"
category_id = "DIC_xxx"
mapping = "pathname"
strict = false
reactions_enabled = true
emit_metadata = false
input_position = "bottom"
lang = "zh-CN"
loading = "lazy"
theme = "light"
dark_theme = "dark_dimmed"
```

## `utterances`

字段：

- `repo`：仓库名
- `issue_term`：Issue 映射方式
- `issue_number`：固定 Issue 编号
- `label`：Issue 标签
- `theme`：亮色主题
- `dark_theme`：暗色主题
- `crossorigin`：跨域策略

### 配置完成条件

必须满足：

- `repo`
- `issue_term` 或 `issue_number` 二选一

### `crossorigin` 可选值

- `anonymous`：匿名跨域
- `use-credentials`：带凭证跨域

示例：

```toml
enabled = true
provider = "utterances"
title = "评论"
description = "欢迎通过 GitHub Issues 留下你的看法。"

[utterances]
repo = "owner/repo"
issue_term = "pathname"
label = "comment"
theme = "github-light"
dark_theme = "github-dark"
crossorigin = "anonymous"
```

## `analytics.toml`

控制统计脚本。

顶层字段：

- `enabled`：是否启用统计
- `respect_dnt`：是否尊重浏览器 DNT
- `track_localhost`：本地环境是否加载

当前支持：

- `umami`：Umami 统计
- `plausible`：Plausible 统计
- `google_analytics`：GA4 统计
- `clarity`：Microsoft Clarity

统计启用需要同时满足：

1. 顶层 `enabled = true`
2. 对应 provider 的 `enabled = true`
3. provider 的必填字段完整

## `umami`

字段：

- `enabled`：是否启用 Umami
- `script_url`：脚本地址
- `website_id`：站点 ID
- `host_url`：自托管地址
- `domains`：限制域名列表
- `auto_track`：是否自动采集
- `do_not_track`：是否向脚本传递 DNT
- `exclude_search`：是否忽略查询参数
- `exclude_hash`：是否忽略 hash
- `performance`：是否采集性能数据
- `tag`：自定义标记

### 配置完成条件

必须同时满足：

- 顶层 `enabled = true`
- `[umami].enabled = true`
- `script_url`
- `website_id`

示例：

```toml
enabled = true
respect_dnt = true

[umami]
enabled = true
script_url = "https://cloud.umami.is/script.js"
website_id = "your-website-id"
auto_track = true
do_not_track = true
```

## `plausible`

字段：

- `enabled`：是否启用 Plausible
- `script_url`：脚本地址
- `domain`：站点域名
- `endpoint`：自定义事件端点
- `auto_capture_pageviews`：是否自动统计浏览量
- `capture_on_localhost`：本地环境是否统计
- `hash_based_routing`：是否按 hash 路由统计
- `outbound_links`：是否统计外链点击
- `file_downloads`：是否统计文件下载
- `tagged_events`：是否启用事件标签

### 配置完成条件

必须同时满足：

- 顶层 `enabled = true`
- `[plausible].enabled = true`
- `script_url`

示例：

```toml
enabled = true

[plausible]
enabled = true
script_url = "https://plausible.io/js/script.js"
domain = "blog.example.com"
auto_capture_pageviews = true
outbound_links = true
file_downloads = true
```

## `google_analytics`

字段：

- `enabled`：是否启用 GA4
- `measurement_id`：测量 ID
- `manual_pageviews`：是否手动发送 page view
- `debug_mode`：是否启用调试模式

### 配置完成条件

必须同时满足：

- 顶层 `enabled = true`
- `[google_analytics].enabled = true`
- `measurement_id`

示例：

```toml
enabled = true

[google_analytics]
enabled = true
measurement_id = "G-XXXXXXXXXX"
manual_pageviews = true
debug_mode = false
```

## `clarity`

字段：

- `enabled`：是否启用 Clarity
- `project_id`：项目 ID

### 配置完成条件

必须同时满足：

- 顶层 `enabled = true`
- `[clarity].enabled = true`
- `project_id`

示例：

```toml
enabled = true

[clarity]
enabled = true
project_id = "your-project-id"
```
