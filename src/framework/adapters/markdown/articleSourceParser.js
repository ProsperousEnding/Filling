import fm from 'front-matter'
import { resolveArticleCover } from '../../utils/articleCover.js'
import { normalizeOptionalBoolean, normalizePositiveInteger } from '../../utils/articleMeta.js'
import { renderMarkdown } from '../../utils/markdownRenderer.js'

const HTML_ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
}

function safeDecodeURIComponent(input) {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export function normalizeArticleLookupId(input) {
  if (input === null || input === undefined) return ''

  return safeDecodeURIComponent(String(input))
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
}

export function toSlugId(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizeTextValue(input) {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(input) {
  return String(input || '')
    .replace(/&(nbsp|amp|lt|gt|quot);|&#39;/g, match => HTML_ENTITY_MAP[match] || match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
}

function stripHtmlTags(input) {
  return decodeHtmlEntities(
    String(input || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function createExcerpt(text, maxLength = 160) {
  const normalized = normalizeTextValue(text)
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}...`
}

function normalizeDateValue(input) {
  if (input instanceof Date && Number.isFinite(input.getTime())) {
    return input.toISOString()
  }

  const normalized = normalizeTextValue(input)
  return normalized || null
}

function normalizeHeadingComparableText(input) {
  return normalizeTextValue(input)
    .replace(/\s+/g, ' ')
    .replace(/[！!？?。.,，:：;；"'“”‘’`~()[\]{}<>《》【】]/g, '')
    .toLowerCase()
}

function stripLeadingDuplicateTitleHeading(body, title) {
  const normalizedBody = String(body || '').replace(/^\uFEFF/, '')
  const comparableTitle = normalizeHeadingComparableText(title)

  if (!normalizedBody || !comparableTitle) {
    return normalizedBody
  }

  const headingMatch = normalizedBody.match(/^(\s*)#\s+(.+?)\s*(?:#+\s*)?(?:\n|$)/)

  if (!headingMatch) {
    return normalizedBody
  }

  const comparableHeading = normalizeHeadingComparableText(headingMatch[2])

  if (comparableHeading !== comparableTitle) {
    return normalizedBody
  }

  return normalizedBody
    .slice(headingMatch[0].length)
    .replace(/^\s*\n/, '')
}

function normalizeAuthor(value) {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    const name = normalizeTextValue(value)
    return name ? { name } : null
  }

  if (typeof value !== 'object') {
    return null
  }

  const name = normalizeTextValue(value.name || value.label || value.title)
  return name ? { name } : null
}

function normalizeSafeUrl(value) {
  const normalizedValue = normalizeTextValue(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return normalizedValue
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue
  }

  return ''
}

function normalizeLicense(value, fallbackUrl = '') {
  if (!value && !fallbackUrl) {
    return null
  }

  if (typeof value === 'string') {
    const name = normalizeTextValue(value)
    const url = normalizeSafeUrl(fallbackUrl)

    if (!name) {
      return url
        ? {
          name: url,
          url
        }
        : null
    }

    return {
      name,
      url
    }
  }

  if (typeof value !== 'object') {
    return null
  }

  const name = normalizeTextValue(value.name || value.label || value.title)
  const url = normalizeSafeUrl(value.url || value.href || fallbackUrl)

  if (!name && !url) {
    return null
  }

  return {
    name: name || url,
    url
  }
}

function resolveLicenseDisabled(frontmatter = {}) {
  if (frontmatter.license === false) {
    return true
  }

  return normalizeOptionalBoolean(
    frontmatter.hide_license
    ?? frontmatter.disable_license
    ?? frontmatter.hideLicense
    ?? frontmatter.disableLicense
  ) === true
}

function resolveOutdatedNoticeFlag(frontmatter = {}) {
  const explicitValue = normalizeOptionalBoolean(
    frontmatter.show_outdated_notice
    ?? frontmatter.outdated_notice
    ?? frontmatter.showOutdatedNotice
    ?? frontmatter.outdatedNotice
  )
  const disabledValue = normalizeOptionalBoolean(
    frontmatter.hide_outdated_notice
    ?? frontmatter.disable_outdated_notice
    ?? frontmatter.hideOutdatedNotice
    ?? frontmatter.disableOutdatedNotice
  )

  if (disabledValue === true) {
    return false
  }

  return explicitValue
}

function normalizeCoverDisplayMode(value) {
  const normalized = normalizeTextValue(value).toLowerCase()

  return ['image', 'header-background', 'page-background'].includes(normalized) ? normalized : ''
}

function estimateReadTime(text) {
  const normalized = normalizeTextValue(text)
  if (!normalized) return 1

  const cjkChars = normalized.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/g) || []
  const latinWords = normalized
    .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)

  const readingUnits = cjkChars.length + latinWords.length
  return Math.max(1, Math.ceil(readingUnits / 300))
}

function resolveArticleFileName(sourcePath = '') {
  const normalizedSourcePath = String(sourcePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
  const relativePath = normalizedSourcePath.startsWith('blog/content/articles/')
    ? normalizedSourcePath.slice('blog/content/articles/'.length)
    : normalizedSourcePath.split('/').pop() || ''

  return relativePath
    .replace(/\.md$/i, '')
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('-')
}

function createArticleRecord(rawContent, sourcePath, { includeContent = false, defaultLicense = null, codeBlockConfig = null, markdownConfig = null, coverConfig = null } = {}) {
  const fileName = resolveArticleFileName(sourcePath)
  const parsed = fm(rawContent || '')
  const frontmatter = parsed.attributes || {}
  const title = frontmatter.title || fileName
  const body = stripLeadingDuplicateTitleHeading(parsed.body || '', title)
  const html = renderMarkdown(body, { codeBlockConfig, markdownConfig })
  const plainHtml = renderMarkdown(body, { enhanceCodeBlocks: false, markdownConfig })
  const slug = normalizeArticleLookupId(frontmatter.slug || fileName) || fileName
  const plainText = normalizeTextValue(stripHtmlTags(plainHtml))
  const description = normalizeTextValue(frontmatter.description)
  const summary = normalizeTextValue(frontmatter.summary)
  const excerpt = summary || description || createExcerpt(plainText)

  const categoryName = frontmatter.category || null
  const category = categoryName
    ? { id: toSlugId(String(categoryName)), name: String(categoryName) }
    : null

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(tag => ({ id: toSlugId(String(tag)), name: String(tag) }))
    : []

  const author = normalizeAuthor(frontmatter.author)
  const updatedAt = normalizeDateValue(
    frontmatter.updated
    || frontmatter.updated_at
    || frontmatter.lastmod
    || frontmatter.last_modified
  )
  const licenseDisabled = resolveLicenseDisabled(frontmatter)
  const license = licenseDisabled
    ? null
    : normalizeLicense(frontmatter.license, frontmatter.license_url) || normalizeLicense(defaultLicense)
  const outdatedThresholdDays = normalizePositiveInteger(
    frontmatter.outdated_threshold
    ?? frontmatter.outdated_threshold_days
    ?? frontmatter.outdatedThreshold
    ?? frontmatter.outdatedThresholdDays
  )
  const showOutdatedNotice = resolveOutdatedNoticeFlag(frontmatter)
  const coverSource = normalizeTextValue(frontmatter.cover || frontmatter.image || frontmatter.thumbnail)
  const coverDisplayMode = normalizeCoverDisplayMode(
    frontmatter.cover_display_mode
    ?? frontmatter.coverDisplayMode
    ?? frontmatter.cover_mode
    ?? frontmatter.coverMode
  )

  const article = {
    id: fileName,
    slug,
    title,
    date: normalizeDateValue(frontmatter.date),
    author,
    category,
    tags,
    cover: resolveArticleCover(coverSource, slug || fileName, { coverConfig }),
    coverSource,
    coverDisplayMode,
    description,
    summary: summary || excerpt,
    excerpt,
    plainText,
    readTime: estimateReadTime(plainText),
    createdAt: normalizeDateValue(frontmatter.date),
    updatedAt,
    license,
    licenseDisabled,
    outdatedThresholdDays,
    showOutdatedNotice,
    sourcePath
  }

  if (includeContent) {
    article.content = html
  }

  return article
}

export function parseArticleMetadata(rawContent, sourcePath, options = {}) {
  return createArticleRecord(rawContent, sourcePath, options)
}

export function parseArticleDetail(rawContent, sourcePath, options = {}) {
  return createArticleRecord(rawContent, sourcePath, {
    ...options,
    includeContent: true
  })
}
