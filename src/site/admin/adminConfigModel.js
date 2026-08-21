const CONFIG_DEFAULTS = Object.freeze({
  site: {
    title: '',
    subtitle: '',
    description: '',
    site_url: '',
    seo: {
      lang: 'zh-CN',
      author: '',
      keywords: [],
      theme_color: '#f8fafc',
      favicon: '',
      og_image: '',
      robots: 'index,follow'
    },
    header: {
      leading_visual: {
        visible: true,
        type: 'dots',
        title: '',
        title_size: '18',
        src: '',
        alt: ''
      },
      navbar: {
        sticky: true,
        blur: true,
        show_brand: true,
        show_title: true,
        show_description: true,
        show_desktop_menu: true,
        show_mobile_menu: true,
        show_search: true,
        show_theme_toggle: true,
        show_sidebar_toggle: true,
        show_mobile_menu_toggle: true
      }
    },
    features: {
      sidebar_visible: true,
      sidebar_position: 'right',
      show_sidebar_on_articles: true,
      show_category_count: true,
      show_tag_count: true,
      show_read_time: true,
      show_profile_in_sidebar: true,
      show_outdated_notice: false,
      outdated_threshold_days: 365
    },
    pagination: {
      page_size: 10
    },
    home_articles: {
      mode: 'latest',
      page_size: 8,
      paginate: true,
      include_sticky: true,
      sticky_first: true,
      categories: [],
      tags: [],
      exclude_categories: [],
      exclude_tags: [],
      include_ids: [],
      exclude_ids: [],
      fallback_to_latest: false
    },
    menus: {
      pages: []
    },
    sidebar: {
      desktop_components: ['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags'],
      article_desktop_components: ['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags'],
      mobile_components: ['profile', 'search', 'latest-articles', 'categories', 'tags'],
      article_mobile_components: ['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags']
    },
    page_layouts: {
      persist: true,
      home: {
        default: 'list',
        allow_switch: false,
        columns: 2,
        wide_columns: 3
      },
      articles: {
        default: 'card',
        allow_switch: false,
        columns: 2,
        wide_columns: 2
      },
      categories: {
        default: 'grid',
        allow_switch: false,
        columns: 2,
        wide_columns: 3
      },
      tags: {
        default: 'list',
        allow_switch: false,
        columns: 2,
        wide_columns: 3
      },
      archive: {
        default: 'timeline',
        allow_switch: false,
        columns: 2,
        wide_columns: 3
      }
    },
    footer: {
      text: '',
      note: ''
    }
  },
  profile: {
    display_name: '',
    username: '',
    tagline: '',
    bio: '',
    avatar_url: '',
    location: '',
    website: '',
    display: {
      show_avatar: true,
      show_name: true,
      show_username: true,
      show_tagline: true,
      show_bio: true,
      show_location: true,
      show_website: true,
      show_social_links: true
    },
    social_links: []
  },
  links: {
    page: {
      columns: 2,
      wide_columns: 3,
      footer_title: '',
      footer_content: ''
    },
    friend_links: []
  },
  theme: {
    current_preset: 'default',
    presets: {}
  },
  background: {
    enabled: false,
    mode: 'gradient',
    gradient_light: '',
    gradient_dark: '',
    image: '',
    dark_image: '',
    overlay_light: 'none',
    overlay_dark: 'none',
    position: 'center top',
    size: 'cover',
    repeat: 'no-repeat',
    attachment: 'scroll',
    opacity: 1
  },
  cover: {
    enabled: true,
    fallback: 'seeded',
    fallback_image: '',
    seeded_width: 1200,
    seeded_height: 630,
    seeded_format: 'webp',
    seeded_style: 'picsum',
    source_switch: {
      enabled: false,
      storage_key: 'vue-blog-cover-source',
      sources: [
        'picsum',
        'cataas',
        'mwm-anime',
        'mwm-scenery',
        'paugram-anime',
        'dmoe-anime',
        'loremflickr',
        'paugram-bing'
      ],
      labels: {
        picsum: 'Picsum',
        cataas: 'Cataas',
        'mwm-anime': 'MWM 二次元',
        'mwm-scenery': 'MWM 风景',
        'paugram-anime': '保罗二次元',
        'dmoe-anime': 'DMOE 二次元',
        loremflickr: 'LoremFlickr 风景',
        'paugram-bing': 'Bing 每日壁纸'
      }
    },
    list: {
      show_cover: true,
      loading: 'lazy',
      aspect_ratio: '',
      object_fit: 'cover',
      placeholder: 'gradient'
    },
    detail: {
      show_cover: true,
      show_related_cover: true,
      display_mode: 'image',
      loading: 'eager',
      aspect_ratio: '',
      object_fit: 'cover',
      placeholder: 'gradient',
      page_background: {
        content_style: 'transparent'
      },
      watermark: {
        enabled: false,
        text: '',
        position: 'bottom-right',
        opacity: 0.72
      }
    }
  },
  font: {
    enabled: false,
    preset: 'system',
    preload: 'marked',
    base_size: '16px',
    faces: []
  },
  comment: {
    provider: '',
    title: '评论',
    description: '',
    not_ready_text: '评论系统尚未完成配置。',
    giscus: {
      repo: '',
      repo_id: '',
      category: '',
      category_id: '',
      mapping: 'pathname',
      term: '',
      strict: false,
      reactions_enabled: true,
      emit_metadata: false,
      input_position: 'top',
      lang: 'zh-CN',
      loading: 'lazy',
      theme: 'light',
      dark_theme: 'dark_dimmed'
    },
    utterances: {
      repo: '',
      issue_term: 'pathname',
      issue_number: '',
      label: '',
      theme: 'github-light',
      dark_theme: 'github-dark',
      crossorigin: 'anonymous'
    }
  },
  guestbook: {
    enabled: false,
    kicker: '留言板',
    title: '欢迎留言',
    description: '',
    guidelines: [],
    template: '',
    contact_label: '',
    contact_url: ''
  },
  announcement: {
    enabled: false,
    id: '',
    title: '',
    content: '',
    link_text: '',
    link_url: '',
    dismissible: true,
    variant: 'info'
  },
  sponsor: {
    enabled: false,
    show: ['articles', 'page'],
    title: '支持作者',
    description: '',
    page_kicker: '赞助',
    page_title: '',
    page_description: '',
    button_text: '',
    button_url: '',
    button_note: '',
    methods: [],
    supporters_title: '赞助者',
    supporters_description: '',
    supporters: []
  },
  analytics: {
    provider: '',
    respect_dnt: true,
    track_localhost: false,
    umami: { website_id: '', script_url: '' },
    plausible: { domain: '', script_url: '' },
    google_analytics: { measurement_id: '' },
    clarity: { project_id: '' }
  },
  markdown: {
    enabled: true,
    callouts: { enabled: true },
    mermaid: { enabled: false, theme: 'default', dark_theme: 'dark' },
    math: { enabled: false }
  },
  code_block: {
    enabled: true,
    show_language: true,
    show_filename: true,
    show_copy_button: true,
    show_line_numbers: true,
    line_number_start: 1,
    theme: 'default',
    dark_theme: 'default',
    copy_label: '复制代码',
    copied_label: '已复制',
    wrap_long_lines: false,
    max_height: '',
    collapsible: true,
    collapse_threshold_lines: 18,
    preview_lines: 18,
    expand_label: '展开代码',
    collapse_label: '收起代码',
    mark_diff_lines: true,
    languages: {}
  },
  license: {
    name: '',
    url: ''
  }
})

