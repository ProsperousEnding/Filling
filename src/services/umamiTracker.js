import { watch } from 'vue'

const SCRIPT_ID = 'filling-umami-script'
const SCRIPT_MARKER_ATTR = 'data-filling-umami'

let currentSignature = ''
let removeAfterEachHook = null
let stopStoreWatcher = null
let pendingPath = ''

const normalizeConfig = (raw = {}) => ({
  enabled: Boolean(raw.enabled),
  scriptUrl: String(raw.scriptUrl || '').trim(),
  websiteId: String(raw.websiteId || '').trim(),
  hostUrl: String(raw.hostUrl || '').trim()
})

const canEnable = (config) => config.enabled && config.scriptUrl && config.websiteId

const stopRouteTracking = () => {
  if (typeof removeAfterEachHook === 'function') {
    removeAfterEachHook()
  }
  removeAfterEachHook = null
}

const getRoutePath = (route) => {
  if (route && typeof route.fullPath === 'string' && route.fullPath) {
    return route.fullPath
  }

  if (typeof window !== 'undefined') {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`
  }

  return '/'
}

const trackPage = (path) => {
  if (typeof window === 'undefined') return false

  const umami = window.umami
  if (!umami || typeof umami.track !== 'function') return false

  umami.track((payload = {}) => ({
    ...payload,
    url: path,
    title: document?.title || payload.title || ''
  }))

  return true
}

const flushPendingTrack = () => {
  if (!pendingPath) return
  if (trackPage(pendingPath)) {
    pendingPath = ''
  }
}

const scheduleTrack = (route) => {
  pendingPath = getRoutePath(route)
  if (!trackPage(pendingPath)) {
    setTimeout(flushPendingTrack, 0)
  }
}

const removeExistingScript = () => {
  if (typeof document === 'undefined') return

  const script = document.getElementById(SCRIPT_ID)
    || document.querySelector(`script[${SCRIPT_MARKER_ATTR}="true"]`)

  if (script) {
    script.remove()
  }
}

const scriptMatchesConfig = (script, config) => {
  if (!script) return false

  const src = script.getAttribute('src') || ''
  const websiteId = script.getAttribute('data-website-id') || ''
  const hostUrl = script.getAttribute('data-host-url') || ''

  return src === config.scriptUrl
    && websiteId === config.websiteId
    && hostUrl === config.hostUrl
}

const ensureScript = async (config) => {
  if (typeof document === 'undefined') return false

  const existing = document.getElementById(SCRIPT_ID)
    || document.querySelector(`script[${SCRIPT_MARKER_ATTR}="true"]`)

  if (scriptMatchesConfig(existing, config)) {
    return true
  }

  if (existing) {
    existing.remove()
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = config.scriptUrl
    script.setAttribute(SCRIPT_MARKER_ATTR, 'true')
    script.setAttribute('data-website-id', config.websiteId)
    script.setAttribute('data-auto-track', 'false')

    if (config.hostUrl) {
      script.setAttribute('data-host-url', config.hostUrl)
    }

    script.onload = () => {
      flushPendingTrack()
      resolve(true)
    }

    script.onerror = () => {
      console.error('[Umami] Script load failed:', config.scriptUrl)
      resolve(false)
    }

    document.head.appendChild(script)
  })
}

const applyConfig = async (router, rawConfig) => {
  const config = normalizeConfig(rawConfig)

  if (!canEnable(config)) {
    stopRouteTracking()
    removeExistingScript()
    currentSignature = ''
    pendingPath = ''
    return
  }

  const nextSignature = JSON.stringify(config)
  if (nextSignature !== currentSignature) {
    const loaded = await ensureScript(config)
    if (!loaded) return
    currentSignature = nextSignature
  }

  if (!removeAfterEachHook) {
    removeAfterEachHook = router.afterEach((to) => {
      scheduleTrack(to)
    })
  }

  scheduleTrack(router.currentRoute?.value)
}

export function initUmamiTracker(router, configStore) {
  if (!router || !configStore) return

  if (typeof stopStoreWatcher === 'function') {
    stopStoreWatcher()
  }

  stopStoreWatcher = watch(
    () => ({
      enabled: configStore.umamiEnabled,
      scriptUrl: configStore.umamiScriptUrl,
      websiteId: configStore.umamiWebsiteId,
      hostUrl: configStore.umamiHostUrl
    }),
    (nextConfig) => {
      applyConfig(router, nextConfig)
    },
    { immediate: true }
  )

  router.isReady().then(() => {
    scheduleTrack(router.currentRoute?.value)
  })
}
