function toTrimmedString(value) {
  return String(value || '').trim()
}

export function resolveSiteUrlOverride(env = {}) {
  return toTrimmedString(env?.VITE_SITE_URL || env?.SITE_URL)
}

export function applyConfigEnvOverrides(configs = {}, env = {}) {
  const siteUrlOverride = resolveSiteUrlOverride(env)

  if (!siteUrlOverride) {
    return configs
  }

  return {
    ...configs,
    site: {
      ...(configs.site && typeof configs.site === 'object' ? configs.site : {}),
      site_url: siteUrlOverride
    }
  }
}