const ARRAY_ITEM_TEMPLATES = Object.freeze({
  'site.menus.pages': {
    key: '',
    title: '',
    description: '',
    component: 'context',
    file: '',
    folder: '',
    path: '',
    visible: true,
    enabled: true,
    menu_group: 'auto',
    menu_order: 100
  },
  'profile.social_links': {
    name: '',
    url: '',
    icon: 'link',
    show_name: true,
    enabled: true,
    weight: 0
  },
  'links.friend_links': {
    name: '',
    url: '',
    description: '',
    tags: [],
    enabled: true,
    weight: 0
  },
  'font.faces': {
    family: '',
    src: '',
    weight: '400',
    style: 'normal',
    display: 'swap'
  },
  'sponsor.methods': {
    name: '',
    account_name: '',
    image_url: '',
    note: '',
    weight: 100
  },
  'sponsor.supporters': {
    name: '',
    tier: '',
    amount: '',
    date: '',
    description: '',
    avatar_url: '',
    url: '',
    weight: 100
  }
})

const FIELD_LABELS = Object.freeze({
  title: '标题',
  subtitle: '副标题',
  description: '说明',
  site_url: '站点地址',
  lang: '语言',
  author: '作者',
  keywords: '关键词',
  theme_color: '浏览器主题色',
  favicon: '站点图标',
  og_image: '默认分享图',
  robots: '搜索引擎规则',
  header: '页眉',
  leading_visual: '左侧标识',
  visible: '显示',
  type: '类型',
  title_size: '标题尺寸',
  src: '资源地址',
  alt: '替代文字',
  navbar: '导航栏',
  sticky: '吸顶',
  blur: '背景模糊',
  show_brand: '显示品牌',
  show_title: '显示标题',
  show_description: '显示说明',
  show_desktop_menu: '显示桌面菜单',
  show_mobile_menu: '显示移动菜单',
  show_search: '显示搜索',
  show_theme_toggle: '显示主题切换',
  show_sidebar_toggle: '显示侧边栏切换',
  show_mobile_menu_toggle: '显示移动菜单按钮',
  features: '显示功能',
  sidebar_visible: '显示侧边栏',
  sidebar_position: '侧边栏位置',
  show_sidebar_on_articles: '文章页显示侧边栏',
  show_category_count: '显示分类数量',
  show_tag_count: '显示标签数量',
  show_read_time: '显示阅读时长',
  show_profile_in_sidebar: '侧边栏显示资料',
  show_outdated_notice: '显示过期提醒',
  outdated_threshold_days: '过期天数',
  pagination: '分页',
  page_size: '每页数量',
  home_articles: '首页文章',
  mode: '模式',
  paginate: '启用分页',
  include_sticky: '包含置顶文章',
  sticky_first: '置顶文章优先',
  categories: '包含分类',
  tags: '包含标签',
  exclude_categories: '排除分类',
  exclude_tags: '排除标签',
  include_ids: '指定文章',
  exclude_ids: '排除文章',
  fallback_to_latest: '无结果时回退到最新文章',
  menus: '菜单与页面',
  pages: '自定义页面',
  key: '唯一标识',
  component: '页面布局',
  file: 'Markdown 文件',
  folder: '内容目录',
  path: '访问路径',
  enabled: '启用',
  menu_group: '菜单分组',
  menu_order: '菜单顺序',
  footer: '页脚',
  text: '文字',
  note: '备注',
  display_name: '显示名称',
  username: '用户名',
  tagline: '简介',
  bio: '个人介绍',
  avatar_url: '头像地址',
  location: '位置',
  website: '个人网站',
  display: '资料显示项',
  show_avatar: '显示头像',
  show_name: '显示名称',
  show_username: '显示用户名',
  show_tagline: '显示简介',
  show_bio: '显示个人介绍',
  show_location: '显示位置',
  show_website: '显示网站',
  show_social_links: '显示社交链接',
  social_links: '社交链接',
  name: '名称',
  url: '链接',
  icon: '图标',
  weight: '排序权重',
  page: '页面设置',
  columns: '列数',
  wide_columns: '宽屏列数',
  footer_title: '底部标题',
  footer_content: '底部内容',
  friend_links: '友情链接',
  current_preset: '当前主题',
  presets: '主题预设',
  css_file: 'CSS 文件',
  js_file: 'JavaScript 文件',
  gradient_light: '浅色渐变',
  gradient_dark: '深色渐变',
  image: '浅色背景图',
  dark_image: '深色背景图',
  overlay_light: '浅色遮罩',
  overlay_dark: '深色遮罩',
  position: '背景位置',
  size: '背景尺寸',
  repeat: '背景重复',
  attachment: '滚动方式',
  opacity: '透明度',
  fallback: '无封面回退',
  fallback_image: '默认封面图',
  seeded_width: '生成宽度',
  seeded_height: '生成高度',
  seeded_format: '图片格式',
  seeded_style: '默认图源',
  source_switch: '访客图源选择',
  storage_key: '浏览器存储键',
  sources: '可选图源',
  labels: '图源名称',
  list: '列表封面',
  show_cover: '显示封面',
  loading: '加载方式',
  aspect_ratio: '宽高比',
  object_fit: '图片填充',
  placeholder: '占位样式',
  detail: '文章详情封面',
  show_related_cover: '相关文章显示封面',
  display_mode: '显示方式',
  page_background: '页面背景',
  content_style: '正文样式',
  watermark: '水印',
  provider: '服务商',
  not_ready_text: '未配置提示',
  repo: 'GitHub 仓库',
  repo_id: '仓库 ID',
  category: '讨论分类',
  category_id: '分类 ID',
  mapping: '映射方式',
  term: '指定主题',
  strict: '严格匹配',
  reactions_enabled: '启用表态',
  emit_metadata: '发送元数据',
  input_position: '输入框位置',
  dark_theme: '深色主题',
  issue_term: 'Issue 映射',
  issue_number: '固定 Issue 编号',
  label: '标签',
  crossorigin: '跨域模式',
  kicker: '页首短标题',
  guidelines: '留言规则',
  template: '留言模板',
  contact_label: '联系按钮文字',
  contact_url: '联系地址',
  id: '版本标识',
  content: '内容',
  link_text: '链接文字',
  link_url: '链接地址',
  dismissible: '允许关闭',
  variant: '样式',
  show: '显示位置',
  page_kicker: '页面短标题',
  page_title: '页面标题',
  page_description: '页面说明',
  button_text: '按钮文字',
  button_url: '按钮地址',
  button_note: '按钮备注',
  methods: '赞助方式',
  account_name: '账户说明',
  image_url: '图片地址',
  supporters_title: '赞助者标题',
  supporters_description: '赞助者说明',
  supporters: '赞助者',
  tier: '级别',
  amount: '金额',
  date: '日期',
  respect_dnt: '尊重 Do Not Track',
  track_localhost: '统计本地访问',
  website_id: '网站 ID',
  script_url: '脚本地址',
  domain: '统计域名',
  measurement_id: 'Measurement ID',
  project_id: '项目 ID',
  callouts: '提示块',
  mermaid: 'Mermaid 图表',
  math: '数学公式',
  show_language: '显示语言',
  show_filename: '显示文件名',
  show_copy_button: '显示复制按钮',
  show_line_numbers: '显示行号',
  line_number_start: '起始行号',
  copy_label: '复制按钮文字',
  copied_label: '复制成功文字',
  wrap_long_lines: '长行换行',
  max_height: '最大高度',
  collapsible: '允许折叠',
  collapse_threshold_lines: '折叠阈值',
  preview_lines: '预览行数',
  expand_label: '展开文字',
  collapse_label: '收起文字',
  mark_diff_lines: '标记 Diff 行',
  languages: '语言级覆盖',
  preset: '字体预设',
  preload: '预加载字体',
  base_size: '基础字号',
  faces: '字体文件',
  family: '字体名称',
  style: '样式'
})

