const FEATURE_PAGE_DEFAULTS = Object.freeze({
  guestbook: Object.freeze({
    title: '留言板',
    description: '如果你路过这里，欢迎留下几句话。',
    component: 'guestbook',
    menu_group: 'more',
    menu_order: 1200
  }),
  sponsor: Object.freeze({
    title: '赞助',
    description: '支持本站持续更新。',
    component: 'sponsor',
    menu_group: 'more',
    menu_order: 1300
  })
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function normalizeFeaturePageKey(value) {
  return String(value || '').trim().toLowerCase()
}

function resolvePageOptions(config = {}) {
  return isPlainObject(config.page) ? config.page : {}
}

function createFeaturePage(key, config = {}) {
  const defaults = FEATURE_PAGE_DEFAULTS[key]
  const page = resolvePageOptions(config)

  return {
    key,
    title: String(page.title || defaults.title).trim() || defaults.title,
    description: String(page.description || defaults.description).trim(),
    path: String(page.path || '').trim(),
    component: defaults.component,
    menu_group: page.menu_group || page.menuGroup || defaults.menu_group,
    menu_order: page.menu_order || page.menuOrder || defaults.menu_order,
    visible: page.visible !== false
  }
}

export function resolveSponsorDisplayTargets(config = {}) {
  const source = isPlainObject(config) ? config : {}

  if (Array.isArray(source.show)) {
    return source.show
      .map(value => String(value || '').trim().toLowerCase())
      .map(value => (value === 'article' ? 'articles' : value))
      .filter(value => value === 'articles' || value === 'page')
      .filter((value, index, values) => values.indexOf(value) === index)
  }

  const showOnArticles = typeof source.show_on_articles === 'boolean'
    ? source.show_on_articles
    : typeof source.showOnArticles === 'boolean'
      ? source.showOnArticles
      : true
  const pageEnabled = typeof source.page_enabled === 'boolean'
    ? source.page_enabled
    : typeof source.pageEnabled === 'boolean'
      ? source.pageEnabled
      : true

  return [
    showOnArticles ? 'articles' : '',
    pageEnabled ? 'page' : ''
  ].filter(Boolean)
}

export function resolveFeatureMenuConfig(menuConfig = {}, featureConfigs = {}) {
  const source = isPlainObject(menuConfig) ? menuConfig : {}
  const pages = Array.isArray(source.pages) ? source.pages.map(page => ({ ...page })) : []
  const configuredKeys = new Set(pages.map(page => normalizeFeaturePageKey(page?.key)))
  const guestbook = isPlainObject(featureConfigs.guestbook) ? featureConfigs.guestbook : {}
  const sponsor = isPlainObject(featureConfigs.sponsor) ? featureConfigs.sponsor : {}

  if (guestbook.enabled === true && !configuredKeys.has('guestbook')) {
    pages.push(createFeaturePage('guestbook', guestbook))
  }

  if (
    sponsor.enabled === true
    && resolveSponsorDisplayTargets(sponsor).includes('page')
    && !configuredKeys.has('sponsor')
  ) {
    pages.push(createFeaturePage('sponsor', sponsor))
  }

  return {
    ...source,
    pages
  }
}
