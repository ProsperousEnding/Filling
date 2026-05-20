import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  configureBlogRoutePatterns,
  getArchivePath,
  getArchiveYearPath,
  getArticlePath,
  getArticlesPath,
  getArticlesPagePath,
  getBlogPathPatterns,
  getCategoriesPath,
  getCategoryPath,
  getCategoryPagePath,
  getHomePath,
  getNotFoundPath,
  getSearchPath,
  getTagPath,
  getTagPagePath,
  getTagsPath
} from '../src/framework/router/routeManifest.js'
import { parseArticleDetail } from '../src/framework/adapters/markdown/articleSourceParser.js'
import {
  getCustomMenuPages,
  normalizeMenuConfig,
  resolveMenuPage
} from '../src/framework/utils/menuConfig.js'
import {
  normalizeMenuContentPath,
  parseMenuCollectionDetail,
  parseMenuContextSource,
  sortMenuCollectionItems
} from '../src/framework/adapters/markdown/menuPageSourceParser.js'
import {
  resolveMenuPageComponentKey
} from '../src/framework/utils/pageComponentConfig.js'
import { buildBackgroundCssText, normalizeBackgroundConfig } from '../src/framework/utils/backgroundConfig.js'
import { normalizeCodeBlockConfig } from '../src/framework/utils/codeBlockConfig.js'
import { normalizeCoverConfig } from '../src/framework/utils/coverConfig.js'
import { createSeededArticleCover } from '../src/framework/utils/articleCover.js'
import { buildFontConfigCss, normalizeFontConfig, resolveFontPreloadLinks } from '../src/framework/utils/fontConfig.js'
import { normalizeMarkdownConfig } from '../src/framework/utils/markdownConfig.js'
import { applyConfigEnvOverrides } from '../src/framework/config/configEnvOverrides.js'
import { parseToml } from '../src/framework/utils/tomlParser.js'
import contentIndexData from '../src/framework/generated/contentIndex.generated.js'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const CONFIG_DIR = path.join(ROOT_DIR, 'blog', 'config')
const ARTICLES_DIR = path.join(ROOT_DIR, 'blog', 'content', 'articles')
const STATIC_HOME_ARTICLE_MODES = new Set(['latest', 'featured', 'sticky', 'mixed'])

function toTrimmedString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value)
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toSlugId(input) {
  return toTrimmedString(input)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function toArticleLookupId(input) {
  return toSlugId(input)
}

function normalizeSiteUrl(value) {
  return toTrimmedString(value).replace(/\/+$/g, '')
}

function resolveBasePath() {
  const rawBase = toTrimmedString(process.env.VITE_BASE_PATH)

  if (!rawBase || rawBase === '/') {
    return '/'
  }

  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`
}

function withBasePath(basePath, value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  const normalizedBase = basePath === '/' ? '/' : `/${basePath.replace(/^\/+|\/+$/g, '')}/`
  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')

  return `${normalizedBase}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

function normalizeStaticBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function buildAbsoluteUrl(siteUrl, basePath, routePath) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)

  if (!normalizedSiteUrl) {
    return ''
  }

  const normalizedRoutePath = routePath === '/' ? '' : String(routePath || '').replace(/^\/+/, '')
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/+$/, '')
  const pathWithBase = [normalizedBase, normalizedRoutePath]
    .filter(Boolean)
    .join('/')
    .replace(/^\/+/, '')

  return pathWithBase ? `${normalizedSiteUrl}/${pathWithBase}` : normalizedSiteUrl
}

function formatDateIso(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString()
}

function normalizeDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return toTrimmedString(value)
}

function resolveValidDate(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return null
  }

  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? null : date
}

function resolveArticleHref(article) {
  return getArticlePath(article)
}

async function loadTomlConfig(name) {
  const candidatePaths = [
    path.join(CONFIG_DIR, `${name}.toml`),
    path.join(CONFIG_DIR, 'optional', `${name}.toml`)
  ]

  for (const filePath of candidatePaths) {
    try {
      const raw = await readFile(filePath, 'utf8')
      return parseToml(raw)
    } catch {
      // Try the next supported config location.
    }
  }

  return {}
}

async function loadConfigs() {
  const [site, profile, license, analytics, font, code_block, markdown, background, cover] = await Promise.all([
    loadTomlConfig('site'),
    loadTomlConfig('profile'),
    loadTomlConfig('license'),
    loadTomlConfig('analytics'),
    loadTomlConfig('font'),
    loadTomlConfig('code_block'),
    loadTomlConfig('markdown'),
    loadTomlConfig('background'),
    loadTomlConfig('cover'),
  ])

  return applyConfigEnvOverrides({
    site,
    profile,
    license,
    analytics,
    font,
    code_block,
    markdown,
    background,
    cover,
  }, process.env)
}

async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedEntries = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectMarkdownFiles(absolutePath)
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      return [absolutePath]
    }

    return []
  }))

  return nestedEntries.flat().sort((left, right) => left.localeCompare(right, 'en'))
}

async function loadArticles(defaultLicense = null, codeBlockConfig = null, markdownConfig = null, coverConfig = null) {
  const files = await collectMarkdownFiles(ARTICLES_DIR)

  const items = await Promise.all(files.map(async (filePath) => {
    const rawContent = await readFile(filePath, 'utf8')
    const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/')
    const sourcePath = `/${relativePath}`
    const article = parseArticleDetail(rawContent, sourcePath, {
      defaultLicense,
      codeBlockConfig,
      markdownConfig,
      coverConfig
    })

    return {
      ...article,
      date: normalizeDateValue(article.date),
      createdAt: normalizeDateValue(article.createdAt),
      updatedAt: normalizeDateValue(article.updatedAt),
      author: article.author?.name || ''
    }
  }))

  return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

function loadContentEntries() {
  const entries = Array.isArray(contentIndexData?.entries)
    ? contentIndexData.entries.slice()
    : []

  return entries.sort((left, right) => (
    new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
    || String(left.title || '').localeCompare(String(right.title || ''), 'zh-CN')
  ))
}

function buildCollections(entries) {
  const categories = new Map()
  const tags = new Map()
  const archive = new Map()

  entries.forEach((entry) => {
    if (entry.category?.id) {
      const current = categories.get(entry.category.id) || {
        ...entry.category,
        articleCount: 0,
        articles: []
      }
      current.articleCount += 1
      current.articles.push(entry)
      categories.set(entry.category.id, current)
    }

    ;(Array.isArray(entry.tags) ? entry.tags : []).forEach((tag) => {
      const current = tags.get(tag.id) || {
        ...tag,
        articleCount: 0,
        articles: []
      }
      current.articleCount += 1
      current.articles.push(entry)
      tags.set(tag.id, current)
    })

    const date = resolveValidDate(entry.createdAt)
    const year = date ? date.getFullYear() : null

    if (Number.isFinite(year) && year > 0) {
      const current = archive.get(year) || []
      current.push(entry)
      archive.set(year, current)
    }
  })

  const categoryList = Array.from(categories.values())
    .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name, 'zh-CN'))

  const tagList = Array.from(tags.values())
    .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name, 'zh-CN'))

  const archiveList = Array.from(archive.entries())
    .map(([year, items]) => ({
      year,
      count: items.length,
      articles: items.sort((a, b) => (
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        || String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN')
      ))
    }))
    .sort((a, b) => b.year - a.year)

  return {
    categories: categoryList,
    tags: tagList,
    archive: archiveList
  }
}

