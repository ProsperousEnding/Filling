import path from 'node:path'
import {
  CONTENT_INDEX_CONTENT_DIR,
  CONTENT_INDEX_OUTPUT_FILE,
  CONTENT_INDEX_SITE_CONFIG_FILE,
  SEARCH_INDEX_OUTPUT_FILE,
  generateContentIndex
} from './build-content-index.mjs'

function isContentIndexDependency(file) {
  const normalizedFile = path.resolve(String(file || ''))
  return normalizedFile === path.resolve(CONTENT_INDEX_SITE_CONFIG_FILE)
    || (
      normalizedFile.startsWith(path.resolve(CONTENT_INDEX_CONTENT_DIR))
      && normalizedFile.endsWith('.md')
    )
}

export function contentIndexPlugin() {
  const generatedIndexFiles = [CONTENT_INDEX_OUTPUT_FILE, SEARCH_INDEX_OUTPUT_FILE]

  return {
    name: 'vue-blog-content-index',
    async buildStart() {
      await generateContentIndex()
    },
    configureServer(server) {
      const reloadContentIndex = async (file) => {
        if (!isContentIndexDependency(file)) {
          return
        }

        await generateContentIndex()
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
