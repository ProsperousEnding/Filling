import { parseToml } from '../../src/framework/utils/tomlParser.js'
import { getConfigDiagnostics } from '../../src/framework/utils/configDiagnostics.js'
import {
  getMenuConfigDiagnostics,
  normalizeMenuConfig
} from '../../src/framework/utils/menuConfig.js'
import { resolveFeatureMenuConfig } from '../../src/framework/utils/featurePageConfig.js'
import {
  getSidebarLayoutDiagnostics,
  getSidebarMenuLayoutDiagnostics
} from '../../src/framework/utils/sidebarLayout.js'
import { normalizeBlogRoutePatterns } from '../../src/framework/router/routeManifest.js'
import { CONFIG_FILE_DEFINITIONS } from '../../src/framework/config/configManifest.js'

const MAX_CONFIG_FILE_BYTES = 128 * 1024

function createDiagnostic(level, code, path, message) {
  return { level, code, path, message }
}

export function normalizeTomlContent(value) {
  const source = String(value ?? '').replace(/^\uFEFF/u, '').replaceAll('\r\n', '\n')
  return source.endsWith('\n') || !source ? source : `${source}\n`
}

export function parseManagedConfigFiles(files = []) {
  const fileByKey = new Map(files.map(file => [file.key, file]))
  const configs = {}
  const diagnostics = []

  CONFIG_FILE_DEFINITIONS.forEach((definition) => {
    const file = fileByKey.get(definition.key)
    const content = normalizeTomlContent(file?.content || '')
    const byteLength = new TextEncoder().encode(content).byteLength

    if (byteLength > MAX_CONFIG_FILE_BYTES) {
      diagnostics.push(createDiagnostic(
        'error',
        'config-file-too-large',
        definition.path,
        `配置文件不能超过 ${MAX_CONFIG_FILE_BYTES / 1024} KiB。`
      ))
      configs[definition.key] = {}
      return
    }

    try {
      configs[definition.key] = parseToml(content)
    } catch (error) {
      configs[definition.key] = {}
      diagnostics.push(createDiagnostic(
        'error',
        'invalid-toml',
        definition.path,
        String(error?.message || 'TOML 语法无效。')
      ))
    }
  })

  return { configs, diagnostics }
}

export function validateManagedConfigFiles(files = []) {
  const parsed = parseManagedConfigFiles(files)
  if (parsed.diagnostics.some(diagnostic => diagnostic.level === 'error')) {
    return parsed
  }

  const site = parsed.configs.site || {}
  const routePatterns = normalizeBlogRoutePatterns(site.routing)
  const effectiveMenus = resolveFeatureMenuConfig(site.menus, parsed.configs)
  const normalizedMenus = normalizeMenuConfig(effectiveMenus)
  const diagnostics = [
    ...parsed.diagnostics,
    ...getConfigDiagnostics(parsed.configs),
    ...getMenuConfigDiagnostics(effectiveMenus, routePatterns),
    ...getSidebarLayoutDiagnostics(site.sidebar),
    ...getSidebarMenuLayoutDiagnostics(site.sidebar, normalizedMenus)
  ]

  return {
    configs: parsed.configs,
    diagnostics
  }
}

export { MAX_CONFIG_FILE_BYTES }