function normalizeSeoKeywords(values = []) {
  if (Array.isArray(values)) {
    return values
      .map(value => toTrimmedString(value))
      .filter(Boolean)
  }

  const normalized = toTrimmedString(values)
  if (!normalized) {
    return []
  }

  return normalized
    .split(/[,，]/)
    .map(value => value.trim())
    .filter(Boolean)
}

function normalizeSiteAssetPath(value) {
  const normalizedValue = toTrimmedString(value)

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

function normalizeStaticUrl(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  return normalizedValue
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => toTrimmedString(value))
    .filter(Boolean)
}

function normalizeSeoShareImageFallback(value, fallback = 'site') {
  const normalizedValue = toTrimmedString(value).toLowerCase()
  return ['none', 'site', 'seeded'].includes(normalizedValue) ? normalizedValue : fallback
}

function normalizeTwitterCard(value, fallback = 'summary_large_image') {
  const normalizedValue = toTrimmedString(value).toLowerCase()
  return ['summary', 'summary_large_image'].includes(normalizedValue) ? normalizedValue : fallback
}

function normalizeSeoShareImageConfig(shareImage = {}, legacySeo = {}) {
  const source = shareImage && typeof shareImage === 'object' ? shareImage : {}

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    preferPageImage: typeof source.prefer_page_image === 'boolean'
      ? source.prefer_page_image
      : typeof source.preferPageImage === 'boolean'
        ? source.preferPageImage
        : true,
    fallback: normalizeSeoShareImageFallback(source.fallback),
    defaultImage: normalizeSiteAssetPath(
      source.default_image
      || source.defaultImage
      || source.default
      || source.image
      || legacySeo?.og_image
      || legacySeo?.ogImage
      || legacySeo?.image
      || legacySeo?.image_url
      || legacySeo?.imageUrl
      || legacySeo?.default_image
      || legacySeo?.defaultImage
    ),
    twitterImage: normalizeSiteAssetPath(
      source.twitter_image
      || source.twitterImage
      || source.twitter
      || legacySeo?.twitter_image
      || legacySeo?.twitterImage
    ),
    twitterCard: normalizeTwitterCard(source.twitter_card || source.twitterCard || legacySeo?.twitter_card || legacySeo?.twitterCard),
    seededWidth: normalizePositiveInteger(source.seeded_width || source.seededWidth, 1200),
    seededHeight: normalizePositiveInteger(source.seeded_height || source.seededHeight, 630),
    seededFormat: toTrimmedString(source.seeded_format || source.seededFormat) || 'webp'
  }
}

function normalizeSeoConfig(config = {}) {
  const shareImage = normalizeSeoShareImageConfig(config?.share_image || config?.shareImage, config)

  return {
    lang: toTrimmedString(config?.lang) || 'zh-CN',
    locale: toTrimmedString(config?.locale) || 'zh_CN',
    author: toTrimmedString(config?.author),
    siteStartDate: toTrimmedString(config?.site_start_date || config?.siteStartDate || config?.start_date || config?.startDate),
    timezone: toTrimmedString(config?.timezone || config?.time_zone || config?.timeZone),
    keywords: normalizeSeoKeywords(config?.keywords),
    themeColor: toTrimmedString(config?.theme_color || config?.themeColor) || '#f8fafc',
    favicon: normalizeSiteAssetPath(
      config?.favicon
      || config?.favicon_url
      || config?.faviconUrl
      || config?.icon
      || config?.icon_url
      || config?.iconUrl
    ),
    appleTouchIcon: normalizeSiteAssetPath(
      config?.apple_touch_icon
      || config?.appleTouchIcon
      || config?.touch_icon
      || config?.touchIcon
    ),
    maskIcon: normalizeSiteAssetPath(
      config?.mask_icon
      || config?.maskIcon
      || config?.safari_pinned_tab
      || config?.safariPinnedTab
    ),
    maskIconColor: toTrimmedString(config?.mask_icon_color || config?.maskIconColor),
    ogImage: shareImage.defaultImage || normalizeSiteAssetPath(
      config?.og_image
      || config?.ogImage
      || config?.image
      || config?.image_url
      || config?.imageUrl
      || config?.default_image
      || config?.defaultImage
    ),
    twitterImage: shareImage.twitterImage || normalizeSiteAssetPath(
      config?.twitter_image
      || config?.twitterImage
    ),
    shareImage,
    robots: toTrimmedString(config?.robots) || 'index,follow'
  }
}

function normalizeLicenseRecord(license) {
  if (!license || typeof license !== 'object') {
    return null
  }

  const name = toTrimmedString(license.name)
  const url = normalizeStaticUrl(license.url)

  if (!name && !url) {
    return null
  }

  return {
    name: name || url,
    url
  }
}

function normalizeDefaultLicenseConfig(config = {}) {
  const normalizedConfig = config && typeof config === 'object' ? config : {}
  const defaultLicense = normalizedConfig.default && typeof normalizedConfig.default === 'object'
    ? normalizedConfig.default
    : {}
  const enabledValue = defaultLicense.enabled ?? normalizedConfig.enabled
  const license = normalizeLicenseRecord({
    name: defaultLicense.name || defaultLicense.label || defaultLicense.title || normalizedConfig.name,
    url: defaultLicense.url || defaultLicense.href || normalizedConfig.url || normalizedConfig.href
  })
  const enabled = typeof enabledValue === 'boolean' ? enabledValue : Boolean(license)

  return enabled ? license : null
}

