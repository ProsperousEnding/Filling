import { resolveDisplayArticleCover } from '../../utils/articleCover'

function normalizeString(value) {
  return String(value || '').trim()
}

function normalizeNamedValue(value) {
  if (typeof value === 'string') {
    const label = normalizeString(value)
    return label ? { label } : null
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const label = normalizeString(value.label || value.name || value.title)

  if (!label) {
    return null
  }

  return {
    ...value,
    label
  }
}

export function resolveMenuItemTag(item) {
  if (item?.href) return 'a'
  if (item?.to) return 'router-link'
  return 'article'
}

export function getMenuItemCover(item, options = {}) {
  return normalizeString(resolveDisplayArticleCover(item, options))
}

export function hasMenuItemCover(item, options = {}) {
  return Boolean(getMenuItemCover(item, options))
}

export function isArticleLikeMenuItem(item, options = {}) {
  const kind = normalizeString(item?.kind || item?.type).toLowerCase()
  return kind === 'article' || kind === 'post' || kind === 'note' || hasMenuItemCover(item, options)
}

export function getMenuItemPrimaryBadge(item) {
  return normalizeString(
    item?.category?.label
      || item?.category?.name
      || item?.eyebrow
      || item?.badge
  )
}

export function getMenuItemTags(item, limit = Number.POSITIVE_INFINITY) {
  const source = Array.isArray(item?.tags)
    ? item.tags
    : Array.isArray(item?.badges)
      ? item.badges
      : []

  return source
    .map(normalizeNamedValue)
    .filter(Boolean)
    .slice(0, limit)
}

export function getMenuItemRemainingTagCount(item, limit) {
  if (!Number.isFinite(limit) || limit < 0) {
    return 0
  }

  const source = Array.isArray(item?.tags)
    ? item.tags
    : Array.isArray(item?.badges)
      ? item.badges
      : []

  return Math.max(0, source.length - limit)
}

export function getMenuItemDetails(item, limit = Number.POSITIVE_INFINITY) {
  const details = Array.isArray(item?.details) ? item.details : []

  return details
    .map(detail => normalizeString(detail))
    .filter(Boolean)
    .slice(0, limit)
}

export function getMenuItemIconKind(item) {
  const explicitKind = normalizeString(item?.iconKind || item?.icon || item?.kind).toLowerCase()

  if (['article', 'archive', 'category', 'entry', 'folder', 'note', 'profile', 'project', 'tag'].includes(explicitKind)) {
    return explicitKind
  }

  if (isArticleLikeMenuItem(item)) {
    return 'article'
  }

  return 'entry'
}

export function getMenuItemActionLabel(item) {
  const customLabel = normalizeString(item?.actionLabel || item?.action)

  if (customLabel) {
    return customLabel
  }

  return isArticleLikeMenuItem(item) ? '阅读全文' : '查看详情'
}
