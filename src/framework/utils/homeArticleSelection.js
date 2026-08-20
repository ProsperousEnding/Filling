const HOME_ARTICLE_MODES = new Set(['latest', 'featured', 'sticky', 'mixed'])
const HOME_ARTICLE_MODE_TITLES = Object.freeze({
  latest: '最新文章',
  featured: '精选文章',
  sticky: '置顶文章',
  mixed: '推荐文章'
})

function normalizeHomeArticleMode(value) {
  const requestedMode = String(value || 'latest').trim().toLowerCase()
  return HOME_ARTICLE_MODES.has(requestedMode) ? requestedMode : 'latest'
}

export function getHomeArticleModeTitle(mode) {
  return HOME_ARTICLE_MODE_TITLES[normalizeHomeArticleMode(mode)]
}

function normalizeLookupValue(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function createLookupSet(values = []) {
  return new Set((Array.isArray(values) ? values : [])
    .map(normalizeLookupValue)
    .filter(Boolean))
}

function getArticleIdentityValues(article = {}) {
  return [article.id, article.slug, article.title, article.sourcePath]
    .map(normalizeLookupValue)
    .filter(Boolean)
}

function matchesAnyIdentity(article, lookupSet) {
  return lookupSet.size > 0
    && getArticleIdentityValues(article).some(value => lookupSet.has(value))
}

function getNamedEntityValues(entity) {
  if (typeof entity === 'string') {
    return [normalizeLookupValue(entity)].filter(Boolean)
  }

  if (!entity || typeof entity !== 'object') {
    return []
  }

  return [entity.id, entity.name, entity.label, entity.title]
    .map(normalizeLookupValue)
    .filter(Boolean)
}

function matchesCategory(article, categorySet) {
  if (categorySet.size === 0) {
    return true
  }

  return getNamedEntityValues(article?.category)
    .some(value => categorySet.has(value))
}

function matchesTags(article, tagSet) {
  if (tagSet.size === 0) {
    return true
  }

  return Array.isArray(article?.tags) && article.tags.some(tag => (
    getNamedEntityValues(tag).some(value => tagSet.has(value))
  ))
}

function compareBooleanPriority(leftValue, rightValue) {
  if (Boolean(leftValue) === Boolean(rightValue)) {
    return 0
  }

  return leftValue ? -1 : 1
}

function getDateTimestamp(value) {
  const timestamp = new Date(value || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function sortHomeArticles(left, right, options) {
  const { includeIds, mode, stickyFirst } = options

  if (mode !== 'latest') {
    const includeDiff = compareBooleanPriority(
      matchesAnyIdentity(left, includeIds),
      matchesAnyIdentity(right, includeIds)
    )

    if (includeDiff !== 0) {
      return includeDiff
    }
  }

  if (stickyFirst) {
    const stickyDiff = compareBooleanPriority(left?.sticky, right?.sticky)

    if (stickyDiff !== 0) {
      return stickyDiff
    }
  }

  if (mode === 'mixed') {
    const featuredDiff = compareBooleanPriority(left?.featured, right?.featured)

    if (featuredDiff !== 0) {
      return featuredDiff
    }
  }

  if (stickyFirst) {
    const weightDiff = (Number(right?.weight) || 0) - (Number(left?.weight) || 0)

    if (weightDiff !== 0) {
      return weightDiff
    }
  }

  const dateDiff = getDateTimestamp(right?.date) - getDateTimestamp(left?.date)

  return dateDiff || String(left?.id || left?.slug || left?.title || '')
    .localeCompare(String(right?.id || right?.slug || right?.title || ''), 'zh-CN')
}

export function selectHomeArticles(articles = [], config = {}) {
  const normalizedArticles = Array.isArray(articles) ? articles : []
  const mode = normalizeHomeArticleMode(config.mode)
  const includeIds = createLookupSet(config.includeIds)
  const excludeIds = createLookupSet(config.excludeIds)
  const categories = createLookupSet(config.categories)
  const tags = createLookupSet(config.tags)
  const excludeCategories = createLookupSet(config.excludeCategories)
  const excludeTags = createLookupSet(config.excludeTags)
  const includeSticky = config.includeSticky !== false
  const stickyFirst = config.stickyFirst !== false
  const fallbackToLatest = config.fallbackToLatest === true

  const baseArticles = normalizedArticles.filter((article) => {
    if (article.homeHidden || matchesAnyIdentity(article, excludeIds)) {
      return false
    }

    if (excludeCategories.size > 0 && matchesCategory(article, excludeCategories)) {
      return false
    }

    if (excludeTags.size > 0 && matchesTags(article, excludeTags)) {
      return false
    }

    return matchesAnyIdentity(article, includeIds)
      || (matchesCategory(article, categories) && matchesTags(article, tags))
  })

  const visibleArticles = baseArticles.filter(article => (
    includeSticky || !article.sticky || matchesAnyIdentity(article, includeIds)
  ))
  let selectedArticles = visibleArticles

  if (mode === 'featured') {
    selectedArticles = visibleArticles.filter(article => (
      article.featured || matchesAnyIdentity(article, includeIds)
    ))
  } else if (mode === 'sticky') {
    selectedArticles = visibleArticles.filter(article => (
      article.sticky || matchesAnyIdentity(article, includeIds)
    ))
  }

  if (
    selectedArticles.length === 0
    && fallbackToLatest
    && (mode === 'featured' || mode === 'sticky')
  ) {
    selectedArticles = visibleArticles
  }

  return selectedArticles
    .slice()
    .sort((left, right) => sortHomeArticles(left, right, {
      includeIds,
      mode,
      stickyFirst
    }))
}