const SELECT_OPTIONS = Object.freeze({
  'site.header.leading_visual.type': ['dots', 'image'],
  'site.features.sidebar_position': ['left', 'right', 'hidden'],
  'site.home_articles.mode': ['latest', 'featured', 'sticky', 'mixed'],
  'site.menus.pages.*.component': ['context', 'list', 'card', 'grid', 'timeline', 'friends'],
  'site.menus.pages.*.menu_group': ['auto', 'primary', 'more'],
  'background.mode': ['none', 'gradient', 'image'],
  'background.repeat': ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'],
  'background.attachment': ['scroll', 'fixed', 'local'],
  'cover.fallback': ['none', 'seeded', 'image'],
  'cover.seeded_format': ['webp', 'jpg', 'png'],
  'cover.seeded_style': [
    'picsum',
    'cataas',
    'mwm-anime',
    'mwm-scenery',
    'paugram-anime',
    'dmoe-anime',
    'loremflickr',
    'paugram-bing'
  ],
  'cover.list.loading': ['lazy', 'eager'],
  'cover.list.object_fit': ['cover', 'contain', 'fill', 'none', 'scale-down'],
  'cover.list.placeholder': ['none', 'gradient', 'icon'],
  'cover.detail.display_mode': ['image', 'header-background', 'page-background'],
  'cover.detail.loading': ['lazy', 'eager'],
  'cover.detail.object_fit': ['cover', 'contain', 'fill', 'none', 'scale-down'],
  'cover.detail.placeholder': ['none', 'gradient', 'icon'],
  'cover.detail.page_background.content_style': ['transparent', 'glass'],
  'cover.detail.watermark.position': ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  'font.preset': ['system', 'sans', 'serif', 'mono'],
  'font.preload': ['none', 'marked', 'all'],
  'comment.provider': ['', 'giscus', 'utterances'],
  'comment.giscus.mapping': ['pathname', 'url', 'title', 'og:title', 'specific'],
  'comment.giscus.input_position': ['top', 'bottom'],
  'comment.giscus.loading': ['lazy', 'eager'],
  'announcement.variant': ['info', 'success', 'warning'],
  'analytics.provider': ['', 'umami', 'plausible', 'google_analytics', 'clarity'],
  'markdown.mermaid.theme': ['default', 'base', 'dark', 'forest', 'neutral'],
  'markdown.mermaid.dark_theme': ['default', 'base', 'dark', 'forest', 'neutral'],
  'code_block.theme': ['default', 'github', 'dracula'],
  'code_block.dark_theme': ['default', 'github', 'dracula']
})

