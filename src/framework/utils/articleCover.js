const DEFAULT_PICSUM_WIDTH = 1200
const DEFAULT_PICSUM_HEIGHT = 630
const DEFAULT_PICSUM_FORMAT = 'webp'
export const DEFAULT_SEEDED_COVER_STYLE = 'picsum'
export const SEEDED_COVER_STYLES = Object.freeze([
  'picsum',
  'cataas',
  'mwm-anime',
  'mwm-scenery',
  'xjh-acg',
  'bing-rand'
])
export const DEFAULT_SEEDED_COVER_URLS = Object.freeze({
  picsum: 'https://picsum.photos/seed/{seed}/{width}/{height}.{format}',
  cataas: 'https://cataas.com/cat?width={width}&height={height}&seed={hash}',
  'mwm-anime': 'https://t.mwm.moe/pc?seed={hash}',
  'mwm-scenery': 'https://t.mwm.moe/fj?seed={hash}',
  'xjh-acg': 'https://img.xjh.me/random_img.php?type=bg&ctype=acg&return=302&seed={hash}',
  'bing-rand': 'https://bing.img.run/rand.php?seed={hash}'
})

function normalizeString(value) {
  return String(value || '').trim()
}

export function normalizeCoverSeed(value) {
  const normalized = normalizeString(value)
    .replace(/[\\/]+/g, '-')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')

  const slugLike = normalized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slugLike || normalized || 'article-cover'
}

