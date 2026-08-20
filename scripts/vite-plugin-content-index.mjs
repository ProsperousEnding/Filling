import path from 'node:path'
import {
  CONTENT_INDEX_CONTENT_DIR,
  CONTENT_INDEX_OUTPUT_FILE,
  SEARCH_INDEX_OUTPUT_FILE,
  generateContentIndex
} from './build-content-index.mjs'
import {
  generateSiteConfig,
  SITE_CONFIG_DIR,
  SITE_CONFIG_OUTPUT_FILE
} from './build-site-config.mjs'

function isConfigDependency(file) {
  const normalizedFile = path.resolve(String(file || ''))
  const normalizedConfigDir = `${path.resolve(SITE_CONFIG_DIR)}${path.sep}`

  return normalizedFile.startsWith(normalizedConfigDir) && normalizedFile.endsWith('.toml')
}

function isContentDependency(file) {
  const normalizedFile = path.resolve(String(file || ''))
  const normalizedContentDir = `${path.resolve(CONTENT_INDEX_CONTENT_DIR)}${path.sep}`

  return (
    normalizedFile.startsWith(normalizedContentDir)
    && normalizedFile.endsWith('.md')
  )
}

export function contentIndexPlugin() {
  const generatedIndexFiles = [
    CONTENT_INDEX_OUTPUT_FILE,
    SEARCH_INDEX_OUTPUT_FILE,
    SITE_CONFIG_OUTPUT_FILE
  ]

  return {
    name: 'vue-blog-content-index',
    async buildStart() {
      await Promise.all([
        generateContentIndex(),
        generateSiteConfig()
      ])
    },
    configureServer(server) {
      const reloadContentIndex = async (file) => {
        const configChanged = isConfigDependency(file)
        const contentChanged = isContentDependency(file)

        if (!configChanged && !contentChanged) {
          return
        }

        await Promise.all([
          generateContentIndex(),
          configChanged ? generateSiteConfig() : Promise.resolve()
        ])
        generatedIndexFiles.forEach((generatedFile) => {
          const module = server.moduleGraph.getModuleById(generatedFile)
          if (module) {
            server.moduleGraph.invalidateModule(module)
          }
        })
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('add', reloadContentIndex)
      server.watcher.on('change', reloadContentIndex)
      server.watcher.on('unlink', reloadContentIndex)
    }
  }
}

export default contentIndexPlugin
