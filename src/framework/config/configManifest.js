export const CONFIG_FILE_DEFINITIONS = Object.freeze([
  {
    key: 'site',
    path: 'blog/config/site.toml',
    title: '站点与导航',
    group: 'site',
    description: '站点信息、首页推荐、菜单、侧边栏和页脚。'
  },
  {
    key: 'profile',
    path: 'blog/config/profile.toml',
    title: '个人资料',
    group: 'site',
    description: '侧边栏资料、头像、网站和社交链接。'
  },
  {
    key: 'links',
    path: 'blog/config/links.toml',
    title: '友情链接',
    group: 'content',
    description: '友链页面布局和链接列表。'
  },
  {
    key: 'theme',
    path: 'blog/config/theme.toml',
    title: '主题',
    group: 'appearance',
    description: '站点主题预设及其静态资源。'
  },
  {
    key: 'cover',
    path: 'blog/config/cover.toml',
    title: '文章封面',
    group: 'appearance',
    description: '封面回退、图源和文章详情背景。'
  },
  {
    key: 'font',
    path: 'blog/config/optional/font.toml',
    title: '字体',
    group: 'appearance',
    description: '字体预设、自托管字体和预加载。'
  },
  {
    key: 'comment',
    path: 'blog/config/comment.toml',
    title: '评论',
    group: 'interaction',
    description: 'giscus 或 utterances 评论服务。'
  },
  {
    key: 'guestbook',
    path: 'blog/config/optional/guestbook.toml',
    title: '留言板',
    group: 'interaction',
    description: '留言板页面、引导内容和评论映射。'
  },
  {
    key: 'announcement',
    path: 'blog/config/optional/announcement.toml',
    title: '公告',
    group: 'features',
    description: '全站公告内容、链接和展示样式。'
  },
  {
    key: 'sponsor',
    path: 'blog/config/optional/sponsor.toml',
    title: '赞助',
    group: 'features',
    description: '赞助入口、支付方式和赞助者列表。'
  },
  {
    key: 'analytics',
    path: 'blog/config/optional/analytics.toml',
    title: '统计',
    group: 'integrations',
    description: '站点统计服务及公开项目标识。'
  },
  {
    key: 'markdown',
    path: 'blog/config/optional/markdown.toml',
    title: 'Markdown',
    group: 'content',
    description: '提示块、图表和数学公式。'
  },
  {
    key: 'code_block',
    path: 'blog/config/optional/code_block.toml',
    title: '代码块',
    group: 'content',
    description: '代码块默认行为和语言级覆盖。'
  },
  {
    key: 'license',
    path: 'blog/config/optional/license.toml',
    title: '许可协议',
    group: 'content',
    description: '文章默认许可协议。'
  }
])

const CONFIG_FILE_BY_KEY = new Map(
  CONFIG_FILE_DEFINITIONS.map(definition => [definition.key, definition])
)

const CONFIG_FILE_BY_PATH = new Map(
  CONFIG_FILE_DEFINITIONS.map(definition => [definition.path, definition])
)

export function getConfigFileDefinition(key) {
  return CONFIG_FILE_BY_KEY.get(String(key || '').trim()) || null
}

export function getConfigFileDefinitionByPath(path) {
  return CONFIG_FILE_BY_PATH.get(String(path || '').trim()) || null
}

export function isManagedConfigKey(key) {
  return CONFIG_FILE_BY_KEY.has(String(key || '').trim())
}

export function isManagedConfigPath(path) {
  return CONFIG_FILE_BY_PATH.has(String(path || '').trim())
}
