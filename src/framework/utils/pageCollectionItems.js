import {
  getArchiveRoute,
  getArticleRoute,
  getCategoryRoute,
  getTagRoute
} from './routeLinks'

function normalizeString(value) {
  return String(value || '').trim()
}

function formatDateLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pickText(...values) {
  return values.map(normalizeString).find(Boolean) || ''
}

function createNamedEntity(value) {
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

function createNamedList(values = []) {
  return (Array.isArray(values) ? values : [])
    .map(createNamedEntity)
    .filter(Boolean)
}

function createArchivePreviewDetails(articles = [], limit = 3) {
  return (Array.isArray(articles) ? articles : [])
    .slice(0, limit)
    .map((article) => {
      const dateLabel = formatDateLabel(article?.createdAt || article?.date)
      const title = normalizeString(article?.title)
      return [dateLabel, title].filter(Boolean).join(' · ')
    })
    .filter(Boolean)
}

export function createCollectionPage({
  key = '',
  title = '',
  description = '',
  items = [],
  emptyText = '这个页面还没有内容。'
} = {}) {
  return {
    key,
    title,
    description,
    items,
    emptyText
  }
}

export function createArticleCollectionItems(articles = []) {
  return (Array.isArray(articles) ? articles : []).map(article => {
    const categoryName = normalizeString(article?.category?.name || article?.category)
    const dateLabel = formatDateLabel(article?.createdAt || article?.date)
    const tags = createNamedList(article?.tags)

    return {
      key: `article-${normalizeString(article?.id || article?.slug || article?.title)}`,
      kind: 'article',
      iconKind: 'article',
      title: normalizeString(article?.title),
      description: pickText(article?.summary, article?.description, article?.excerpt),
      meta: dateLabel,
      footer: article?.readTime ? `约 ${article.readTime} 分钟阅读` : '',
      cover: normalizeString(article?.cover || article?.imageUrl),
      category: categoryName ? { label: categoryName } : null,
      tags,
      to: getArticleRoute(article)
    }
  })
}

export function createContentCollectionItems(entries = []) {
  return (Array.isArray(entries) ? entries : []).map(entry => {
    const title = normalizeString(entry?.title)
    const categoryName = normalizeString(entry?.category?.name || entry?.category)
    const dateLabel = formatDateLabel(entry?.createdAt || entry?.date)
    const sectionTitle = normalizeString(entry?.sectionTitle)
    const tags = createNamedList(entry?.tags)
    const footer = sectionTitle && sectionTitle !== title ? sectionTitle : ''

    return {
      key: normalizeString(entry?.id || entry?.to || entry?.sourcePath || title),
      kind: normalizeString(entry?.kind || 'entry'),
      iconKind: normalizeString(entry?.iconKind || entry?.kind || 'entry'),
      title,
      description: pickText(entry?.excerpt, entry?.description),
      meta: [dateLabel, sectionTitle].filter(Boolean).join(' · '),
      footer,
      cover: normalizeString(entry?.cover || entry?.imageUrl || entry?.image),
      category: categoryName ? { label: categoryName } : null,
      tags,
      to: normalizeString(entry?.to),
      href: normalizeString(entry?.href),
      external: entry?.external === true
    }
  })
}

export function createCategoryCollectionItems(categories = []) {
  return (Array.isArray(categories) ? categories : []).map(category => {
    const name = normalizeString(category?.name)
    const count = Number(category?.count || category?.articleCount || 0)

    return {
      key: `category-${normalizeString(category?.id || name)}`,
      kind: 'category',
      iconKind: 'category',
      title: name,
      description: pickText(category?.description, `查看 ${name} 分类下的全部内容`),
      meta: `${count} 项内容`,
      footer: '查看分类',
      to: getCategoryRoute(category)
    }
  })
}

export function createTagCollectionItems(tags = []) {
  return (Array.isArray(tags) ? tags : []).map(tag => {
    const name = normalizeString(tag?.name)
    const count = Number(tag?.count || tag?.articleCount || 0)

    return {
      key: `tag-${normalizeString(tag?.id || name)}`,
      kind: 'tag',
      iconKind: 'tag',
      title: `#${name}`,
      description: pickText(tag?.description, `查看 ${name} 标签下的全部内容`),
      meta: `${count} 项内容`,
      footer: '查看标签',
      to: getTagRoute(tag)
    }
  })
}

export function createArchiveOverviewItems(groups = []) {
  return (Array.isArray(groups) ? groups : [])
    .map(group => {
      const year = Number(group?.year)
      const count = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)

      if (!Number.isFinite(year)) {
        return null
      }

      return {
        key: `archive-${year}`,
        kind: 'archive',
        iconKind: 'archive',
        title: `${year} 年`,
        description: `${count} 项内容`,
        meta: '查看归档',
        footer: '按年份浏览',
        details: createArchivePreviewDetails(group?.articles),
        to: getArchiveRoute(year)
      }
    })
    .filter(Boolean)
}