function mergeMetaKeywords(...groups) {
  const uniqueKeywords = new Set()

  groups.flat().forEach((keyword) => {
    const normalizedKeyword = toTrimmedString(keyword)
    if (normalizedKeyword) {
      uniqueKeywords.add(normalizedKeyword)
    }
  })

  return Array.from(uniqueKeywords)
}

function normalizeAnalyticsScriptUrl(value, fallback = '') {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return fallback
  }

  if (/^(https?:)?\/\//i.test(normalizedValue)) {
    return normalizedValue
  }

  return ''
}

function normalizeAnalyticsConfig(config = {}) {
  const normalizedConfig = config && typeof config === 'object' ? config : {}
  const globalEnabled = normalizedConfig.enabled === true
  const umamiSource = normalizedConfig.umami && typeof normalizedConfig.umami === 'object' ? normalizedConfig.umami : {}
  const plausibleSource = normalizedConfig.plausible && typeof normalizedConfig.plausible === 'object' ? normalizedConfig.plausible : {}
  const googleAnalyticsSource = normalizedConfig.google_analytics && typeof normalizedConfig.google_analytics === 'object'
    ? normalizedConfig.google_analytics
    : normalizedConfig.googleAnalytics && typeof normalizedConfig.googleAnalytics === 'object'
      ? normalizedConfig.googleAnalytics
      : {}
  const claritySource = normalizedConfig.clarity && typeof normalizedConfig.clarity === 'object' ? normalizedConfig.clarity : {}

  const umami = {
    enabled: globalEnabled && umamiSource.enabled === true,
    scriptUrl: normalizeAnalyticsScriptUrl(umamiSource.script_url || umamiSource.scriptUrl, 'https://cloud.umami.is/script.js'),
    websiteId: toTrimmedString(umamiSource.website_id || umamiSource.websiteId),
    hostUrl: normalizeAnalyticsScriptUrl(umamiSource.host_url || umamiSource.hostUrl),
    domains: normalizeStringList(umamiSource.domains),
    autoTrack: typeof umamiSource.auto_track === 'boolean' ? umamiSource.auto_track : true,
    doNotTrack: typeof umamiSource.do_not_track === 'boolean' ? umamiSource.do_not_track : true,
    excludeSearch: umamiSource.exclude_search === true,
    excludeHash: umamiSource.exclude_hash === true,
    performance: umamiSource.performance === true,
    tag: toTrimmedString(umamiSource.tag)
  }
  umami.ready = umami.enabled && Boolean(umami.scriptUrl && umami.websiteId)

  const plausible = {
    enabled: globalEnabled && plausibleSource.enabled === true,
    scriptUrl: normalizeAnalyticsScriptUrl(plausibleSource.script_url || plausibleSource.scriptUrl, 'https://plausible.io/js/script.js'),
    domain: toTrimmedString(plausibleSource.domain),
    endpoint: normalizeAnalyticsScriptUrl(plausibleSource.endpoint || plausibleSource.api_host || plausibleSource.apiHost),
    autoCapturePageviews: typeof plausibleSource.auto_capture_pageviews === 'boolean' ? plausibleSource.auto_capture_pageviews : true,
    captureOnLocalhost: typeof plausibleSource.capture_on_localhost === 'boolean' ? plausibleSource.capture_on_localhost : false,
    hashBasedRouting: plausibleSource.hash_based_routing === true,
    outboundLinks: plausibleSource.outbound_links === true,
    fileDownloads: plausibleSource.file_downloads === true,
    taggedEvents: plausibleSource.tagged_events === true
  }
  plausible.ready = plausible.enabled && Boolean(plausible.scriptUrl)

  const googleAnalytics = {
    enabled: globalEnabled && googleAnalyticsSource.enabled === true,
    measurementId: toTrimmedString(googleAnalyticsSource.measurement_id || googleAnalyticsSource.measurementId),
    manualPageviews: typeof googleAnalyticsSource.manual_pageviews === 'boolean' ? googleAnalyticsSource.manual_pageviews : true,
    debugMode: typeof googleAnalyticsSource.debug_mode === 'boolean' ? googleAnalyticsSource.debug_mode : false
  }
  googleAnalytics.ready = googleAnalytics.enabled && Boolean(googleAnalytics.measurementId)

  const clarity = {
    enabled: globalEnabled && claritySource.enabled === true,
    projectId: toTrimmedString(claritySource.project_id || claritySource.projectId)
  }
  clarity.ready = clarity.enabled && Boolean(clarity.projectId)

  return {
    enabled: globalEnabled && (umami.ready || plausible.ready || googleAnalytics.ready || clarity.ready),
    respectDnt: normalizedConfig.respect_dnt === true,
    trackLocalhost: normalizedConfig.track_localhost === true,
    umami,
    plausible,
    googleAnalytics,
    clarity
  }
}

