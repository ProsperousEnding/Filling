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
import { stripMenuCollectionDetail } from '../src/framework/utils/menuPageSource.js'
import {
  resolveMenuPageComponentKey
} from '../src/framework/utils/pageComponentConfig.js'
import { normalizeCodeBlockConfig } from '../src/framework/utils/codeBlockConfig.js'
import { normalizeCoverConfig } from '../src/framework/utils/coverConfig.js'
import { createSeededArticleCover } from '../src/framework/utils/articleCover.js'
import { normalizeAnalyticsConfig } from '../src/framework/utils/analyticsConfig.js'
import { resolveFeatureMenuConfig } from '../src/framework/utils/featurePageConfig.js'
import { selectHomeArticles } from '../src/framework/utils/homeArticleSelection.js'
import { buildFontConfigCss, normalizeFontConfig, resolveFontPreloadLinks } from '../src/framework/utils/fontConfig.js'
import { normalizeMarkdownConfig } from '../src/framework/utils/markdownConfig.js'
import {
  buildAbsoluteUrl,
  normalizeSiteUrl,
  resolveShareImageUrl as resolveMetadataShareImageUrl
} from '../src/framework/utils/pageMetadataModel.js'
import { applyConfigEnvOverrides } from '../src/framework/config/configEnvOverrides.js'
import { resolveThemePresetAssetPath } from '../src/framework/utils/themeAsset.js'
import contentIndexData from '../src/framework/generated/contentIndex.generated.js'
import { readFirstTomlConfig } from './read-toml-config.mjs'
import { resolveStaticRouteOutputFile } from './static-route-output.mjs'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const CONFIG_DIR = path.join(ROOT_DIR, 'blog', 'config')
const ARTICLES_DIR = path.join(ROOT_DIR, 'blog', 'content', 'articles')

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

function withStaticRoutePath(context, value) {
  const routePath = toTrimmedString(value)
  const href = withBasePath(context.basePath, routePath)

  if (
    !href
    || href.endsWith('/')
    || routePath === '/'
    || !context.staticRoutePaths?.has(routePath)
  ) {
    return href
  }

  return `${href}/`
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
  return readFirstTomlConfig([
    path.join(CONFIG_DIR, `${name}.toml`),
    path.join(CONFIG_DIR, 'optional', `${name}.toml`)
  ])
}

