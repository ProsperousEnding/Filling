---
title: 评论、统计与内容增强
description: 用单一 provider 配置评论和统计，并按需开启 Markdown 与代码块增强。
date: 2026-05-13
updated: 2026-08-21
category: 配置
cover_display_mode: page-background
weight: 100
tags:
  - 配置
  - 评论
  - 统计
---

评论是常用配置，放在 `blog/config/comment.toml`。统计、Markdown 和代码块增强位于 `blog/config/optional/`。这些配置文件可以保留，关闭功能时修改开关或移除 provider，不需要删除文件。

## 使用 giscus

选择 `provider` 即启用评论，不需要重复添加总开关：

```toml
provider = "giscus"
description = "欢迎通过 GitHub Discussions 留下你的看法。"

[giscus]
repo = "owner/repo"
repo_id = "R_xxx"
category = "Announcements"
category_id = "DIC_xxx"
input_position = "bottom"
```

`repo`、`repo_id`、`category` 和 `category_id` 都是 giscus 生成的公开标识，缺少任意一项都会导致评论区无法连接。需要临时关闭全站评论时添加 `enabled = false`。

默认使用页面路径映射 Discussion。需要让某个页面固定使用同一主题时：

```toml
[giscus]
mapping = "specific"
term = "guestbook"
```

## 使用 utterances

```toml
provider = "utterances"

[utterances]
repo = "owner/repo"
issue_term = "pathname"
```

`repo` 必填。通常保留 `issue_term = "pathname"`；只有需要固定绑定到某个 Issue 时才填写 `issue_number`。

## 留言板评论

留言板默认继承 `comment.toml`。需要独立 Discussion 时，在 `optional/guestbook.toml` 中只覆盖映射：

```toml
[comment.giscus]
mapping = "specific"
term = "guestbook"
```

仓库和分类信息会继续继承全站评论配置。

## 访问统计

`optional/analytics.toml` 一次选择一个服务：

```toml
provider = "umami"
respect_dnt = true

[umami]
website_id = "your-website-id"
```

其他可选值：

- `plausible`：填写 `[plausible].domain`。
- `google_analytics`：填写 `[google_analytics].measurement_id`。
- `clarity`：填写 `[clarity].project_id`。

选中 provider 后自动启用，不需要再维护子级开关。需要关闭统计时，删除或注释顶层 `provider`；不要同时选择多个服务。

## Markdown 增强

Callout 默认开启：

```markdown
> [!NOTE]
> 这是一条提示。
```

在 `optional/markdown.toml` 中按需开启 Mermaid 和 KaTeX：

```toml
[mermaid]
enabled = true

[math]
enabled = true
```

然后可在文章中使用 `mermaid` 代码块、`$E = mc^2$` 行内公式或 `$$...$$` 块级公式。

## 代码块增强

`optional/code_block.toml` 统一控制语言标签、文件名、复制按钮、行号、自动折叠与长行换行。全局行为写在顶层，特殊语言写在 `[languages.*]`：

```toml
enabled = true
show_copy_button = true
show_line_numbers = true
collapsible = true
collapse_threshold_lines = 18

[languages.bash]
show_line_numbers = false
wrap_long_lines = true
```

Markdown 代码块可通过 `title` 指定文件名：

````markdown
```js title="main.js"
console.log('hello')
```
````

## 修改后检查

```bash
pnpm build:config
```

该命令会指出 provider 拼写、缺失凭据和无效字段。文章内容有变化时再运行 `pnpm build:content-index`，发布前运行 `pnpm check`。