const FIELD_HINTS = Object.freeze({
  'site.site_url': '填写站点正式地址，不要以斜杠结尾。',
  'site.seo.favicon': '填写 public/ 下的相对路径，例如 icons/points.png。',
  'site.seo.og_image': '用于没有独立封面时的默认分享图片。',
  'site.header.leading_visual.title_size': '支持数字、px 或 rem，例如 18、18px、1rem。',
  'site.home_articles.include_ids': '每行填写一个文章 ID；留空时由模式自动选择。',
  'site.home_articles.exclude_ids': '这里的文章始终不会出现在首页。',
  'profile.avatar_url': '填写 public/ 下的相对路径或完整 HTTPS 地址。',
  'profile.social_links.*.icon': '推荐使用 github、link、mail 等 Lucide 图标名称。',
  'background.gradient_light': '填写完整 CSS background 值；留空使用内置浅色渐变。',
  'background.gradient_dark': '填写完整 CSS background 值；留空沿用浅色或内置深色渐变。',
  'background.image': '填写 public/ 下的相对路径或完整图片地址。',
  'background.dark_image': '留空时深色模式继续使用浅色背景图。',
  'cover.fallback_image': '填写 public/ 下的相对路径或完整图片地址。',
  'cover.source_switch.enabled': '开启后访客可以在网页上切换自动封面图源。',
  'cover.list.aspect_ratio': '可选，例如 16 / 9；留空使用主题默认比例。',
  'cover.detail.aspect_ratio': '可选，例如 16 / 9；留空使用主题默认比例。',
  'comment.provider': '选择服务商即启用评论；选择关闭会保留已填写参数。',
  'comment.giscus.repo': '格式为 owner/repo，并确保仓库已启用 Discussions。',
  'comment.giscus.repo_id': '从 giscus.app 生成配置后复制 Repository ID。',
  'comment.giscus.category_id': '从 giscus.app 生成配置后复制 Category ID。',
  'comment.utterances.repo': '格式为 owner/repo，并确保仓库已安装 Utterances。',
  'guestbook.contact_url': '支持站内路径、HTTPS、邮箱和电话链接。',
  'announcement.id': '发布新公告时修改此值，已关闭公告才会重新出现。',
  'analytics.provider': '一次只启用一个统计服务；选择关闭时不会加载任何统计脚本。',
  'font.preload': '“标记字体”只预加载明确标记的字体文件，通常更合适。',
  'font.base_size': '支持数字、px 或 rem，例如 16px、1rem。',
  'code_block.max_height': '可选，例如 480px；留空时不限制高度。',
  'code_block.collapse_threshold_lines': '代码达到该行数后默认折叠。',
  'code_block.preview_lines': '折叠状态下保留显示的代码行数。',
  'license.url': '填写许可协议的完整 HTTPS 地址。'
})

