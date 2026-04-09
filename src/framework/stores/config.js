import { defineStore } from 'pinia'
import { loadAllConfigs } from '../config/configLoader'
import { configureBlogRoutePatterns, normalizeBlogRoutePatterns } from '../router/routeManifest'
import { normalizeMenuConfig } from '../utils/menuConfig'
import { normalizeThemeAssetPath } from '../utils/themeAsset'

const DEFAULT_SITE_CONFIG = {
  title: '',
  description: '',
  site_url: '',
  footer_text: '',
  footer_note: '',
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
    note: ''
  },
  features: {
    sidebar_visible: true,
    sidebar_position: 'right',
    show_category_count: true,
    show_tag_count: true,
    show_read_time: true,
    show_profile_in_sidebar: true
  },
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

const SIDEBAR_POSITION_VALUES = new Set(['left', 'right', 'hidden'])
const RAW_SITE_CONFIG_KEYS = new Set([
  'title',
  'description',
  'site_url',
  'footer_text',
  'footer_note',
  'header',
  'footer',
  'features',
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
    .map(link => toCamelCase(link))
}

function normalizeFriendLinks(friendLinks = []) {
  if (!Array.isArray(friendLinks)) {
    return []
  }

  return friendLinks
    .filter(link => isPlainObject(link))
    .map((link, index) => {
      const name = String(link.name || '').trim()
      const url = String(link.url || '').trim()
      const description = String(link.description || '').trim()

      if (!name || !url) {
        return null
      }

      return {
        id: `friend-link-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        url,
        description
      }
    })
    .filter(Boolean)
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

function normalizeFooterConfig(footer = {}) {
  if (!isPlainObject(footer)) {
    return {
      ...DEFAULT_SITE_CONFIG.footer
    }
  }

  return {
    ...DEFAULT_SITE_CONFIG.footer,
    ...footer
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

function normalizeConfigState({ site = {}, profile = {}, theme = {}, links = {} } = {}) {
  const mergedSite = {
    ...DEFAULT_SITE_CONFIG,
    ...site,
    header: normalizeHeaderConfig(site.header),
    footer: normalizeFooterConfig(site.footer),
    features: {
      ...DEFAULT_SITE_CONFIG.features,
      ...(site.features || {})
    },
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
    friendLinks: normalizeFriendLinks(mergedLinks.friend_links),
    showCategoryCount: mergedSite.features.show_category_count,
    showTagCount: mergedSite.features.show_tag_count,
    showReadTime: mergedSite.features.show_read_time,
    showProfileInSidebar: mergedSite.features.show_profile_in_sidebar,
    routePatterns: normalizeRoutingConfig(mergedSite.routing),
    menus: normalizeMenusConfig(mergedSite.menus),
    userProfile: normalizeProfile(profile),
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

  const hasNamespacedConfig = ['site', 'profile', 'theme', 'links']
    .some(key => Object.prototype.hasOwnProperty.call(config, key))

  if (hasNamespacedConfig) {
    return normalizeConfigState({
      site: config.site,
      profile: config.profile,
      theme: config.theme,
      links: config.links
    })
  }

  const site = pickConfigSubset(config, RAW_SITE_CONFIG_KEYS)
  const profile = pickConfigSubset(config, RAW_PROFILE_CONFIG_KEYS)
  const theme = pickConfigSubset(config, RAW_THEME_CONFIG_KEYS)
  const links = pickConfigSubset(config, RAW_LINKS_CONFIG_KEYS)

  if (
    Object.keys(site).length > 0 ||
    Object.keys(profile).length > 0 ||
    Object.keys(theme).length > 0 ||
    Object.keys(links).length > 0
  ) {
    return normalizeConfigState({
      site,
      profile,
      theme,
      links
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
        links: configs?.links || {}
      }))
    },

    async bootstrapConfig() {
      await this.reloadConfig()
      this.loadThemeFromStorage()
    }
  }
})
