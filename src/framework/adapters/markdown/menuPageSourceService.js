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
import {
  menuPageUsesFileSource,
  menuPageUsesFolderSource,
  stripMenuCollectionDetail
} from '../../utils/menuPageSource.js'

const menuFileLoaders = import.meta.glob('/blog/content/**/*.md', {
  query: '?raw',
  import: 'default'
})
const menuCollectionCache = new Map()

function getRuntimeConfig(context) {
  return typeof context?.getConfig === 'function'
    ? (context.getConfig() || {})
    : useConfigStore()
}

function serializeConfigCacheKey(config = {}) {
  return JSON.stringify(config || {})
}

async function loadMenuContextSource(page, context) {
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
  const configStore = getRuntimeConfig(context)
  return parseMenuContextSource(rawContent, sourcePath, {
    codeBlockConfig: configStore.codeBlockConfig,
    markdownConfig: configStore.markdownConfig,
    coverConfig: configStore.coverConfig
  })
}

async function loadMenuCollectionSource(page, context) {
  const collectionRecords = await loadMenuCollectionRecords(page, context)

  return {
    items: collectionRecords.map(stripMenuCollectionDetail)
  }
}

async function loadMenuCollectionRecords(page, context) {
  const folderPrefix = resolveMenuContentFolderPrefix(page?.folder)
  const pagePath = String(page?.path || '').trim()
  const configStore = getRuntimeConfig(context)
  const cacheKey = [
    folderPrefix,
    pagePath,
    serializeConfigCacheKey(configStore.codeBlockConfig),
    serializeConfigCacheKey(configStore.markdownConfig),
    serializeConfigCacheKey(configStore.coverConfig)
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
    return loadMenuContextSource(page, this)
  }

  if (menuPageUsesFolderSource(page, componentKey)) {
    return loadMenuCollectionSource(page, this)
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

  const collectionRecords = await loadMenuCollectionRecords(page, this)
  return collectionRecords.find(item => item.itemId === normalizedItemId) || null
}
