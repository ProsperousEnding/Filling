import fm from 'front-matter'
import MarkdownIt from 'markdown-it'
import { resolveArticleCover } from '../../utils/articleCover.js'

const MENU_CONTENT_ROOT = '/blog/content'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const markdownValidateLink = markdown.validateLink.bind(markdown)
markdown.validateLink = (url) => {
  const normalizedUrl = String(url || '').trim()
  return markdownValidateLink(normalizedUrl) && !/^(?:javascript|vbscript|data):/i.test(normalizedUrl)
}

const HTML_ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
}

function normalizeString(value) {
  return String(value || '').trim()
}

function normalizeFrontmatterText(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  return normalizeString(value)
}

function normalizeTextValue(value) {
  return normalizeFrontmatterText(value)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFrontmatterList(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeTextValue(item))
      .filter(Boolean)
  }

  const normalized = normalizeTextValue(value)

  if (!normalized) {
    return []
  }

  return normalized
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&(nbsp|amp|lt|gt|quot);|&#39;/g, match => HTML_ENTITY_MAP[match] || match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
}

function stripHtmlTags(value) {
  return decodeHtmlEntities(
    String(value || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function createExcerpt(text, maxLength = 160) {
  const normalized = normalizeTextValue(text)

  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trim()}...`
}

function resolveSourceName(sourcePath = '') {
  return String(sourcePath || '')
    .split('/')
    .pop()
    ?.replace(/\.md$/i, '') || ''
}

export function normalizeMenuCollectionItemId(value) {
  const normalizedValue = normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')

  if (!normalizedValue) {
    return ''
  }

  return normalizedValue
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('-')
}

function parseOrder(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeMenuContentPath(value, { kind = 'file' } = {}) {
  const normalizedValue = normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')
  const segments = normalizedValue
    .split('/')
    .map(segment => segment.trim())
    .filter(segment => segment && segment !== '.')

  if (segments.length === 0 || segments.some(segment => segment === '..')) {
    return ''
  }

  const resolvedPath = segments.join('/')

  return kind === 'folder'
    ? resolvedPath.replace(/\/+$/, '')
    : resolvedPath
}

export function resolveMenuContentSourcePath(value) {
  const relativePath = normalizeMenuContentPath(value, { kind: 'file' })
  return relativePath ? `${MENU_CONTENT_ROOT}/${relativePath}` : ''
}

export function resolveMenuContentFolderPrefix(value) {
  const relativePath = normalizeMenuContentPath(value, { kind: 'folder' })
  return relativePath ? `${MENU_CONTENT_ROOT}/${relativePath}/` : ''
}

export function resolveMenuCollectionItemPath(pagePath, itemId) {
  const normalizedPagePath = normalizeString(pagePath)
  const normalizedItemId = normalizeMenuCollectionItemId(itemId)

  if (!normalizedPagePath || !normalizedItemId) {
    return ''
  }

  return `${normalizedPagePath}/${normalizedItemId}`
}

export function isMenuSourcePathInFolder(sourcePath, folderPrefix) {
  const normalizedSourcePath = normalizeString(sourcePath)
  const normalizedFolderPrefix = normalizeString(folderPrefix)

  if (!normalizedSourcePath || !normalizedFolderPrefix || !normalizedSourcePath.startsWith(normalizedFolderPrefix)) {
    return false
  }

  const relativePath = normalizedSourcePath.slice(normalizedFolderPrefix.length)
  return Boolean(relativePath) && !relativePath.includes('/') && relativePath.endsWith('.md')
}

export function parseMenuContextSource(rawContent, sourcePath) {
  const parsed = fm(rawContent || '')
  const frontmatter = parsed.attributes || {}
  const body = String(parsed.body || '').trim()
  const contentHtml = body ? markdown.render(body) : ''
  const plainText = normalizeTextValue(stripHtmlTags(contentHtml))
  const sourceName = resolveSourceName(sourcePath)
  const title = normalizeString(frontmatter.title || frontmatter.name || sourceName)
  const category = normalizeTextValue(frontmatter.category)
  const tags = normalizeFrontmatterList(frontmatter.tags).map(name => ({ name }))
  const cover = resolveArticleCover(
    frontmatter.cover || frontmatter.image || frontmatter.thumbnail,
    frontmatter.slug || frontmatter.key || title || sourceName
  )

  return {
    title,
    description: normalizeTextValue(frontmatter.description || frontmatter.summary) || createExcerpt(plainText),
    kind: normalizeTextValue(frontmatter.kind) || 'page',
    iconKind: normalizeTextValue(frontmatter.iconKind || frontmatter.icon || frontmatter.kind),
    createdAt: normalizeTextValue(frontmatter.date),
    category: category ? { name: category } : null,
    tags,
    cover,
    content: body,
    contentHtml,
    plainText,
    sourcePath
  }
}

function createMenuCollectionRecord(rawContent, sourcePath, { pagePath = '' } = {}) {
  const parsed = fm(rawContent || '')
  const frontmatter = parsed.attributes || {}
  const body = String(parsed.body || '').trim()
  const contentHtml = body ? markdown.render(body) : ''
  const plainText = normalizeTextValue(stripHtmlTags(contentHtml))
  const sourceName = resolveSourceName(sourcePath)
  const itemId = normalizeMenuCollectionItemId(frontmatter.slug || frontmatter.key || sourceName) || sourceName
  const title = normalizeString(frontmatter.title || frontmatter.name || resolveSourceName(sourcePath))
  const description = normalizeTextValue(frontmatter.description || frontmatter.summary)
  const meta = normalizeTextValue(frontmatter.meta || frontmatter.eyebrow || frontmatter.date)
  const category = normalizeTextValue(frontmatter.category)
  const tags = normalizeFrontmatterList(frontmatter.tags).map(label => ({ label }))
  const details = normalizeFrontmatterList(frontmatter.details || frontmatter.highlights || frontmatter.points)
  const cover = resolveArticleCover(
    frontmatter.cover || frontmatter.image || frontmatter.thumbnail,
    itemId || frontmatter.key || frontmatter.slug || title
  )
  const to = resolveMenuCollectionItemPath(pagePath, itemId)

  return {
    itemId,
    key: normalizeString(frontmatter.key || frontmatter.slug || sourceName) || sourceName,
    kind: normalizeTextValue(frontmatter.kind) || 'entry',
    iconKind: normalizeTextValue(frontmatter.iconKind || frontmatter.icon || frontmatter.kind),
    title: title || sourceName,
    description,
    meta,
    footer: normalizeTextValue(frontmatter.footer || frontmatter.cta || frontmatter.note),
    cover,
    category: category ? { label: category } : null,
    tags,
    details,
    to,
    href: '',
    external: false,
    order: parseOrder(frontmatter.order),
    date: normalizeTextValue(frontmatter.date),
    content: body,
    contentHtml,
    plainText,
    detailDescription: description || createExcerpt(plainText),
    sourcePath
  }
}

export function parseMenuCollectionDetail(rawContent, sourcePath, options = {}) {
  return createMenuCollectionRecord(rawContent, sourcePath, options)
}

export function sortMenuCollectionItems(items = []) {
  return [...items].sort((left, right) => {
    const leftOrder = Number.isFinite(left?.order) ? left.order : null
    const rightOrder = Number.isFinite(right?.order) ? right.order : null

    if (leftOrder !== null || rightOrder !== null) {
      if (leftOrder === null) return 1
      if (rightOrder === null) return -1
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
    }

    const leftTime = Date.parse(left?.date || '')
    const rightTime = Date.parse(right?.date || '')
    const leftHasDate = Number.isFinite(leftTime)
    const rightHasDate = Number.isFinite(rightTime)

    if (leftHasDate || rightHasDate) {
      if (!leftHasDate) return 1
      if (!rightHasDate) return -1
      if (leftTime !== rightTime) return rightTime - leftTime
    }

    return String(left?.sourcePath || left?.key || '')
      .localeCompare(String(right?.sourcePath || right?.key || ''), 'en')
  })
}