function renderAnalyticsHeadTags(analytics) {
  if (!analytics?.enabled) {
    return ''
  }

  const bootstrapScript = `(function(config){if(!config||!config.enabled){return;}var nav=window.navigator||{};var dntValues=[nav.doNotTrack,window.doNotTrack,nav.msDoNotTrack];var dntEnabled=dntValues.some(function(value){var normalized=String(value||'').trim().toLowerCase();return normalized==='1'||normalized==='yes';});var hostname=String(window.location&&window.location.hostname||'').trim().toLowerCase();var isLocalhost=hostname==='localhost'||hostname==='127.0.0.1'||hostname==='0.0.0.0'||hostname==='::1';if((!config.trackLocalhost&&isLocalhost)||(config.respectDnt&&dntEnabled)){return;}function setAttr(script,name,value){if(value!==''&&value!==null&&value!==undefined){script.setAttribute(name,String(value));}}function ensureAsyncScript(id,src,defer,attrs){if(!src){return;}var existing=document.getElementById(id);if(existing){return;}var script=document.createElement('script');script.id=id;script.async=true;if(defer){script.defer=true;}script.src=src;Object.keys(attrs||{}).forEach(function(name){setAttr(script,name,attrs[name]);});document.head.appendChild(script);}function ensureInlineScript(id,content){if(!content||document.getElementById(id)){return;}var script=document.createElement('script');script.id=id;script.textContent=content;document.head.appendChild(script);}if(config.umami&&config.umami.ready){ensureAsyncScript('blog-analytics-umami-script',config.umami.scriptUrl,true,{'data-website-id':config.umami.websiteId,'data-host-url':config.umami.hostUrl,'data-domains':Array.isArray(config.umami.domains)&&config.umami.domains.length>0?config.umami.domains.join(','):'','data-auto-track':config.umami.autoTrack?'':'false','data-do-not-track':config.umami.doNotTrack?'true':'','data-exclude-search':config.umami.excludeSearch?'true':'','data-exclude-hash':config.umami.excludeHash?'true':'','data-performance':config.umami.performance?'true':'','data-tag':config.umami.tag});}if(config.plausible&&config.plausible.ready){var plausibleOptions={};if(!config.plausible.autoCapturePageviews){plausibleOptions.autoCapturePageviews=false;}if(config.plausible.captureOnLocalhost){plausibleOptions.captureOnLocalhost=true;}if(config.plausible.hashBasedRouting){plausibleOptions.hashBasedRouting=true;}if(config.plausible.outboundLinks){plausibleOptions.outboundLinks=true;}if(config.plausible.fileDownloads){plausibleOptions.fileDownloads=true;}if(config.plausible.taggedEvents){plausibleOptions.taggedEvents=true;}if(config.plausible.endpoint){plausibleOptions.endpoint=config.plausible.endpoint;}var plausibleInline='window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};window.plausible.init=window.plausible.init||function(options){window.plausible.q=window.plausible.q||[];window.plausible.q.push(["init",options||{}])};'+(Object.keys(plausibleOptions).length>0?'window.plausible.init('+JSON.stringify(plausibleOptions)+');':'window.plausible.init();');ensureInlineScript('blog-analytics-plausible-inline',plausibleInline);ensureAsyncScript('blog-analytics-plausible-script',config.plausible.scriptUrl,true,{'data-domain':config.plausible.domain});}if(config.googleAnalytics&&config.googleAnalytics.ready){var gaOptions={};if(config.googleAnalytics.manualPageviews){gaOptions.send_page_view=false;}if(config.googleAnalytics.debugMode){gaOptions.debug_mode=true;}var gaInline='window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config",'+JSON.stringify(config.googleAnalytics.measurementId)+','+JSON.stringify(gaOptions)+');';ensureAsyncScript('blog-analytics-ga-script','https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.googleAnalytics.measurementId),false,{});ensureInlineScript('blog-analytics-ga-inline',gaInline);}if(config.clarity&&config.clarity.ready){var clarityInline='(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",'+JSON.stringify(config.clarity.projectId)+');';ensureInlineScript('blog-analytics-clarity-inline',clarityInline);}})(${JSON.stringify(analytics)});`

  return `<script id="blog-analytics-bootstrap">${bootstrapScript}</script>`
}

function resolveMenuPageVariant(page) {
  return resolveMenuPageComponentKey(page?.component)
}

function paginateItems(items, pageSize = 10) {
  const normalizedItems = Array.isArray(items) ? items : []
  const resolvedPageSize = normalizePositiveInteger(pageSize, 10)
  const totalPages = Math.max(1, Math.ceil(normalizedItems.length / resolvedPageSize))

  return Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1
    const start = index * resolvedPageSize
    const end = start + resolvedPageSize

    return {
      page,
      totalPages,
      items: normalizedItems.slice(start, end)
    }
  })
}

function splitMenuPageContent(content = '') {
  return String(content || '')
    .trim()
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
}

function createStaticLookupSet(values = [], normalize = toSlugId) {
  return new Set((Array.isArray(values) ? values : [])
    .map(value => normalize(value))
    .filter(Boolean))
}

function normalizeStaticHomeArticlesConfig(source = {}, fallbackPageSize = 10) {
  const rawMode = toTrimmedString(source.mode).toLowerCase()

  return {
    mode: STATIC_HOME_ARTICLE_MODES.has(rawMode) ? rawMode : 'latest',
    pageSize: normalizePositiveInteger(source.page_size ?? source.pageSize, fallbackPageSize || 8),
    paginate: normalizeStaticBoolean(source.paginate, true),
    includeSticky: normalizeStaticBoolean(source.include_sticky ?? source.includeSticky, true),
    stickyFirst: normalizeStaticBoolean(source.sticky_first ?? source.stickyFirst, true),
    categories: Array.isArray(source.categories) ? source.categories : [],
    tags: Array.isArray(source.tags) ? source.tags : [],
    excludeCategories: Array.isArray(source.exclude_categories ?? source.excludeCategories)
      ? (source.exclude_categories ?? source.excludeCategories)
      : [],
    excludeTags: Array.isArray(source.exclude_tags ?? source.excludeTags)
      ? (source.exclude_tags ?? source.excludeTags)
      : [],
    includeIds: Array.isArray(source.include_ids ?? source.includeIds)
      ? (source.include_ids ?? source.includeIds)
      : [],
    excludeIds: Array.isArray(source.exclude_ids ?? source.excludeIds)
      ? (source.exclude_ids ?? source.excludeIds)
      : [],
    fallbackToLatest: normalizeStaticBoolean(source.fallback_to_latest ?? source.fallbackToLatest, true)
  }
}

function getStaticArticleIdentityValues(article = {}) {
  return [
    article.id,
    article.slug,
    article.title,
    article.sourcePath
  ]
    .map(toArticleLookupId)
    .filter(Boolean)
}

function staticArticleMatchesAnyIdentity(article, lookupSet) {
  if (!(lookupSet instanceof Set) || lookupSet.size === 0) {
    return false
  }

  return getStaticArticleIdentityValues(article).some(value => lookupSet.has(value))
}

function staticArticleMatchesCategory(article, categorySet) {
  if (!(categorySet instanceof Set) || categorySet.size === 0) {
    return true
  }

  return categorySet.has(toSlugId(article?.category?.id || article?.category?.name || article?.category))
}

function staticArticleMatchesTags(article, tagSet) {
  if (!(tagSet instanceof Set) || tagSet.size === 0) {
    return true
  }

  return Array.isArray(article?.tags) && article.tags.some(tag => (
    tagSet.has(toSlugId(tag?.id || tag?.name || tag))
  ))
}