const URL_FIELD_PATHS = new Set([
  'profile.website',
  'profile.social_links.*.url',
  'links.friend_links.*.url',
  'sponsor.supporters.*.url',
  'analytics.umami.script_url',
  'analytics.plausible.script_url',
  'license.url'
])

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue)
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]))
  }
  return value
}

function mergeConfigValue(defaultValue, configuredValue) {
  if (configuredValue === undefined) {
    return cloneValue(defaultValue)
  }
  if (Array.isArray(configuredValue)) {
    return cloneValue(configuredValue)
  }
  if (isPlainObject(defaultValue) && isPlainObject(configuredValue)) {
    const keys = new Set([...Object.keys(defaultValue), ...Object.keys(configuredValue)])
    return Object.fromEntries(Array.from(keys, key => [
      key,
      mergeConfigValue(defaultValue[key], configuredValue[key])
    ]))
  }
  return cloneValue(configuredValue)
}

function configValuesEqual(left, right) {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length
      && left.every((item, index) => configValuesEqual(item, right[index]))
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)
    return leftKeys.length === rightKeys.length
      && leftKeys.every(key => (
        Object.prototype.hasOwnProperty.call(right, key)
        && configValuesEqual(left[key], right[key])
      ))
  }
  return false
}

function compactConfigValue(configuredValue, defaultValue, hasDefault) {
  if (hasDefault && configValuesEqual(configuredValue, defaultValue)) {
    return undefined
  }
  if (Array.isArray(configuredValue)) {
    return cloneValue(configuredValue)
  }
  if (!isPlainObject(configuredValue)) {
    return cloneValue(configuredValue)
  }

  const compactedEntries = Object.entries(configuredValue)
    .map(([key, value]) => {
      const childHasDefault = isPlainObject(defaultValue)
        && Object.prototype.hasOwnProperty.call(defaultValue, key)
      return [
        key,
        compactConfigValue(value, childHasDefault ? defaultValue[key] : undefined, childHasDefault)
      ]
    })
    .filter(([, value]) => value !== undefined)

  if (compactedEntries.length === 0 && hasDefault) {
    return undefined
  }
  return Object.fromEntries(compactedEntries)
}

