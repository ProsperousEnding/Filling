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
  getMaxMenuSourceLimit,
  normalizeMenuConfig,
  resolveMenuPage,
  resolveHeaderMenuGroups,
  resolveSidebarMenuSections
} from '../src/framework/utils/menuConfig.js'
import {
  normalizeMenuContentPath,
  parseMenuCollectionDetail,
  parseMenuContextSource,
  sortMenuCollectionItems
} from '../src/framework/adapters/markdown/menuPageSourceParser.js'
import {
  resolveBuiltInPageComponentKey,
  resolveMenuPageComponentKey
} from '../src/framework/utils/pageComponentConfig.js'
import { normalizeThemeAssetPath } from '../src/framework/utils/themeAsset.js'
import { applyConfigEnvOverrides } from '../src/framework/config/configEnvOverrides.js'
import { parseToml } from '../src/framework/utils/tomlParser.js'
import contentIndexData from '../src/framework/generated/contentIndex.generated.js'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const CONFIG_DIR = path.join(ROOT_DIR, 'blog', 'config')
const ARTICLES_DIR = path.join(ROOT_DIR, 'blog', 'content', 'articles')

const STATIC_STYLE = `
<style id="vue-blog-static-preview">
  :root {
    color-scheme: light;
    --ssg-bg: #f8fafc;
    --ssg-panel: #ffffff;
    --ssg-panel-muted: #f8fafc;
    --ssg-text: #0f172a;
    --ssg-text-soft: #475569;
    --ssg-text-muted: #64748b;
    --ssg-line: rgba(148, 163, 184, 0.24);
    --ssg-accent: #2563eb;
    --ssg-accent-soft: rgba(37, 99, 235, 0.1);
    --ssg-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }

  body {
    margin: 0;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 28%, #ffffff 100%);
    color: var(--ssg-text);
  }

  .ssg-shell {
    min-height: 100vh;
  }

  .ssg-container {
    width: min(1120px, calc(100vw - 32px));
    margin: 0 auto;
  }

  .ssg-header {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.84);
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .ssg-header-inner,
  .ssg-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px 0;
  }

  .ssg-brand {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-brand-title {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-brand-description {
    display: block;
    margin-top: 4px;
    color: var(--ssg-text-muted);
    font-size: 0.92rem;
  }

  .ssg-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ssg-nav a,
  .ssg-inline-link,
  .ssg-tag,
  .ssg-category {
    color: var(--ssg-accent);
    text-decoration: none;
  }

  .ssg-nav a:hover,
  .ssg-inline-link:hover,
  .ssg-tag:hover,
  .ssg-category:hover,
  .ssg-article-link:hover,
  .ssg-sidebar-link:hover,
  .ssg-footer-link:hover {
    text-decoration: underline;
  }

  .ssg-main {
    padding: 32px 0 56px;
  }

  .ssg-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 32px;
    align-items: start;
  }

  .ssg-layout.is-sidebar-left {
    grid-template-columns: 300px minmax(0, 1fr);
  }

  .ssg-layout.is-sidebar-left .ssg-sidebar {
    order: 0;
  }

  .ssg-layout.is-sidebar-left .ssg-content {
    order: 1;
  }

  .ssg-content,
  .ssg-sidebar-card,
  .ssg-footer {
    background: var(--ssg-panel);
    border: 1px solid var(--ssg-line);
    border-radius: 20px;
    box-shadow: var(--ssg-shadow);
  }

  .ssg-content {
    padding: 28px;
  }

  .ssg-page-title {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    line-height: 1.12;
    letter-spacing: -0.03em;
  }

  .ssg-page-description {
    margin: 12px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.7;
  }

  .ssg-page-header {
    margin-bottom: 28px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--ssg-line);
  }

  .ssg-list {
    display: grid;
    gap: 18px;
  }

  .ssg-card {
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px solid var(--ssg-line);
    background: var(--ssg-panel-muted);
  }

  .ssg-article-link {
    color: var(--ssg-text);
    text-decoration: none;
    font-size: 1.06rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-meta,
  .ssg-meta a,
  .ssg-summary,
  .ssg-footer-copy,
  .ssg-footer-note,
  .ssg-sidebar-copy,
  .ssg-sidebar-meta {
    color: var(--ssg-text-muted);
    font-size: 0.94rem;
    line-height: 1.7;
  }

  .ssg-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 10px;
  }

  .ssg-summary {
    margin: 12px 0 0;
  }

  .ssg-cover {
    display: block;
    width: 100%;
    max-height: 420px;
    margin: 0 0 24px;
    border-radius: 18px;
    object-fit: cover;
    background: #e2e8f0;
  }

  .ssg-prose {
    color: var(--ssg-text);
    line-height: 1.85;
  }

  .ssg-prose h1,
  .ssg-prose h2,
  .ssg-prose h3,
  .ssg-prose h4 {
    margin: 1.5em 0 0.6em;
    line-height: 1.25;
    letter-spacing: -0.03em;
  }

  .ssg-prose p,
  .ssg-prose ul,
  .ssg-prose ol,
  .ssg-prose pre,
  .ssg-prose blockquote {
    margin: 0 0 1.1em;
  }

  .ssg-prose pre {
    overflow-x: auto;
    padding: 16px;
    border-radius: 16px;
    background: #0f172a;
    color: #e2e8f0;
  }

  .ssg-prose code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92em;
  }

  .ssg-prose :not(pre) > code {
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.14);
  }

  .ssg-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ssg-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--ssg-accent-soft);
    color: var(--ssg-accent);
    text-decoration: none;
    font-size: 0.92rem;
  }

  .ssg-chip-current {
    background: var(--ssg-accent);
    color: #fff;
    font-weight: 700;
  }

  .ssg-pagination {
    margin-top: 28px;
    display: flex;
    justify-content: center;
  }

  .ssg-pagination-shell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ssg-pagination-link,
  .ssg-pagination-current,
  .ssg-pagination-disabled,
  .ssg-pagination-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 0.94rem;
    line-height: 1;
  }

  .ssg-pagination-link,
  .ssg-pagination-current,
  .ssg-pagination-disabled {
    border: 1px solid var(--ssg-line);
    background: var(--ssg-panel-muted);
  }

  .ssg-pagination-link {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-pagination-link:hover {
    border-color: rgba(37, 99, 235, 0.28);
    color: var(--ssg-accent);
  }

  .ssg-pagination-current {
    background: var(--ssg-accent);
    border-color: var(--ssg-accent);
    color: #fff;
    font-weight: 700;
  }

  .ssg-pagination-disabled,
  .ssg-pagination-ellipsis {
    color: var(--ssg-text-muted);
  }

  .ssg-sidebar {
    display: grid;
    gap: 18px;
  }

  .ssg-sidebar-card {
    padding: 18px;
  }

  .ssg-sidebar-title {
    margin: 0 0 12px;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-sidebar-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ssg-sidebar-link,
  .ssg-footer-link {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-sidebar-meta {
    display: block;
    margin-top: 4px;
  }

  .ssg-avatar {
    width: 72px;
    height: 72px;
    border-radius: 999px;
    object-fit: cover;
    display: block;
    margin-bottom: 14px;
    border: 1px solid rgba(148, 163, 184, 0.28);
  }

  .ssg-footer {
    margin: 0 auto 36px;
  }

  .ssg-footer-inner {
    padding: 20px 24px;
  }

  .ssg-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
  }

  .ssg-archive-year {
    margin: 28px 0 14px;
    font-size: 1.12rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-archive-preview {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  .ssg-archive-preview a {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-archive-preview a:hover {
    color: var(--ssg-accent);
  }

  .ssg-empty {
    padding: 20px;
    border-radius: 18px;
    border: 1px dashed rgba(148, 163, 184, 0.42);
    color: var(--ssg-text-muted);
    background: rgba(248, 250, 252, 0.8);
  }

  .ssg-configured-copy {
    display: grid;
    gap: 16px;
  }

  .ssg-configured-copy p {
    margin: 0;
    color: var(--ssg-text-soft);
    line-height: 1.9;
  }

  .ssg-configured-context,
  .ssg-configured-cards {
    display: grid;
    gap: 16px;
  }

  .ssg-configured-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 16px;
  }

  .ssg-configured-timeline {
    position: relative;
    display: grid;
    gap: 18px;
  }

  .ssg-configured-timeline::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 88px;
    width: 2px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.18), rgba(148, 163, 184, 0.28));
  }

  .ssg-configured-item {
    display: block;
    padding: 18px 20px;
    border-radius: 18px;
    text-decoration: none;
    border: 1px solid var(--ssg-line);
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .ssg-configured-item:hover {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.26);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
  }

  .ssg-configured-context .ssg-configured-item {
    background: rgba(248, 250, 252, 0.82);
  }

  .ssg-configured-cards .ssg-configured-item {
    background: #fff;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
  }

  .ssg-configured-grid .ssg-configured-item {
    min-height: 180px;
    background:
      radial-gradient(circle at top right, rgba(191, 219, 254, 0.34), transparent 36%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  }

  .ssg-configured-meta {
    margin: 0 0 6px;
    color: var(--ssg-accent);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .ssg-configured-media {
    margin: -18px -20px 16px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(226, 232, 240, 0.9), rgba(226, 232, 240, 0.55));
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  .ssg-configured-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssg-configured-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.08rem;
    line-height: 1.45;
    letter-spacing: -0.02em;
  }

  .ssg-configured-description {
    margin: 10px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
  }

  .ssg-configured-timeline-item {
    position: relative;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    text-decoration: none;
    color: inherit;
  }

  .ssg-configured-timeline-stamp {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.1rem;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    border: 1px solid rgba(37, 99, 235, 0.18);
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.06));
    color: var(--ssg-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
  }

  .ssg-configured-timeline-card {
    position: relative;
    display: block;
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px solid var(--ssg-line);
    background:
      radial-gradient(circle at top right, rgba(191, 219, 254, 0.24), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .ssg-configured-timeline-card::before {
    content: "";
    position: absolute;
    top: 22px;
    left: -16px;
    width: 16px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0.52));
  }

  .ssg-configured-timeline-item:hover .ssg-configured-timeline-card {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.24);
    box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
  }

  @media (max-width: 960px) {
    .ssg-header-inner,
    .ssg-footer-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .ssg-layout,
    .ssg-layout.is-sidebar-left {
      grid-template-columns: minmax(0, 1fr);
    }

    .ssg-sidebar,
    .ssg-layout.is-sidebar-left .ssg-sidebar,
    .ssg-layout.is-sidebar-left .ssg-content {
      order: initial;
    }

    .ssg-configured-grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .ssg-configured-timeline::before {
      left: 20px;
    }

    .ssg-configured-timeline-item {
      grid-template-columns: 1fr;
      gap: 10px;
      padding-left: 40px;
    }

    .ssg-configured-timeline-stamp {
      justify-self: start;
    }

    .ssg-configured-timeline-card::before {
      top: 20px;
      left: -24px;
      width: 24px;
    }
  }

  @media (min-width: 768px) {
    .ssg-configured-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
`