function sortStaticHomeArticles(left, right, stickyFirst = true) {
  if (stickyFirst && Boolean(left?.sticky) !== Boolean(right?.sticky)) {
    return left?.sticky ? -1 : 1
  }

  const weightDiff = (Number(right?.weight) || 0) - (Number(left?.weight) || 0)

  if (weightDiff !== 0) {
    return weightDiff
  }

  return new Date(right?.date || 0) - new Date(left?.date || 0)
}

function resolveStaticHomeArticles(articles = [], config = {}) {
  const normalizedArticles = Array.isArray(articles) ? articles : []
  const mode = toTrimmedString(config.mode || 'latest').toLowerCase()
  const includeIds = createStaticLookupSet(config.includeIds, toArticleLookupId)
  const excludeIds = createStaticLookupSet(config.excludeIds, toArticleLookupId)
  const categories = createStaticLookupSet(config.categories, toSlugId)
  const tags = createStaticLookupSet(config.tags, toSlugId)
  const excludeCategories = createStaticLookupSet(config.excludeCategories, toSlugId)
  const excludeTags = createStaticLookupSet(config.excludeTags, toSlugId)
  const includeSticky = config.includeSticky !== false
  const stickyFirst = config.stickyFirst !== false
  const fallbackToLatest = config.fallbackToLatest !== false

  const baseArticles = normalizedArticles.filter((article) => {
    if (article.homeHidden || staticArticleMatchesAnyIdentity(article, excludeIds)) {
      return false
    }

    if (excludeCategories.size > 0 && staticArticleMatchesCategory(article, excludeCategories)) {
      return false
    }

    if (excludeTags.size > 0 && staticArticleMatchesTags(article, excludeTags)) {
      return false
    }

    const explicitlyIncluded = staticArticleMatchesAnyIdentity(article, includeIds)

    return explicitlyIncluded
      || (staticArticleMatchesCategory(article, categories) && staticArticleMatchesTags(article, tags))
  })

  let selectedArticles = baseArticles

  if (mode === 'featured') {
    selectedArticles = baseArticles.filter(article => article.featured || staticArticleMatchesAnyIdentity(article, includeIds))
  } else if (mode === 'sticky') {
    selectedArticles = baseArticles.filter(article => article.sticky || staticArticleMatchesAnyIdentity(article, includeIds))
  } else if (mode === 'mixed') {
    selectedArticles = baseArticles.filter(article => (
      article.featured
      || article.sticky
      || staticArticleMatchesAnyIdentity(article, includeIds)
    ))
  }

  if (selectedArticles.length === 0 && fallbackToLatest) {
    selectedArticles = baseArticles
  }

  return selectedArticles
    .filter(article => includeSticky || !article.sticky || staticArticleMatchesAnyIdentity(article, includeIds))
    .slice()
    .sort((left, right) => sortStaticHomeArticles(left, right, stickyFirst))
}

async function loadStaticMenuPageSource(page, componentKey, codeBlockConfig = null, markdownConfig = null, coverConfig = null) {
  const normalizedComponentKey = resolveMenuPageComponentKey(componentKey)

  if (normalizedComponentKey === 'friends' || normalizedComponentKey === 'guestbook' || normalizedComponentKey === 'sponsor') {
    return {
      items: [],
      records: []
    }
  }

  if (normalizedComponentKey === 'context') {
    const relativeFilePath = normalizeMenuContentPath(page?.file, { kind: 'file' })

    if (!relativeFilePath) {
      return {
        title: '',
        description: '',
        content: '',
        contentHtml: ''
      }
    }

    const absoluteFilePath = path.join(ROOT_DIR, 'blog', 'content', relativeFilePath)

    try {
      const rawContent = await readFile(absoluteFilePath, 'utf8')
      return parseMenuContextSource(rawContent, path.posix.join('/blog/content', relativeFilePath), {
        codeBlockConfig,
        markdownConfig,
        coverConfig
      })
    } catch {
      return {
        title: '',
        description: '',
        content: '',
        contentHtml: ''
      }
    }
  }

  const relativeFolderPath = normalizeMenuContentPath(page?.folder, { kind: 'folder' })

  if (!relativeFolderPath) {
    return {
      items: [],
      records: []
    }
  }

  const absoluteFolderPath = path.join(ROOT_DIR, 'blog', 'content', relativeFolderPath)

  try {
    const entries = await readdir(absoluteFolderPath, { withFileTypes: true })
    const fileEntries = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))

    const items = await Promise.all(fileEntries.map(async (entry) => {
      const absoluteFilePath = path.join(absoluteFolderPath, entry.name)
      const sourcePath = path.posix.join('/blog/content', relativeFolderPath, entry.name)
      const rawContent = await readFile(absoluteFilePath, 'utf8')
      return parseMenuCollectionDetail(rawContent, sourcePath, {
        pagePath: page.path,
        codeBlockConfig,
        markdownConfig,
        coverConfig
      })
    }))
    const sortedItems = sortMenuCollectionItems(items)

    return {
      items: sortedItems.map(({
        order,
        date,
        content,
        contentHtml,
        plainText,
        detailDescription,
        sourcePath,
        ...item
      }) => item),
      records: sortedItems
    }
  } catch {
    return {
      items: [],
      records: []
    }
  }
}

