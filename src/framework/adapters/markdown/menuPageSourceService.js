import {
  isMenuSourcePathInFolder,
  normalizeMenuCollectionItemId,
  parseMenuCollectionDetail,
  parseMenuContextSource,
  resolveMenuContentFolderPrefix,
  resolveMenuContentSourcePath,
  sortMenuCollectionItems
} from './menuPageSourceParser.js'
import { useConfigStore } from '../../stores/config'

const menuFileLoaders = import.meta.glob('/blog/content/**/*.md', {
  query: '?raw',
  import: 'default'
})
const menuCollectionCache = new Map()

function serializeCodeBlockCacheKey(config = {}) {
  return JSON.stringify(config || {})
}

function serializeMarkdownCacheKey(config = {}) {
  return JSON.stringify(config || {})
}

function serializeCoverCacheKey(config = {}) {
  return JSON.stringify(config || {})
}

function normalizeComponentKey(value) {
  return String(value || '').trim().toLowerCase()
}

function stripMenuCollectionMeta(item = {}) {
  const {
    itemId,
    order,
    date,
    content,
    contentHtml,
    plainText,
    detailDescription,
    sourcePath,
    ...resolvedItem
  } = item

  return {
    ...resolvedItem,
    itemId
  }
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

async function loadMenuContextSource(page) {
  const sourcePath = resolveMenuContentSourcePath(page?.file)
  const sourceLoader = menuFileLoaders[sourcePath]

  if (!sourcePath || typeof sourceLoader !== 'function') {
    return {
      title: '',
      description: '',
      content: '',
      contentHtml: ''
    }
  }

  const rawContent = await sourceLoader()
  const configStore = useConfigStore()
  return parseMenuContextSource(rawContent, sourcePath, {
    codeBlockConfig: configStore.codeBlockConfig,
    markdownConfig: configStore.markdownConfig,
    coverConfig: configStore.coverConfig
  })
}

async function loadMenuCollectionSource(page) {
  const collectionRecords = await loadMenuCollectionRecords(page)

  return {
    items: collectionRecords.map(stripMenuCollectionMeta)
  }
}

async function loadMenuCollectionRecords(page) {
  const folderPrefix = resolveMenuContentFolderPrefix(page?.folder)
  const pagePath = String(page?.path || '').trim()
  const configStore = useConfigStore()
  const cacheKey = [
    folderPrefix,
    pagePath,
    serializeCodeBlockCacheKey(configStore.codeBlockConfig),
    serializeMarkdownCacheKey(configStore.markdownConfig),
    serializeCoverCacheKey(configStore.coverConfig)
  ].join('::')

  if (!folderPrefix || !pagePath) {
    return []
  }

  if (menuCollectionCache.has(cacheKey)) {
    return menuCollectionCache.get(cacheKey)
  }

  const matchingEntries = Object.entries(menuFileLoaders)
    .filter(([sourcePath]) => isMenuSourcePathInFolder(sourcePath, folderPrefix))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, 'en'))

  if (matchingEntries.length === 0) {
    menuCollectionCache.set(cacheKey, [])
    return []
  }

  const items = await Promise.all(matchingEntries.map(async ([sourcePath, sourceLoader]) => {
    if (typeof sourceLoader !== 'function') {
      return null
    }

    const rawContent = await sourceLoader()
    return parseMenuCollectionDetail(rawContent, sourcePath, {
      pagePath,
      codeBlockConfig: configStore.codeBlockConfig,
      markdownConfig: configStore.markdownConfig,
      coverConfig: configStore.coverConfig
    })
  }))

  const sortedItems = sortMenuCollectionItems(items.filter(Boolean))
  menuCollectionCache.set(cacheKey, sortedItems)
  return sortedItems
}

export async function loadMenuPageSource(page, componentKey) {
  if (menuPageUsesFileSource(page, componentKey)) {
    return loadMenuContextSource(page)
  }

  if (menuPageUsesFolderSource(page, componentKey)) {
    return loadMenuCollectionSource(page)
  }

  return {
    title: '',
    description: '',
    content: '',
    contentHtml: '',
    items: []
  }
}

export async function loadMenuPageItemDetail(page, itemId) {
  if (!page || page.builtIn || !String(page.folder || '').trim()) {
    return null
  }

  const normalizedItemId = normalizeMenuCollectionItemId(itemId)

  if (!normalizedItemId) {
    return null
  }

  const collectionRecords = await loadMenuCollectionRecords(page)
  return collectionRecords.find(item => item.itemId === normalizedItemId) || null
}