function toTrimmedString(value) {
  return String(value || '').trim()
}

function normalizeTextValue(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(input) {
  return String(input || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

function createExcerpt(text, maxLength = 180) {
  const normalized = normalizeTextValue(text)
  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trim()}...`
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toSlugId(input) {
  const normalized = toTrimmedString(input)

  if (!normalized) {
    return ''
  }

  return normalized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeArticleLookupId(input) {
  return toTrimmedString(input)
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
}

function normalizeSiteUrl(value) {
  const normalized = toTrimmedString(value)

  if (!normalized) {
    return ''
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/+$/, '')
  }

  return `https://${normalized}`.replace(/\/+$/, '')
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

function formatDateLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知日期'
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function resolveArticleHref(article) {
  return getArticlePath(article)
}

function resolveCollectionHref(prefix, id) {
  if (prefix === 'category') {
    return getCategoryPath(id)
  }

  if (prefix === 'tag') {
    return getTagPath(id)
  }

  return getHomePath()
}

function resolveInternalHref(basePath, routePath) {
  const normalizedRoutePath = String(routePath || '').trim()

  if (!normalizedRoutePath || normalizedRoutePath === '/') {
    return withBasePath(basePath, '/')
  }

  return withBasePath(basePath, normalizedRoutePath.replace(/^\/+/, ''))
}

function resolveThemeCssFile(themeConfig = {}) {
  const presets = themeConfig.presets && typeof themeConfig.presets === 'object'
    ? themeConfig.presets
    : {}
  const currentPreset = toTrimmedString(themeConfig.current_preset)
  const activePreset = currentPreset && presets[currentPreset] && typeof presets[currentPreset] === 'object'
    ? presets[currentPreset]
    : null

  return normalizeThemeAssetPath(activePreset?.css_file || themeConfig.css_file || '')
}

async function loadTomlConfig(name) {
  const filePath = path.join(CONFIG_DIR, `${name}.toml`)
  const raw = await readFile(filePath, 'utf8')
  return parseToml(raw)
}

async function loadConfigs() {
  const [site, profile, theme, links] = await Promise.all([
    loadTomlConfig('site'),
    loadTomlConfig('profile'),
    loadTomlConfig('theme'),
    loadTomlConfig('links')
  ])

  return applyConfigEnvOverrides({
    site,
    profile,
    theme,
    links
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

async function loadArticles() {
  const files = await collectMarkdownFiles(ARTICLES_DIR)

  const items = await Promise.all(files.map(async (filePath) => {
    const rawContent = await readFile(filePath, 'utf8')
    const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/')
    const sourcePath = `/${relativePath}`
    const article = parseArticleDetail(rawContent, sourcePath)

    return {
      ...article,
      date: normalizeDateValue(article.date),
      createdAt: normalizeDateValue(article.createdAt),
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

    const year = new Date(entry.createdAt || 0).getFullYear()
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

function normalizeFriendLinks(friendLinks = []) {
  if (!Array.isArray(friendLinks)) {
    return []
  }

  return friendLinks
    .map((link, index) => {
      const name = toTrimmedString(link?.name)
      const url = toTrimmedString(link?.url)
      const description = toTrimmedString(link?.description)

      if (!name || !url) {
        return null
      }

      return {
        id: `friend-link-${index}`,
        name,
        url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
        description
      }
    })
    .filter(Boolean)
}

function resolveProfileAvatar(basePath, value) {
  const normalized = toTrimmedString(value)

  if (!normalized) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) {
    return normalized
  }

  return withBasePath(basePath, normalized)
}

function renderMetaParts(parts) {
  const items = parts.filter(Boolean)

  if (items.length === 0) {
    return ''
  }

  return `<div class="ssg-meta">${items.join('')}</div>`
}

function renderCollectionShell(items, renderItem, variant = 'list', emptyText = '这里还没有内容。') {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="ssg-empty">${escapeHtml(emptyText)}</div>`
  }

  if (variant === 'grid') {
    return `<div class="ssg-configured-grid">${items.map(item => renderItem(item, 'ssg-configured-item')).join('')}</div>`
  }

  if (variant === 'card') {
    return `<div class="ssg-configured-cards">${items.map(item => renderItem(item, 'ssg-configured-item')).join('')}</div>`
  }

  return `<div class="ssg-list">${items.map(item => renderItem(item, 'ssg-card')).join('')}</div>`
}

function resolveBuiltInPageVariant(pageKey, page, fallback = 'list') {
  const componentKey = resolveBuiltInPageComponentKey(pageKey, page?.component)

  if (componentKey === 'context') {
    return fallback
  }

  return componentKey || fallback
}

function resolveMenuPageVariant(page) {
  return resolveMenuPageComponentKey(page?.component)
}

function renderArticleCard(article, basePath, className = 'ssg-card') {
  const categoryLink = article.category
    ? `<a class="ssg-category" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', article.category.id)))}">${escapeHtml(article.category.name)}</a>`
    : ''
  const tags = article.tags.length > 0
    ? article.tags
      .slice(0, 3)
      .map(tag => `<a class="ssg-tag" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>`)
      .join(' ')
    : ''

  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveArticleHref(article)))}">${escapeHtml(article.title)}</a>
      ${renderMetaParts([
        `<span>${escapeHtml(formatDateLabel(article.createdAt || article.date))}</span>`,
        categoryLink,
        tags ? `<span>${tags}</span>` : ''
      ])}
      <p class="ssg-summary">${escapeHtml(article.excerpt)}</p>
    </article>
  `
}

function renderArticleList(articles, basePath, variant = 'list') {
  return renderCollectionShell(
    articles,
    (article, className) => renderArticleCard(article, basePath, className),
    variant,
    '这里还没有内容。'
  )
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

function getDisplayedPages(currentPage, totalPages) {
  const totalDisplayed = 5
  const pages = []

  if (totalPages <= totalDisplayed) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page)
    }
    return pages
  }

  const leftSide = Math.floor(totalDisplayed / 2)
  const rightSide = totalDisplayed - leftSide - 1

  if (currentPage > leftSide + 1) {
    pages.push(1)
    pages.push('...')
  }

  let start = Math.max(1, currentPage - leftSide)
  let end = Math.min(totalPages, currentPage + rightSide)

  if (end - start + 1 < totalDisplayed - 2) {
    if (start === 1) {
      end = Math.min(totalDisplayed - 1, totalPages)
    } else {
      start = Math.max(1, end - totalDisplayed + 3)
    }
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < totalPages - 1) {
    pages.push('...')
  }

  if (end < totalPages) {
    pages.push(totalPages)
  }

  return pages
}

function renderPagination({ currentPage, totalPages, resolvePagePath, basePath }) {
  if (!Number.isFinite(totalPages) || totalPages <= 1 || typeof resolvePagePath !== 'function') {
    return ''
  }

  const displayedPages = getDisplayedPages(currentPage, totalPages)
  const previousPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null
  const previousLink = previousPage
    ? `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(previousPage)))}">上一页</a>`
    : '<span class="ssg-pagination-disabled">上一页</span>'
  const nextLink = nextPage
    ? `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(nextPage)))}">下一页</a>`
    : '<span class="ssg-pagination-disabled">下一页</span>'

  return `
    <nav class="ssg-pagination" aria-label="Pagination">
      <div class="ssg-pagination-shell">
        ${previousLink}
        ${displayedPages.map((page) => {
          if (page === '...') {
            return '<span class="ssg-pagination-ellipsis">···</span>'
          }

          if (page === currentPage) {
            return `<span class="ssg-pagination-current" aria-current="page">${page}</span>`
          }

          return `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(page)))}">${page}</a>`
        }).join('')}
        ${nextLink}
      </div>
    </nav>
  `
}

function renderPaginatedArticleList(items, options = {}) {
  const {
    currentPage = 1,
    totalPages = 1,
    resolvePagePath,
    basePath,
    variant = 'list'
  } = options

  return `
    ${renderMenuPage({
      component: variant,
      items: createStaticArticleCollectionItems(items),
      emptyText: '这里还没有内容。'
    }, basePath)}
    ${renderPagination({ currentPage, totalPages, resolvePagePath, basePath })}
  `
}

function renderPaginatedMenuPage(page, options = {}) {
  const {
    currentPage = 1,
    totalPages = 1,
    resolvePagePath,
    basePath
  } = options

  return `
    ${renderMenuPage(page, basePath)}
    ${renderPagination({ currentPage, totalPages, resolvePagePath, basePath })}
  `
}

function renderCategoryCard(category, basePath, className = 'ssg-card') {
  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', category.id)))}">${escapeHtml(category.name)}</a>
      <p class="ssg-summary">${escapeHtml(category.description || `共 ${category.articleCount} 篇文章`)}</p>
    </article>
  `
}