function injectHead(template, {
  title,
  description,
  absoluteUrl,
  imageUrl,
  ogType,
  robots,
  lang,
  locale,
  author,
  subtitle,
  siteStartDate,
  timezone,
  keywords,
  faviconHref,
  appleTouchIconHref,
  maskIconHref,
  maskIconColor,
  themeColor,
  siteName,
  twitterImageUrl,
  twitterCard,
  analyticsHeadTags,
  fontHeadTags,
  backgroundHeadTags
}) {
  const headTags = [
    description ? `<meta name="description" content="${escapeAttribute(description)}" />` : '',
    author ? `<meta name="author" content="${escapeAttribute(author)}" />` : '',
    keywords ? `<meta name="keywords" content="${escapeAttribute(keywords)}" />` : '',
    siteName ? `<meta name="application-name" content="${escapeAttribute(siteName)}" />` : '',
    subtitle ? `<meta name="subtitle" content="${escapeAttribute(subtitle)}" />` : '',
    siteStartDate ? `<meta name="site-start-date" content="${escapeAttribute(siteStartDate)}" />` : '',
    timezone ? `<meta name="timezone" content="${escapeAttribute(timezone)}" />` : '',
    themeColor ? `<meta name="theme-color" content="${escapeAttribute(themeColor)}" />` : '',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    siteName ? `<meta property="og:site_name" content="${escapeAttribute(siteName)}" />` : '',
    description ? `<meta property="og:description" content="${escapeAttribute(description)}" />` : '',
    locale ? `<meta property="og:locale" content="${escapeAttribute(locale)}" />` : '',
    ogType ? `<meta property="og:type" content="${escapeAttribute(ogType)}" />` : '',
    absoluteUrl ? `<meta property="og:url" content="${escapeAttribute(absoluteUrl)}" />` : '',
    imageUrl ? `<meta property="og:image" content="${escapeAttribute(imageUrl)}" />` : '',
    `<meta name="twitter:card" content="${escapeAttribute(twitterCard || (twitterImageUrl || imageUrl ? 'summary_large_image' : 'summary'))}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeAttribute(description)}" />` : '',
    (twitterImageUrl || imageUrl) ? `<meta name="twitter:image" content="${escapeAttribute(twitterImageUrl || imageUrl)}" />` : '',
    absoluteUrl ? `<link rel="canonical" href="${escapeAttribute(absoluteUrl)}" />` : '',
    robots ? `<meta name="robots" content="${escapeAttribute(robots)}" />` : '',
    faviconHref ? `<link rel="icon" href="${escapeAttribute(faviconHref)}" />` : '',
    appleTouchIconHref ? `<link rel="apple-touch-icon" href="${escapeAttribute(appleTouchIconHref)}" />` : '',
    maskIconHref ? `<link rel="mask-icon" href="${escapeAttribute(maskIconHref)}"${maskIconColor ? ` color="${escapeAttribute(maskIconColor)}"` : ''} />` : '',
    fontHeadTags || '',
    backgroundHeadTags || '',
    analyticsHeadTags || ''
  ].filter(Boolean).join('\n    ')

  const nextTemplate = template
    .replace(/<html\b([^>]*)\blang="[^"]*"([^>]*)>/i, `<html$1lang="${escapeAttribute(lang || 'zh-CN')}"$2>`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  return nextTemplate.replace('</head>', `    ${headTags}\n  </head>`)
}

function replaceAppRoot(template, markup) {
  return template.replace('<div id="app"></div>', `<div id="app">${markup}</div>`)
}

function renderFontHeadTags(fontConfig, basePath) {
  const cssText = buildFontConfigCss(fontConfig, basePath)
  const preloadTags = resolveFontPreloadLinks(fontConfig, basePath)
    .map((descriptor) => {
      const typeAttribute = descriptor.type ? ` type="${escapeAttribute(descriptor.type)}"` : ''
      const crossoriginAttribute = descriptor.crossorigin ? ` crossorigin="${escapeAttribute(descriptor.crossorigin)}"` : ''
      return `<link rel="preload" as="font" href="${escapeAttribute(descriptor.href)}"${typeAttribute}${crossoriginAttribute} />`
    })
    .join('\n    ')

  const styleTag = cssText
    ? `<style id="vue-blog-static-font">${cssText}</style>`
    : ''

  return [preloadTags, styleTag].filter(Boolean).join('\n    ')
}

function renderBackgroundHeadTags(backgroundConfig, basePath) {
  const cssText = buildBackgroundCssText(backgroundConfig, basePath)

  return cssText
    ? `<style id="vue-blog-static-background">:root { ${cssText} }</style>`
    : ''
}

function buildSeededShareImage(seed, shareImageConfig = {}) {
  return createSeededArticleCover(seed || 'site-share-image', {
    width: shareImageConfig.seededWidth,
    height: shareImageConfig.seededHeight,
    format: shareImageConfig.seededFormat
  })
}

function resolveAbsoluteShareImageUrl(site = {}, basePath = '/', value = '') {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  return buildAbsoluteUrl(site.site_url || site.url, basePath, normalizedValue)
}

function resolveShareImageUrl({ route = {}, seo = {}, site = {}, basePath = '/', twitter = false } = {}) {
  const shareImage = seo.shareImage || {}

  if (shareImage.enabled === false) {
    return ''
  }

  if (shareImage.preferPageImage !== false && route.imageUrl) {
    return resolveAbsoluteShareImageUrl(site, basePath, route.imageUrl)
  }

  const configuredImage = twitter
    ? (shareImage.twitterImage || shareImage.defaultImage || seo.twitterImage || seo.ogImage)
    : (shareImage.defaultImage || seo.ogImage)

  if (configuredImage) {
    return resolveAbsoluteShareImageUrl(site, basePath, configuredImage)
  }

  if (shareImage.fallback === 'seeded') {
    return buildSeededShareImage(
      route.imageSeed || route.pageTitle || route.path || 'site-share-image',
      shareImage
    )
  }

  return ''
}

