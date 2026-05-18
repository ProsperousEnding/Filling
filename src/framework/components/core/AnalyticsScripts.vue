<template>
  <span class="sr-only" aria-hidden="true"></span>
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../../stores/config'

const UMAMI_SCRIPT_ID = 'blog-analytics-umami-script'
const PLAUSIBLE_SCRIPT_ID = 'blog-analytics-plausible-script'
const PLAUSIBLE_INLINE_ID = 'blog-analytics-plausible-inline'
const GA_SCRIPT_ID = 'blog-analytics-ga-script'
const GA_INLINE_ID = 'blog-analytics-ga-inline'
const CLARITY_INLINE_ID = 'blog-analytics-clarity-inline'

const configStore = useConfigStore()
const route = useRoute()

const analyticsConfig = computed(() => configStore.analyticsConfig || {})
const analyticsEnabled = computed(() => {
  const config = analyticsConfig.value

  if (!config?.enabled) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  if (!config.trackLocalhost && isLocalhost(window.location.hostname)) {
    return false
  }

  if (config.respectDnt && isDoNotTrackEnabled()) {
    return false
  }

  return true
})
const analyticsSignature = computed(() => JSON.stringify(analyticsConfig.value || {}))

function isLocalhost(hostname = '') {
  const normalizedHostname = String(hostname || '').trim().toLowerCase()
  return normalizedHostname === 'localhost'
    || normalizedHostname === '127.0.0.1'
    || normalizedHostname === '0.0.0.0'
    || normalizedHostname === '::1'
}

function isDoNotTrackEnabled() {
  if (typeof window === 'undefined') {
    return false
  }

  const nav = typeof navigator !== 'undefined' ? navigator : null
  const candidates = [
    nav?.doNotTrack,
    window?.doNotTrack,
    nav?.msDoNotTrack
  ]

  return candidates.some(value => String(value || '').trim() === '1' || String(value || '').trim().toLowerCase() === 'yes')
}

function setScriptAttribute(script, name, value) {
  if (value === '' || value === null || value === undefined) {
    return
  }

  script.setAttribute(name, String(value))
}

function ensureAsyncScript(id, src, {
  defer = false,
  attributes = {}
} = {}) {
  if (typeof document === 'undefined' || !src) {
    return null
  }

  let script = document.getElementById(id)
  if (script instanceof HTMLScriptElement) {
    return script
  }

  script = document.createElement('script')
  script.id = id
  script.async = true
  script.defer = defer
  script.src = src

  Object.entries(attributes).forEach(([name, value]) => {
    setScriptAttribute(script, name, value)
  })

  document.head.appendChild(script)
  return script
}

function ensureInlineScript(id, content) {
  if (typeof document === 'undefined' || !content) {
    return null
  }

  let script = document.getElementById(id)
  if (script instanceof HTMLScriptElement) {
    return script
  }

  script = document.createElement('script')
  script.id = id
  script.textContent = content
  document.head.appendChild(script)
  return script
}

function buildPlausibleInitScript(config) {
  const options = {}

  if (!config.autoCapturePageviews) {
    options.autoCapturePageviews = false
  }

  if (config.captureOnLocalhost) {
    options.captureOnLocalhost = true
  }

  if (config.hashBasedRouting) {
    options.hashBasedRouting = true
  }

  if (config.outboundLinks) {
    options.outboundLinks = true
  }

  if (config.fileDownloads) {
    options.fileDownloads = true
  }

  if (config.taggedEvents) {
    options.taggedEvents = true
  }

  if (config.endpoint) {
    options.endpoint = config.endpoint
  }

  const hasOptions = Object.keys(options).length > 0
  const serializedOptions = hasOptions ? JSON.stringify(options) : ''

  return [
    'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};',
    'window.plausible.init=window.plausible.init||function(options){window.plausible.q=window.plausible.q||[];window.plausible.q.push([\'init\',options||{}])};',
    hasOptions ? `window.plausible.init(${serializedOptions});` : 'window.plausible.init();'
  ].join('')
}

function buildGoogleAnalyticsInitScript(config) {
  const options = {}

  if (config.manualPageviews) {
    options.send_page_view = false
  }

  if (config.debugMode) {
    options.debug_mode = true
  }

  return [
    'window.dataLayer=window.dataLayer||[];',
    'window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};',
    'window.gtag("js",new Date());',
    `window.gtag("config",${JSON.stringify(config.measurementId)},${JSON.stringify(options)});`
  ].join('')
}

function buildClarityInitScript(config) {
  return `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(config.projectId)});`
}

function ensureAnalyticsScripts() {
  if (!analyticsEnabled.value) {
    return
  }

  const config = analyticsConfig.value

  if (config.umami?.ready) {
    ensureAsyncScript(UMAMI_SCRIPT_ID, config.umami.scriptUrl, {
      defer: true,
      attributes: {
        'data-website-id': config.umami.websiteId,
        'data-host-url': config.umami.hostUrl,
        'data-domains': config.umami.domains?.join(',') || '',
        'data-auto-track': config.umami.autoTrack ? '' : 'false',
        'data-do-not-track': config.umami.doNotTrack ? 'true' : '',
        'data-exclude-search': config.umami.excludeSearch ? 'true' : '',
        'data-exclude-hash': config.umami.excludeHash ? 'true' : '',
        'data-performance': config.umami.performance ? 'true' : '',
        'data-tag': config.umami.tag
      }
    })
  }

  if (config.plausible?.ready) {
    ensureInlineScript(PLAUSIBLE_INLINE_ID, buildPlausibleInitScript(config.plausible))
    ensureAsyncScript(PLAUSIBLE_SCRIPT_ID, config.plausible.scriptUrl, {
      defer: true,
      attributes: {
        'data-domain': config.plausible.domain
      }
    })
  }

  if (config.googleAnalytics?.ready) {
    ensureAsyncScript(
      GA_SCRIPT_ID,
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleAnalytics.measurementId)}`
    )
    ensureInlineScript(GA_INLINE_ID, buildGoogleAnalyticsInitScript(config.googleAnalytics))
  }

  if (config.clarity?.ready) {
    ensureInlineScript(CLARITY_INLINE_ID, buildClarityInitScript(config.clarity))
  }
}

async function trackGoogleAnalyticsPageview() {
  if (!analyticsEnabled.value || !analyticsConfig.value.googleAnalytics?.ready || !analyticsConfig.value.googleAnalytics.manualPageviews) {
    return
  }

  await nextTick()

  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title || undefined
  })
}

onMounted(() => {
  ensureAnalyticsScripts()
})

watch(analyticsSignature, () => {
  ensureAnalyticsScripts()
}, { immediate: true })

watch(() => route.fullPath, () => {
  trackGoogleAnalyticsPageview().catch(() => {})
}, { immediate: true })
</script>
