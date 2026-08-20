function normalizeComponentKey(value) {
  return String(value || '').trim().toLowerCase()
}

const MENU_COLLECTION_DETAIL_FIELDS = Object.freeze([
  'order',
  'date',
  'content',
  'contentHtml',
  'plainText',
  'detailDescription',
  'sourcePath'
])

export function stripMenuCollectionDetail(item = {}) {
  const resolvedItem = { ...item }
  MENU_COLLECTION_DETAIL_FIELDS.forEach(field => delete resolvedItem[field])
  return resolvedItem
}

export function menuPageUsesFileSource(page, componentKey) {
  return Boolean(
    page
    && !page.builtIn
    && normalizeComponentKey(componentKey) === 'context'
    && String(page.file || '').trim()
  )
}

export function menuPageUsesFolderSource(page, componentKey) {
  const normalizedComponentKey = normalizeComponentKey(componentKey)

  return Boolean(
    page
    && !page.builtIn
    && normalizedComponentKey !== 'context'
    && normalizedComponentKey !== 'friends'
    && normalizedComponentKey !== 'guestbook'
    && normalizedComponentKey !== 'sponsor'
    && String(page.folder || '').trim()
  )
}

export function menuPageUsesExternalSource(page, componentKey) {
  return menuPageUsesFileSource(page, componentKey) || menuPageUsesFolderSource(page, componentKey)
}
