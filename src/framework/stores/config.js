import { defineStore } from 'pinia'
import { loadAllConfigs } from '../config/configLoader'
import { configureBlogRoutePatterns, normalizeBlogRoutePatterns } from '../router/routeManifest'
import { normalizeMenuConfig } from '../utils/menuConfig'
import { normalizeSidebarLayout } from '../utils/sidebarLayout'
import { normalizeThemeAssetPath } from '../utils/themeAsset'

const DEFAULT_SITE_CONFIG = {
  title: '',
  description: '',
  site_url: '',
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
    }
  },
  footer: {
    text: '',
    note: '',
    snippet_html: ''
  },
  features: {
    sidebar_visible: true,
    sidebar_position: 'right',
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
  social_links: []
}

const DEFAULT_THEME_CONFIG = {
  current_preset: 'default',
  css_file: '',
  js_file: '',
  presets: {}
}

const DEFAULT_LINKS_CONFIG = {
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
  methods: []
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
  'footer_text',
  'footer_note',
  'footer_html',
  'footer_snippet_html',
  'header',
  'footer',
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
  'social_links'
])
const RAW_THEME_CONFIG_KEYS = new Set([
  'current_preset',
  'css_file',
  'js_file',
  'presets'
])
const RAW_LINKS_CONFIG_KEYS = new Set(['friend_links'])
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
  'methods'
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

      if (!name || !url) {
        return null
      }

      return {
        id: String(normalizedLink.id || `social-link-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`).trim(),
        name,
        url
      }
    })
    .filter(Boolean)
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => String(value || '').trim())
    .filter(Boolean)
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

