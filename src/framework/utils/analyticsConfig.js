const DEFAULT_ANALYTICS_CONFIG = Object.freeze({
  umamiScriptUrl: 'https://cloud.umami.is/script.js',
  plausibleScriptUrl: 'https://plausible.io/js/script.js',
  umamiAutoTrack: true,
  umamiDoNotTrack: true,
  plausibleAutoCapturePageviews: true,
  plausibleCaptureOnLocalhost: false,
  googleAnalyticsManualPageviews: true,
  googleAnalyticsDebugMode: false
})

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toTrimmedString(value) {
  return String(value || '').trim()
}

function normalizeStringList(values) {
  return (Array.isArray(values) ? values : [])
    .map(toTrimmedString)
    .filter(Boolean)
}

function normalizeScriptUrl(value, fallback = '') {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return fallback
  }

  return /^(https?:)?\/\//i.test(normalizedValue) ? normalizedValue : ''
}

export function normalizeAnalyticsProvider(value) {
  const provider = toTrimmedString(value).toLowerCase().replace(/[\s-]+/g, '_')
  const aliases = {
    ga: 'google_analytics',
    ga4: 'google_analytics',
    google: 'google_analytics',
    googleanalytics: 'google_analytics',
    google_analytics_4: 'google_analytics',
    microsoft_clarity: 'clarity'
  }
  const normalizedProvider = aliases[provider] || provider

  return ['umami', 'plausible', 'google_analytics', 'clarity'].includes(normalizedProvider)
    ? normalizedProvider
    : ''
}

export function normalizeAnalyticsConfig(config = {}) {
  const source = isObject(config) ? config : {}
  const selectedProvider = normalizeAnalyticsProvider(source.provider)
  const globalEnabled = source.enabled === false
    ? false
    : Boolean(selectedProvider || source.enabled === true)
  const umamiSource = isObject(source.umami) ? source.umami : {}
  const plausibleSource = isObject(source.plausible) ? source.plausible : {}
  const googleAnalyticsSource = isObject(source.google_analytics)
    ? source.google_analytics
    : isObject(source.googleAnalytics)
      ? source.googleAnalytics
      : {}
  const claritySource = isObject(source.clarity) ? source.clarity : {}
  const providerEnabled = (providerName, providerSource) => (
    globalEnabled
    && (selectedProvider
      ? selectedProvider === providerName
      : providerSource.enabled === true)
  )

  const umami = {
    enabled: providerEnabled('umami', umamiSource),
    scriptUrl: normalizeScriptUrl(
      umamiSource.script_url || umamiSource.scriptUrl,
      DEFAULT_ANALYTICS_CONFIG.umamiScriptUrl
    ),
    websiteId: toTrimmedString(umamiSource.website_id || umamiSource.websiteId),
    hostUrl: normalizeScriptUrl(umamiSource.host_url || umamiSource.hostUrl),
    domains: normalizeStringList(umamiSource.domains),
    autoTrack: typeof umamiSource.auto_track === 'boolean'
      ? umamiSource.auto_track
      : DEFAULT_ANALYTICS_CONFIG.umamiAutoTrack,
    doNotTrack: typeof umamiSource.do_not_track === 'boolean'
      ? umamiSource.do_not_track
      : DEFAULT_ANALYTICS_CONFIG.umamiDoNotTrack,
    excludeSearch: umamiSource.exclude_search === true,
    excludeHash: umamiSource.exclude_hash === true,
    performance: umamiSource.performance === true,
    tag: toTrimmedString(umamiSource.tag)
  }
  umami.ready = umami.enabled && Boolean(umami.scriptUrl && umami.websiteId)

  const plausible = {
    enabled: providerEnabled('plausible', plausibleSource),
    scriptUrl: normalizeScriptUrl(
      plausibleSource.script_url || plausibleSource.scriptUrl,
      DEFAULT_ANALYTICS_CONFIG.plausibleScriptUrl
    ),
    domain: toTrimmedString(plausibleSource.domain),
    endpoint: normalizeScriptUrl(
      plausibleSource.endpoint || plausibleSource.api_host || plausibleSource.apiHost
    ),
    autoCapturePageviews: typeof plausibleSource.auto_capture_pageviews === 'boolean'
      ? plausibleSource.auto_capture_pageviews
      : DEFAULT_ANALYTICS_CONFIG.plausibleAutoCapturePageviews,
    captureOnLocalhost: typeof plausibleSource.capture_on_localhost === 'boolean'
      ? plausibleSource.capture_on_localhost
      : DEFAULT_ANALYTICS_CONFIG.plausibleCaptureOnLocalhost,
    hashBasedRouting: plausibleSource.hash_based_routing === true,
    outboundLinks: plausibleSource.outbound_links === true,
    fileDownloads: plausibleSource.file_downloads === true,
    taggedEvents: plausibleSource.tagged_events === true
  }
  plausible.ready = plausible.enabled && Boolean(plausible.scriptUrl)

  const googleAnalytics = {
    enabled: providerEnabled('google_analytics', googleAnalyticsSource),
    measurementId: toTrimmedString(
      googleAnalyticsSource.measurement_id || googleAnalyticsSource.measurementId
    ),
    manualPageviews: typeof googleAnalyticsSource.manual_pageviews === 'boolean'
      ? googleAnalyticsSource.manual_pageviews
      : DEFAULT_ANALYTICS_CONFIG.googleAnalyticsManualPageviews,
    debugMode: typeof googleAnalyticsSource.debug_mode === 'boolean'
      ? googleAnalyticsSource.debug_mode
      : DEFAULT_ANALYTICS_CONFIG.googleAnalyticsDebugMode
  }
  googleAnalytics.ready = googleAnalytics.enabled && Boolean(googleAnalytics.measurementId)

  const clarity = {
    enabled: providerEnabled('clarity', claritySource),
    projectId: toTrimmedString(claritySource.project_id || claritySource.projectId)
  }
  clarity.ready = clarity.enabled && Boolean(clarity.projectId)

  const providers = [
    ['umami', umami],
    ['plausible', plausible],
    ['googleAnalytics', googleAnalytics],
    ['clarity', clarity]
  ]
    .filter(([, provider]) => provider.ready)
    .map(([providerName]) => providerName)

  return {
    enabled: globalEnabled && providers.length > 0,
    provider: selectedProvider,
    respectDnt: source.respect_dnt === true || source.respectDnt === true,
    trackLocalhost: source.track_localhost === true || source.trackLocalhost === true,
    umami,
    plausible,
    googleAnalytics,
    clarity,
    providers
  }
}