function normalizeStyleKey(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveStyleAlias(value) {
  const normalized = normalizeStyleKey(value)

  if (['landscape', 'photo', 'photos', 'picsum', 'nature'].includes(normalized)) {
    return 'picsum'
  }

  if (['anime', 'acg', '二次元', 'cartoon'].includes(normalized)) {
    return 'anime'
  }

  if (['source-splash', 'sourcesplash', 'source', 'splash', 'unsplash', 'city', 'tech', 'technology', 'digital', 'abstract'].includes(normalized)) {
    return 'sourcesplash'
  }

  if (['lorem-flickr', 'loremflickr', 'flickr'].includes(normalized)) {
    return 'loremflickr'
  }

  if (['image-cdn', 'imagecdn', 'random-imagecdn'].includes(normalized)) {
    return 'imagecdn'
  }

  if (['pollinations', 'pollinations-ai', 'ai'].includes(normalized)) {
    return 'pollinations'
  }

  if (['cataas', 'cat', 'cats'].includes(normalized)) {
    return 'cataas'
  }

  if (['dmoe', 'sakura', 'yinghua'].includes(normalized)) {
    return 'dmoe'
  }

  if (['btstu-anime', 'btstu-dongman', 'dongman'].includes(normalized)) {
    return 'btstu-anime'
  }

  if (['btstu-scenery', 'btstu-fengjing', 'fengjing', 'scenery'].includes(normalized)) {
    return 'btstu-scenery'
  }

  if (['ixiaowai', 'xiaowai'].includes(normalized)) {
    return 'ixiaowai'
  }

  if (['r10086', 'yingdao'].includes(normalized)) {
    return 'r10086'
  }

  if (['paulzzh', 'touhou', 'dongfang'].includes(normalized)) {
    return 'paulzzh'
  }

  if (['dujin-bing', 'dujin', 'bing'].includes(normalized)) {
    return 'dujin-bing'
  }

  if (['mwm-anime', 'mwm', 'mwm-pc'].includes(normalized)) {
    return 'mwm-anime'
  }

  if (['mwm-scenery', 'mwm-fj'].includes(normalized)) {
    return 'mwm-scenery'
  }

  if (['loliapi', 'loli-api'].includes(normalized)) {
    return 'loliapi'
  }

  if (['xjh-acg', 'xjh'].includes(normalized)) {
    return 'xjh-acg'
  }

  if (['bing-rand', 'bing-random'].includes(normalized)) {
    return 'bing-rand'
  }

  return normalized
}

export function normalizeSeededCoverStyle(value, fallback = DEFAULT_SEEDED_COVER_STYLE, availableStyles = null) {
  const normalized = resolveStyleAlias(value)
  const normalizedFallback = fallback === ''
    ? ''
    : resolveStyleAlias(fallback) || DEFAULT_SEEDED_COVER_STYLE

  if (!normalized) {
    return normalizedFallback
  }

  if (Array.isArray(availableStyles) && availableStyles.length > 0) {
    return availableStyles.includes(normalized) ? normalized : normalizedFallback
  }

  return normalized
}

export function getArticleCoverSeed(article = {}) {
  if (!article || typeof article !== 'object') {
    return normalizeCoverSeed(article)
  }

  return normalizeCoverSeed(
    article.slug
    || article.itemId
    || normalizeString(article.id).replace(/^(article|page|page-item):/i, '')
    || normalizeString(article.key).replace(/^article-/i, '')
    || article.sourcePath
    || article.title
  )
}

export function createLandscapeArticleCover(seedInput, options = {}) {
  const width = Number.parseInt(options.width, 10) || DEFAULT_PICSUM_WIDTH
  const height = Number.parseInt(options.height, 10) || DEFAULT_PICSUM_HEIGHT
  const format = normalizeString(options.format) || DEFAULT_PICSUM_FORMAT
  const seed = normalizeCoverSeed(seedInput)

  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}.${format}`
}

function createNumericHash(value) {
  const normalized = normalizeCoverSeed(value)
  let hash = 0

  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(index)) | 0
  }

  return String(Math.abs(hash) || 1)
}

function appendQueryParam(url, name, value) {
  const normalizedUrl = normalizeString(url)
  const normalizedName = encodeURIComponent(normalizeString(name))
  const normalizedValue = encodeURIComponent(normalizeString(value))

  if (!normalizedUrl || !normalizedName || !normalizedValue) {
    return normalizedUrl
  }

  const hashIndex = normalizedUrl.indexOf('#')
  const baseUrl = hashIndex >= 0 ? normalizedUrl.slice(0, hashIndex) : normalizedUrl
  const hash = hashIndex >= 0 ? normalizedUrl.slice(hashIndex) : ''
  const separator = baseUrl.includes('?') ? '&' : '?'

  return `${baseUrl}${separator}${normalizedName}=${normalizedValue}${hash}`
}

function resolveCoverUrlTemplate(template, seedInput, options = {}) {
  const seed = normalizeCoverSeed(seedInput)
  const hash = createNumericHash(seed)
  const resolvedTemplate = normalizeString(template)
    .replace(/\{seed\}/g, encodeURIComponent(seed))
    .replace(/\{hash\}/g, encodeURIComponent(hash))
    .replace(/\{width\}/g, encodeURIComponent(Number.parseInt(options.width, 10) || DEFAULT_PICSUM_WIDTH))
    .replace(/\{height\}/g, encodeURIComponent(Number.parseInt(options.height, 10) || DEFAULT_PICSUM_HEIGHT))
    .replace(/\{format\}/g, encodeURIComponent(normalizeString(options.format) || DEFAULT_PICSUM_FORMAT))

  if (resolvedTemplate.includes('{')) {
    return resolvedTemplate
  }

  return resolvedTemplate === template
    ? appendQueryParam(resolvedTemplate, 'seed', seed)
    : resolvedTemplate
}

export function createTemplateArticleCover(seedInput, template, options = {}) {
  return resolveCoverUrlTemplate(
    template,
    seedInput,
    options
  )
}

export function createAnimeArticleCover(seedInput, options = {}) {
  return createTemplateArticleCover(seedInput, options.animeUrl || DEFAULT_SEEDED_COVER_URLS['mwm-anime'], options)
}

export function createSeededArticleCover(seedInput, options = {}) {
  const styleUrls = options.styleUrls && typeof options.styleUrls === 'object'
    ? options.styleUrls
    : DEFAULT_SEEDED_COVER_URLS
  const style = normalizeSeededCoverStyle(options.style || options.seededStyle)
  const styleUrl = normalizeString(styleUrls[style] || DEFAULT_SEEDED_COVER_URLS[style])

  if (styleUrl) {
    return createTemplateArticleCover(seedInput, styleUrl, options)
  }

  if (style === 'anime') {
    return createAnimeArticleCover(seedInput, options)
  }

  return createLandscapeArticleCover(seedInput, options)
}

function isGeneratedSeededCoverUrl(value) {
  const normalizedValue = normalizeString(value)
  return /^https?:\/\/picsum\.photos\/seed\//i.test(normalizedValue)
    || /^https?:\/\/api\.dicebear\.com\/[0-9.]+\/[^/]+\/svg\?/i.test(normalizedValue)
    || /^https?:\/\/rimg\.zhuqiy\.top\/api\/random\?/i.test(normalizedValue)
    || /^https?:\/\/api\.sourcesplash\.com\/i\/random\?/i.test(normalizedValue)
    || /^https?:\/\/loremflickr\.com\//i.test(normalizedValue)
    || /^https?:\/\/random\.imagecdn\.app\//i.test(normalizedValue)
    || /^https?:\/\/image\.pollinations\.ai\/prompt\//i.test(normalizedValue)
    || /^https?:\/\/cataas\.com\/cat/i.test(normalizedValue)
    || /^https?:\/\/www\.dmoe\.cc\/random\.php\?/i.test(normalizedValue)
    || /^https?:\/\/www\.btstu\.cn\/sjbz\/api\.php\?/i.test(normalizedValue)
    || /^https?:\/\/api\.ixiaowai\.cn\/api\/api2\.php\?/i.test(normalizedValue)
    || /^https?:\/\/api\.r10086\.com\/img-api\.php\?/i.test(normalizedValue)
    || /^https?:\/\/img\.paulzzh\.tech\/touhou\/random/i.test(normalizedValue)
    || /^https?:\/\/api\.dujin\.org\/bing\/1920\.php\?/i.test(normalizedValue)
    || /^https?:\/\/t\.mwm\.moe\//i.test(normalizedValue)
    || /^https?:\/\/www\.loliapi\.com\/acg\//i.test(normalizedValue)
    || /^https?:\/\/img\.xjh\.me\/random_img\.php\?/i.test(normalizedValue)
    || /^https?:\/\/bing\.img\.run\/rand\.php\?/i.test(normalizedValue)
}

function canUseGeneratedArticleCover(article = {}) {
  if (!article || typeof article !== 'object') {
    return Boolean(normalizeString(article))
  }

  const kind = normalizeString(article.kind || article.type).toLowerCase()

  if (['category', 'tag', 'archive', 'folder', 'profile', 'project'].includes(kind)) {
    return false
  }

  if (['article', 'post', 'note', 'entry', 'page', 'page-item', 'content'].includes(kind)) {
    return true
  }

  return Boolean(
    article.slug
    || article.itemId
    || article.sourcePath
    || article.readTime
    || article.plainText
    || article.content
  )
}

export function resolveArticleCover(cover, seedInput, options = {}) {
  const normalizedCover = normalizeString(cover)

  if (normalizedCover) {
    return normalizedCover
  }

  const coverConfig = options.coverConfig && typeof options.coverConfig === 'object'
    ? options.coverConfig
    : {}

  if (coverConfig.enabled === false) {
    return ''
  }

  const fallbackMode = normalizeString(coverConfig.fallback || options.fallback || 'seeded').toLowerCase()

  if (fallbackMode === 'none') {
    return ''
  }

  if (fallbackMode === 'image') {
    return normalizeString(coverConfig.fallbackImage || options.fallbackImage)
  }

  return createSeededArticleCover(seedInput, {
    width: coverConfig.seededWidth || options.width,
    height: coverConfig.seededHeight || options.height,
    format: coverConfig.seededFormat || options.format,
    style: coverConfig.seededStyle || options.style,
    animeUrl: coverConfig.seededAnimeUrl || options.animeUrl,
    styleUrls: coverConfig.styleUrls || options.styleUrls
  })
}

export function resolveDisplayArticleCover(article = {}, options = {}) {
  const coverConfig = options.coverConfig && typeof options.coverConfig === 'object'
    ? options.coverConfig
    : {}
  const explicitCover = normalizeString(article?.imageUrl || article?.cover || article?.image)
  const explicitCoverSource = normalizeString(article?.coverSource || article?.imageSource || article?.thumbnailSource)

  if (explicitCoverSource || (explicitCover && !isGeneratedSeededCoverUrl(explicitCover))) {
    return explicitCover
  }

  if (coverConfig.enabled === false) {
    return ''
  }

  const fallbackMode = normalizeString(coverConfig.fallback || 'seeded').toLowerCase()

  if (fallbackMode === 'none') {
    return ''
  }

  if (fallbackMode === 'image') {
    return explicitCover || normalizeString(coverConfig.fallbackImage)
  }

  if (fallbackMode !== 'seeded') {
    return explicitCover
  }

  if (!canUseGeneratedArticleCover(article)) {
    return ''
  }

  return createSeededArticleCover(getArticleCoverSeed(article), {
    width: coverConfig.seededWidth,
    height: coverConfig.seededHeight,
    format: coverConfig.seededFormat,
    style: options.style || coverConfig.seededStyle,
    animeUrl: coverConfig.seededAnimeUrl || options.animeUrl,
    styleUrls: coverConfig.styleUrls || options.styleUrls
  })
}
