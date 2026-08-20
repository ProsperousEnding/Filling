# 配置目录说明

配置遵循“只写需要改的值”。未填字段使用框架默认值，无需把所有选项复制到 TOML。

## 建议修改顺序

1. `site.toml`：站点名称、域名、首页模式和自定义页面。
2. `profile.toml`：个人信息和社交链接。
3. `comment.toml`：选择评论服务并填写必要凭据。
4. `links.toml`：友情链接。

`theme.toml`、`background.toml` 和 `cover.toml` 用于外观。`optional/` 里的功能用到时再开：

- `analytics.toml`：统计，只选一个 `provider`。
- `announcement.toml`：全站公告。
- `code_block.toml`：代码块语言级覆盖。
- `font.toml`：字体预设或自托管字体。
- `guestbook.toml`：留言板，`enabled = true` 会自动注册菜单和页面。
- `license.toml`：文章默认协议。
- `markdown.toml`：Callout、Mermaid 和 KaTeX。
- `sponsor.toml`：赞助区，用 `show = ["articles", "page"]` 选择位置。

## 修改后检查

```bash
pnpm build:config
```

这个命令会报出错误枚举、缺失凭据、非法路由和常见字段拼写问题。完整说明见 `docs/configuration.md`。

同一配置只保留一份，不要同时创建 `cover.toml` 和 `optional/cover.toml` 这类同名配置。
