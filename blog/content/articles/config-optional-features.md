---
title: 公告、字体、赞助与许可配置
description: 配置 Filling 的低频功能，并理解每个功能真正的启用条件与页面注册方式。
date: 2026-08-21
updated: 2026-08-28
category: 配置
cover_display_mode: page-background
weight: 80
tags:
  - 配置
  - 功能
  - 外观
---

Filling 将低频功能集中在 `blog/config/optional/`。这些文件属于受管理配置，即使暂时关闭也应保留，线上配置后台会按固定白名单读取它们。

不同功能的启用方式并不完全相同：公告、字体、留言板和赞助使用 `enabled`，许可协议通过有效的名称与链接生效，统计则通过一个有效的 `provider` 生效。

当前仓库已启用 `font.toml`、`guestbook.toml` 和默认许可协议；公告与赞助保持关闭，统计尚未选择 provider，Markdown 只启用了 Callout。需要调整时修改对应文件即可，不要通过删除文件来关闭功能。

## 全站公告

`optional/announcement.toml` 控制页头下方的公告栏：

```toml
enabled = true
id = "release-2026-08"
title = "站点配置已经更新"
content = "新的封面和菜单配置已经上线。"
link_text = "查看说明"
link_url = "/article/config-site-and-theme/"
dismissible = true
variant = "info"
```

`variant` 支持 `info`、`success` 和 `warning`。用户关闭公告后，浏览器会记住当前 `id`；发布新公告时修改 `id`，公告才会再次出现。

`link_url` 可以是以 `/` 开头的站内路径，也可以是明确的 `https://`、`mailto:` 或 `tel:` 地址。

## 字体预设

`optional/font.toml` 最简单的配置只有两项：

```toml
enabled = true
preset = "sans"
```

内置预设包括：

- `system`：跟随操作系统界面字体。
- `sans`：适合正文和常规界面。
- `serif`：更偏向长文阅读。
- `mono`：全站使用等宽字体，通常只适合特殊站点。

需要自托管字体时，将文件放入 `public/fonts/`，再配置字体栈、`[[faces]]` 和预加载。普通站点优先使用预设，可以减少字体下载和首屏布局变化。

## 默认许可协议

`optional/license.toml` 不需要额外开关。填写名称和链接后，它会成为文章的默认协议：

```toml
name = "CC BY-NC-SA 4.0"
url = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
```

单篇文章可以在 frontmatter 中覆盖：

```yaml
license:
  name: CC BY 4.0
  url: https://creativecommons.org/licenses/by/4.0/
```

不希望某篇文章显示协议时使用：

```yaml
license: false
```

## 赞助功能

`optional/sponsor.toml` 用一个开关控制功能，用 `show` 决定显示位置：

```toml
enabled = true
show = ["articles", "page"]

title = "支持作者"
description = "如果内容对你有帮助，欢迎支持继续更新。"
page_title = "支持本站持续更新"
page_description = "感谢你对内容维护的支持。"
```

`show` 的组合含义：

- `["articles"]`：只显示在文章底部。
- `["page"]`：只创建独立赞助页与菜单。
- `["articles", "page"]`：两处同时显示。

当 `show` 包含 `page` 时，赞助页会自动注册，不要再在 `site.toml` 添加同名页面。

支付方式使用 `[[methods]]`：

```toml
[[methods]]
name = "微信赞赏"
account_name = "微信扫码"
image_url = "images/sponsor/wechat-pay.png"
note = "感谢支持"
weight = 100
```

图片对应 `public/images/sponsor/wechat-pay.png`。赞助者列表使用 `[[supporters]]`，可以填写名称、档位、日期、头像和个人主页。

## 留言板的边界

留言板也位于 `optional/`，但它同时依赖全站评论配置：

```toml
enabled = true
title = "欢迎留下你的来访足迹"
description = "简单介绍自己，或者留下一句想说的话。"
```

启用后会自动生成留言板页面与菜单，评论仓库和分类默认继承 `comment.toml`。只有需要独立 Discussion 时，才在留言板配置中覆盖 `[comment.giscus]`。

## 修改后检查

```bash
pnpm build:config
pnpm build:content-index
```

如果启用了独立页面，第二条命令会同步更新静态路由和搜索索引。发布前运行 `pnpm check` 可以完成整套验证。
