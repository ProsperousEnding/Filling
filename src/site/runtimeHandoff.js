const RUNTIME_LOADING_SELECTOR = [
  '.theme-loading-inline',
  '.theme-loading-pill',
  '.collection-status [aria-busy="true"]'
].join(', ')

const RUNTIME_CONTENT_SELECTOR = [
  '.article-detail-shell',
  '.menu-page-card-list',
  '.menu-page-grid-list',
  '.menu-page-list',
  '.menu-page-timeline',
  '.menu-page-context',
  '.menu-page-item-shell',
  '.article-card-page',
  '.article-grid-page',
  '.article-list-page',
  '.archive-grid-page',
  '.archive-list-page',
  '.archive-timeline-page',
  '.category-card-page',
  '.category-grid-page',
  '.category-list-page',
  '.tag-card-page',
  '.tag-grid-page',
  '.tag-list-page',
  '.taxonomy-index',
  '.friend-links-page',
  '.guestbook-page',
  '.sponsor-page',
  '.search-view',
  '.theme-empty-state',
  '.collection-status-error'
].join(', ')

function hasLoadingPlaceholder(contentRoot) {
  if (contentRoot.querySelector(RUNTIME_LOADING_SELECTOR)) {
    return true
  }

  return Array.from(contentRoot.querySelectorAll('.theme-empty-state'))
    .some(element => /加载中|正在加载|loading/iu.test(element.textContent || ''))
}

export function isRuntimeContentReady(runtimeRoot) {
  const contentRoot = runtimeRoot?.querySelector('.theme-content-column') || runtimeRoot

  if (!contentRoot || hasLoadingPlaceholder(contentRoot)) {
    return false
  }

  return Boolean(contentRoot.querySelector(RUNTIME_CONTENT_SELECTOR))
}

export function waitForRuntimeContent(runtimeRoot, options = {}) {
  const quietTime = Number(options.quietTime) || 64
  const timeout = Number(options.timeout) || 4000
  const view = runtimeRoot?.ownerDocument?.defaultView

  if (!runtimeRoot || !view) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let quietTimer
    let timeoutTimer
    let observer

    const finish = () => {
      view.clearTimeout(quietTimer)
      view.clearTimeout(timeoutTimer)
      observer?.disconnect()
      resolve()
    }

    const check = () => {
      if (isRuntimeContentReady(runtimeRoot)) {
        finish()
      }
    }

    const scheduleCheck = () => {
      view.clearTimeout(quietTimer)
      quietTimer = view.setTimeout(check, quietTime)
    }

    observer = new view.MutationObserver(scheduleCheck)
    observer.observe(runtimeRoot, {
      childList: true,
      characterData: true,
      subtree: true
    })
    timeoutTimer = view.setTimeout(finish, timeout)
    scheduleCheck()
  })
}

function waitForPaint(documentRef) {
  const view = documentRef.defaultView

  if (typeof view?.requestAnimationFrame !== 'function') {
    return Promise.resolve()
  }

  return new Promise(resolve => {
    view.requestAnimationFrame(() => view.requestAnimationFrame(resolve))
  })
}

export function prepareRuntimeHandoff(documentRef = document) {
  const staticRoot = documentRef.querySelector('#app')
  const staticPreview = staticRoot?.querySelector('[data-static-preview="true"]')

  if (!staticRoot || !staticPreview) {
    return {
      mountTarget: staticRoot,
      complete: async () => {},
      abort: () => {}
    }
  }

  const runtimeRoot = documentRef.createElement('div')
  runtimeRoot.dataset.runtimeStaging = 'true'
  runtimeRoot.setAttribute('aria-hidden', 'true')
  runtimeRoot.inert = true
  runtimeRoot.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none'
  staticRoot.after(runtimeRoot)

  return {
    mountTarget: runtimeRoot,
    complete: async () => {
      await waitForRuntimeContent(runtimeRoot)
      await waitForPaint(documentRef)

      staticRoot.removeAttribute('id')
      runtimeRoot.id = 'app'
      runtimeRoot.removeAttribute('aria-hidden')
      runtimeRoot.removeAttribute('inert')
      runtimeRoot.inert = false
      runtimeRoot.removeAttribute('style')
      runtimeRoot.removeAttribute('data-runtime-staging')
      staticRoot.remove()
    },
    abort: () => {
      runtimeRoot.remove()
    }
  }
}
