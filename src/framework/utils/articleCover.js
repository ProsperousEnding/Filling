const DEFAULT_PICSUM_WIDTH = 1200
const DEFAULT_PICSUM_HEIGHT = 630
const DEFAULT_PICSUM_FORMAT = 'webp'

function normalizeString(value) {
  return String(value || '').trim()
}

function normalizeCoverSeed(value) {
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

export function createSeededArticleCover(seedInput, options = {}) {
  const width = Number.parseInt(options.width, 10) || DEFAULT_PICSUM_WIDTH
  const height = Number.parseInt(options.height, 10) || DEFAULT_PICSUM_HEIGHT
  const format = normalizeString(options.format) || DEFAULT_PICSUM_FORMAT
  const seed = normalizeCoverSeed(seedInput)

  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}.${format}`
}

export function resolveArticleCover(cover, seedInput, options = {}) {
  const normalizedCover = normalizeString(cover)

  if (normalizedCover) {
    return normalizedCover
  }

  return createSeededArticleCover(seedInput, options)
}
