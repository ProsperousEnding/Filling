const DEFAULT_PICSUM_WIDTH = 1200
const DEFAULT_PICSUM_HEIGHT = 630
const DEFAULT_PICSUM_FORMAT = 'webp'
export const DEFAULT_SEEDED_COVER_STYLE = 'mwm-anime'
export const SEEDED_COVER_STYLES = Object.freeze([
  'picsum',
  'cataas',
  'mwm-anime',
  'mwm-scenery',
  'paugram-anime',
  'dmoe-anime',
  'loremflickr',
  'paugram-bing'
])
export const RANDOM_COVER_STYLES = Object.freeze([
  'mwm-anime',
  'mwm-scenery',
  'paugram-anime',
  'dmoe-anime',
  'paugram-bing'
])
export const SEEDED_COVER_STYLE_LABELS = Object.freeze({
  picsum: 'Picsum 摄影',
  cataas: 'Cataas 猫咪',
  'mwm-anime': 'MWM 二次元',
  'mwm-scenery': 'MWM 风景',
  'paugram-anime': '保罗二次元',
  'dmoe-anime': 'DMOE 二次元',
  loremflickr: 'LoremFlickr 风景',
  'paugram-bing': 'Bing 每日壁纸'
})
export const DEFAULT_SEEDED_COVER_URLS = Object.freeze({
  picsum: 'https://picsum.photos/seed/{seed}/{width}/{height}.{format}',
  cataas: 'https://cataas.com/cat?width={width}&height={height}&seed={hash}',
  'mwm-anime': 'https://t.alcy.cc/pc/?seed={hash}',
  'mwm-scenery': 'https://t.alcy.cc/fj/?seed={hash}',
  'paugram-anime': 'https://api.paugram.com/wallpaper/?seed={hash}',
  'dmoe-anime': 'https://www.dmoe.cc/random.php?seed={hash}',
  loremflickr: 'https://loremflickr.com/{width}/{height}/landscape?lock={hash}',
  'paugram-bing': 'https://api.paugram.com/bing/?seed={hash}'
})

