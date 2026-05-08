const MS_PER_DAY = 24 * 60 * 60 * 1000
const BOOLEAN_TRUE_VALUES = new Set(['true', '1', 'yes', 'on'])
const BOOLEAN_FALSE_VALUES = new Set(['false', '0', 'no', 'off'])

export function normalizePositiveInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function normalizeOptionalBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalizedValue = String(value || '').trim().toLowerCase()

  if (!normalizedValue) {
    return null
  }

  if (BOOLEAN_TRUE_VALUES.has(normalizedValue)) {
    return true
  }

  if (BOOLEAN_FALSE_VALUES.has(normalizedValue)) {
    return false
  }

  return null
}

export function shouldShowUpdatedAt(updatedAt, createdAt) {
  const updatedDate = new Date(updatedAt)
  const createdDate = new Date(createdAt)

  if (Number.isNaN(updatedDate.getTime())) {
    return false
  }

  if (!Number.isNaN(createdDate.getTime()) && updatedDate.getTime() === createdDate.getTime()) {
    return false
  }

  return true
}

export function resolveOutdatedNotice(article, options = {}) {
  if (!article || typeof article !== 'object') {
    return null
  }

  const articleToggle = normalizeOptionalBoolean(article.showOutdatedNotice)
  const siteToggle = normalizeOptionalBoolean(options.showOutdatedNotice)
  const enabled = articleToggle ?? siteToggle ?? false

  if (!enabled) {
    return null
  }

  const thresholdDays = normalizePositiveInteger(article.outdatedThresholdDays)
    || normalizePositiveInteger(options.outdatedThresholdDays)

  if (!thresholdDays) {
    return null
  }

  const referenceValue = article.updatedAt || article.createdAt || article.date
  const referenceDate = new Date(referenceValue)

  if (Number.isNaN(referenceDate.getTime())) {
    return null
  }

  const ageMs = Date.now() - referenceDate.getTime()

  if (ageMs < thresholdDays * MS_PER_DAY) {
    return null
  }

  const referenceKind = shouldShowUpdatedAt(article.updatedAt, article.createdAt || article.date)
    ? 'updated'
    : 'published'

  return {
    thresholdDays,
    referenceKind,
    referenceAt: referenceKind === 'updated'
      ? article.updatedAt
      : article.createdAt || article.date,
    daysSince: Math.floor(ageMs / MS_PER_DAY)
  }
}
