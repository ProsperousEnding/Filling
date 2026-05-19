# 配置目录说明

根目录保留日常最常改的基础配置。

- `site.toml`：站点信息、导航、页面、路由、分页、首页文章和页脚
- `profile.toml`：侧边栏个人资料卡
- `theme.toml`：主题资源和主题预设
- `background.toml`：站点背景
- `cover.toml`：文章封面、列表封面和详情页背景
- `comment.toml`：文章评论系统
- `links.toml`：友情链接

`optional/` 存放低频或高级细节配置。默认会被项目自动读取，不需要额外启用目录。

- `optional/analytics.toml`：统计脚本
- `optional/announcement.toml`：站点公告
- `optional/code_block.toml`：代码块增强
- `optional/font.toml`：字体栈、本地字体和 preload
- `optional/guestbook.toml`：留言板
- `optional/license.toml`：文章默认协议
- `optional/markdown.toml`：Markdown 增强
- `optional/sponsor.toml`：赞助区和赞助页

同一个配置只保留一份。不要同时创建 `cover.toml` 和 `optional/cover.toml` 这类同名配置。