async function loadConfigs() {
  const [
    site,
    profile,
    license,
    analytics,
    font,
    code_block,
    markdown,
    cover,
    theme,
    guestbook,
    sponsor
  ] = await Promise.all([
    loadTomlConfig('site'),
    loadTomlConfig('profile'),
    loadTomlConfig('license'),
    loadTomlConfig('analytics'),
    loadTomlConfig('font'),
    loadTomlConfig('code_block'),
    loadTomlConfig('markdown'),
    loadTomlConfig('cover'),
    loadTomlConfig('theme'),
    loadTomlConfig('guestbook'),
    loadTomlConfig('sponsor')
  ])

  return applyConfigEnvOverrides({
    site,
    profile,
    license,
    analytics,
    font,
    code_block,
    markdown,
    cover,
    theme,
    guestbook,
    sponsor
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

export async function loadStaticMenuPageSource(
  page,
  componentKey,
  codeBlockConfig = null,
  markdownConfig = null,
  coverConfig = null,
  contentDirectory = path.join(ROOT_DIR, 'blog', 'content')
) {
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

    const absoluteFilePath = path.join(contentDirectory, relativeFilePath)

    try {
      const rawContent = await readFile(absoluteFilePath, 'utf8')
      return parseMenuContextSource(rawContent, path.posix.join('/blog/content', relativeFilePath), {
        codeBlockConfig,
        markdownConfig,
        coverConfig
      })
    } catch (error) {
      throw new Error(
        `Failed to load menu page "${page?.key || 'unknown'}" from blog/content/${relativeFilePath}.`,
        { cause: error }
      )
    }
  }

  const relativeFolderPath = normalizeMenuContentPath(page?.folder, { kind: 'folder' })

  if (!relativeFolderPath) {
    return {
      items: [],
      records: []
    }
  }

  const absoluteFolderPath = path.join(contentDirectory, relativeFolderPath)

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
      items: sortedItems.map(stripMenuCollectionDetail),
      records: sortedItems
    }
  } catch (error) {
    throw new Error(
      `Failed to load menu page "${page?.key || 'unknown'}" from blog/content/${relativeFolderPath}.`,
      { cause: error }
    )
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
  themeHeadTags,
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
    themeHeadTags || '',
    fontHeadTags || '',
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

const STATIC_PREVIEW_STYLE = `<style id="vue-blog-static-preview-style">
  .ssg-shell{min-height:100vh;min-height:100dvh;background:var(--theme-body-background,#f8fafc);color:var(--theme-body-color,#0f172a);font-family:var(--font-sans,ui-sans-serif,system-ui,sans-serif)}
  .ssg-header{border-bottom:1px solid var(--theme-header-border,rgba(148,163,184,.2));background:var(--theme-header-bg,rgba(255,255,255,.9))}
  .ssg-header-inner,.ssg-main,.ssg-footer-inner{width:min(72rem,calc(100% - 2rem));margin:0 auto}
  .ssg-header-inner{min-height:3.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .ssg-brand{color:var(--theme-heading-color,#0f172a);font-size:1.05rem;font-weight:700;text-decoration:none}
  .ssg-nav{display:flex;flex-wrap:wrap;gap:.35rem}
  .ssg-nav a{padding:.35rem .55rem;border-radius:.45rem;color:var(--theme-text-soft,#64748b);font-size:.875rem;text-decoration:none}
  .ssg-nav a:hover,.ssg-nav a:focus-visible{background:var(--theme-chip-surface,#f1f5f9);color:var(--theme-heading-color,#0f172a)}
  .ssg-main{padding:2.25rem 0 4rem}
  .ssg-page-header{margin-bottom:1.75rem}
  .ssg-page-title{margin:0;color:var(--theme-heading-color,#0f172a);font-size:clamp(1.75rem,4vw,2.35rem);line-height:1.2}
  .ssg-page-description{max-width:48rem;margin:.7rem 0 0;color:var(--theme-text-soft,#64748b);line-height:1.75}
  .ssg-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem;margin:0;padding:0;list-style:none}
  .ssg-list-item{height:100%;padding:1rem 1.1rem;border:1px solid var(--theme-border,rgba(148,163,184,.2));border-radius:.65rem;background:var(--theme-panel-background,rgba(255,255,255,.82));box-sizing:border-box}
  .ssg-list-title{margin:0;font-size:1rem;line-height:1.45}
  .ssg-list-title a{color:var(--theme-heading-color,#0f172a);text-decoration:none}
  .ssg-list-meta{margin:.45rem 0 0;color:var(--theme-text-faint,#94a3b8);font-size:.75rem}
  .ssg-list-description{margin:.55rem 0 0;color:var(--theme-text-soft,#64748b);font-size:.9rem;line-height:1.65}
  .ssg-article{max-width:52rem;margin:0 auto}
  .ssg-article-meta{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.75rem;color:var(--theme-text-soft,#64748b);font-size:.82rem}
  .ssg-article-content{margin-top:2rem;color:var(--theme-body-color,#0f172a);line-height:1.8}
  .ssg-article-content img{max-width:100%;height:auto}
  .ssg-article-content pre{max-width:100%;overflow:auto}
  .ssg-article-content table{display:block;max-width:100%;overflow:auto;border-collapse:collapse}
  .ssg-article-content th,.ssg-article-content td{padding:.6rem;border:1px solid var(--theme-border,rgba(148,163,184,.25))}
  .ssg-empty{padding:1rem 1.1rem;border:1px solid var(--theme-border,rgba(148,163,184,.2));border-radius:.65rem;background:var(--theme-panel-background,rgba(255,255,255,.82));color:var(--theme-text-soft,#64748b)}
  .ssg-footer{border-top:1px solid var(--theme-border,rgba(148,163,184,.2));color:var(--theme-text-soft,#64748b);font-size:.8rem}
  .ssg-footer-inner{padding:1rem 0}
  @media(max-width:640px){.ssg-header-inner{align-items:flex-start;flex-direction:column;padding:.75rem 0}.ssg-list{grid-template-columns:1fr}.ssg-main{padding-top:1.5rem}}
</style>`

function formatStaticDate(value) {
  const date = resolveValidDate(value)
  return date ? date.toISOString().slice(0, 10) : ''
}

function resolveStaticItemPath(item) {
  const directPath = toTrimmedString(item?.to || item?.path)
  return directPath || getArticlePath(item)
}

function renderStaticItemList(items = [], context) {
  const renderedItems = (Array.isArray(items) ? items : [])
    .map((item) => {
      const title = toTrimmedString(item?.title || item?.label)
      const itemPath = resolveStaticItemPath(item)

      if (!title || !itemPath) return ''

      const description = toTrimmedString(item?.description || item?.summary || item?.excerpt)
      const date = formatStaticDate(item?.createdAt || item?.date)
      const category = toTrimmedString(item?.category?.name || item?.category?.label || item?.category)
      const meta = [category, date].filter(Boolean).join(' · ')

      return `<li><article class="ssg-list-item">
        <h2 class="ssg-list-title"><a href="${escapeAttribute(withStaticRoutePath(context, itemPath))}">${escapeHtml(title)}</a></h2>
        ${meta ? `<p class="ssg-list-meta">${escapeHtml(meta)}</p>` : ''}
        ${description ? `<p class="ssg-list-description">${escapeHtml(description)}</p>` : ''}
      </article></li>`
    })
    .filter(Boolean)
    .join('\n')

  return renderedItems
    ? `<ul class="ssg-list">${renderedItems}</ul>`
    : '<div class="ssg-empty">当前页面还没有内容。</div>'
}

function renderStaticLinkList(items = [], context) {
  const normalizedItems = (Array.isArray(items) ? items : []).map(item => ({
    title: item?.title || item?.label || item?.name || item?.year,
    description: item?.description || (Number.isFinite(Number(item?.count)) ? `共 ${Number(item.count)} 项内容` : ''),
    to: item?.to || item?.path
  }))

  return renderStaticItemList(normalizedItems, context)
}

function renderStaticNavigation(context) {
  const routePaths = context.staticRoutePaths || new Set()
  const navigation = [
    { label: '首页', path: getHomePath() },
    { label: '文章', path: getArticlesPath() },
    { label: '分类', path: getCategoriesPath() },
    { label: '标签', path: getTagsPath() },
    { label: '归档', path: getArchivePath() }
  ].filter(item => routePaths.has(item.path))

  return navigation
    .map(item => `<a href="${escapeAttribute(withStaticRoutePath(context, item.path))}">${escapeHtml(item.label)}</a>`)
    .join('')
}

function renderStaticPageContent(route, context) {
  if (route.staticArticle) {
    const article = route.staticArticle
    const articleMeta = [
      toTrimmedString(article.category?.name || article.category),
      formatStaticDate(article.createdAt || article.date),
      article.readTime ? `约 ${article.readTime} 分钟阅读` : ''
    ].filter(Boolean)

    return `<article class="ssg-article">
      <header class="ssg-page-header">
        <h1 class="ssg-page-title">${escapeHtml(article.title)}</h1>
        ${articleMeta.length > 0 ? `<div class="ssg-article-meta">${articleMeta.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
        ${route.description ? `<p class="ssg-page-description">${escapeHtml(route.description)}</p>` : ''}
      </header>
      <div class="ssg-article-content article-content">${article.content || ''}</div>
    </article>`
  }

  const pageHeader = `<header class="ssg-page-header">
    <h1 class="ssg-page-title">${escapeHtml(route.pageTitle || '页面')}</h1>
    ${route.description ? `<p class="ssg-page-description">${escapeHtml(route.description)}</p>` : ''}
  </header>`

  if (route.staticContentHtml) {
    return `${pageHeader}<div class="ssg-article-content article-content">${route.staticContentHtml}</div>`
  }

  if (route.staticItems) {
    return `${pageHeader}${renderStaticItemList(route.staticItems, context)}`
  }

  if (route.staticLinks) {
    return `${pageHeader}${renderStaticLinkList(route.staticLinks, context)}`
  }

  return `${pageHeader}${route.content || '<div class="ssg-empty">完整内容将在页面脚本加载后显示。</div>'}`
}

function renderStaticPreview(route, context) {
  const siteTitle = toTrimmedString(context.site?.title) || toTrimmedString(context.profile?.display_name) || 'Blog'
  const footerText = toTrimmedString(context.site?.footer?.text || context.site?.footer_text)

  return `${STATIC_PREVIEW_STYLE}
    <div class="ssg-shell" data-static-preview="true">
      <header class="ssg-header">
        <div class="ssg-header-inner">
          <a class="ssg-brand" href="${escapeAttribute(withStaticRoutePath(context, getHomePath()))}">${escapeHtml(siteTitle)}</a>
          <nav class="ssg-nav" aria-label="主要导航">${renderStaticNavigation(context)}</nav>
        </div>
      </header>
      <main class="ssg-main" id="main-content">${renderStaticPageContent(route, context)}</main>
      <footer class="ssg-footer"><div class="ssg-footer-inner">${escapeHtml(footerText || siteTitle)}</div></footer>
    </div>`
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

function renderThemeHeadTags(themeConfig, basePath) {
  const cssFile = resolveThemePresetAssetPath(themeConfig, 'css')

  if (!cssFile) {
    return ''
  }

  return `<link id="vue-blog-theme-css" rel="stylesheet" href="${escapeAttribute(withBasePath(basePath, cssFile))}" />`
}

function buildSeededShareImage(seed, shareImageConfig = {}) {
  return createSeededArticleCover(seed || 'site-share-image', {
    width: shareImageConfig.seededWidth,
    height: shareImageConfig.seededHeight,
    format: shareImageConfig.seededFormat
  })
}

function resolveShareImageUrl({ route = {}, seo = {}, site = {}, basePath = '/', twitter = false } = {}) {
  const shareImage = seo.shareImage || {}
  return resolveMetadataShareImageUrl({
    pageImage: route.imageUrl,
    seed: route.imageSeed || route.pageTitle || route.path || 'site-share-image',
    shareImageConfig: {
      ...shareImage,
      defaultImage: shareImage.defaultImage || seo.ogImage,
      twitterImage: shareImage.twitterImage || seo.twitterImage || seo.ogImage
    },
    siteUrl: site.site_url || site.url,
    basePath,
    twitter,
    createSeededImage: buildSeededShareImage
  })
}

async function writeRouteFile(routePath, html) {
  const filePath = resolveStaticRouteOutputFile(DIST_DIR, routePath)

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
  const themeHeadTags = renderThemeHeadTags(context.theme, basePath)
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
    themeHeadTags
  })

  return replaceAppRoot(withHead, renderStaticPreview(route, context))
}

function normalizeStaticHomeArticleConfig(source = {}) {
  return {
    ...source,
    includeIds: source.includeIds || source.include_ids,
    excludeIds: source.excludeIds || source.exclude_ids,
    excludeCategories: source.excludeCategories || source.exclude_categories,
    excludeTags: source.excludeTags || source.exclude_tags,
    includeSticky: source.includeSticky ?? source.include_sticky,
    stickyFirst: source.stickyFirst ?? source.sticky_first,
    fallbackToLatest: source.fallbackToLatest ?? source.fallback_to_latest
  }
}

async function createPageRoutes(context) {
  const { articles, categories, tags, archive, pageSize, routePatterns, menus } = context
  const routes = []
  const articlePages = paginateItems(articles, pageSize)
  const homePage = resolveMenuPage('home', menus, routePatterns)
  const articlesPageConfig = resolveMenuPage('articles', menus, routePatterns)
  const categoriesPage = resolveMenuPage('categories', menus, routePatterns)
  const tagsPage = resolveMenuPage('tags', menus, routePatterns)
  const archivePage = resolveMenuPage('archive', menus, routePatterns)
  const searchPage = resolveMenuPage('search', menus, routePatterns)
  const homeArticleConfig = normalizeStaticHomeArticleConfig(context.site?.home_articles || context.site?.homeArticles)
  const homePageSize = normalizePositiveInteger(homeArticleConfig.pageSize || homeArticleConfig.page_size, 8)
  const homeArticles = selectHomeArticles(articles, homeArticleConfig).slice(0, homePageSize)

  if (homePage) {
    routes.push({
      path: getHomePath(),
      pageTitle: homePage.title || '最新文章',
      description: homePage.description || '浏览站点最新发布的文章内容。',
      staticItems: homeArticles
    })
  }

  if (articlesPageConfig) {
    routes.push({
      path: getArticlesPath(),
      pageTitle: articlesPageConfig.title || '所有文章',
      description: articlesPageConfig.description || '浏览站点全部文章列表。',
      staticItems: articlePages[0]?.items || []
    })

    articlePages.slice(1).forEach((pageGroup) => {
      routes.push({
        path: getArticlesPagePath(pageGroup.page),
        pageTitle: `${articlesPageConfig.title || '所有文章'} - 第 ${pageGroup.page} 页`,
        description: `${articlesPageConfig.description || '浏览站点全部文章列表。'} 第 ${pageGroup.page} 页。`,
        staticItems: pageGroup.items
      })
    })
  }

  if (categoriesPage) {
    routes.push({
      path: getCategoriesPath(),
      pageTitle: categoriesPage.title || '内容分类',
      description: categoriesPage.description || '浏览站点所有内容分类。',
      staticLinks: categories.map(category => ({
        title: category.name,
        count: category.articleCount,
        path: getCategoryPath(category)
      }))
    })

    categories.forEach((category) => {
      const categoryPages = paginateItems(category.articles, pageSize)

      routes.push({
        path: getCategoryPath(category),
        pageTitle: `分类：${category.name}`,
        description: `浏览分类 ${category.name} 下的内容。`,
        keywords: [category.name, '分类'],
        staticItems: categoryPages[0]?.items || []
      })

      categoryPages.slice(1).forEach((pageGroup) => {
        routes.push({
          path: getCategoryPagePath(category, pageGroup.page),
          pageTitle: `分类：${category.name} - 第 ${pageGroup.page} 页`,
          description: `浏览分类 ${category.name} 下的内容，第 ${pageGroup.page} 页。`,
          keywords: [category.name, '分类'],
          staticItems: pageGroup.items
        })
      })
    })
  }

  if (tagsPage) {
    routes.push({
      path: getTagsPath(),
      pageTitle: tagsPage.title || '内容标签',
      description: tagsPage.description || '浏览站点所有内容标签。',
      staticLinks: tags.map(tag => ({
        title: tag.name,
        count: tag.articleCount,
        path: getTagPath(tag)
      }))
    })

    tags.forEach((tag) => {
      const tagPages = paginateItems(tag.articles, pageSize)

      routes.push({
        path: getTagPath(tag),
        pageTitle: `标签：${tag.name}`,
        description: `浏览标签 ${tag.name} 下的内容。`,
        keywords: [tag.name, '标签'],
        staticItems: tagPages[0]?.items || []
      })

      tagPages.slice(1).forEach((pageGroup) => {
        routes.push({
          path: getTagPagePath(tag, pageGroup.page),
          pageTitle: `标签：${tag.name} - 第 ${pageGroup.page} 页`,
          description: `浏览标签 ${tag.name} 下的内容，第 ${pageGroup.page} 页。`,
          keywords: [tag.name, '标签'],
          staticItems: pageGroup.items
        })
      })
    })
  }

  if (archivePage) {
    routes.push({
      path: getArchivePath(),
      pageTitle: archivePage.title || '内容归档',
      description: archivePage.description || '按年份浏览站点归档内容。',
      staticLinks: archive.map(group => ({
        title: `${group.year} 年`,
        count: group.count,
        path: getArchiveYearPath(group.year)
      }))
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
        keywords: [String(year), '归档'],
        staticItems: group.articles || []
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

  routes.push({
    path: '/admin/config',
    pageTitle: '站点管理',
    description: 'Filling 站点配置管理入口。',
    robots: 'noindex,nofollow',
    sitemap: false
  })

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
      lastmod: article.updatedAt || article.createdAt || article.date,
      staticArticle: article
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

  customPages.forEach(({ page, loadedSource, records, description, imageUrl }) => {
    const pageContentBlocks = splitMenuPageContent(page.content || '')
    const staticContentHtml = loadedSource.contentHtml
      || pageContentBlocks.map(block => `<p>${escapeHtml(block)}</p>`).join('')

    routes.push({
      path: page.path,
      pageTitle: page.title,
      description,
      imageUrl,
      staticContentHtml,
      staticItems: records.length > 0 ? records : undefined
    })

    records.forEach((item) => {
      routes.push({
        path: item.to,
        pageTitle: item.title,
        description: item.detailDescription || item.description || `${item.title} - ${page.title}`,
        imageUrl: item.cover || item.imageUrl || item.image || '',
        staticContentHtml: item.contentHtml || ''
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
  const cover = normalizeCoverConfig(configs.cover)
  const articles = await loadArticles(defaultLicense, codeBlock, markdown, cover)
  const contentEntries = loadContentEntries()
  configureBlogRoutePatterns(configs?.site?.routing)
  const routePatterns = getBlogPathPatterns()
  const collections = buildCollections(contentEntries)
  const menus = normalizeMenuConfig(resolveFeatureMenuConfig(configs.site.menus, configs))
  const siteUrl = normalizeSiteUrl(configs.site.site_url || configs.site.url)
  const font = normalizeFontConfig(configs.font)
  const context = {
    template,
    site: configs.site,
    profile: configs.profile,
    theme: configs.theme,
    font,
    markdown,
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
  context.staticRoutePaths = new Set(routes.map(route => route.path))

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('静态页面生成失败:', error)
    process.exitCode = 1
  })
}