const runtimeRandomCoverPools = new Map()
let runtimeRandomCoverSeed = ''

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

  if (['paugram-anime', 'paugram', 'paul-anime'].includes(normalized)) {
    return 'paugram-anime'
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

  if (['dmoe-anime', 'dmoe', 'sakura', 'yinghua'].includes(normalized)) {
    return 'dmoe-anime'
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

  if (['paugram-bing', 'paul-bing'].includes(normalized)) {
    return 'paugram-bing'
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

function getRuntimeRandomCoverSeed() {
  const injectedSeed = normalizeString(globalThis.__FILLING_COVER_POOL_SEED__)

  if (injectedSeed) {
    return injectedSeed
  }

  if (!runtimeRandomCoverSeed) {
    runtimeRandomCoverSeed = `${Date.now()}-${Math.random()}`
  }

  return runtimeRandomCoverSeed
}

function createSeededRandom(seedInput) {
  let state = Number.parseInt(createNumericHash(seedInput), 10) || 1

  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleCoverSources(sources, poolKey) {
  const shuffledSources = [...sources]
  const random = createSeededRandom(`${getRuntimeRandomCoverSeed()}\u0000${poolKey}`)

  for (let index = shuffledSources.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1))
    const currentSource = shuffledSources[index]
    shuffledSources[index] = shuffledSources[targetIndex]
    shuffledSources[targetIndex] = currentSource
  }

  return shuffledSources
}

function selectRuntimeRandomCoverSource(sources, seedInput) {
  const poolKey = sources.join('\u0000')
  let poolState = runtimeRandomCoverPools.get(poolKey)

  if (!poolState) {
    poolState = {
      assignments: new Map(),
      cursor: 0,
      sources: shuffleCoverSources(sources, poolKey)
    }
    runtimeRandomCoverPools.set(poolKey, poolState)
  }

  const seed = normalizeCoverSeed(seedInput)
  const assignedSource = poolState.assignments.get(seed)

  if (assignedSource) {
    return assignedSource
  }

  const source = poolState.sources[poolState.cursor % poolState.sources.length]
  poolState.assignments.set(seed, source)
  poolState.cursor += 1
  return source
}

export function resetRuntimeRandomCoverPool(seed = '') {
  runtimeRandomCoverPools.clear()
  runtimeRandomCoverSeed = normalizeString(seed)
}

function selectSeededCoverSource(source, seedInput, options = {}) {
  if (!Array.isArray(source)) {
    return {
      pooled: false,
      value: normalizeString(source)
    }
  }

  const sources = source
    .map(value => normalizeString(value))
    .filter(Boolean)

  if (sources.length === 0) {
    return {
      pooled: true,
      value: ''
    }
  }

  if (options.randomizePool === true) {
    return {
      pooled: true,
      value: selectRuntimeRandomCoverSource(sources, seedInput)
    }
  }

  if (options.fixed !== true) {
    return {
      pooled: false,
      value: ''
    }
  }

  const sourceIndex = Number.parseInt(createNumericHash(seedInput), 10) % sources.length

  return {
    pooled: true,
    value: sources[sourceIndex]
  }
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

  return resolvedTemplate === template && options.appendSeed !== false
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

function normalizeResponsiveWidths(widths = []) {
  return Array.from(new Set((Array.isArray(widths) ? widths : [])
    .map(width => Number.parseInt(width, 10))
    .filter(width => Number.isFinite(width) && width >= 160 && width <= 3840)))
    .sort((left, right) => left - right)
}

function isProxyOptimizableCover(source) {
  try {
    const url = new URL(normalizeString(source))
    return url.protocol === 'https:' && ['t.alcy.cc', 'tc.alcy.cc'].includes(url.hostname)
  } catch {
    return false
  }
}

export function resolveOptimizedArticleCoverSource(source) {
  try {
    const proxyUrl = new URL(normalizeString(source))
    const originalSource = normalizeString(proxyUrl.searchParams.get('url'))
    return isProxyOptimizableCover(originalSource) ? originalSource : ''
  } catch {
    return ''
  }
}

export function createOptimizedArticleCoverUrl(source, options = {}) {
  const normalizedSource = normalizeString(source)
  const imageProxyUrl = normalizeString(options.imageProxyUrl)
  const width = Number.parseInt(options.width, 10)

  if (!normalizedSource || !imageProxyUrl || !isProxyOptimizableCover(normalizedSource)) {
    return normalizedSource
  }

  try {
    const proxyUrl = new URL(imageProxyUrl)
    proxyUrl.searchParams.set('url', normalizedSource)
    proxyUrl.searchParams.set('width', String(width || DEFAULT_PICSUM_WIDTH))
    return proxyUrl.toString()
  } catch {
    return normalizedSource
  }
}

function resizeProxyCoverUrl(source, width, imageProxyUrl) {
  const normalizedProxyUrl = normalizeString(imageProxyUrl)

  if (!normalizedProxyUrl) {
    return ''
  }

  try {
    const sourceUrl = new URL(normalizeString(source))
    const proxyUrl = new URL(normalizedProxyUrl)

    if (sourceUrl.origin !== proxyUrl.origin || sourceUrl.pathname !== proxyUrl.pathname) {
      return ''
    }

    sourceUrl.searchParams.set('width', String(width))
    return sourceUrl.toString()
  } catch {
    return ''
  }
}

function resizeKnownCoverUrl(source, width, aspectRatio) {
  const normalizedSource = normalizeString(source)
  const height = Math.max(1, Math.round(width / aspectRatio))

  if (/^https?:\/\/picsum\.photos\/seed\//i.test(normalizedSource)) {
    return normalizedSource.replace(
      /(\/seed\/[^/]+\/)\d+\/\d+(\.[a-z0-9]+)([?#].*)?$/i,
      `$1${width}/${height}$2$3`
    )
  }

  if (/^https?:\/\/loremflickr\.com\/\d+\/\d+\//i.test(normalizedSource)) {
    return normalizedSource.replace(
      /^(https?:\/\/loremflickr\.com\/)\d+\/\d+(\/)/i,
      `$1${width}/${height}$2`
    )
  }

  if (/^https?:\/\/cataas\.com\/cat(?:[?#]|$)/i.test(normalizedSource)) {
    try {
      const url = new URL(normalizedSource)
      url.searchParams.set('width', String(width))
      url.searchParams.set('height', String(height))
      return url.toString()
    } catch {
      return ''
    }
  }

  return ''
}

export function createArticleCoverSrcset(source, options = {}) {
  const sourceWidth = Number.parseInt(options.sourceWidth, 10) || DEFAULT_PICSUM_WIDTH
  const sourceHeight = Number.parseInt(options.sourceHeight, 10) || DEFAULT_PICSUM_HEIGHT
  const aspectRatio = sourceWidth / sourceHeight
  const widths = normalizeResponsiveWidths(options.widths || [480, 800, 1200])

  if (!normalizeString(source) || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return ''
  }

  const candidates = widths
    .map(width => ({
      width,
      url: resizeKnownCoverUrl(source, width, aspectRatio)
        || resizeProxyCoverUrl(source, width, options.imageProxyUrl)
        || (normalizeString(options.imageProxyUrl)
          ? createOptimizedArticleCoverUrl(source, {
            imageProxyUrl: options.imageProxyUrl,
            width
          })
          : '')
    }))
    .filter(candidate => candidate.url)

  return candidates.length > 1
    ? candidates.map(candidate => `${candidate.url} ${candidate.width}w`).join(', ')
    : ''
}

export function createSeededArticleCover(seedInput, options = {}) {
  const styleUrls = options.styleUrls && typeof options.styleUrls === 'object'
    ? options.styleUrls
    : DEFAULT_SEEDED_COVER_URLS
  const style = normalizeSeededCoverStyle(options.style || options.seededStyle)
  const configuredSource = styleUrls[style]
  const hasConfiguredSources = Array.isArray(configuredSource)
    && configuredSource.some(source => normalizeString(source))
  const useConfiguredPool = options.fixed === true || options.randomizePool === true
  const source = Array.isArray(configuredSource) && (!useConfiguredPool || !hasConfiguredSources)
    ? DEFAULT_SEEDED_COVER_URLS[style]
    : configuredSource || DEFAULT_SEEDED_COVER_URLS[style]
  const styleSource = selectSeededCoverSource(source, seedInput, options)

  if (styleSource.value) {
    return createTemplateArticleCover(seedInput, styleSource.value, {
      ...options,
      appendSeed: !styleSource.pooled
    })
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
    || /^https?:\/\/api\.paugram\.com\/(?:wallpaper|bing)\//i.test(normalizedValue)
    || /^https?:\/\/www\.btstu\.cn\/sjbz\/api\.php\?/i.test(normalizedValue)
    || /^https?:\/\/api\.ixiaowai\.cn\/api\/api2\.php\?/i.test(normalizedValue)
    || /^https?:\/\/api\.r10086\.com\/img-api\.php\?/i.test(normalizedValue)
    || /^https?:\/\/img\.paulzzh\.tech\/touhou\/random/i.test(normalizedValue)
    || /^https?:\/\/api\.dujin\.org\/bing\/1920\.php\?/i.test(normalizedValue)
    || /^https?:\/\/t\.mwm\.moe\//i.test(normalizedValue)
    || /^https?:\/\/t\.alcy\.cc\/(?:pc|fj)\//i.test(normalizedValue)
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
    fixed: coverConfig.fixed === true,
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

  const generatedCover = createSeededArticleCover(getArticleCoverSeed(article), {
    width: coverConfig.seededWidth,
    height: coverConfig.seededHeight,
    format: coverConfig.seededFormat,
    style: options.style || coverConfig.seededStyle,
    fixed: coverConfig.fixed === true,
    randomizePool: coverConfig.fixed !== true,
    animeUrl: coverConfig.seededAnimeUrl || options.animeUrl,
    styleUrls: coverConfig.styleUrls || options.styleUrls
  })

  return createOptimizedArticleCoverUrl(generatedCover, {
    imageProxyUrl: coverConfig.imageProxyUrl,
    width: coverConfig.seededWidth
  })
}