function renderCategoryList(categories, basePath, variant = 'list') {
  return renderCollectionShell(
    categories,
    (category, className) => renderCategoryCard(category, basePath, className),
    variant,
    '这里还没有分类。'
  )
}

function renderTagCard(tag, basePath, className = 'ssg-card') {
  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>
      <p class="ssg-summary">${escapeHtml(`共 ${tag.articleCount} 篇文章`)}</p>
    </article>
  `
}

function renderTagList(tags, basePath, variant = 'list') {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '<div class="ssg-empty">这里还没有标签。</div>'
  }

  if (variant !== 'list') {
    return renderCollectionShell(
      tags,
      (tag, className) => renderTagCard(tag, basePath, className),
      variant,
      '这里还没有标签。'
    )
  }

  return `
    <div class="ssg-chip-list">
      ${tags.map(tag => `
        <a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">
          <span>#${escapeHtml(tag.name)}</span>
          <span>${escapeHtml(String(tag.articleCount))}</span>
        </a>
      `).join('')}
    </div>
  `
}

function renderArchiveFilters(archiveGroups, basePath, activeYear = null) {
  if (!Array.isArray(archiveGroups) || archiveGroups.length === 0) {
    return ''
  }

  const allLink = activeYear
    ? `<a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, getArchivePath()))}">全部</a>`
    : '<span class="ssg-chip ssg-chip-current" aria-current="page">全部</span>'

  return `
    <nav class="ssg-chip-list" aria-label="Archive years">
      ${allLink}
      ${archiveGroups.map((group) => {
        const year = Number(group?.year)
        if (!Number.isFinite(year)) {
          return ''
        }

        if (year === activeYear) {
          return `<span class="ssg-chip ssg-chip-current" aria-current="page">${escapeHtml(String(year))}</span>`
        }

        return `<a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, getArchiveYearPath(year)))}">${escapeHtml(String(year))}</a>`
      }).join('')}
    </nav>
  `
}

function renderArchiveOverviewCard(group, basePath, className = 'ssg-card') {
  const year = Number(group?.year)
  const articleCount = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)
  const previewArticles = Array.isArray(group?.articles) ? group.articles.slice(0, 3) : []

  return `
    <article class="${className}">
      <div class="ssg-meta">
        <span>${escapeHtml(String(year))} 年</span>
        <span>${escapeHtml(String(articleCount))} 篇文章</span>
      </div>
      <h2 class="ssg-archive-year">
        <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, getArchiveYearPath(year)))}">${escapeHtml(`${year} 年归档`)}</a>
      </h2>
      ${previewArticles.length > 0
        ? `
          <ul class="ssg-archive-preview">
            ${previewArticles.map((article) => `
              <li>
                <a href="${escapeAttribute(resolveInternalHref(basePath, resolveArticleHref(article)))}">${escapeHtml(article.title)}</a>
              </li>
            `).join('')}
          </ul>
        `
        : '<div class="ssg-empty">该年份暂无文章。</div>'}
    </article>
  `
}

function renderArchiveOverview(archiveGroups, basePath, variant = 'card') {
  if (!Array.isArray(archiveGroups) || archiveGroups.length === 0) {
    return '<div class="ssg-empty">这里还没有归档内容。</div>'
  }

  return `
    ${renderArchiveFilters(archiveGroups, basePath)}
    ${renderCollectionShell(
      archiveGroups,
      (group, className) => renderArchiveOverviewCard(group, basePath, className),
      variant,
      '这里还没有归档内容。'
    )}
  `
}

function groupArchiveArticlesByMonth(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return []
  }

  const monthFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'long' })
  const groups = new Map()

  articles.forEach((article) => {
    const date = new Date(article.createdAt || article.date)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const monthNumber = date.getMonth() + 1
    const current = groups.get(monthNumber) || {
      month: monthFormatter.format(date),
      monthNumber,
      articles: []
    }

    current.articles.push(article)
    groups.set(monthNumber, current)
  })

  return Array.from(groups.values()).sort((a, b) => b.monthNumber - a.monthNumber)
}

function renderArchiveYearDetail(archiveGroup, archiveGroups, basePath, variant = 'list') {
  const year = Number(archiveGroup?.year)
  const monthGroups = groupArchiveArticlesByMonth(archiveGroup?.articles)

  return `
    ${renderArchiveFilters(archiveGroups, basePath, year)}
    ${monthGroups.length > 0
      ? monthGroups.map((group) => `
        <section>
          <h2 class="ssg-archive-year">${escapeHtml(group.month)}</h2>
          ${renderArticleList(group.articles, basePath, variant)}
        </section>
      `).join('')
      : '<div class="ssg-empty">该年份内还没有归档文章。</div>'}
  `
}

function renderArticleDetail(article, relatedArticles, basePath) {
  const cover = article.cover
    ? `<img class="ssg-cover" src="${escapeAttribute(article.cover)}" alt="${escapeAttribute(article.title)}" />`
    : ''
  const meta = renderMetaParts([
    `<span>${escapeHtml(formatDateLabel(article.createdAt || article.date))}</span>`,
    article.category
      ? `<a class="ssg-category" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', article.category.id)))}">${escapeHtml(article.category.name)}</a>`
      : '',
    article.author ? `<span>${escapeHtml(article.author)}</span>` : ''
  ])
  const tags = article.tags.length > 0
    ? `<div class="ssg-chip-list">${article.tags.map(tag => `
      <a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>
    `).join('')}</div>`
    : ''
  const related = Array.isArray(relatedArticles) && relatedArticles.length > 0
    ? `
      <section>
        <h2 class="ssg-archive-year">相关文章</h2>
        ${renderArticleList(relatedArticles, basePath)}
      </section>
    `
    : ''

  return `
    <article>
      <header class="ssg-page-header">
        <h1 class="ssg-page-title">${escapeHtml(article.title)}</h1>
        ${meta}
        ${article.excerpt ? `<p class="ssg-page-description">${escapeHtml(article.excerpt)}</p>` : ''}
      </header>
      ${cover}
      <div class="ssg-prose">${article.content}</div>
      ${tags ? `<section style="margin-top: 28px;">${tags}</section>` : ''}
      ${related}
    </article>
  `
}