function preserveConfiguredShape(modelValue, configuredValue) {
  if (modelValue === undefined || configuredValue === undefined) {
    return undefined
  }
  if (Array.isArray(configuredValue) || !isPlainObject(configuredValue)) {
    return cloneValue(modelValue)
  }
  if (!isPlainObject(modelValue)) {
    return cloneValue(modelValue)
  }

  return Object.fromEntries(
    Object.keys(configuredValue)
      .map(key => [key, preserveConfiguredShape(modelValue[key], configuredValue[key])])
      .filter(([, value]) => value !== undefined)
  )
}

export function createAdminConfigModel(key, configuredValue = {}) {
  return mergeConfigValue(CONFIG_DEFAULTS[key] || {}, configuredValue)
}

export function createAdminConfigOverrides(key, model = {}, configuredValue = undefined) {
  const compacted = compactConfigValue(model, CONFIG_DEFAULTS[key] || {}, true) || {}
  if (configuredValue === undefined) return compacted

  const explicitValues = preserveConfiguredShape(model, configuredValue) || {}
  return mergeConfigValue(compacted, explicitValues)
}

export function getArrayItemTemplate(path) {
  const template = ARRAY_ITEM_TEMPLATES[path]
  return template ? cloneValue(template) : null
}

export function getFieldLabel(key) {
  return FIELD_LABELS[key] || String(key || '').replaceAll('_', ' ')
}

export function normalizeFieldPath(path) {
  return String(path || '').replace(/\.\d+(?=\.|$)/gu, '.*')
}

export function getFieldOptions(path, rootModel = {}) {
  const normalizedPath = normalizeFieldPath(path)
  if (normalizedPath === 'theme.current_preset') {
    return Object.keys(rootModel.presets || {})
  }

  return SELECT_OPTIONS[normalizedPath] || []
}

function getRootValue(rootModel, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => value?.[key], rootModel)
}

