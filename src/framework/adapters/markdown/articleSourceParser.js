import fm from 'front-matter'
import MarkdownIt from 'markdown-it'
import { resolveArticleCover } from '../../utils/articleCover.js'

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

function createArticleRecord(rawContent, sourcePath, { includeContent = false } = {}) {
  const fileName = resolveArticleFileName(sourcePath)
  const parsed = fm(rawContent || '')
  const frontmatter = parsed.attributes || {}
  const body = parsed.body || ''
  const html = markdown.render(body)
  const title = frontmatter.title || fileName
  const slug = normalizeArticleLookupId(frontmatter.slug || fileName) || fileName
  const plainText = normalizeTextValue(stripHtmlTags(html))
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

  const author = frontmatter.author ? { name: String(frontmatter.author) } : null

  const article = {
    id: fileName,
    slug,
    title,
    date: frontmatter.date || null,
    author,
    category,
    tags,
    cover: resolveArticleCover(frontmatter.cover, slug || fileName),
    description,
    summary: summary || excerpt,
    excerpt,
    plainText,
    readTime: estimateReadTime(plainText),
    createdAt: frontmatter.date || null,
    sourcePath
  }

  if (includeContent) {
    article.content = html
  }

  return article
}

export function parseArticleMetadata(rawContent, sourcePath) {
  return createArticleRecord(rawContent, sourcePath)
}

export function parseArticleDetail(rawContent, sourcePath) {
  return createArticleRecord(rawContent, sourcePath, { includeContent: true })
}
