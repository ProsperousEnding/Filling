function normalizeScrollOptions(options = {}) {
  return {
    top: Number.isFinite(Number(options.top)) ? Number(options.top) : 0,
    left: Number.isFinite(Number(options.left)) ? Number(options.left) : 0,
    behavior: options.behavior === 'smooth' ? 'smooth' : 'auto'
  }
}

export function getBlogScrollContainer(documentRef = globalThis.document) {
  return documentRef?.querySelector?.('.theme-main') || null
}

export function scrollBlogViewport(options = {}, environment = {}) {
  const documentRef = environment.document || globalThis.document
  const windowRef = environment.window || globalThis.window
  const scrollOptions = normalizeScrollOptions(options)
  const container = getBlogScrollContainer(documentRef)

  if (container) {
    if (typeof container.scrollTo === 'function') {
      container.scrollTo(scrollOptions)
    } else {
      container.scrollTop = scrollOptions.top
      container.scrollLeft = scrollOptions.left
    }
    return container
  }

  windowRef?.scrollTo?.(scrollOptions)
  return null
}
