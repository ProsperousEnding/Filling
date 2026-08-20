import { inject } from 'vue'

import { getContentAdapter } from '../adapters/contentAdapter.js'
import { loadConfiguredConfigs, resolveConfigProvider } from '../config/configProvider.js'

export const BLOG_RUNTIME_CONTEXT_KEY = Symbol('vue-blog-runtime-context')

export function normalizeBlogBaseUrl(value = '/') {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue || normalizedValue === '/') {
    return '/'
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue.endsWith('/') ? normalizedValue : `${normalizedValue}/`
  }

  return `/${normalizedValue.replace(/^\/+|\/+$/g, '')}/`
}

export function createBlogRuntimeContext(options = {}) {
  const configProvider = options.configProvider
    ? resolveConfigProvider(options.configProvider)
    : null

  return Object.freeze({
    baseUrl: normalizeBlogBaseUrl(options.baseUrl ?? options.base),
    contentAdapter: options.contentAdapter || getContentAdapter(),
    configProvider
  })
}

export function installBlogRuntimeContext(app, pinia, options = {}) {
  const context = createBlogRuntimeContext(options)

  pinia.use(() => ({
    $blogRuntime: context
  }))
  app.provide(BLOG_RUNTIME_CONTEXT_KEY, context)

  return context
}

export function useBlogRuntimeContext() {
  return inject(BLOG_RUNTIME_CONTEXT_KEY, null) || createBlogRuntimeContext()
}

export function useBlogBaseUrl() {
  return useBlogRuntimeContext().baseUrl
}

export function getStoreContentAdapter(store) {
  return store?.$blogRuntime?.contentAdapter || getContentAdapter()
}

export function loadStoreConfigs(store) {
  const provider = store?.$blogRuntime?.configProvider
  return provider ? provider() : loadConfiguredConfigs()
}