function splitMenuPageContent(content = '') {
  return String(content || '')
    .trim()
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
}

function formatStaticDateLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pickStaticText(...values) {
  return values.map(value => String(value || '').trim()).find(Boolean) || ''
}

function createStaticArticleCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(article => {
    const categoryName = String(article?.category?.name || article?.category || '').trim()
    const dateLabel = formatStaticDateLabel(article?.createdAt || article?.date)

    return {
      key: `article-${String(article?.id || article?.slug || article?.title || '').trim()}`,
      kind: 'article',
      title: String(article?.title || '').trim(),
      description: pickStaticText(article?.summary, article?.description, article?.excerpt),
      meta: [dateLabel, categoryName].filter(Boolean).join(' · '),
      cover: article?.cover || '',
      to: getArticlePath(article)
    }
  })
}

function createStaticContentCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(item => {
    const title = String(item?.title || '').trim()
    const dateLabel = formatStaticDateLabel(item?.createdAt || item?.date)
    const sectionTitle = String(item?.sectionTitle || '').trim()
    const categoryName = String(item?.category?.name || item?.category || '').trim()

    return {
      key: String(item?.id || item?.to || item?.sourcePath || title).trim(),
      kind: String(item?.kind || 'entry').trim(),
      iconKind: String(item?.iconKind || item?.kind || 'entry').trim(),
      title,
      description: pickStaticText(item?.excerpt, item?.description),
      meta: [dateLabel, sectionTitle].filter(Boolean).join(' · '),
      footer: sectionTitle && sectionTitle !== title ? sectionTitle : '',
      cover: item?.cover || '',
      category: categoryName ? { label: categoryName } : null,
      tags: (Array.isArray(item?.tags) ? item.tags : [])
        .map(tag => ({ label: String(tag?.name || tag?.label || '').trim() }))
        .filter(tag => tag.label),
      to: String(item?.to || '').trim()
    }
  })
}

function createStaticCategoryCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(category => {
    const name = String(category?.name || '').trim()
    const count = Number(category?.count || category?.articleCount || 0)

    return {
      key: `category-${String(category?.id || name).trim()}`,
      kind: 'category',
      title: name,
      description: pickStaticText(category?.description, `查看 ${name} 分类下的全部内容`),
      meta: `${count} 项内容`,
      to: getCategoryPath(category)
    }
  })
}

function createStaticTagCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(tag => {
    const name = String(tag?.name || '').trim()
    const count = Number(tag?.count || tag?.articleCount || 0)

    return {
      key: `tag-${String(tag?.id || name).trim()}`,
      kind: 'tag',
      title: name,
      description: pickStaticText(tag?.description, `查看 ${name} 标签下的全部内容`),
      meta: `${count} 项内容`,
      to: getTagPath(tag)
    }
  })
}

function createStaticArchiveOverviewItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(group => {
      const year = Number(group?.year)
      const count = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)

      if (!Number.isFinite(year)) {
        return null
      }

      return {
        key: `archive-${year}`,
        kind: 'archive',
        title: `${year} 年`,
        description: `${count} 项内容`,
        meta: '查看归档',
        to: getArchiveYearPath(year)
      }
    })
    .filter(Boolean)
}

