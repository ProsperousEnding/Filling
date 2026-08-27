# 配置目录

这里存放当前站点的 TOML 配置。构建脚本会递归读取 `blog/config/`，再由框架补齐未填写的默认值，因此配置文件只需要保留站点确实要覆盖的内容。

完整字段、枚举值和示例见 [配置参考](../../docs/configuration.md)，项目安装与部署见 [根目录 README](../../README.md)。

## 配置原则

- 只写需要修改的值，空字符串、空数组和重复的默认值通常无需保留。
- 同名配置只能存在一份，不要同时创建 `cover.toml` 和 `optional/cover.toml`。
- 受管理的配置文件应当保留。即使功能暂未启用，线上管理后台和 Worker 发布链仍会按固定白名单读取这些文件。
- `public/` 内资源填写相对路径，例如 `icons/points.png`，不要写成 `public/icons/points.png`。
- 不要在 TOML 中保存 GitHub App 私钥、OAuth Secret、Worker Token 等服务端密钥。

## 文件职责

| 文件 | 负责内容 |
| --- | --- |
| `site.toml` | 站点名称、SEO、页头、首页文章、菜单、侧边栏、页脚和分页 |
| `profile.toml` | 侧边栏资料、头像、网站和社交链接 |
| `links.toml` | 友情链接数据 |
| `theme.toml` | 当前主题、页面背景和主题资源预设 |
| `cover.toml` | 自动封面图源、列表封面和文章详情封面 |
| `comment.toml` | giscus 或 utterances 评论服务 |

建议先完成 `site.toml` 和 `profile.toml`，再按需调整外观、评论和友情链接。

## 文章封面

`cover.toml` 是站点封面的唯一配置入口。所有访客统一使用 `seeded_style` 指定的自动封面图源，不存在浏览器本地覆盖：

```toml
enabled = true
fallback = "seeded"
seeded_style = "mwm-anime"
fixed = false
```

默认的随机模式会在每次访问时打乱 `source_urls` 图片池，并尽量避免同页文章使用重复封面。需要让每篇文章长期使用同一张封面时，在配置后台打开“固定文章封面”，或将 `fixed` 改为 `true`：

```toml
fixed = true

[source_urls]
mwm-anime = [
  "https://images.example.com/anime-cover-1.webp",
  "https://images.example.com/anime-cover-2.webp",
]
```

当前内置图源包括：

- `mwm-anime`、`paugram-anime`、`dmoe-anime`：二次元随机接口，可按需切换到固定模式。
- `mwm-scenery`、`paugram-bing`：摄影或风景随机接口，也支持固定模式。
- `picsum`、`loremflickr`：原生支持稳定 seed 的摄影图源。
- `cataas`：猫咪图片。

`source_urls` 的值既可以是一个 URL 模板，也可以是 URL 数组。随机模式按访问打乱数组，固定模式按文章 seed 稳定选择；没有配置图片池时才直接使用对应远程图源。这个开关是全站配置，不使用访客的浏览器本地状态。当前站点的 MWM 图片池见 [`cover.toml`](./cover.toml)。`image_proxy_url` 是可选的图片优化服务地址，只应在对应服务已经部署可用后填写。

单篇文章仍可通过 frontmatter 的 `cover` 指定图片，或通过 `cover_display_mode` 选择 `image`、`header-background`、`page-background`。

## 可选配置

`optional/` 中的文件属于低频或按需功能。通过对应字段启用，不要通过删除文件来关闭功能。

| 文件 | 启用方式 |
| --- | --- |
| `analytics.toml` | 取消注释并设置一个 `provider`，再填写该服务的公开项目标识 |
| `announcement.toml` | 设置 `enabled = true`，并填写公告标题与内容 |
| `code_block.toml` | `enabled = true`；可设置全局行为和 `[languages.*]` 语言覆盖 |
| `font.toml` | 设置 `enabled = true` 并选择 `system`、`sans`、`serif` 或 `mono` |
| `guestbook.toml` | 设置 `enabled = true`，自动注册留言板菜单和页面 |
| `license.toml` | 填写 `name` 与 `url`，作为文章默认许可协议 |
| `markdown.toml` | 分别控制 Callout、Mermaid 和 KaTeX |
| `sponsor.toml` | 设置 `enabled = true`，用 `show` 选择文章区或独立页面 |

关闭可选功能时保留配置内容，恢复启用时无需重新填写。例如：

```toml
enabled = false
```

统计配置是例外：选择有效的 `provider` 即表示启用；需要关闭时删除或注释 `provider`。

## 页面与菜单

内置的首页、文章、分类、标签、归档和搜索无需重复注册。自定义 Markdown 页面在 `site.toml` 中添加：

```toml
[[menus.pages]]
key = "about"
title = "关于"
component = "context"
file = "about.md"
```

`file` 和 `folder` 都相对于 `blog/content/`。启用且可见的页面会自动进入桌面和移动端导航。

## 修改后检查

只检查配置：

```bash
pnpm build:config
```

同时重新生成文章和搜索索引：

```bash
pnpm build:content-index
```

发布前完整验证：

```bash
pnpm check
```

配置校验会检查 TOML 语法、未知字段、无效枚举、缺失凭据、非法路径和页面路由冲突。出现 warning 时也应核对字段是否已经废弃，而不是默认忽略。