export function isAdminFieldVisible(path, rootModel = {}) {
  const normalizedPath = normalizeFieldPath(path)
  const rootKey = normalizedPath.split('.')[0]
  const localValue = localPath => getRootValue(rootModel, localPath)

  if (rootKey === 'site') {
    if (normalizedPath === 'site.header.leading_visual.type'
      || normalizedPath === 'site.header.leading_visual.title'
      || normalizedPath === 'site.header.leading_visual.title_size') {
      return localValue('header.leading_visual.visible') !== false
    }
    if (['site.header.leading_visual.src', 'site.header.leading_visual.alt'].includes(normalizedPath)) {
      return localValue('header.leading_visual.visible') !== false
        && localValue('header.leading_visual.type') === 'image'
    }
    if (normalizedPath === 'site.features.outdated_threshold_days') {
      return localValue('features.show_outdated_notice') === true
    }
  }

  if (rootKey === 'background') {
    if (normalizedPath === 'background.enabled') return true
    if (localValue('enabled') !== true) return false
    if (normalizedPath === 'background.mode') return true
    const mode = localValue('mode')
    if (['background.gradient_light', 'background.gradient_dark'].includes(normalizedPath)) {
      return mode === 'gradient'
    }
    if ([
      'background.image',
      'background.dark_image',
      'background.position',
      'background.size',
      'background.repeat',
      'background.attachment'
    ].includes(normalizedPath)) {
      return mode === 'image'
    }
    return mode !== 'none'
  }

  if (rootKey === 'cover') {
    if (normalizedPath === 'cover.enabled') return true
    if (localValue('enabled') !== true) return false
    if (normalizedPath === 'cover.fallback_image') return localValue('fallback') === 'image'
    if (/^cover\.seeded_/u.test(normalizedPath) || normalizedPath === 'cover.source_switch') {
      return localValue('fallback') === 'seeded'
    }
    if (normalizedPath.startsWith('cover.source_switch.')
      && normalizedPath !== 'cover.source_switch.enabled') {
      return localValue('fallback') === 'seeded' && localValue('source_switch.enabled') === true
    }
    if (normalizedPath === 'cover.detail.page_background') {
      return localValue('detail.display_mode') === 'page-background'
    }
    if (normalizedPath.startsWith('cover.detail.page_background.')) {
      return localValue('detail.display_mode') === 'page-background'
    }
    if (normalizedPath.startsWith('cover.detail.watermark.')
      && normalizedPath !== 'cover.detail.watermark.enabled') {
      return localValue('detail.watermark.enabled') === true
    }
  }

  if (rootKey === 'comment') {
    if (normalizedPath === 'comment.enabled' || normalizedPath === 'comment.provider') return true
    const provider = localValue('provider')
    if (!provider || localValue('enabled') === false) return false
    if (normalizedPath === 'comment.giscus') return provider === 'giscus'
    if (normalizedPath === 'comment.utterances') return provider === 'utterances'
  }

  if (rootKey === 'analytics') {
    if (normalizedPath === 'analytics.provider') return true
    const provider = localValue('provider')
    if (!provider) return false
    if (['analytics.umami', 'analytics.plausible', 'analytics.google_analytics', 'analytics.clarity']
      .includes(normalizedPath)) {
      return normalizedPath === `analytics.${provider}`
    }
  }

  if (['announcement', 'guestbook', 'sponsor', 'font', 'code_block'].includes(rootKey)) {
    if (normalizedPath === `${rootKey}.enabled`) return true
    if (localValue('enabled') !== true) return false
  }

  if (rootKey === 'markdown') {
    if (normalizedPath === 'markdown.enabled') return true
    if (localValue('enabled') !== true) return false
    if (normalizedPath.startsWith('markdown.mermaid.')
      && normalizedPath !== 'markdown.mermaid.enabled') {
      return localValue('mermaid.enabled') === true
    }
    if (normalizedPath.startsWith('markdown.math.')
      && normalizedPath !== 'markdown.math.enabled') {
      return localValue('math.enabled') === true
    }
  }

  return true
}

export function getFieldHint(path) {
  return FIELD_HINTS[normalizeFieldPath(path)] || ''
}

export function getAdminFieldInputType(path, value) {
  if (typeof value === 'number') return 'number'
  return URL_FIELD_PATHS.has(normalizeFieldPath(path)) ? 'url' : 'text'
}

export function getAdminNumberBounds(path) {
  const normalizedPath = normalizeFieldPath(path)
  if (normalizedPath.endsWith('.opacity')) return { min: 0, max: 1, step: 0.05 }
  if (normalizedPath.endsWith('.columns') || normalizedPath.endsWith('.wide_columns')) {
    return { min: 1, max: 5, step: 1 }
  }
  if (/\.(?:page_size|seeded_width|seeded_height|line_number_start|collapse_threshold_lines|preview_lines)$/u.test(normalizedPath)) {
    return { min: 1, max: undefined, step: 1 }
  }
  return { min: undefined, max: undefined, step: 1 }
}

export function isMultilineField(key, value) {
  return [
    'bio',
    'content',
    'description',
    'footer_content',
    'gradient_dark',
    'gradient_light',
    'note',
    'not_ready_text',
    'page_description',
    'supporters_description',
    'tagline',
    'template'
  ].includes(key) || String(value || '').length > 100
}
