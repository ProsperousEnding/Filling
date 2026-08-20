import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readFirstTomlConfig } from './read-toml-config.mjs'
import { normalizeBlogRoutePatterns } from '../src/framework/router/routeManifest.js'
import {
  getMenuConfigDiagnostics,
  normalizeMenuConfig,
  resolveMenuPages
} from '../src/framework/utils/menuConfig.js'
import {
  getSidebarLayoutDiagnostics,
  getSidebarMenuLayoutDiagnostics
} from '../src/framework/utils/sidebarLayout.js'
import { resolveFeatureMenuConfig } from '../src/framework/utils/featurePageConfig.js'
import { getConfigDiagnostics } from '../src/framework/utils/configDiagnostics.js'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const CONTENT_DIR = path.join(ROOT_DIR, 'blog', 'content')
export const SITE_CONFIG_DIR = path.join(ROOT_DIR, 'blog', 'config')
export const SITE_CONFIG_OUTPUT_FILE = path.join(
  ROOT_DIR,
  'src',
  'framework',
  'generated',
  'siteConfig.generated.js'
)

async function collectTomlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectTomlFiles(entryPath)
    }

    return entry.isFile() && entry.name.endsWith('.toml') ? [entryPath] : []
  }))

  return files.flat().sort((left, right) => left.localeCompare(right, 'en'))
}

export async function getMenuPageSourceDiagnostics(
  menus,
  routePatterns,
  contentDirectory = CONTENT_DIR
) {
  const pages = resolveMenuPages(menus, routePatterns).filter(page => !page.builtIn)
  const diagnostics = []

  await Promise.all(pages.map(async (page) => {
    const source = page.component === 'context' ? page.file : page.folder

    if (!source) {
      return
    }

    if (page.component === 'context' && !source.endsWith('.md')) {
      diagnostics.push({
        level: 'error',
        code: 'unsupported-menu-page-source',
        path: `menus.pages.${page.key}.file`,
        message: `Menu page "${page.key}" source blog/content/${source} must be a .md file.`
      })
      return
    }

    const sourcePath = path.join(contentDirectory, source)
    let sourceStats

    try {
      sourceStats = await stat(sourcePath)
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }

    const expectedType = page.component === 'context' ? 'file' : 'directory'
    const validSource = expectedType === 'file' ? sourceStats?.isFile() : sourceStats?.isDirectory()

    if (!validSource) {
      diagnostics.push({
        level: 'error',
        code: 'missing-menu-page-source',
        path: `menus.pages.${page.key}`,
        message: `Menu page "${page.key}" requires ${expectedType} blog/content/${source}.`
      })
      return
    }

    if (expectedType === 'directory') {
      const entries = await readdir(sourcePath, { withFileTypes: true })
      const hasMarkdownFiles = entries.some(entry => (
        entry.isFile() && entry.name.endsWith('.md')
      ))

      if (!hasMarkdownFiles) {
        diagnostics.push({
          level: 'warning',
          code: 'empty-menu-page-source',
          path: `menus.pages.${page.key}.folder`,
          message: `Menu page "${page.key}" source blog/content/${source} contains no Markdown files.`
        })
      }
    }
  }))

  return diagnostics
}

async function validateSiteNavigation(configs = {}) {
  const site = configs.site || {}
  const routePatterns = normalizeBlogRoutePatterns(site.routing)
  const effectiveMenus = resolveFeatureMenuConfig(site.menus, configs)
  const normalizedMenus = normalizeMenuConfig(effectiveMenus)
  const diagnostics = [
    ...getConfigDiagnostics(configs),
    ...getMenuConfigDiagnostics(effectiveMenus, routePatterns),
    ...getSidebarLayoutDiagnostics(site.sidebar),
    ...getSidebarMenuLayoutDiagnostics(site.sidebar, normalizedMenus),
    ...await getMenuPageSourceDiagnostics(normalizedMenus, routePatterns)
  ]

  diagnostics
    .filter(diagnostic => diagnostic.level === 'warning')
    .forEach((diagnostic) => {
      console.warn(`[config:${diagnostic.code}] ${diagnostic.path}: ${diagnostic.message}`)
    })

  const errors = diagnostics.filter(diagnostic => diagnostic.level === 'error')
  if (errors.length > 0) {
    throw new Error([
      'Invalid site configuration:',
      ...errors.map(diagnostic => `- ${diagnostic.path}: ${diagnostic.message}`)
    ].join('\n'))
  }
}

export async function generateSiteConfig() {
  const configFiles = await collectTomlFiles(SITE_CONFIG_DIR)
  const configs = {}
  const sourceByName = new Map()

  for (const filePath of configFiles) {
    const configName = path.basename(filePath, '.toml')

    if (sourceByName.has(configName)) {
      throw new Error(
        `Duplicate TOML config ${configName}.toml: ${sourceByName.get(configName)} and ${filePath}`
      )
    }

    sourceByName.set(configName, filePath)
    configs[configName] = await readFirstTomlConfig([filePath])
  }

  await validateSiteNavigation(configs)

  const output = [
    '// This file is generated by scripts/build-site-config.mjs.',
    `const siteConfig = ${JSON.stringify(configs, null, 2)}`,
    '',
    'export default siteConfig',
    ''
  ].join('\n')

  await mkdir(path.dirname(SITE_CONFIG_OUTPUT_FILE), { recursive: true })
  await writeFile(SITE_CONFIG_OUTPUT_FILE, output, 'utf8')
  return configs
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateSiteConfig()
}
