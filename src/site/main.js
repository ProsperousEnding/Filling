import '@framework/style.css'

import { createSiteApp } from './createSiteApp'

function redirectToCanonicalDirectoryUrl() {
  const { hash, pathname, search } = window.location
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname.replace(/^\/+/, '')
  const lastSegment = relativePath.split('/').filter(Boolean).at(-1) || ''

  if (!relativePath || pathname.endsWith('/') || lastSegment.includes('.')) {
    return false
  }

  window.location.replace(`${pathname}/${search}${hash}`)
  return true
}

async function bootstrap() {
  if (redirectToCanonicalDirectoryUrl()) return

  const prerenderedRoot = document.querySelector('#app[data-vue-prerendered="true"]')
  const prerenderState = globalThis.__FILLING_PRERENDER_STATE__ || {}

  const { app } = await createSiteApp({
    hydrate: Boolean(prerenderedRoot),
    prerenderState
  })

  app.mount(prerenderedRoot || '#app')

  if (prerenderedRoot) {
    prerenderedRoot.removeAttribute('data-vue-prerendered')
  }

  delete globalThis.__FILLING_PRERENDER_STATE__
}

bootstrap().catch(error => console.error(error))