async function loadStaticMenuPageSource(page, componentKey) {
  const normalizedComponentKey = resolveMenuPageComponentKey(componentKey)

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
      return parseMenuContextSource(rawContent, path.posix.join('/blog/content', relativeFilePath))
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
      return parseMenuCollectionDetail(rawContent, sourcePath, { pagePath: page.path })
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

function resolveMenuPageHref(item, basePath) {
  if (item?.external) {
    return escapeAttribute(item.href || '#')
  }

  return escapeAttribute(resolveInternalHref(basePath, item?.to || '/'))
}

function renderMenuPageItem(item, basePath, className = 'ssg-configured-item') {
  const tag = item?.to || item?.href ? 'a' : 'article'
  const href = tag === 'a' ? ` href="${resolveMenuPageHref(item, basePath)}"` : ''
  const target = item?.external ? ' target="_blank"' : ''
  const rel = item?.external ? ' rel="noreferrer"' : ''
  const cover = toTrimmedString(item?.cover || item?.imageUrl || item?.image)

  return `
    <${tag} class="${className}"${href}${target}${rel}>
      ${cover
        ? `<div class="ssg-configured-media"><img class="ssg-configured-image" src="${escapeAttribute(cover)}" alt="${escapeAttribute(item?.title || '')}" loading="lazy" /></div>`
        : ''}
      ${item?.meta ? `<p class="ssg-configured-meta">${escapeHtml(item.meta)}</p>` : ''}
      <h2 class="ssg-configured-title">${escapeHtml(item?.title || '')}</h2>
      ${item?.description ? `<p class="ssg-configured-description">${escapeHtml(item.description)}</p>` : ''}
    </${tag}>
  `
}

function isStaticArchiveMenuItem(item) {
  return String(item?.kind || '').trim().toLowerCase() === 'archive'
}

function resolveTimelineStamp(item) {
  if (isStaticArchiveMenuItem(item)) {
    const matchedYear = String(item?.title || '').match(/\d{4}/)
    return matchedYear?.[0] || String(item?.title || item?.description || '归档').trim()
  }

  const [primaryMeta] = String(item?.meta || '').split(' · ')
  return primaryMeta || String(item?.footer || '目录').trim()
}

function resolveTimelineMeta(item) {
  if (isStaticArchiveMenuItem(item)) {
    return String(item?.description || '').trim()
  }

  const [, ...restMetaParts] = String(item?.meta || '').split(' · ')
  return restMetaParts.join(' · ').trim()
}

function renderTimelineMenuPageItem(item, basePath) {
  const tag = item?.to || item?.href ? 'a' : 'article'
  const href = tag === 'a' ? ` href="${resolveMenuPageHref(item, basePath)}"` : ''
  const target = item?.external ? ' target="_blank"' : ''
  const rel = item?.external ? ' rel="noreferrer"' : ''
  const stamp = resolveTimelineStamp(item)
  const meta = resolveTimelineMeta(item)

  return `
    <${tag} class="ssg-configured-timeline-item"${href}${target}${rel}>
      <span class="ssg-configured-timeline-stamp">${escapeHtml(stamp)}</span>
      <div class="ssg-configured-timeline-card">
        ${meta ? `<p class="ssg-configured-meta">${escapeHtml(meta)}</p>` : ''}
        <h2 class="ssg-configured-title">${escapeHtml(item?.title || '')}</h2>
        ${item?.description ? `<p class="ssg-configured-description">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </${tag}>
  `
}

function renderMenuPage(page, basePath) {
  const items = Array.isArray(page?.items) ? page.items : []
  const contentHtml = String(page?.contentHtml || '').trim()
  const contentBlocks = splitMenuPageContent(page?.content)
  const component = resolveMenuPageComponentKey(page?.component)

  if (component === 'context') {
    return `
      <div class="ssg-configured-context">
        ${contentHtml
          ? `<div class="ssg-configured-copy ssg-prose">${contentHtml}</div>`
          : ''}
        ${!contentHtml && contentBlocks.length > 0
          ? `<div class="ssg-configured-copy">${contentBlocks.map(block => `<p>${escapeHtml(block)}</p>`).join('')}</div>`
          : ''}
        ${items.length > 0
          ? items.map(item => renderMenuPageItem(item, basePath)).join('')
          : ''}
        ${!contentHtml && contentBlocks.length === 0 && items.length === 0 ? '<div class="ssg-empty">这个页面还没有配置内容。</div>' : ''}
      </div>
    `
  }

  if (component === 'timeline') {
    return items.length > 0
      ? `<div class="ssg-configured-timeline">${items.map(item => renderTimelineMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置时间线内容。</div>'
  }

  if (component === 'grid') {
    return items.length > 0
      ? `<div class="ssg-configured-grid">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置网格内容。</div>'
  }

  if (component === 'list') {
    return items.length > 0
      ? `<div class="ssg-list">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置列表内容。</div>'
  }

  return items.length > 0
    ? `<div class="ssg-configured-cards">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
    : '<div class="ssg-empty">这个页面还没有配置卡片内容。</div>'
}

function renderMenuPageDetail(page, item, basePath) {
  return `
    <header class="ssg-page-header">
      <p class="ssg-meta"><a class="ssg-inline-link" href="${escapeAttribute(resolveInternalHref(basePath, page?.path || '/'))}">${escapeHtml(page?.title || '')}</a></p>
      <h1 class="ssg-page-title">${escapeHtml(item?.title || '')}</h1>
      ${item?.meta ? `<p class="ssg-page-description">${escapeHtml(item.meta)}</p>` : ''}
      ${item?.description ? `<p class="ssg-page-description">${escapeHtml(item.description)}</p>` : ''}
    </header>
    ${item?.contentHtml
      ? `<div class="ssg-prose">${item.contentHtml}</div>`
      : '<div class="ssg-empty">这个条目还没有正文内容。</div>'}
  `
}

function resolveStaticMenuHref(basePath, item = {}) {
  if (item.external) {
    return escapeAttribute(item.href || '#')
  }

  return escapeAttribute(resolveInternalHref(basePath, item.to || '/'))
}

function renderStaticHeaderMenuGroup(group, basePath) {
  const items = Array.isArray(group?.rendererProps?.items) ? group.rendererProps.items : []

  return items.map((item) => {
    const rel = item.external ? ' rel="noreferrer"' : ''
    const target = item.external ? ' target="_blank"' : ''

    return `<a href="${resolveStaticMenuHref(basePath, item)}"${target}${rel}>${escapeHtml(item.label)}</a>`
  }).join('')
}

function renderStaticSidebarSection(section, basePath) {
  const items = Array.isArray(section?.rendererProps?.items) ? section.rendererProps.items : []
  const variant = section?.rendererProps?.variant || 'default'

  if (items.length === 0) {
    return ''
  }

  if (section.renderer === 'sidebar-article') {
    return `
      <section class="ssg-sidebar-card">
        <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
        <ul class="ssg-sidebar-list">
          ${items.map(item => `
            <li>
              <a class="ssg-sidebar-link" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>${escapeHtml(item.label)}</a>
              ${item.meta ? `<span class="ssg-sidebar-meta">${escapeHtml(item.meta)}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    `
  }

  if (variant === 'tags') {
    return `
      <section class="ssg-sidebar-card">
        <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
        <div class="ssg-chip-list">
          ${items.map(item => `
            <a class="ssg-chip" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>
              <span>${escapeHtml(item.label)}</span>
              ${item.badge ? `<span>${escapeHtml(item.badge)}</span>` : ''}
            </a>
          `).join('')}
        </div>
      </section>
    `
  }

  return `
    <section class="ssg-sidebar-card">
      <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
      <ul class="ssg-sidebar-list">
        ${items.map(item => `
          <li>
            <a class="ssg-sidebar-link" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>${escapeHtml(item.label)}</a>
            ${item.badge ? `<span class="ssg-sidebar-meta">${escapeHtml(item.badge)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `
}

function renderSidebar(data) {
  const {
    site,
    profile,
    latestArticles,
    categories,
    tags,
    friendLinks,
    basePath,
    menus,
    routePatterns
  } = data
  const displayName = toTrimmedString(profile.display_name) || toTrimmedString(profile.username) || toTrimmedString(site.title)
  const displayUsername = toTrimmedString(profile.username)
  const tagline = toTrimmedString(profile.tagline) || toTrimmedString(site.description)
  const avatar = resolveProfileAvatar(basePath, profile.avatar_url)
  const profileCard = (displayName || tagline || avatar)
    ? `
      <section class="ssg-sidebar-card">
        ${avatar ? `<img class="ssg-avatar" src="${escapeAttribute(avatar)}" alt="${escapeAttribute(displayName || 'avatar')}" />` : ''}
        ${displayName ? `<h2 class="ssg-sidebar-title">${escapeHtml(displayName)}</h2>` : ''}
        ${displayUsername ? `<div class="ssg-sidebar-meta">@${escapeHtml(displayUsername.replace(/^@+/, ''))}</div>` : ''}
        ${tagline ? `<p class="ssg-sidebar-copy">${escapeHtml(tagline)}</p>` : ''}
      </section>
    `
    : ''
  const menuSections = resolveSidebarMenuSections(menus, {
    routePatterns,
    categories,
    tags,
    latestArticles,
    friendLinks,
    showCategoryCount: site.features?.show_category_count,
    showTagCount: site.features?.show_tag_count,
    formatArticleMeta: (article) => formatDateLabel(article.createdAt || article.date)
  })

  return [
    profileCard,
    ...menuSections.map(section => renderStaticSidebarSection(section, basePath))
  ].filter(Boolean).join('')
}

function renderFooter(site, friendLinks) {
  const footerText = toTrimmedString(site.footer?.text || site.footer_text)
  const footerNote = toTrimmedString(site.footer?.note || site.footer_note)
  const linksMarkup = friendLinks.length > 0
    ? `
      <div class="ssg-footer-links">
        ${friendLinks.map(link => `
          <a class="ssg-footer-link" href="${escapeAttribute(link.url)}">${escapeHtml(link.name)}</a>
        `).join('')}
      </div>
    `
    : ''

  return `
    <footer class="ssg-footer ssg-container">
      <div class="ssg-footer-inner">
        <div>
          ${footerText ? `<div class="ssg-footer-copy">${escapeHtml(footerText)}</div>` : ''}
          ${footerNote ? `<div class="ssg-footer-note">${escapeHtml(footerNote)}</div>` : ''}
        </div>
        ${linksMarkup}
      </div>
    </footer>
  `
}

function renderLayout({
  site,
  profile,
  content,
  latestArticles,
  categories,
  tags,
  friendLinks,
  menus,
  routePatterns,
  basePath,
  sidebarPosition,
  sidebarVisible
}) {
  const brandTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const brandDescription = toTrimmedString(site.description) || toTrimmedString(profile.tagline)
  const headerMenuGroups = resolveHeaderMenuGroups(menus, {
    routePatterns
  })
  const showSidebar = sidebarVisible && sidebarPosition !== 'hidden'

  return `
    <div class="ssg-shell">
      <header class="ssg-header">
        <div class="ssg-container ssg-header-inner">
          <a class="ssg-brand" href="${escapeAttribute(resolveInternalHref(basePath, getHomePath()))}">
            <span class="ssg-brand-title">${escapeHtml(brandTitle)}</span>
            ${brandDescription ? `<span class="ssg-brand-description">${escapeHtml(brandDescription)}</span>` : ''}
          </a>
          <nav class="ssg-nav">
            ${headerMenuGroups.map(group => renderStaticHeaderMenuGroup(group, basePath)).join('')}
          </nav>
        </div>
      </header>
      <main class="ssg-main">
        <div class="ssg-container ssg-layout ${showSidebar && sidebarPosition === 'left' ? 'is-sidebar-left' : ''}">
          <section class="ssg-content">
            ${content}
          </section>
          ${showSidebar ? `<aside class="ssg-sidebar">${renderSidebar({
            site,
            profile,
            latestArticles,
            categories,
            tags,
            friendLinks,
            menus,
            routePatterns,
            basePath
          })}</aside>` : ''}
        </div>
      </main>
      ${renderFooter(site, friendLinks)}
    </div>
  `
}

function injectHead(template, {
  title,
  description,
  absoluteUrl,
  imageUrl,
  ogType,
  robots,
  themeCssHref,
  includeStaticPreview = false
}) {
  const headTags = [
    includeStaticPreview ? STATIC_STYLE : '',
    description ? `<meta name="description" content="${escapeAttribute(description)}" />` : '',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    description ? `<meta property="og:description" content="${escapeAttribute(description)}" />` : '',
    ogType ? `<meta property="og:type" content="${escapeAttribute(ogType)}" />` : '',
    absoluteUrl ? `<meta property="og:url" content="${escapeAttribute(absoluteUrl)}" />` : '',
    imageUrl ? `<meta property="og:image" content="${escapeAttribute(imageUrl)}" />` : '',
    `<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeAttribute(description)}" />` : '',
    imageUrl ? `<meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />` : '',
    absoluteUrl ? `<link rel="canonical" href="${escapeAttribute(absoluteUrl)}" />` : '',
    robots ? `<meta name="robots" content="${escapeAttribute(robots)}" />` : '',
    includeStaticPreview && themeCssHref
      ? `<link rel="stylesheet" href="${escapeAttribute(themeCssHref)}" id="vue-blog-static-theme" />`
      : ''
  ].filter(Boolean).join('\n    ')

  const nextTemplate = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  return nextTemplate.replace('</head>', `    ${headTags}\n  </head>`)
}

function replaceAppRoot(template, markup) {
  return template.replace('<div id="app"></div>', `<div id="app">${markup}</div>`)
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
    categories,
    tags,
    archive,
    articles,
    latestArticles,
    friendLinks,
    menus,
    routePatterns,
    basePath,
    themeCssHref
  } = context
  const sidebarPosition = toTrimmedString(site.features?.sidebar_position || 'right').toLowerCase() || 'right'
  const sidebarVisible = sidebarPosition !== 'hidden'
  const siteTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const pageTitle = route.pageTitle ? `${route.pageTitle} - ${siteTitle}` : siteTitle
  const description = route.description || toTrimmedString(site.description) || toTrimmedString(profile.tagline)
  const absoluteUrl = buildAbsoluteUrl(site.site_url || site.url, basePath, route.path)
  const imageUrl = route.imageUrl
    ? (/^(https?:)?\/\//i.test(route.imageUrl) ? route.imageUrl : buildAbsoluteUrl(site.site_url || site.url, basePath, route.imageUrl))
    : ''
  const includeStaticPreview = route.staticPreview === true
  const content = includeStaticPreview
    ? renderLayout({
      site,
      profile,
      content: route.content,
      latestArticles,
      categories,
      tags,
      friendLinks,
      menus,
      routePatterns,
      basePath,
      sidebarPosition,
      sidebarVisible
    })
    : ''

  const withHead = injectHead(context.template, {
    title: pageTitle,
    description,
    absoluteUrl,
    imageUrl,
    ogType: route.ogType || 'website',
    robots: route.robots || '',
    themeCssHref,
    includeStaticPreview
  })

  return replaceAppRoot(withHead, content)
}

function getRelatedArticles(currentArticle, articles) {
  return articles
    .filter((article) => {
      if (article.id === currentArticle.id) {
        return false
      }

      const sameCategory = article.category && currentArticle.category && article.category.id === currentArticle.category.id
      const sharedTag = article.tags.some(tag => currentArticle.tags.some(currentTag => currentTag.id === tag.id))
      return sameCategory || sharedTag
    })
    .slice(0, 3)
}

async function createPageRoutes(context) {
  const { articles, categories, tags, archive, basePath, pageSize, routePatterns, menus } = context
  const articlePages = paginateItems(articles, pageSize)
  const homePage = resolveMenuPage('home', menus, routePatterns)
  const articlesPageConfig = resolveMenuPage('articles', menus, routePatterns)
  const categoriesPage = resolveMenuPage('categories', menus, routePatterns)
  const tagsPage = resolveMenuPage('tags', menus, routePatterns)
  const archivePage = resolveMenuPage('archive', menus, routePatterns)
  const homeComponent = resolveBuiltInPageVariant('home', homePage, 'list')
  const articlesComponent = resolveBuiltInPageVariant('articles', articlesPageConfig, 'card')
  const categoriesComponent = resolveBuiltInPageVariant('categories', categoriesPage, 'grid')
  const tagsComponent = resolveBuiltInPageVariant('tags', tagsPage, 'list')
  const archiveComponent = resolveBuiltInPageVariant('archive', archivePage, 'timeline')
  const homeCollectionPage = {
    component: homeComponent,
    items: createStaticArticleCollectionItems(articles.slice(0, 10)),
    emptyText: '这里还没有文章。'
  }
  const firstArticlesCollectionPage = {
    component: articlesComponent,
    items: createStaticArticleCollectionItems(articlePages[0]?.items || []),
    emptyText: '这里还没有文章。'
  }
  const categoriesCollectionPage = {
    component: categoriesComponent,
    items: createStaticCategoryCollectionItems(categories),
    emptyText: '目前还没有分类。'
  }
  const tagsCollectionPage = {
    component: tagsComponent,
    items: createStaticTagCollectionItems(tags),
    emptyText: '目前还没有标签。'
  }
  const archiveOverviewCollectionPage = {
    component: archiveComponent,
    items: createStaticArchiveOverviewItems(archive),
    emptyText: '这里还没有归档内容。'
  }

  const routes = [
    {
      path: getHomePath(),
      pageTitle: homePage?.title || '最新文章',
      description: homePage?.description || '浏览站点最新发布的文章内容。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(homePage?.title || '最新文章')}</h1>
          <p class="ssg-page-description">${escapeHtml(homePage?.description || '这里收录了站点最近发布的内容。')}</p>
        </header>
        ${renderMenuPage(homeCollectionPage, basePath)}
      `
    },
    {
      path: getArticlesPath(),
      pageTitle: articlesPageConfig?.title || '所有文章',
      description: articlesPageConfig?.description || '浏览站点全部文章列表。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(articlesPageConfig?.title || '所有文章')}</h1>
          <p class="ssg-page-description">按发布时间查看全部文章内容，共 ${escapeHtml(String(articles.length))} 篇。</p>
        </header>
        ${renderPaginatedMenuPage(firstArticlesCollectionPage, {
          currentPage: 1,
          totalPages: articlePages[0]?.totalPages || 1,
          resolvePagePath: (page) => getArticlesPagePath(page),
          basePath
        })}
      `
    },
    {
      path: getCategoriesPath(),
      pageTitle: categoriesPage?.title || '内容分类',
      description: categoriesPage?.description || '浏览站点所有内容分类。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(categoriesPage?.title || '内容分类')}</h1>
          <p class="ssg-page-description">${escapeHtml(categoriesPage?.description || '按分类整理全部站点内容。')}</p>
        </header>
        ${renderMenuPage(categoriesCollectionPage, basePath)}
      `
    },
    {
      path: getTagsPath(),
      pageTitle: tagsPage?.title || '内容标签',
      description: tagsPage?.description || '浏览站点所有内容标签。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(tagsPage?.title || '内容标签')}</h1>
          <p class="ssg-page-description">${escapeHtml(tagsPage?.description || '按标签快速浏览站点内容。')}</p>
        </header>
        ${renderMenuPage(tagsCollectionPage, basePath)}
      `
    },
    {
      path: getArchivePath(),
      pageTitle: archivePage?.title || '内容归档',
      description: archivePage?.description || '按年份浏览站点归档内容。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(archivePage?.title || '内容归档')}</h1>
          <p class="ssg-page-description">${escapeHtml(archivePage?.description || '按年份查看全部归档内容。')}</p>
        </header>
        ${renderMenuPage(archiveOverviewCollectionPage, basePath)}
      `
    },
    {
      path: getSearchPath(),
      pageTitle: '搜索',
      description: '搜索站点中的文章内容。',
      robots: 'noindex,follow',
      sitemap: false,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">搜索</h1>
          <p class="ssg-page-description">搜索结果页由前端应用接管，这里保留静态入口和站点结构。</p>
        </header>
        <div class="ssg-empty">输入关键词后，页面会在客户端加载搜索结果。</div>
      `
    }
  ]

  articlePages.slice(1).forEach((pageGroup) => {
    const paginatedArticlesCollectionPage = {
      component: articlesComponent,
      items: createStaticArticleCollectionItems(pageGroup.items),
      emptyText: '这里还没有文章。'
    }

    routes.push({
      path: getArticlesPagePath(pageGroup.page),
      pageTitle: `${articlesPageConfig?.title || '所有文章'} - 第 ${pageGroup.page} 页`,
      description: `${articlesPageConfig?.description || '浏览站点全部文章列表。'} 第 ${pageGroup.page} 页。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(articlesPageConfig?.title || '所有文章')}</h1>
          <p class="ssg-page-description">按发布时间查看全部文章内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
        </header>
        ${renderPaginatedMenuPage(paginatedArticlesCollectionPage, {
          currentPage: pageGroup.page,
          totalPages: pageGroup.totalPages,
          resolvePagePath: (page) => getArticlesPagePath(page),
          basePath
        })}
      `
    })
  })

  categories.forEach((category) => {
    const categoryPages = paginateItems(category.articles, pageSize)
    const firstCategoryPage = {
      component: articlesComponent,
      items: createStaticContentCollectionItems(categoryPages[0]?.items || []),
      emptyText: '这个分类下还没有内容。'
    }

    routes.push({
      path: getCategoryPath(category),
      pageTitle: `分类：${category.name}`,
      description: `浏览分类 ${category.name} 下的内容。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">分类：${escapeHtml(category.name)}</h1>
          <p class="ssg-page-description">共 ${escapeHtml(String(category.articleCount))} 项内容。</p>
        </header>
        ${renderPaginatedMenuPage(firstCategoryPage, {
          currentPage: 1,
          totalPages: categoryPages[0]?.totalPages || 1,
          resolvePagePath: (page) => getCategoryPagePath(category, page),
          basePath
        })}
      `
    })

    categoryPages.slice(1).forEach((pageGroup) => {
      const paginatedCategoryPage = {
        component: articlesComponent,
        items: createStaticContentCollectionItems(pageGroup.items),
        emptyText: '这个分类下还没有内容。'
      }

      routes.push({
        path: getCategoryPagePath(category, pageGroup.page),
        pageTitle: `分类：${category.name} - 第 ${pageGroup.page} 页`,
        description: `浏览分类 ${category.name} 下的内容，第 ${pageGroup.page} 页。`,
        content: `
          <header class="ssg-page-header">
            <h1 class="ssg-page-title">分类：${escapeHtml(category.name)}</h1>
            <p class="ssg-page-description">共 ${escapeHtml(String(category.articleCount))} 项内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
          </header>
          ${renderPaginatedMenuPage(paginatedCategoryPage, {
            currentPage: pageGroup.page,
            totalPages: pageGroup.totalPages,
            resolvePagePath: (page) => getCategoryPagePath(category, page),
            basePath
          })}
        `
      })
    })
  })

  tags.forEach((tag) => {
    const tagPages = paginateItems(tag.articles, pageSize)
    const firstTagPage = {
      component: articlesComponent,
      items: createStaticContentCollectionItems(tagPages[0]?.items || []),
      emptyText: '这个标签下还没有内容。'
    }

    routes.push({
      path: getTagPath(tag),
      pageTitle: `标签：${tag.name}`,
      description: `浏览标签 ${tag.name} 下的内容。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">标签：#${escapeHtml(tag.name)}</h1>
          <p class="ssg-page-description">共 ${escapeHtml(String(tag.articleCount))} 项内容。</p>
        </header>
        ${renderPaginatedMenuPage(firstTagPage, {
          currentPage: 1,
          totalPages: tagPages[0]?.totalPages || 1,
          resolvePagePath: (page) => getTagPagePath(tag, page),
          basePath
        })}
      `
    })

    tagPages.slice(1).forEach((pageGroup) => {
      const paginatedTagPage = {
        component: articlesComponent,
        items: createStaticContentCollectionItems(pageGroup.items),
        emptyText: '这个标签下还没有内容。'
      }

      routes.push({
        path: getTagPagePath(tag, pageGroup.page),
        pageTitle: `标签：${tag.name} - 第 ${pageGroup.page} 页`,
        description: `浏览标签 ${tag.name} 下的内容，第 ${pageGroup.page} 页。`,
        content: `
          <header class="ssg-page-header">
            <h1 class="ssg-page-title">标签：#${escapeHtml(tag.name)}</h1>
            <p class="ssg-page-description">共 ${escapeHtml(String(tag.articleCount))} 项内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
          </header>
          ${renderPaginatedMenuPage(paginatedTagPage, {
            currentPage: pageGroup.page,
            totalPages: pageGroup.totalPages,
            resolvePagePath: (page) => getTagPagePath(tag, page),
            basePath
          })}
        `
      })
    })
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
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(`${year} 年归档`)}</h1>
          <p class="ssg-page-description">浏览 ${escapeHtml(String(year))} 年发布的归档内容。</p>
        </header>
        ${renderMenuPage({
          component: archiveComponent,
          items: createStaticContentCollectionItems(group?.articles || []),
          emptyText: '这一年还没有内容。'
        }, basePath)}
      `
    })
  })

  articles.forEach((article) => {
    routes.push({
      path: getArticlePath(article),
      pageTitle: article.title,
      description: article.description || article.summary || article.excerpt,
      ogType: 'article',
      imageUrl: article.cover,
      lastmod: article.createdAt || article.date,
      content: renderArticleDetail(article, getRelatedArticles(article, articles), basePath)
    })
  })

  const customPages = await Promise.all(getCustomMenuPages(menus, routePatterns).map(async (page) => {
    const pageVariant = resolveMenuPageVariant(page)
    const loadedSource = await loadStaticMenuPageSource(page, pageVariant)
    const usesFileSource = pageVariant === 'context' && Boolean(page.file)
    const usesFolderSource = pageVariant !== 'context' && Boolean(page.folder)
    const resolvedPage = {
      ...page,
      component: pageVariant,
      content: usesFileSource
        ? (loadedSource.content || '')
        : page.content,
      contentHtml: usesFileSource
        ? (loadedSource.contentHtml || '')
        : '',
      items: usesFolderSource
        ? (Array.isArray(loadedSource.items) ? loadedSource.items : [])
        : Array.isArray(page.items) ? page.items : []
    }

    if (usesFileSource && !resolvedPage.description) {
      resolvedPage.description = loadedSource.description || ''
    }

    return {
      page: resolvedPage,
      records: usesFolderSource && Array.isArray(loadedSource.records) ? loadedSource.records : []
    }
  }))

  customPages.forEach(({ page, records }) => {
    const contentBlocks = splitMenuPageContent(page.content)

    routes.push({
      path: page.path,
      pageTitle: page.title,
      description: page.description || contentBlocks[0] || `${page.title} 页面`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(page.title)}</h1>
          ${page.description ? `<p class="ssg-page-description">${escapeHtml(page.description)}</p>` : ''}
        </header>
        ${renderMenuPage(page, basePath)}
      `
    })

    records.forEach((item) => {
      routes.push({
        path: item.to,
        pageTitle: item.title,
        description: item.detailDescription || item.description || `${item.title} - ${page.title}`,
        content: renderMenuPageDetail(page, item, basePath)
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
  const [template, configs, articles] = await Promise.all([
    readFile(path.join(DIST_DIR, 'index.html'), 'utf8'),
    loadConfigs(),
    loadArticles()
  ])
  const contentEntries = loadContentEntries()
  configureBlogRoutePatterns(configs?.site?.routing)
  const routePatterns = getBlogPathPatterns()
  const collections = buildCollections(contentEntries)
  const friendLinks = normalizeFriendLinks(configs.links.friend_links)
  const menus = normalizeMenuConfig(configs.site.menus)
  const themeCssFile = resolveThemeCssFile(configs.theme)
  const themeCssHref = themeCssFile ? withBasePath(basePath, themeCssFile) : ''
  const siteUrl = normalizeSiteUrl(configs.site.site_url || configs.site.url)
  const latestArticlesLimit = getMaxMenuSourceLimit(menus, 'latest-articles', ['sidebar'], 0)
  const latestArticles = articles.slice(0, latestArticlesLimit)
  const context = {
    template,
    site: configs.site,
    profile: configs.profile,
    articles,
    contentEntries,
    latestArticles,
    categories: collections.categories,
    tags: collections.tags,
    archive: collections.archive,
    friendLinks,
    menus,
    routePatterns,
    basePath,
    themeCssHref,
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
