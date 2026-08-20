const emptyConfigProvider = async () => ({})
let currentConfigProvider = emptyConfigProvider

export function resolveConfigProvider(provider) {
  const loadConfigs = typeof provider === 'function'
    ? provider
    : provider?.loadAllConfigs

  if (typeof loadConfigs !== 'function') {
    throw new TypeError('[vue-blog] Config provider must be a function or expose loadAllConfigs().')
  }

  return loadConfigs.bind(provider)
}

export function configureConfigProvider(provider) {
  currentConfigProvider = resolveConfigProvider(provider)
  return currentConfigProvider
}

export function resetConfigProvider() {
  currentConfigProvider = emptyConfigProvider
}

export function loadConfiguredConfigs() {
  return currentConfigProvider()
}
