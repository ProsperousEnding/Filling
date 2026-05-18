import { defineStore } from 'pinia'
import { loadAllConfigs } from '../config/configLoader'
import { normalizeBackgroundConfig } from '../utils/backgroundConfig'
import { normalizeCodeBlockConfig } from '../utils/codeBlockConfig'
import { normalizeCoverConfig } from '../utils/coverConfig'
import { normalizeFontConfig } from '../utils/fontConfig'
import { normalizeGuestbookConfig } from '../utils/guestbookConfig'
import { normalizeMarkdownConfig } from '../utils/markdownConfig'
import { configureBlogRoutePatterns, normalizeBlogRoutePatterns } from '../router/routeManifest'
import { normalizeMenuConfig, resolveMenuPageRegistry } from '../utils/menuConfig'
import { normalizeBuiltInPageLayoutsConfig } from '../utils/pageLayoutConfig'
import { normalizeSidebarLayout } from '../utils/sidebarLayout'
import { normalizeThemeAssetPath } from '../utils/themeAsset'
import { normalizeSeededCoverStyle } from '../utils/articleCover'

const DEFAULT_SITE_CONFIG = {
  title: '',
  subtitle: '',
  description: '',
  site_url: '',
  seo: {
    lang: 'zh-CN',
    locale: 'zh_CN',
    author: '',
    site_start_date: '',
    timezone: '',
    keywords: [],
    theme_color: '#f8fafc',
    favicon: '',
    apple_touch_icon: '',
    mask_icon: '',
    mask_icon_color: '',
    og_image: '',
    twitter_image: '',
    share_image: {
      enabled: true,
      prefer_page_image: true,
      fallback: 'site',
      default_image: '',
      twitter_image: '',
      twitter_card: 'summary_large_image',
      seeded_width: 1200,
      seeded_height: 630,
      seeded_format: 'webp'
    },
    robots: 'index,follow'
  },
  footer_text: '',
  footer_note: '',
  footer_html: '',
  footer_snippet_html: '',
  header: {
    leading_visual: {
      visible: true,
      type: 'dots',
      title: '',
      title_size: '0.98rem',
      src: '',
      alt: '',
      width: 56,
      height: 18,
      dots: {
        colors: ['#ff5f57', '#febc2e', '#28c840']
      }
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
  footer: {
    text: '',
    note: '',
    snippet_html: ''
  },
  page_layouts: {},
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
  sidebar: {},
  routing: {},
  menus: {},
  pagination: {
    page_size: 10
  }
}

const DEFAULT_PROFILE_CONFIG = {
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
}

const DEFAULT_THEME_CONFIG = {
  current_preset: 'default',
  css_file: '',
  js_file: '',
  presets: {}
}

const DEFAULT_LINKS_CONFIG = {
  page: {
    columns: 2,
    wide_columns: 3,
    footer_title: '',
    footer_content: '',
    footer_html: ''
  },
  friend_links: []
}

const DEFAULT_ANNOUNCEMENT_CONFIG = {
  enabled: false,
  id: '',
  title: '',
  content: '',
  link_text: '',
  link_url: '',
  dismissible: true,
  variant: 'info'
}

const DEFAULT_COMMENT_CONFIG = {
  enabled: false,
  provider: 'giscus',
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
}

const DEFAULT_SPONSOR_CONFIG = {
  enabled: false,
  title: '支持作者',
  description: '',
  button_text: '',
  button_url: '',
  button_note: '',
  show_on_articles: true,
  page_enabled: true,
  page_kicker: '赞助',
  page_title: '',
  page_description: '',
  supporters_title: '赞助者',
  supporters_description: '感谢这些朋友对本站的支持。',
  methods: [],
  supporters: []
}

const DEFAULT_LICENSE_CONFIG = {
  enabled: false,
  name: '',
  url: ''
}

const DEFAULT_ANALYTICS_CONFIG = {
  enabled: false,
  respect_dnt: false,
  track_localhost: false,
  umami: {
    enabled: false,
    script_url: 'https://cloud.umami.is/script.js',
    website_id: '',
    host_url: '',
    domains: [],
    auto_track: true,
    do_not_track: true,
    exclude_search: false,
    exclude_hash: false,
    performance: false,
    tag: ''
  },
  plausible: {
    enabled: false,
    script_url: 'https://plausible.io/js/script.js',
    domain: '',
    endpoint: '',
    auto_capture_pageviews: true,
    capture_on_localhost: false,
    hash_based_routing: false,
    outbound_links: false,
    file_downloads: false,
    tagged_events: false
  },
  google_analytics: {
    enabled: false,
    measurement_id: '',
    manual_pageviews: true,
    debug_mode: false
  },
  clarity: {
    enabled: false,
    project_id: ''
  }
}

const DEFAULT_FONT_CONFIG = {
  enabled: false,
  preset: '',
  current_preset: '',
  preload: '',
  base_size: '',
  families: {
    sans: '',
    heading: '',
    serif: '',
    mono: ''
  },
  dark_families: {},
  presets: {},
  faces: []
}

const DEFAULT_CODE_BLOCK_CONFIG = {
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
}

const DEFAULT_MARKDOWN_CONFIG = {
  enabled: true,
  callouts: {
    enabled: true,
    syntax: 'github',
    default_type: 'note',
    show_icon: true,
    labels: {},
    icons: {},
    aliases: {}
  },
  mermaid: {
    enabled: false,
    render: true,
    script_url: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
    theme: 'default',
    dark_theme: 'dark',
    security_level: 'strict'
  },
  math: {
    enabled: false,
    render: true,
    engine: 'katex',
    script_url: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
    css_url: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
    inline_dollar: true,
    inline_parentheses: true,
    block_dollar: true,
    block_brackets: true,
    throw_on_error: false,
    error_color: '#dc2626',
    strict: 'warn'
  }
}

const DEFAULT_BACKGROUND_CONFIG = {
  enabled: false,
  mode: 'gradient',
  gradient_light: 'radial-gradient(72rem 42rem at 0% 0%, rgba(59, 130, 246, 0.14), transparent 56%), radial-gradient(56rem 34rem at 100% 8%, rgba(16, 185, 129, 0.1), transparent 48%), linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 38%, rgba(248, 250, 252, 0.94) 100%)',
  gradient_dark: 'radial-gradient(72rem 42rem at 0% 0%, rgba(37, 99, 235, 0.18), transparent 54%), radial-gradient(54rem 32rem at 100% 10%, rgba(14, 165, 233, 0.12), transparent 46%), linear-gradient(180deg, rgba(2, 6, 23, 0.98) 0%, rgba(15, 23, 42, 0.98) 42%, rgba(15, 23, 42, 0.94) 100%)',
  image: '',
  dark_image: '',
  overlay_light: 'none',
  overlay_dark: 'none',
  position: 'center top',
  size: 'cover',
  repeat: 'no-repeat',
  attachment: 'scroll',
  opacity: 1
}

const DEFAULT_COVER_CONFIG = {
  enabled: true,
  fallback: 'seeded',
  fallback_image: '',
  seeded_width: 1200,
  seeded_height: 630,
  seeded_format: 'webp',
  seeded_style: 'picsum',
  style_switch: {
    enabled: true,
    storage_key: 'vue-blog-cover-source',
    styles: [
      'picsum',
      'cataas',
      'mwm-anime',
      'mwm-scenery',
      'xjh-acg',
      'bing-rand'
    ],
    labels: {
      picsum: 'Picsum',
      cataas: 'Cataas',
      'mwm-anime': 'MWM 二次元',
      'mwm-scenery': 'MWM 风景',
      'xjh-acg': 'XJH ACG',
      'bing-rand': 'Bing 随机'
    }
  },
  source_switch: {
    enabled: true,
    storage_key: 'vue-blog-cover-source',
    sources: [
      'picsum',
      'cataas',
      'mwm-anime',
      'mwm-scenery',
      'xjh-acg',
      'bing-rand'
    ],
    labels: {
      picsum: 'Picsum',
      cataas: 'Cataas',
      'mwm-anime': 'MWM 二次元',
      'mwm-scenery': 'MWM 风景',
      'xjh-acg': 'XJH ACG',
      'bing-rand': 'Bing 随机'
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
    watermark: {
      enabled: false,
      text: '',
      position: 'bottom-right',
      opacity: 0.72
    }
  }
}

const DEFAULT_GUESTBOOK_CONFIG = {
  enabled: false,
  kicker: '留言板',
  title: '欢迎留下你的来访足迹',
  description: '如果你路过这里，可以简单介绍自己，或者留下一句想说的话。',
  guidelines: [],
  template: '',
  contact_label: '',
  contact_url: '',
  comment_title: '开始留言',
  comment_description: '评论区会按当前页面路径独立保存留言内容。',
  comment_not_ready_text: '',
  comment: {}
}

const SIDEBAR_POSITION_VALUES = new Set(['left', 'right', 'hidden'])
const GISCUS_MAPPING_VALUES = new Set(['pathname', 'url', 'title', 'og:title', 'specific'])
const GISCUS_INPUT_POSITION_VALUES = new Set(['top', 'bottom'])
const GISCUS_LOADING_VALUES = new Set(['lazy', 'eager'])
const COMMENT_PROVIDER_VALUES = new Set(['giscus', 'utterances'])
const UTTERANCES_CROSSORIGIN_VALUES = new Set(['anonymous', 'use-credentials'])
const RAW_SITE_CONFIG_KEYS = new Set([
  'title',
  'description',
  'site_url',
  'seo',
  'footer_text',
  'footer_note',
  'footer_html',
  'footer_snippet_html',
  'header',
  'footer',
  'page_layouts',
  'pageLayouts',
  'features',
  'sidebar',
  'routing',
  'menus',
  'pagination'
])
const RAW_PROFILE_CONFIG_KEYS = new Set([
  'display_name',
  'username',
  'tagline',
  'bio',
  'avatar_url',
  'location',
  'website',
  'display',
  'social_links'
])
const RAW_THEME_CONFIG_KEYS = new Set([
  'current_preset',
  'css_file',
  'js_file',
  'presets'
])
const RAW_LINKS_CONFIG_KEYS = new Set(['page', 'friend_links'])
const RAW_COMMENT_CONFIG_KEYS = new Set([
  'enabled',
  'provider',
  'title',
  'description',
  'not_ready_text',
  'giscus',
  'utterances'
])
const RAW_SPONSOR_CONFIG_KEYS = new Set([
  'enabled',
  'title',
  'description',
  'button_text',
  'button_url',
  'button_note',
  'show_on_articles',
  'page_enabled',
  'page_kicker',
  'page_title',
  'page_description',
  'supporters_title',
  'supporters_description',
  'methods',
  'supporters',
  'backers'
])
const RAW_LICENSE_CONFIG_KEYS = new Set([
  'enabled',
  'name',
  'url',
  'default'
])
const RAW_ANALYTICS_CONFIG_KEYS = new Set([
  'enabled',
  'respect_dnt',
  'track_localhost',
  'umami',
  'plausible',
  'google_analytics',
  'clarity'
])
const RAW_FONT_CONFIG_KEYS = new Set([
  'enabled',
  'preset',
  'current_preset',
  'currentPreset',
  'preload',
  'base_size',
  'baseSize',
  'families',
  'dark_families',
  'darkFamilies',
  'presets',
  'faces',
  'sans_family',
  'sansFamily',
  'heading_family',
  'headingFamily',
  'display_family',
  'displayFamily',
  'serif_family',
  'serifFamily',
  'mono_family',
  'monoFamily'
])
const RAW_CODE_BLOCK_CONFIG_KEYS = new Set([
  'enabled',
  'show_language',
  'showLanguage',
  'show_filename',
  'showFilename',
  'show_copy_button',
  'showCopyButton',
  'show_line_numbers',
  'showLineNumbers',
  'line_number_start',
  'lineNumberStart',
  'theme',
  'dark_theme',
  'darkTheme',
  'copy_label',
  'copyLabel',
  'copied_label',
  'copiedLabel',
  'wrap_long_lines',
  'wrapLongLines',
  'max_height',
  'maxHeight',
  'collapsible',
  'collapse_threshold_lines',
  'collapseThresholdLines',
  'preview_lines',
  'previewLines',
  'expand_label',
  'expandLabel',
  'collapse_label',
  'collapseLabel',
  'mark_diff_lines',
  'markDiffLines',
  'languages'
])
const RAW_MARKDOWN_CONFIG_KEYS = new Set([
  'enabled',
  'callouts',
  'mermaid',
  'math'
])
const RAW_BACKGROUND_CONFIG_KEYS = new Set([
  'enabled',
  'mode',
  'gradient_light',
  'gradientLight',
  'gradient_dark',
  'gradientDark',
  'image',
  'dark_image',
  'darkImage',
  'image_dark',
  'imageDark',
  'overlay_light',
  'overlayLight',
  'overlay_dark',
  'overlayDark',
  'position',
  'size',
  'repeat',
  'attachment',
  'opacity'
])
const RAW_COVER_CONFIG_KEYS = new Set([
  'enabled',
  'fallback',
  'fallback_image',
  'fallbackImage',
  'image',
  'seeded_width',
  'seededWidth',
  'seeded_height',
  'seededHeight',
  'seeded_format',
  'seededFormat',
  'seeded_style',
  'seededStyle',
  'seeded_anime_url',
  'seededAnimeUrl',
  'style_urls',
  'styleUrls',
  'source_urls',
  'sourceUrls',
  'style_switch',
  'styleSwitch',
  'source_switch',
  'sourceSwitch',
  'list',
  'display_mode',
  'displayMode',
  'detail'
])
const RAW_GUESTBOOK_CONFIG_KEYS = new Set([
  'enabled',
  'kicker',
  'title',
  'description',
  'guidelines',
  'template',
  'contact_label',
  'contactLabel',
  'contact_url',
  'contactUrl',
  'comment_title',
  'commentTitle',
  'comment_description',
  'commentDescription',
  'comment_not_ready_text',
  'commentNotReadyText',
  'comment'
])

let reloadSeq = 0

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function transformKeysDeep(value, transformKey) {
  if (Array.isArray(value)) {
    return value.map(item => transformKeysDeep(item, transformKey))
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.entries(value).reduce((result, [key, nestedValue]) => {
    result[transformKey(key)] = transformKeysDeep(nestedValue, transformKey)
    return result
  }, {})
}

function toCamelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toCamelCase(value) {
  return transformKeysDeep(value, toCamelKey)
}

function normalizeSocialLinks(socialLinks = []) {
  if (!Array.isArray(socialLinks)) {
    return []
  }

  return socialLinks
    .filter(link => isPlainObject(link))
    .map((link, index) => {
      const normalizedLink = toCamelCase(link)
      const name = String(normalizedLink.name || normalizedLink.label || normalizedLink.title || '').trim()
      const rawUrl = String(normalizedLink.url || normalizedLink.href || '').trim()
      const url = normalizeProfileLinkUrl(rawUrl)
      const icon = String(normalizedLink.icon || '').trim()
      const weight = Number.parseInt(normalizedLink.weight, 10)
      const enabled = typeof normalizedLink.enabled === 'boolean' ? normalizedLink.enabled : true
      const showName = typeof normalizedLink.showName === 'boolean' ? normalizedLink.showName : true

      if (!enabled || !name || !url) {
        return null
      }

      return {
        id: String(normalizedLink.id || `social-link-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`).trim(),
        name,
        url,
        icon,
        showName,
        weight: Number.isFinite(weight) ? weight : 0
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeProfileDisplay(display = {}) {
  const defaultDisplay = DEFAULT_PROFILE_CONFIG.display
  const merged = {
    ...defaultDisplay,
    ...(isPlainObject(display) ? display : {})
  }

  return {
    showAvatar: normalizeFeatureBoolean(merged.show_avatar, defaultDisplay.show_avatar),
    showName: normalizeFeatureBoolean(merged.show_name, defaultDisplay.show_name),
    showUsername: normalizeFeatureBoolean(merged.show_username, defaultDisplay.show_username),
    showTagline: normalizeFeatureBoolean(merged.show_tagline, defaultDisplay.show_tagline),
    showBio: normalizeFeatureBoolean(merged.show_bio, defaultDisplay.show_bio),
    showLocation: normalizeFeatureBoolean(merged.show_location, defaultDisplay.show_location),
    showWebsite: normalizeFeatureBoolean(merged.show_website, defaultDisplay.show_website),
    showSocialLinks: normalizeFeatureBoolean(merged.show_social_links, defaultDisplay.show_social_links)
  }
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => String(value || '').trim())
    .filter(Boolean)
}

function normalizeBoundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, min), max)
}

function normalizeFriendLinksPageConfig(page = {}) {
  const defaultPage = DEFAULT_LINKS_CONFIG.page
  const merged = {
    ...defaultPage,
    ...(isPlainObject(page) ? toCamelCase(page) : {})
  }

  return {
    columns: normalizeBoundedInteger(merged.columns, defaultPage.columns, 1, 4),
    wideColumns: normalizeBoundedInteger(merged.wideColumns, defaultPage.wide_columns, 1, 5),
    footerTitle: String(merged.footerTitle || '').trim(),
    footerContent: String(merged.footerContent || merged.footer || merged.bottomContent || '').trim(),
    footerHtml: String(merged.footerHtml || merged.bottomHtml || '').trim()
  }
}

function normalizeSeoKeywords(values = []) {
  if (Array.isArray(values)) {
    return values
      .map(value => String(value || '').trim())
      .filter(Boolean)
  }

  const normalized = String(values || '').trim()
  if (!normalized) {
    return []
  }

  return normalized
    .split(/[,，]/)
    .map(value => value.trim())
    .filter(Boolean)
}

function normalizeSeoShareImageFallback(value, fallback = DEFAULT_SITE_CONFIG.seo.share_image.fallback) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return ['none', 'site', 'seeded'].includes(normalizedValue) ? normalizedValue : fallback
}

function normalizeTwitterCard(value, fallback = DEFAULT_SITE_CONFIG.seo.share_image.twitter_card) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return ['summary', 'summary_large_image'].includes(normalizedValue) ? normalizedValue : fallback
}

function normalizeSeoShareImageConfig(shareImage = {}, legacySeo = {}) {
  const defaults = DEFAULT_SITE_CONFIG.seo.share_image
  const source = isPlainObject(shareImage) ? toCamelCase(shareImage) : {}

  return {
    enabled: normalizeFeatureBoolean(source.enabled, defaults.enabled),
    preferPageImage: normalizeFeatureBoolean(source.preferPageImage, defaults.prefer_page_image),
    fallback: normalizeSeoShareImageFallback(source.fallback, defaults.fallback),
    defaultImage: normalizeFriendLinkAssetPath(
      source.defaultImage
      || source.default
      || source.image
      || legacySeo.og_image
      || legacySeo.ogImage
      || legacySeo.image
      || legacySeo.image_url
      || legacySeo.imageUrl
      || legacySeo.default_image
      || legacySeo.defaultImage
    ),
    twitterImage: normalizeFriendLinkAssetPath(
      source.twitterImage
      || source.twitter
      || legacySeo.twitter_image
      || legacySeo.twitterImage
    ),
    twitterCard: normalizeTwitterCard(source.twitterCard || legacySeo.twitter_card || legacySeo.twitterCard, defaults.twitter_card),
    seededWidth: normalizePositiveFeatureInteger(source.seededWidth, defaults.seeded_width),
    seededHeight: normalizePositiveFeatureInteger(source.seededHeight, defaults.seeded_height),
    seededFormat: String(source.seededFormat || defaults.seeded_format).trim() || defaults.seeded_format
  }
}

function normalizeFriendLinks(friendLinks = []) {
  if (!Array.isArray(friendLinks)) {
    return []
  }

  return friendLinks
    .filter(link => isPlainObject(link))
    .map((link, index) => {
      const name = String(link.name || '').trim()
      const url = normalizeProfileLinkUrl(link.url)
      const description = String(link.description || '').trim()
      const avatarUrl = normalizeFriendLinkAssetPath(
        link.avatar_url || link.logo_url || link.image_url || link.icon_url || link.avatar || link.logo || link.image
      )
      const location = String(link.location || '').trim()
      const note = String(link.note || '').trim()
      const weight = Number.parseInt(link.weight, 10)
      const enabled = typeof link.enabled === 'boolean' ? link.enabled : true
      const tags = normalizeStringList(link.tags || link.badges)

      if (!enabled || !name || !url) {
        return null
      }

      return {
        id: `friend-link-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        url,
        description,
        avatarUrl,
        location,
        note,
        weight: Number.isFinite(weight) ? weight : 0,
        tags
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeSidebarPosition(position) {
  if (typeof position !== 'string') {
    return DEFAULT_SITE_CONFIG.features.sidebar_position
  }

  const normalized = position.trim().toLowerCase()

  if (normalized === 'none') {
    return 'hidden'
  }

  return SIDEBAR_POSITION_VALUES.has(normalized)
    ? normalized
    : DEFAULT_SITE_CONFIG.features.sidebar_position
}

function normalizeFeatureBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizePositiveFeatureInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeProfileLinkUrl(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  return `https://${normalizedValue}`
}

function normalizeFriendLinkAssetPath(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  return normalizedValue.replace(/^\.?\//, '')
}

function normalizeSeoConfig(seo = {}) {
  const merged = {
    ...DEFAULT_SITE_CONFIG.seo,
    ...(isPlainObject(seo) ? seo : {})
  }
  const shareImage = normalizeSeoShareImageConfig(
    merged.share_image || merged.shareImage,
    merged
  )

  return {
    lang: String(merged.lang || '').trim() || DEFAULT_SITE_CONFIG.seo.lang,
    locale: String(merged.locale || '').trim() || DEFAULT_SITE_CONFIG.seo.locale,
    author: String(merged.author || '').trim(),
    siteStartDate: String(merged.site_start_date || merged.siteStartDate || merged.start_date || merged.startDate || '').trim(),
    timezone: String(merged.timezone || merged.time_zone || merged.timeZone || '').trim(),
    keywords: normalizeSeoKeywords(merged.keywords),
    themeColor: String(merged.theme_color || merged.themeColor || '').trim() || DEFAULT_SITE_CONFIG.seo.theme_color,
    favicon: normalizeFriendLinkAssetPath(
      merged.favicon
      || merged.favicon_url
      || merged.faviconUrl
      || merged.icon
      || merged.icon_url
      || merged.iconUrl
    ),
    appleTouchIcon: normalizeFriendLinkAssetPath(
      merged.apple_touch_icon
      || merged.appleTouchIcon
      || merged.touch_icon
      || merged.touchIcon
    ),
    maskIcon: normalizeFriendLinkAssetPath(
      merged.mask_icon
      || merged.maskIcon
      || merged.safari_pinned_tab
      || merged.safariPinnedTab
    ),
    maskIconColor: String(merged.mask_icon_color || merged.maskIconColor || '').trim(),
    ogImage: shareImage.defaultImage || normalizeFriendLinkAssetPath(
      merged.og_image
      || merged.ogImage
      || merged.image
      || merged.image_url
      || merged.imageUrl
      || merged.default_image
      || merged.defaultImage
    ),
    twitterImage: shareImage.twitterImage || normalizeFriendLinkAssetPath(
      merged.twitter_image
      || merged.twitterImage
    ),
    shareImage,
    robots: String(merged.robots || '').trim() || DEFAULT_SITE_CONFIG.seo.robots
  }
}

function normalizeLicenseConfig(license = {}) {
  const normalizedLicense = isPlainObject(license) ? license : {}
  const defaultLicense = isPlainObject(normalizedLicense.default) ? normalizedLicense.default : {}
  const enabledValue = defaultLicense.enabled ?? normalizedLicense.enabled
  const name = String(
    defaultLicense.name
    || defaultLicense.label
    || defaultLicense.title
    || normalizedLicense.name
    || normalizedLicense.label
    || normalizedLicense.title
    || ''
  ).trim()
  const link = normalizeAnnouncementLink(
    defaultLicense.url
    || defaultLicense.href
    || normalizedLicense.url
    || normalizedLicense.href
  )
  const enabled = typeof enabledValue === 'boolean' ? enabledValue : Boolean(name || link.url)

  if (!enabled || (!name && !link.url)) {
    return null
  }

  return {
    enabled: true,
    name: name || link.url,
    url: link.url,
    external: link.external
  }
}

function normalizeAnalyticsScriptUrl(value, fallback = '') {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return fallback
  }

  if (/^(https?:)?\/\//i.test(normalizedValue)) {
    return normalizedValue
  }

  return ''
}

function normalizeAnalyticsConfig(analytics = {}) {
  const merged = {
    ...DEFAULT_ANALYTICS_CONFIG,
    ...(isPlainObject(analytics) ? analytics : {})
  }
  const umamiSource = isPlainObject(merged.umami) ? merged.umami : {}
  const plausibleSource = isPlainObject(merged.plausible) ? merged.plausible : {}
  const googleAnalyticsSource = isPlainObject(merged.google_analytics)
    ? merged.google_analytics
    : isPlainObject(merged.googleAnalytics)
      ? merged.googleAnalytics
      : {}
  const claritySource = isPlainObject(merged.clarity) ? merged.clarity : {}
  const globalEnabled = merged.enabled === true

  const umami = {
    enabled: globalEnabled && umamiSource.enabled === true,
    scriptUrl: normalizeAnalyticsScriptUrl(
      umamiSource.script_url || umamiSource.scriptUrl,
      DEFAULT_ANALYTICS_CONFIG.umami.script_url
    ),
    websiteId: String(umamiSource.website_id || umamiSource.websiteId || '').trim(),
    hostUrl: normalizeAnalyticsScriptUrl(umamiSource.host_url || umamiSource.hostUrl),
    domains: normalizeStringList(umamiSource.domains),
    autoTrack: typeof umamiSource.auto_track === 'boolean'
      ? umamiSource.auto_track
      : DEFAULT_ANALYTICS_CONFIG.umami.auto_track,
    doNotTrack: typeof umamiSource.do_not_track === 'boolean'
      ? umamiSource.do_not_track
      : DEFAULT_ANALYTICS_CONFIG.umami.do_not_track,
    excludeSearch: umamiSource.exclude_search === true,
    excludeHash: umamiSource.exclude_hash === true,
    performance: umamiSource.performance === true,
    tag: String(umamiSource.tag || '').trim()
  }
  umami.ready = umami.enabled && Boolean(umami.scriptUrl && umami.websiteId)

  const plausible = {
    enabled: globalEnabled && plausibleSource.enabled === true,
    scriptUrl: normalizeAnalyticsScriptUrl(
      plausibleSource.script_url || plausibleSource.scriptUrl,
      DEFAULT_ANALYTICS_CONFIG.plausible.script_url
    ),
    domain: String(plausibleSource.domain || '').trim(),
    endpoint: normalizeAnalyticsScriptUrl(
      plausibleSource.endpoint
      || plausibleSource.api_host
      || plausibleSource.apiHost
    ),
    autoCapturePageviews: typeof plausibleSource.auto_capture_pageviews === 'boolean'
      ? plausibleSource.auto_capture_pageviews
      : DEFAULT_ANALYTICS_CONFIG.plausible.auto_capture_pageviews,
    captureOnLocalhost: typeof plausibleSource.capture_on_localhost === 'boolean'
      ? plausibleSource.capture_on_localhost
      : DEFAULT_ANALYTICS_CONFIG.plausible.capture_on_localhost,
    hashBasedRouting: plausibleSource.hash_based_routing === true,
    outboundLinks: plausibleSource.outbound_links === true,
    fileDownloads: plausibleSource.file_downloads === true,
    taggedEvents: plausibleSource.tagged_events === true
  }
  plausible.ready = plausible.enabled && Boolean(plausible.scriptUrl)

  const googleAnalytics = {
    enabled: globalEnabled && googleAnalyticsSource.enabled === true,
    measurementId: String(
      googleAnalyticsSource.measurement_id
      || googleAnalyticsSource.measurementId
      || ''
    ).trim(),
    manualPageviews: typeof googleAnalyticsSource.manual_pageviews === 'boolean'
      ? googleAnalyticsSource.manual_pageviews
      : DEFAULT_ANALYTICS_CONFIG.google_analytics.manual_pageviews,
    debugMode: typeof googleAnalyticsSource.debug_mode === 'boolean'
      ? googleAnalyticsSource.debug_mode
      : DEFAULT_ANALYTICS_CONFIG.google_analytics.debug_mode
  }
  googleAnalytics.ready = googleAnalytics.enabled && Boolean(googleAnalytics.measurementId)

  const clarity = {
    enabled: globalEnabled && claritySource.enabled === true,
    projectId: String(claritySource.project_id || claritySource.projectId || '').trim()
  }
  clarity.ready = clarity.enabled && Boolean(clarity.projectId)

  const providers = ['umami', 'plausible', 'googleAnalytics', 'clarity']
    .filter((providerName) => {
      if (providerName === 'googleAnalytics') {
        return googleAnalytics.ready
      }

      return ({ umami, plausible, clarity })[providerName].ready
    })

  return {
    enabled: globalEnabled && providers.length > 0,
    respectDnt: merged.respect_dnt === true,
    trackLocalhost: merged.track_localhost === true,
    umami,
    plausible,
    googleAnalytics,
    clarity,
    providers
  }
}

function normalizeProfile(profile = {}) {
  const merged = {
    ...DEFAULT_PROFILE_CONFIG,
    ...profile
  }

  return {
    displayName: merged.display_name,
    username: merged.username,
    tagline: merged.tagline,
    bio: merged.bio,
    avatarUrl: merged.avatar_url,
    location: merged.location,
    website: merged.website,
    display: normalizeProfileDisplay(merged.display),
    socialLinks: normalizeSocialLinks(merged.social_links)
  }
}

function normalizeThemePresets(presets = {}) {
  return Object.entries(presets).reduce((result, [name, preset]) => {
    result[name] = toCamelCase(preset)
    return result
  }, {})
}

function normalizeAnnouncementVariant(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  if (normalizedValue === 'success' || normalizedValue === 'warning') {
    return normalizedValue
  }

  return DEFAULT_ANNOUNCEMENT_CONFIG.variant
}

function normalizeAnnouncementLink(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return {
      url: '',
      external: false
    }
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return {
      url: normalizedValue,
      external: true
    }
  }

  if (!normalizedValue.startsWith('/') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return {
      url: '',
      external: false
    }
  }

  return {
    url: normalizedValue,
    external: false
  }
}

function normalizeSponsorMethods(methods = []) {
  if (!Array.isArray(methods)) {
    return []
  }

  return methods
    .filter(method => isPlainObject(method))
    .map((method, index) => {
      const normalizedMethod = toCamelCase(method)
      const name = String(normalizedMethod.name || normalizedMethod.label || normalizedMethod.title || '').trim()
      const accountName = String(
        normalizedMethod.accountName
        || normalizedMethod.account
        || normalizedMethod.payee
        || ''
      ).trim()
      const note = String(normalizedMethod.note || normalizedMethod.description || '').trim()
      const imageUrl = normalizeFriendLinkAssetPath(
        normalizedMethod.imageUrl
        || normalizedMethod.qrCodeUrl
        || normalizedMethod.qrUrl
        || normalizedMethod.image
        || normalizedMethod.qrCode
        || normalizedMethod.qr
      )
      const link = normalizeAnnouncementLink(
        normalizedMethod.linkUrl
        || normalizedMethod.url
        || normalizedMethod.href
      )
      const weight = Number.parseInt(normalizedMethod.weight, 10)
      const enabled = typeof normalizedMethod.enabled === 'boolean'
        ? normalizedMethod.enabled
        : true

      if (!enabled || (!name && !accountName && !note && !imageUrl && !link.url)) {
        return null
      }

      return {
        id: String(normalizedMethod.id || `sponsor-method-${index}`).trim(),
        name: name || accountName || `赞助方式 ${index + 1}`,
        accountName,
        note,
        imageUrl,
        linkUrl: link.url,
        external: link.external,
        weight: Number.isFinite(weight) ? weight : 0
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeSponsorSupporters(supporters = []) {
  if (!Array.isArray(supporters)) {
    return []
  }

  return supporters
    .filter(supporter => isPlainObject(supporter))
    .map((supporter, index) => {
      const normalizedSupporter = toCamelCase(supporter)
      const name = String(normalizedSupporter.name || normalizedSupporter.label || '').trim()
      const description = String(normalizedSupporter.description || normalizedSupporter.note || '').trim()
      const tier = String(normalizedSupporter.tier || '').trim()
      const amount = String(normalizedSupporter.amount || '').trim()
      const date = String(normalizedSupporter.date || normalizedSupporter.since || '').trim()
      const avatarUrl = normalizeFriendLinkAssetPath(
        normalizedSupporter.avatarUrl
        || normalizedSupporter.imageUrl
        || normalizedSupporter.logoUrl
        || normalizedSupporter.avatar
        || normalizedSupporter.image
        || normalizedSupporter.logo
      )
      const link = normalizeAnnouncementLink(
        normalizedSupporter.url
        || normalizedSupporter.linkUrl
        || normalizedSupporter.href
      )
      const weight = Number.parseInt(normalizedSupporter.weight, 10)
      const enabled = typeof normalizedSupporter.enabled === 'boolean'
        ? normalizedSupporter.enabled
        : true

      if (!enabled || !name) {
        return null
      }

      return {
        id: String(normalizedSupporter.id || `sponsor-supporter-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`).trim(),
        name,
        description,
        tier,
        amount,
        date,
        avatarUrl,
        url: link.url,
        external: link.external,
        weight: Number.isFinite(weight) ? weight : 0
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeSponsorConfig(sponsor = {}) {
  const merged = {
    ...DEFAULT_SPONSOR_CONFIG,
    ...(isPlainObject(sponsor) ? sponsor : {})
  }
  const buttonLink = normalizeAnnouncementLink(merged.button_url)
  const methods = normalizeSponsorMethods(merged.methods)
  const supportersSource = Array.isArray(merged.supporters) && merged.supporters.length > 0
    ? merged.supporters
    : merged.backers
  const supporters = normalizeSponsorSupporters(supportersSource)
  const title = String(merged.title || '').trim() || DEFAULT_SPONSOR_CONFIG.title
  const description = String(merged.description || '').trim()
  const buttonText = String(merged.button_text || '').trim()
  const buttonNote = String(merged.button_note || '').trim()
  const enabled = merged.enabled === true
  const showOnArticles = typeof merged.show_on_articles === 'boolean'
    ? merged.show_on_articles
    : DEFAULT_SPONSOR_CONFIG.show_on_articles
  const pageEnabled = typeof merged.page_enabled === 'boolean'
    ? merged.page_enabled
    : DEFAULT_SPONSOR_CONFIG.page_enabled
  const articleEnabled = enabled && showOnArticles && Boolean(
    description
    || buttonLink.url
    || buttonNote
    || methods.length > 0
  )

  return {
    enabled,
    articleEnabled,
    pageEnabled: enabled && pageEnabled,
    title,
    description,
    buttonText,
    buttonUrl: buttonLink.url,
    buttonExternal: buttonLink.external,
    buttonNote,
    pageKicker: String(merged.page_kicker || '').trim() || DEFAULT_SPONSOR_CONFIG.page_kicker,
    pageTitle: String(merged.page_title || '').trim() || title,
    pageDescription: String(merged.page_description || '').trim() || description,
    supportersTitle: String(merged.supporters_title || '').trim() || DEFAULT_SPONSOR_CONFIG.supporters_title,
    supportersDescription: String(merged.supporters_description || '').trim() || DEFAULT_SPONSOR_CONFIG.supporters_description,
    methods,
    supporters
  }
}

function normalizeAnnouncement(announcement = {}) {
  const merged = {
    ...DEFAULT_ANNOUNCEMENT_CONFIG,
    ...(isPlainObject(announcement) ? announcement : {})
  }
  const title = String(merged.title || '').trim()
  const content = String(merged.content || '').trim()
  const linkText = String(merged.link_text || '').trim()
  const link = normalizeAnnouncementLink(merged.link_url)

  return {
    enabled: merged.enabled === true && Boolean(title || content),
    id: String(merged.id || '').trim(),
    title,
    content,
    linkText,
    linkUrl: link.url,
    external: link.external,
    dismissible: merged.dismissible !== false,
    variant: normalizeAnnouncementVariant(merged.variant)
  }
}

function normalizeCommentProvider(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  return COMMENT_PROVIDER_VALUES.has(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMMENT_CONFIG.provider
}

function normalizeGiscusMapping(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  if (normalizedValue === 'og:title') {
    return 'og:title'
  }

  return GISCUS_MAPPING_VALUES.has(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMMENT_CONFIG.giscus.mapping
}

function normalizeGiscusInputPosition(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  return GISCUS_INPUT_POSITION_VALUES.has(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMMENT_CONFIG.giscus.input_position
}

function normalizeGiscusLoading(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  return GISCUS_LOADING_VALUES.has(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMMENT_CONFIG.giscus.loading
}

function normalizeGiscusConfig(config = {}) {
  const merged = {
    ...DEFAULT_COMMENT_CONFIG.giscus,
    ...(isPlainObject(config) ? config : {})
  }
  const repo = String(merged.repo || '').trim()
  const repoId = String(merged.repo_id || merged.repoId || '').trim()
  const category = String(merged.category || '').trim()
  const categoryId = String(merged.category_id || merged.categoryId || '').trim()
  const mapping = normalizeGiscusMapping(merged.mapping)
  const term = String(merged.term || '').trim()
  const theme = String(merged.theme || '').trim() || DEFAULT_COMMENT_CONFIG.giscus.theme
  const darkTheme = String(merged.dark_theme || merged.darkTheme || '').trim() || DEFAULT_COMMENT_CONFIG.giscus.dark_theme
  const lang = String(merged.lang || '').trim() || DEFAULT_COMMENT_CONFIG.giscus.lang
  const loading = normalizeGiscusLoading(merged.loading)
  const requiresTerm = mapping === 'specific'
  const ready = Boolean(repo && repoId && category && categoryId && (!requiresTerm || term))

  return {
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    term,
    strict: typeof merged.strict === 'boolean'
      ? merged.strict
      : DEFAULT_COMMENT_CONFIG.giscus.strict,
    reactionsEnabled: typeof merged.reactions_enabled === 'boolean'
      ? merged.reactions_enabled
      : typeof merged.reactionsEnabled === 'boolean'
        ? merged.reactionsEnabled
        : DEFAULT_COMMENT_CONFIG.giscus.reactions_enabled,
    emitMetadata: typeof merged.emit_metadata === 'boolean'
      ? merged.emit_metadata
      : typeof merged.emitMetadata === 'boolean'
        ? merged.emitMetadata
        : DEFAULT_COMMENT_CONFIG.giscus.emit_metadata,
    inputPosition: normalizeGiscusInputPosition(merged.input_position || merged.inputPosition),
    lang,
    loading,
    theme,
    darkTheme,
    ready
  }
}

function normalizeUtterancesCrossorigin(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  return UTTERANCES_CROSSORIGIN_VALUES.has(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMMENT_CONFIG.utterances.crossorigin
}

function normalizeUtterancesConfig(config = {}) {
  const merged = {
    ...DEFAULT_COMMENT_CONFIG.utterances,
    ...(isPlainObject(config) ? config : {})
  }
  const repo = String(merged.repo || '').trim()
  const issueTerm = String(merged.issue_term || merged.issueTerm || '').trim() || DEFAULT_COMMENT_CONFIG.utterances.issue_term
  const issueNumber = String(merged.issue_number || merged.issueNumber || '').trim()
  const label = String(merged.label || '').trim()
  const theme = String(merged.theme || '').trim() || DEFAULT_COMMENT_CONFIG.utterances.theme
  const darkTheme = String(merged.dark_theme || merged.darkTheme || '').trim() || DEFAULT_COMMENT_CONFIG.utterances.dark_theme
  const ready = Boolean(repo && (issueNumber || issueTerm))

  return {
    repo,
    issueTerm,
    issueNumber,
    label,
    theme,
    darkTheme,
    crossorigin: normalizeUtterancesCrossorigin(merged.crossorigin),
    ready
  }
}

function normalizeCommentConfig(comment = {}) {
  const merged = {
    ...DEFAULT_COMMENT_CONFIG,
    ...(isPlainObject(comment) ? comment : {})
  }
  const provider = normalizeCommentProvider(merged.provider)
  const giscus = normalizeGiscusConfig(merged.giscus)
  const utterances = normalizeUtterancesConfig(merged.utterances)
  const enabled = merged.enabled === true
  const title = String(merged.title || '').trim() || DEFAULT_COMMENT_CONFIG.title
  const description = String(merged.description || '').trim()
  const notReadyText = String(merged.not_ready_text || merged.notReadyText || '').trim()
    || DEFAULT_COMMENT_CONFIG.not_ready_text
  const providerReady = provider === 'giscus'
    ? giscus.ready
    : utterances.ready

  return {
    enabled,
    provider,
    title,
    description,
    notReadyText,
    ready: enabled && providerReady,
    giscus,
    utterances
  }
}

function normalizeFooterConfig(footer = {}) {
  if (!isPlainObject(footer)) {
    return normalizeFooterConfig(DEFAULT_SITE_CONFIG.footer)
  }

  const mergedFooter = {
    ...DEFAULT_SITE_CONFIG.footer,
    ...footer
  }

  return {
    text: String(mergedFooter.text || '').trim(),
    note: String(mergedFooter.note || '').trim(),
    snippetHtml: String(
      mergedFooter.snippet_html
      || mergedFooter.snippetHtml
      || mergedFooter.html
      || ''
    ).trim()
  }
}

function normalizeWindowControlColors(colors = []) {
  if (!Array.isArray(colors)) {
    return [...DEFAULT_SITE_CONFIG.header.leading_visual.dots.colors]
  }

  const normalizedColors = colors
    .map(color => (typeof color === 'string' ? color.trim() : ''))
    .filter(Boolean)
    .slice(0, 6)

  return normalizedColors.length > 0
    ? normalizedColors
    : [...DEFAULT_SITE_CONFIG.header.leading_visual.dots.colors]
}

function normalizeLeadingVisualTitleSize(value, fallback = DEFAULT_SITE_CONFIG.header.leading_visual.title_size) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return `${value}px`
  }

  if (typeof value !== 'string') {
    return fallback
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return fallback
  }

  if (/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return `${normalizedValue}px`
  }

  return normalizedValue
}

function normalizeLeadingVisualConfig(leadingVisual = {}, legacyWindowControls = null) {
  const defaultLeadingVisual = DEFAULT_SITE_CONFIG.header.leading_visual
  const normalizedLeadingVisual = isPlainObject(leadingVisual) ? leadingVisual : {}
  const camelLeadingVisual = isPlainObject(leadingVisual) ? toCamelCase(leadingVisual) : {}
  const fallbackWindowControls = isPlainObject(legacyWindowControls) ? legacyWindowControls : null
  const dots = isPlainObject(normalizedLeadingVisual.dots || camelLeadingVisual.dots)
    ? (normalizedLeadingVisual.dots || camelLeadingVisual.dots)
    : {}
  const src = String(normalizedLeadingVisual.src || camelLeadingVisual.src || '').trim()
  const width = Number(normalizedLeadingVisual.width || camelLeadingVisual.width)
  const height = Number(normalizedLeadingVisual.height || camelLeadingVisual.height)
  const requestedType = String(normalizedLeadingVisual.type || camelLeadingVisual.type || '').trim().toLowerCase()
  const type = requestedType === 'image' && src ? 'image' : 'dots'

  return {
    visible: typeof normalizedLeadingVisual.visible === 'boolean'
      ? normalizedLeadingVisual.visible
      : typeof camelLeadingVisual.visible === 'boolean'
        ? camelLeadingVisual.visible
      : typeof fallbackWindowControls?.visible === 'boolean'
        ? fallbackWindowControls.visible
        : defaultLeadingVisual.visible,
    type,
    title: String(
      normalizedLeadingVisual.title
      || normalizedLeadingVisual.label
      || camelLeadingVisual.title
      || camelLeadingVisual.label
      || ''
    ).trim(),
    titleSize: normalizeLeadingVisualTitleSize(
      normalizedLeadingVisual.title_size || camelLeadingVisual.titleSize,
      defaultLeadingVisual.title_size
    ),
    src,
    alt: String(normalizedLeadingVisual.alt || camelLeadingVisual.alt || '').trim(),
    width: Number.isFinite(width) && width > 0 ? width : defaultLeadingVisual.width,
    height: Number.isFinite(height) && height > 0 ? height : defaultLeadingVisual.height,
    dots: {
      colors: normalizeWindowControlColors(dots.colors || fallbackWindowControls?.colors)
    }
  }
}

function normalizeHeaderBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeNavbarConfig(navbar = {}) {
  const defaultNavbar = DEFAULT_SITE_CONFIG.header.navbar
  const normalizedNavbar = isPlainObject(navbar) ? toCamelCase(navbar) : {}

  return {
    sticky: normalizeHeaderBoolean(normalizedNavbar.sticky, defaultNavbar.sticky),
    blur: normalizeHeaderBoolean(normalizedNavbar.blur, defaultNavbar.blur),
    showBrand: normalizeHeaderBoolean(normalizedNavbar.showBrand, defaultNavbar.show_brand),
    showTitle: normalizeHeaderBoolean(normalizedNavbar.showTitle, defaultNavbar.show_title),
    showDescription: normalizeHeaderBoolean(normalizedNavbar.showDescription, defaultNavbar.show_description),
    showDesktopMenu: normalizeHeaderBoolean(normalizedNavbar.showDesktopMenu, defaultNavbar.show_desktop_menu),
    showMobileMenu: normalizeHeaderBoolean(normalizedNavbar.showMobileMenu, defaultNavbar.show_mobile_menu),
    showSearch: normalizeHeaderBoolean(normalizedNavbar.showSearch, defaultNavbar.show_search),
    showThemeToggle: normalizeHeaderBoolean(normalizedNavbar.showThemeToggle, defaultNavbar.show_theme_toggle),
    showSidebarToggle: normalizeHeaderBoolean(normalizedNavbar.showSidebarToggle, defaultNavbar.show_sidebar_toggle),
    showMobileMenuToggle: normalizeHeaderBoolean(normalizedNavbar.showMobileMenuToggle, defaultNavbar.show_mobile_menu_toggle)
  }
}

function normalizeHeaderConfig(header = {}) {
  const normalizedHeader = isPlainObject(header) ? header : {}
  const camelHeader = isPlainObject(header) ? toCamelCase(header) : {}

  return {
    leadingVisual: normalizeLeadingVisualConfig(
      normalizedHeader.leading_visual || camelHeader.leadingVisual,
      normalizedHeader.window_controls || camelHeader.windowControls
    ),
    navbar: normalizeNavbarConfig(normalizedHeader.navbar || normalizedHeader.navBar || camelHeader.navbar)
  }
}

function normalizeRoutingConfig(routing = {}) {
  if (!isPlainObject(routing)) {
    return normalizeBlogRoutePatterns()
  }

  return normalizeBlogRoutePatterns(routing)
}

function normalizeMenusConfig(menus = {}) {
  return normalizeMenuConfig(menus)
}

function normalizeConfigState({ site = {}, profile = {}, theme = {}, links = {}, announcement = {}, comment = {}, sponsor = {}, license = {}, analytics = {}, font = {}, codeBlock = {}, markdown = {}, background = {}, cover = {}, guestbook = {} } = {}) {
  const mergedSite = {
    ...DEFAULT_SITE_CONFIG,
    ...site,
    seo: normalizeSeoConfig(site.seo),
    header: normalizeHeaderConfig(site.header),
    footer: normalizeFooterConfig(site.footer),
    features: {
      ...DEFAULT_SITE_CONFIG.features,
      ...(site.features || {}),
      show_read_time: normalizeFeatureBoolean(
        site.features?.show_read_time,
        DEFAULT_SITE_CONFIG.features.show_read_time
      ),
      show_sidebar_on_articles: normalizeFeatureBoolean(
        site.features?.show_sidebar_on_articles,
        DEFAULT_SITE_CONFIG.features.show_sidebar_on_articles
      ),
      show_profile_in_sidebar: normalizeFeatureBoolean(
        site.features?.show_profile_in_sidebar,
        DEFAULT_SITE_CONFIG.features.show_profile_in_sidebar
      ),
      show_outdated_notice: normalizeFeatureBoolean(
        site.features?.show_outdated_notice,
        DEFAULT_SITE_CONFIG.features.show_outdated_notice
      ),
      outdated_threshold_days: normalizePositiveFeatureInteger(
        site.features?.outdated_threshold_days,
        DEFAULT_SITE_CONFIG.features.outdated_threshold_days
      )
    },
    sidebar: isPlainObject(site.sidebar) ? site.sidebar : DEFAULT_SITE_CONFIG.sidebar,
    pagination: {
      ...DEFAULT_SITE_CONFIG.pagination,
      ...(site.pagination || {})
    },
    page_layouts: normalizeBuiltInPageLayoutsConfig(site.page_layouts || site.pageLayouts)
  }

  const mergedTheme = {
    ...DEFAULT_THEME_CONFIG,
    ...theme
  }

  const mergedLinks = {
    ...DEFAULT_LINKS_CONFIG,
    ...links
  }
  const themePresets = normalizeThemePresets(mergedTheme.presets)
  const currentThemePreset = typeof mergedTheme.current_preset === 'string' && mergedTheme.current_preset.trim()
    ? mergedTheme.current_preset.trim()
    : DEFAULT_THEME_CONFIG.current_preset
  const activeThemePreset = isPlainObject(themePresets[currentThemePreset])
    ? themePresets[currentThemePreset]
    : null

  const sidebarPosition = normalizeSidebarPosition(mergedSite.features.sidebar_position)
  const sidebarVisible = sidebarPosition !== 'hidden' && mergedSite.features.sidebar_visible !== false
  const routePatterns = normalizeRoutingConfig(mergedSite.routing)
  const menus = normalizeMenusConfig(mergedSite.menus)
  const pageRegistry = resolveMenuPageRegistry(menus, routePatterns)

  return {
    sidebarVisible,
    sidebarPosition: sidebarPosition === 'hidden' ? 'right' : sidebarPosition,
    pageSize: mergedSite.pagination.page_size,
    blogTitle: mergedSite.title,
    blogSubtitle: typeof mergedSite.subtitle === 'string' ? mergedSite.subtitle.trim() : '',
    blogDescription: mergedSite.description,
    siteUrl: typeof mergedSite.site_url === 'string' ? mergedSite.site_url.trim() : '',
    seo: mergedSite.seo,
    headerConfig: mergedSite.header,
    footerText: mergedSite.footer.text || mergedSite.footer_text,
    footerNote: mergedSite.footer.note || mergedSite.footer_note,
    footerSnippetHtml: mergedSite.footer.snippetHtml || mergedSite.footer_snippet_html || mergedSite.footer_html,
    friendLinks: normalizeFriendLinks(mergedLinks.friend_links),
    friendLinksPageConfig: normalizeFriendLinksPageConfig(mergedLinks.page),
    showCategoryCount: mergedSite.features.show_category_count,
    showTagCount: mergedSite.features.show_tag_count,
    showReadTime: mergedSite.features.show_read_time,
    showSidebarOnArticles: mergedSite.features.show_sidebar_on_articles,
    showOutdatedNotice: mergedSite.features.show_outdated_notice,
    outdatedThresholdDays: mergedSite.features.outdated_threshold_days,
    showProfileInSidebar: mergedSite.features.show_profile_in_sidebar,
    sidebarLayout: normalizeSidebarLayout(mergedSite.sidebar),
    pageLayouts: mergedSite.page_layouts,
    routePatterns,
    menus,
    pageRegistry,
    userProfile: normalizeProfile(profile),
    announcement: normalizeAnnouncement(announcement),
    commentConfig: normalizeCommentConfig(comment),
    sponsorConfig: normalizeSponsorConfig(sponsor),
    defaultLicense: normalizeLicenseConfig(license),
    analyticsConfig: normalizeAnalyticsConfig(analytics),
    fontConfig: normalizeFontConfig({
      ...DEFAULT_FONT_CONFIG,
      ...(isPlainObject(font) ? font : {})
    }),
    codeBlockConfig: normalizeCodeBlockConfig({
      ...DEFAULT_CODE_BLOCK_CONFIG,
      ...(isPlainObject(codeBlock) ? codeBlock : {})
    }),
    markdownConfig: normalizeMarkdownConfig({
      ...DEFAULT_MARKDOWN_CONFIG,
      ...(isPlainObject(markdown) ? markdown : {})
    }),
    backgroundConfig: normalizeBackgroundConfig({
      ...DEFAULT_BACKGROUND_CONFIG,
      ...(isPlainObject(background) ? background : {})
    }),
    coverConfig: normalizeCoverConfig({
      ...DEFAULT_COVER_CONFIG,
      ...(isPlainObject(cover) ? cover : {})
    }),
    guestbookConfig: normalizeGuestbookConfig({
      ...DEFAULT_GUESTBOOK_CONFIG,
      ...(isPlainObject(guestbook) ? guestbook : {})
    }),
    currentThemePreset,
    themePresets,
    themeCSSFile: normalizeThemeAssetPath(activeThemePreset?.cssFile || mergedTheme.css_file || ''),
    themeJSFile: normalizeThemeAssetPath(activeThemePreset?.jsFile || mergedTheme.js_file || '')
  }
}

function pickConfigSubset(source, allowedKeys) {
  return Object.entries(source).reduce((result, [key, value]) => {
    if (allowedKeys.has(key)) {
      result[key] = value
    }
    return result
  }, {})
}

function normalizeRuntimeConfigInput(config = {}) {
  if (!isPlainObject(config)) {
    return config
  }

  const hasNamespacedConfig = ['site', 'profile', 'theme', 'links', 'announcement', 'comment', 'sponsor', 'license', 'analytics', 'font', 'codeBlock', 'code_block', 'markdown', 'background', 'cover', 'guestbook']
    .some(key => Object.prototype.hasOwnProperty.call(config, key))

  if (hasNamespacedConfig) {
    return normalizeConfigState({
      site: config.site,
      profile: config.profile,
      theme: config.theme,
      links: config.links,
      announcement: config.announcement,
      comment: config.comment,
      sponsor: config.sponsor,
      license: config.license,
      analytics: config.analytics,
      font: config.font,
      codeBlock: config.codeBlock || config.code_block,
      markdown: config.markdown,
      background: config.background,
      cover: config.cover,
      guestbook: config.guestbook
    })
  }

  const site = pickConfigSubset(config, RAW_SITE_CONFIG_KEYS)
  const profile = pickConfigSubset(config, RAW_PROFILE_CONFIG_KEYS)
  const theme = pickConfigSubset(config, RAW_THEME_CONFIG_KEYS)
  const links = pickConfigSubset(config, RAW_LINKS_CONFIG_KEYS)
  const comment = pickConfigSubset(config, RAW_COMMENT_CONFIG_KEYS)
  const sponsor = pickConfigSubset(config, RAW_SPONSOR_CONFIG_KEYS)
  const license = pickConfigSubset(config, RAW_LICENSE_CONFIG_KEYS)
  const analytics = pickConfigSubset(config, RAW_ANALYTICS_CONFIG_KEYS)
  const font = pickConfigSubset(config, RAW_FONT_CONFIG_KEYS)
  const codeBlock = pickConfigSubset(config, RAW_CODE_BLOCK_CONFIG_KEYS)
  const markdown = pickConfigSubset(config, RAW_MARKDOWN_CONFIG_KEYS)
  const background = pickConfigSubset(config, RAW_BACKGROUND_CONFIG_KEYS)
  const cover = pickConfigSubset(config, RAW_COVER_CONFIG_KEYS)
  const guestbook = pickConfigSubset(config, RAW_GUESTBOOK_CONFIG_KEYS)

  if (
    Object.keys(site).length > 0 ||
    Object.keys(profile).length > 0 ||
    Object.keys(theme).length > 0 ||
    Object.keys(links).length > 0 ||
    Object.keys(comment).length > 0 ||
    Object.keys(sponsor).length > 0 ||
    Object.keys(license).length > 0 ||
    Object.keys(analytics).length > 0 ||
    Object.keys(font).length > 0 ||
    Object.keys(codeBlock).length > 0 ||
    Object.keys(markdown).length > 0 ||
    Object.keys(background).length > 0 ||
    Object.keys(cover).length > 0 ||
    Object.keys(guestbook).length > 0
  ) {
    return normalizeConfigState({
      site,
      profile,
      theme,
      links,
      comment,
      sponsor,
      license,
      analytics,
      font,
      codeBlock,
      markdown,
      background,
      cover,
      guestbook
    })
  }

  return config
}

function applyDocumentTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function syncConfiguredRoutePatterns(configPatch = {}) {
  if (!isPlainObject(configPatch) || !Object.prototype.hasOwnProperty.call(configPatch, 'routePatterns')) {
    return configPatch
  }

  const nextRoutePatterns = normalizeRoutingConfig(configPatch.routePatterns)
  configureBlogRoutePatterns(nextRoutePatterns)

  return {
    ...configPatch,
    routePatterns: nextRoutePatterns
  }
}

function buildNormalizedState(config = {}) {
  return syncConfiguredRoutePatterns(normalizeConfigState(config))
}

function getCoverStyleStorageKey(coverConfig = {}) {
  return String(coverConfig?.sourceSwitch?.storageKey || coverConfig?.styleSwitch?.storageKey || 'vue-blog-cover-source').trim() || 'vue-blog-cover-source'
}

function getAvailableCoverStyles(coverConfig = {}) {
  const styles = Array.isArray(coverConfig?.sourceSwitch?.sources)
    ? coverConfig.sourceSwitch.sources
    : Array.isArray(coverConfig?.styleSwitch?.styles)
      ? coverConfig.styleSwitch.styles
      : ['picsum', 'cataas']

  return styles
    .map(style => normalizeSeededCoverStyle(style, ''))
    .filter(Boolean)
    .filter((style, index, list) => list.indexOf(style) === index)
}

function resolveCoverStyle(value, coverConfig = {}) {
  const availableStyles = getAvailableCoverStyles(coverConfig)
  const fallback = normalizeSeededCoverStyle(
    coverConfig?.sourceSwitch?.defaultSource || coverConfig?.styleSwitch?.defaultStyle || coverConfig?.seededSource || coverConfig?.seededStyle,
    'picsum'
  )
  const resolved = normalizeSeededCoverStyle(value, fallback)

  return availableStyles.includes(resolved)
    ? resolved
    : availableStyles[0] || fallback
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    theme: 'light',
    coverStyle: 'picsum',
    mobileSidebarOpen: false,
    ...buildNormalizedState()
  }),

  actions: {
    initConfig(config = {}) {
      this.$patch(syncConfiguredRoutePatterns(normalizeRuntimeConfigInput(config)))
      this.coverStyle = resolveCoverStyle(this.coverStyle, this.coverConfig)
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      applyDocumentTheme(this.theme)

      if (typeof window !== 'undefined') {
        localStorage.setItem('vue-blog-theme', this.theme)
      }
    },

    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
    },

    openMobileSidebar() {
      this.mobileSidebarOpen = true
    },

    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },

    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen
    },

    loadThemeFromStorage() {
      if (typeof window === 'undefined') {
        applyDocumentTheme(this.theme)
        return
      }

      const savedTheme = localStorage.getItem('vue-blog-theme')
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.theme = savedTheme
      }

      applyDocumentTheme(this.theme)
    },

    setCoverStyle(style, { persist = true } = {}) {
      this.coverStyle = resolveCoverStyle(style, this.coverConfig)

      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(getCoverStyleStorageKey(this.coverConfig), this.coverStyle)
      }
    },

    toggleCoverStyle() {
      const styles = getAvailableCoverStyles(this.coverConfig)
      const currentIndex = styles.indexOf(resolveCoverStyle(this.coverStyle, this.coverConfig))
      const nextStyle = styles[(currentIndex + 1) % styles.length] || this.coverConfig?.seededSource || this.coverConfig?.seededStyle || 'picsum'

      this.setCoverStyle(nextStyle)
    },

    loadCoverStyleFromStorage() {
      if (typeof window === 'undefined') {
        this.coverStyle = resolveCoverStyle(this.coverStyle, this.coverConfig)
        return
      }

      const savedStyle = localStorage.getItem(getCoverStyleStorageKey(this.coverConfig))
      this.coverStyle = resolveCoverStyle(savedStyle || this.coverConfig?.seededSource || this.coverConfig?.seededStyle, this.coverConfig)
    },

    updateConfig(config = {}) {
      this.$patch(syncConfiguredRoutePatterns(normalizeRuntimeConfigInput(config)))
      this.coverStyle = resolveCoverStyle(this.coverStyle, this.coverConfig)
    },

    async reloadConfig() {
      const currentSeq = ++reloadSeq
      const configs = await loadAllConfigs()

      if (currentSeq !== reloadSeq) {
        return
      }

      this.$patch(buildNormalizedState({
        site: configs?.site || {},
        profile: configs?.profile || {},
        theme: configs?.theme || {},
        links: configs?.links || {},
        announcement: configs?.announcement || {},
        comment: configs?.comment || {},
        sponsor: configs?.sponsor || {},
        license: configs?.license || {},
        analytics: configs?.analytics || {},
        font: configs?.font || {},
        codeBlock: configs?.code_block || {},
        markdown: configs?.markdown || {},
        background: configs?.background || {},
        cover: configs?.cover || {},
        guestbook: configs?.guestbook || {}
      }))
      this.coverStyle = resolveCoverStyle(this.coverStyle, this.coverConfig)
    },

    async bootstrapConfig() {
      await this.reloadConfig()
      this.loadThemeFromStorage()
      this.loadCoverStyleFromStorage()
    }
  }
})