async function writeRouteFile(routePath, html) {
  const normalized = routePath === '/' ? '' : decodeURIComponent(String(routePath).replace(/^\/+|\/+$/g, ''))
  const filePath = normalized
    ? path.join(DIST_DIR, normalized, 'index.html')
    : path.join(DIST_DIR, 'index.html')

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

function renderPage(route, context) {
  const {
    site,
    profile,
    basePath
  } = context
  const seo = normalizeSeoConfig(site.seo)
  const analyticsHeadTags = renderAnalyticsHeadTags(context.analytics)
  const fontHeadTags = renderFontHeadTags(context.font, basePath)
  const backgroundHeadTags = renderBackgroundHeadTags(context.background, basePath)
  const siteTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const siteSubtitle = toTrimmedString(site.subtitle)
  const pageTitle = route.pageTitle ? `${route.pageTitle} - ${siteTitle}` : siteTitle
  const description = route.description || toTrimmedString(site.description) || siteSubtitle || toTrimmedString(profile.tagline)
  const absoluteUrl = buildAbsoluteUrl(site.site_url || site.url, basePath, route.path)
  const imageUrl = resolveShareImageUrl({ route, seo, site, basePath })
  const twitterImageUrl = resolveShareImageUrl({ route, seo, site, basePath, twitter: true })
  const keywords = mergeMetaKeywords(route.keywords || [], seo.keywords).join(', ')
  const faviconHref = seo.favicon ? withBasePath(basePath, seo.favicon) : ''
  const appleTouchIconHref = seo.appleTouchIcon ? withBasePath(basePath, seo.appleTouchIcon) : ''
  const maskIconHref = seo.maskIcon ? withBasePath(basePath, seo.maskIcon) : ''

  const withHead = injectHead(context.template, {
    title: pageTitle,
    description,
    absoluteUrl,
    imageUrl,
    ogType: route.ogType || 'website',
    robots: route.robots || seo.robots || '',
    lang: seo.lang,
    locale: seo.locale,
    author: seo.author,
    subtitle: siteSubtitle,
    siteStartDate: seo.siteStartDate,
    timezone: seo.timezone,
    keywords,
    faviconHref,
    appleTouchIconHref,
    maskIconHref,
    maskIconColor: seo.maskIconColor,
    themeColor: seo.themeColor,
    siteName: siteTitle,
    twitterImageUrl,
    twitterCard: twitterImageUrl || imageUrl ? seo.shareImage?.twitterCard || 'summary_large_image' : 'summary',
    analyticsHeadTags,
    fontHeadTags,
    backgroundHeadTags
  })

  return replaceAppRoot(withHead, '')
}

async function createPageRoutes(context) {
  const { site, articles, categories, tags, archive, pageSize, routePatterns, menus } = context
  const routes = []
  const articlePages = paginateItems(articles, pageSize)
  const homeArticleConfig = normalizeStaticHomeArticlesConfig(site.home_articles || site.homeArticles, pageSize || 8)
  const homeArticles = resolveStaticHomeArticles(articles, homeArticleConfig)
  const homeArticlePages = homeArticleConfig.paginate === false
    ? [{ page: 1, totalPages: 1, items: homeArticles.slice(0, homeArticleConfig.pageSize) }]
    : paginateItems(homeArticles, homeArticleConfig.pageSize)
  const homePage = resolveMenuPage('home', menus, routePatterns)
  const articlesPageConfig = resolveMenuPage('articles', menus, routePatterns)
  const categoriesPage = resolveMenuPage('categories', menus, routePatterns)
  const tagsPage = resolveMenuPage('tags', menus, routePatterns)
  const archivePage = resolveMenuPage('archive', menus, routePatterns)
  const searchPage = resolveMenuPage('search', menus, routePatterns)

  if (homePage) {
    routes.push({
      path: getHomePath(),
      pageTitle: homePage.title || '最新文章',
      description: homePage.description || '浏览站点最新发布的文章内容。'
    })
  }

  if (articlesPageConfig) {
    routes.push({
      path: getArticlesPath(),
      pageTitle: articlesPageConfig.title || '所有文章',
      description: articlesPageConfig.description || '浏览站点全部文章列表。'
    })

    articlePages.slice(1).forEach((pageGroup) => {
      routes.push({
        path: getArticlesPagePath(pageGroup.page),
        pageTitle: `${articlesPageConfig.title || '所有文章'} - 第 ${pageGroup.page} 页`,
        description: `${articlesPageConfig.description || '浏览站点全部文章列表。'} 第 ${pageGroup.page} 页。`
      })
    })
  }

  if (categoriesPage) {
    routes.push({
      path: getCategoriesPath(),
      pageTitle: categoriesPage.title || '内容分类',
      description: categoriesPage.description || '浏览站点所有内容分类。'
    })

    categories.forEach((category) => {
      const categoryPages = paginateItems(category.articles, pageSize)

      routes.push({
        path: getCategoryPath(category),
        pageTitle: `分类：${category.name}`,
        description: `浏览分类 ${category.name} 下的内容。`,
        keywords: [category.name, '分类']
      })

      categoryPages.slice(1).forEach((pageGroup) => {
        routes.push({
          path: getCategoryPagePath(category, pageGroup.page),
          pageTitle: `分类：${category.name} - 第 ${pageGroup.page} 页`,
          description: `浏览分类 ${category.name} 下的内容，第 ${pageGroup.page} 页。`,
          keywords: [category.name, '分类']
        })
      })
    })
  }

  if (tagsPage) {
    routes.push({
      path: getTagsPath(),
      pageTitle: tagsPage.title || '内容标签',
      description: tagsPage.description || '浏览站点所有内容标签。'
    })

    tags.forEach((tag) => {
      const tagPages = paginateItems(tag.articles, pageSize)

      routes.push({
        path: getTagPath(tag),
        pageTitle: `标签：${tag.name}`,
        description: `浏览标签 ${tag.name} 下的内容。`,
        keywords: [tag.name, '标签']
      })

      tagPages.slice(1).forEach((pageGroup) => {
        routes.push({
          path: getTagPagePath(tag, pageGroup.page),
          pageTitle: `标签：${tag.name} - 第 ${pageGroup.page} 页`,
          description: `浏览标签 ${tag.name} 下的内容，第 ${pageGroup.page} 页。`,
          keywords: [tag.name, '标签']
        })
      })
    })
  }

  if (archivePage) {
    routes.push({
      path: getArchivePath(),
      pageTitle: archivePage.title || '内容归档',
      description: archivePage.description || '按年份浏览站点归档内容。'
    })

    archive.forEach((group) => {
      const year = Number(group?.year)
      const articleCount = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)

      if (!Number.isFinite(year)) {
        return
      }

      routes.push({
        path: getArchiveYearPath(year),
        pageTitle: `${year} 年归档`,
        description: `浏览 ${year} 年发布的归档内容，共 ${articleCount} 项。`,
        keywords: [String(year), '归档']
      })
    })
  }

  if (searchPage) {
    routes.push({
      path: getSearchPath(),
      pageTitle: searchPage.title || '搜索',
      description: searchPage.description || '搜索站点中的文章内容。',
      robots: 'noindex,follow',
      sitemap: false
    })
  }

  articles.forEach((article) => {
    routes.push({
      path: getArticlePath(article),
      isArticlePage: true,
      pageTitle: article.title,
      description: article.description || article.summary || article.excerpt,
      ogType: 'article',
      imageUrl: article.cover,
      keywords: [
        article.category?.name || '',
        ...((Array.isArray(article.tags) ? article.tags : []).map(tag => tag?.name || ''))
      ],
      lastmod: article.updatedAt || article.createdAt || article.date
    })
  })

  const customPages = await Promise.all(getCustomMenuPages(menus, routePatterns).map(async (page) => {
    const pageVariant = resolveMenuPageVariant(page)
    const usesFileSource = pageVariant === 'context' && Boolean(page.file)
    const usesFolderSource = pageVariant !== 'context' && pageVariant !== 'friends' && pageVariant !== 'guestbook' && pageVariant !== 'sponsor' && Boolean(page.folder)
    const loadedSource = usesFileSource || usesFolderSource
      ? await loadStaticMenuPageSource(page, pageVariant, context.codeBlock, context.markdown, context.cover)
      : {}
    const pageContent = usesFileSource ? loadedSource.content || '' : page.content || ''
    const contentBlocks = splitMenuPageContent(pageContent)

    return {
      page,
      loadedSource,
      usesFileSource,
      records: usesFolderSource && Array.isArray(loadedSource.records) ? loadedSource.records : [],
      description: page.description || loadedSource.description || contentBlocks[0] || `${page.title} 页面`,
      imageUrl: usesFileSource
        ? (page.cover || page.image || loadedSource.cover || '')
        : (page.cover || page.image || '')
    }
  }))

  customPages.forEach(({ page, records, description, imageUrl }) => {
    routes.push({
      path: page.path,
      pageTitle: page.title,
      description,
      imageUrl
    })

    records.forEach((item) => {
      routes.push({
        path: item.to,
        pageTitle: item.title,
        description: item.detailDescription || item.description || `${item.title} - ${page.title}`,
        imageUrl: item.cover || item.imageUrl || item.image || ''
      })
    })
  })

  return routes
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function writeSitemap(routes, siteUrl, basePath) {
  const entries = routes
    .filter(route => route.sitemap !== false)
    .map((route) => {
      const loc = buildAbsoluteUrl(siteUrl, basePath, route.path)

      if (!loc) {
        return null
      }

      const lastmod = formatDateIso(route.lastmod)

      return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    ${lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ''}
  </url>`.trimEnd()
    })
    .filter(Boolean)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8')
}

async function writeRss(articles, site, profile, siteUrl, basePath) {
  const channelTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const channelDescription = toTrimmedString(site.description) || toTrimmedString(profile.tagline) || 'Blog feed'
  const channelLink = buildAbsoluteUrl(siteUrl, basePath, '/')
  const items = articles
    .slice(0, 20)
    .map((article) => {
      const link = buildAbsoluteUrl(siteUrl, basePath, resolveArticleHref(article))
      const pubDate = formatDateIso(article.createdAt || article.date)
      const description = article.description || article.summary || article.excerpt

      return `
  <item>
    <title>${xmlEscape(article.title)}</title>
    ${link ? `<link>${xmlEscape(link)}</link>` : ''}
    ${link ? `<guid>${xmlEscape(link)}</guid>` : ''}
    ${pubDate ? `<pubDate>${new Date(pubDate).toUTCString()}</pubDate>` : ''}
    ${description ? `<description><![CDATA[${description}]]></description>` : ''}
    <content:encoded><![CDATA[${article.content}]]></content:encoded>
  </item>`.trimEnd()
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    ${channelLink ? `<link>${xmlEscape(channelLink)}</link>` : ''}
    <description>${xmlEscape(channelDescription)}</description>
${items}
  </channel>
</rss>
`

  await writeFile(path.join(DIST_DIR, 'rss.xml'), xml, 'utf8')
}

async function writeRobots(siteUrl, basePath) {
  const sitemapUrl = buildAbsoluteUrl(siteUrl, basePath, '/sitemap.xml')
  const content = [
    'User-agent: *',
    'Allow: /',
    sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''
  ].filter(Boolean).join('\n')

  await writeFile(path.join(DIST_DIR, 'robots.txt'), `${content}\n`, 'utf8')
}

async function write404(template, context) {
  const html = renderPage({
    path: getNotFoundPath(),
    pageTitle: '页面未找到',
    description: '您访问的页面不存在。',
    robots: 'noindex,follow',
    staticPreview: true,
    content: `
      <header class="ssg-page-header">
        <h1 class="ssg-page-title">页面未找到</h1>
        <p class="ssg-page-description">这个链接可能已经失效，或者地址输入有误。</p>
      </header>
      <div class="ssg-empty">您可以返回首页，或继续浏览最新文章。</div>
    `
  }, {
    ...context,
    template
  })

  await writeFile(path.join(DIST_DIR, '404.html'), html, 'utf8')
}

async function writeNoJekyll() {
  await writeFile(path.join(DIST_DIR, '.nojekyll'), '\n', 'utf8')
}

async function main() {
  const basePath = resolveBasePath()
  const [template, configs] = await Promise.all([
    readFile(path.join(DIST_DIR, 'index.html'), 'utf8'),
    loadConfigs()
  ])
  const defaultLicense = normalizeDefaultLicenseConfig(configs.license)
  const codeBlock = normalizeCodeBlockConfig(configs.code_block)
  const markdown = normalizeMarkdownConfig(configs.markdown)
  const background = normalizeBackgroundConfig(configs.background)
  const cover = normalizeCoverConfig(configs.cover)
  const articles = await loadArticles(defaultLicense, codeBlock, markdown, cover)
  const contentEntries = loadContentEntries()
  configureBlogRoutePatterns(configs?.site?.routing)
  const routePatterns = getBlogPathPatterns()
  const collections = buildCollections(contentEntries)
  const menus = normalizeMenuConfig(configs.site.menus)
  const siteUrl = normalizeSiteUrl(configs.site.site_url || configs.site.url)
  const font = normalizeFontConfig(configs.font)
  const context = {
    template,
    site: configs.site,
    profile: configs.profile,
    font,
    markdown,
    background,
    cover,
    codeBlock,
    analytics: normalizeAnalyticsConfig(configs.analytics),
    defaultLicense,
    articles,
    contentEntries,
    categories: collections.categories,
    tags: collections.tags,
    archive: collections.archive,
    menus,
    routePatterns,
    basePath,
    pageSize: Number(configs.site?.pagination?.page_size) || 10
  }
  const routes = await createPageRoutes(context)

  await Promise.all(routes.map(async (route) => {
    const html = renderPage(route, context)
    await writeRouteFile(route.path, html)
  }))

  await write404(template, context)
  await writeNoJekyll()
  await writeSitemap(routes, siteUrl, basePath)
  await writeRss(articles, configs.site, configs.profile, siteUrl, basePath)
  await writeRobots(siteUrl, basePath)
}

main().catch((error) => {
  console.error('静态页面生成失败:', error)
  process.exitCode = 1
})