function normalizeSponsorConfig(sponsor = {}) {
  const merged = {
    ...DEFAULT_SPONSOR_CONFIG,
    ...(isPlainObject(sponsor) ? sponsor : {})
  }
  const buttonLink = normalizeAnnouncementLink(merged.button_url)
  const methods = normalizeSponsorMethods(merged.methods)
  const title = String(merged.title || '').trim() || DEFAULT_SPONSOR_CONFIG.title
  const description = String(merged.description || '').trim()
  const buttonText = String(merged.button_text || '').trim()
  const buttonNote = String(merged.button_note || '').trim()
  const enabled = merged.enabled === true && Boolean(buttonLink.url || methods.length > 0)

  return {
    enabled,
    title,
    description,
    buttonText,
    buttonUrl: buttonLink.url,
    buttonExternal: buttonLink.external,
    buttonNote,
    methods
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
  const fallbackWindowControls = isPlainObject(legacyWindowControls) ? legacyWindowControls : null
  const dots = isPlainObject(normalizedLeadingVisual.dots) ? normalizedLeadingVisual.dots : {}
  const src = String(normalizedLeadingVisual.src || '').trim()
  const width = Number(normalizedLeadingVisual.width)
  const height = Number(normalizedLeadingVisual.height)
  const requestedType = String(normalizedLeadingVisual.type || '').trim().toLowerCase()
  const type = requestedType === 'image' && src ? 'image' : 'dots'

  return {
    visible: typeof normalizedLeadingVisual.visible === 'boolean'
      ? normalizedLeadingVisual.visible
      : typeof fallbackWindowControls?.visible === 'boolean'
        ? fallbackWindowControls.visible
        : defaultLeadingVisual.visible,
    type,
    title: String(normalizedLeadingVisual.title || normalizedLeadingVisual.label || '').trim(),
    titleSize: normalizeLeadingVisualTitleSize(
      normalizedLeadingVisual.title_size,
      defaultLeadingVisual.title_size
    ),
    src,
    alt: String(normalizedLeadingVisual.alt || '').trim(),
    width: Number.isFinite(width) && width > 0 ? width : defaultLeadingVisual.width,
    height: Number.isFinite(height) && height > 0 ? height : defaultLeadingVisual.height,
    dots: {
      colors: normalizeWindowControlColors(dots.colors || fallbackWindowControls?.colors)
    }
  }
}

function normalizeHeaderConfig(header = {}) {
  const normalizedHeader = isPlainObject(header) ? header : {}

  return {
    leadingVisual: normalizeLeadingVisualConfig(
      normalizedHeader.leading_visual,
      normalizedHeader.window_controls
    )
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

function normalizeConfigState({ site = {}, profile = {}, theme = {}, links = {}, announcement = {}, comment = {}, sponsor = {} } = {}) {
  const mergedSite = {
    ...DEFAULT_SITE_CONFIG,
    ...site,
    header: normalizeHeaderConfig(site.header),
    footer: normalizeFooterConfig(site.footer),
    features: {
      ...DEFAULT_SITE_CONFIG.features,
      ...(site.features || {}),
      show_read_time: normalizeFeatureBoolean(
        site.features?.show_read_time,
        DEFAULT_SITE_CONFIG.features.show_read_time
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
    }
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

  return {
    sidebarVisible,
    sidebarPosition: sidebarPosition === 'hidden' ? 'right' : sidebarPosition,
    pageSize: mergedSite.pagination.page_size,
    blogTitle: mergedSite.title,
    blogDescription: mergedSite.description,
    siteUrl: typeof mergedSite.site_url === 'string' ? mergedSite.site_url.trim() : '',
    headerConfig: mergedSite.header,
    footerText: mergedSite.footer.text || mergedSite.footer_text,
    footerNote: mergedSite.footer.note || mergedSite.footer_note,
    footerSnippetHtml: mergedSite.footer.snippetHtml || mergedSite.footer_snippet_html || mergedSite.footer_html,
    friendLinks: normalizeFriendLinks(mergedLinks.friend_links),
    showCategoryCount: mergedSite.features.show_category_count,
    showTagCount: mergedSite.features.show_tag_count,
    showReadTime: mergedSite.features.show_read_time,
    showOutdatedNotice: mergedSite.features.show_outdated_notice,
    outdatedThresholdDays: mergedSite.features.outdated_threshold_days,
    showProfileInSidebar: mergedSite.features.show_profile_in_sidebar,
    sidebarLayout: normalizeSidebarLayout(mergedSite.sidebar),
    routePatterns: normalizeRoutingConfig(mergedSite.routing),
    menus: normalizeMenusConfig(mergedSite.menus),
    userProfile: normalizeProfile(profile),
    announcement: normalizeAnnouncement(announcement),
    commentConfig: normalizeCommentConfig(comment),
    sponsorConfig: normalizeSponsorConfig(sponsor),
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

  const hasNamespacedConfig = ['site', 'profile', 'theme', 'links', 'announcement', 'comment', 'sponsor']
    .some(key => Object.prototype.hasOwnProperty.call(config, key))

  if (hasNamespacedConfig) {
    return normalizeConfigState({
      site: config.site,
      profile: config.profile,
      theme: config.theme,
      links: config.links,
      announcement: config.announcement,
      comment: config.comment,
      sponsor: config.sponsor
    })
  }

  const site = pickConfigSubset(config, RAW_SITE_CONFIG_KEYS)
  const profile = pickConfigSubset(config, RAW_PROFILE_CONFIG_KEYS)
  const theme = pickConfigSubset(config, RAW_THEME_CONFIG_KEYS)
  const links = pickConfigSubset(config, RAW_LINKS_CONFIG_KEYS)
  const comment = pickConfigSubset(config, RAW_COMMENT_CONFIG_KEYS)
  const sponsor = pickConfigSubset(config, RAW_SPONSOR_CONFIG_KEYS)

  if (
    Object.keys(site).length > 0 ||
    Object.keys(profile).length > 0 ||
    Object.keys(theme).length > 0 ||
    Object.keys(links).length > 0 ||
    Object.keys(comment).length > 0 ||
    Object.keys(sponsor).length > 0
  ) {
    return normalizeConfigState({
      site,
      profile,
      theme,
      links,
      comment,
      sponsor
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

export const useConfigStore = defineStore('config', {
  state: () => ({
    theme: 'light',
    mobileSidebarOpen: false,
    ...buildNormalizedState()
  }),

  actions: {
    initConfig(config = {}) {
      this.$patch(syncConfiguredRoutePatterns(normalizeRuntimeConfigInput(config)))
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

    updateConfig(config = {}) {
      this.$patch(syncConfiguredRoutePatterns(normalizeRuntimeConfigInput(config)))
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
        sponsor: configs?.sponsor || {}
      }))
    },

    async bootstrapConfig() {
      await this.reloadConfig()
      this.loadThemeFromStorage()
    }
  }
})
