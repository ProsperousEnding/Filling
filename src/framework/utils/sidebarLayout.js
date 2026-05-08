const SIDEBAR_SECTION_KEYS = ['profile', 'search', 'menu']
const SIDEBAR_SECTION_KEY_SET = new Set(SIDEBAR_SECTION_KEYS)

export const DEFAULT_SIDEBAR_LAYOUT = Object.freeze({
  desktopSections: Object.freeze([...SIDEBAR_SECTION_KEYS]),
  articleDesktopSections: Object.freeze([...SIDEBAR_SECTION_KEYS]),
  mobileSections: Object.freeze([...SIDEBAR_SECTION_KEYS]),
  articleMobileSections: Object.freeze([...SIDEBAR_SECTION_KEYS])
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function normalizeSidebarSectionKey(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  return SIDEBAR_SECTION_KEY_SET.has(normalizedValue)
    ? normalizedValue
    : ''
}

function normalizeSidebarSectionList(value, fallbackSections) {
  if (!Array.isArray(value)) {
    return [...fallbackSections]
  }

  const normalizedSections = []

  value.forEach((section) => {
    const normalizedSection = normalizeSidebarSectionKey(section)

    if (!normalizedSection || normalizedSections.includes(normalizedSection)) {
      return
    }

    normalizedSections.push(normalizedSection)
  })

  return normalizedSections
}

export function normalizeSidebarLayout(sidebar = {}) {
  const normalizedSidebar = isPlainObject(sidebar) ? sidebar : {}
  const desktopSections = normalizeSidebarSectionList(
    normalizedSidebar.desktop_sections ?? normalizedSidebar.desktopSections,
    DEFAULT_SIDEBAR_LAYOUT.desktopSections
  )
  const mobileSections = normalizeSidebarSectionList(
    normalizedSidebar.mobile_sections ?? normalizedSidebar.mobileSections,
    DEFAULT_SIDEBAR_LAYOUT.mobileSections
  )

  return {
    desktopSections,
    articleDesktopSections: normalizeSidebarSectionList(
      normalizedSidebar.article_desktop_sections ?? normalizedSidebar.articleDesktopSections,
      desktopSections
    ),
    mobileSections,
    articleMobileSections: normalizeSidebarSectionList(
      normalizedSidebar.article_mobile_sections ?? normalizedSidebar.articleMobileSections,
      mobileSections
    )
  }
}

export function resolveSidebarSections(sidebarLayout = {}, { mobile = false, article = false } = {}) {
  const normalizedLayout = normalizeSidebarLayout(sidebarLayout)

  if (mobile) {
    return article
      ? [...normalizedLayout.articleMobileSections]
      : [...normalizedLayout.mobileSections]
  }

  return article
    ? [...normalizedLayout.articleDesktopSections]
    : [...normalizedLayout.desktopSections]
}
