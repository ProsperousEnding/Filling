import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createSSRApp } from 'vue'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const libraryDir = path.join(rootDir, 'dist-lib')
const esmEntry = path.join(libraryDir, 'vue-blog-framework.es.js')
const cjsEntry = path.join(libraryDir, 'vue-blog-framework.umd.cjs')
const require = createRequire(import.meta.url)

const esmModule = await import(pathToFileURL(esmEntry).href)
const cjsModule = require(cjsEntry)

for (const moduleExports of [esmModule, cjsModule]) {
  assert.equal(typeof moduleExports.install, 'function')
  assert.equal(typeof moduleExports.setupBlogFramework, 'function')
  assert.equal(typeof moduleExports.getBlogReady, 'function')
  assert.equal(typeof moduleExports.configureContentAdapter, 'function')
  assert.equal(typeof moduleExports.configureConfigProvider, 'function')
}

const app = createSSRApp({})
const { configStore } = await esmModule.setupBlogFramework(app, {
  base: '/package-test/',
  contentAdapter: {},
  configProvider: async () => ({
    site: {
      title: 'Packaged framework'
    }
  })
})
assert.equal(configStore.blogTitle, 'Packaged framework')

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(entryPath)
    }

    return /\.(?:js|cjs)$/.test(entry.name) ? [entryPath] : []
  }))

  return files.flat()
}

const outputText = (await Promise.all(
  (await collectJavaScriptFiles(libraryDir)).map(file => readFile(file, 'utf8'))
)).join('\n')

for (const forbiddenText of [
  '/blog/config/',
  '/blog/content/',
  'config-comments-and-analytics'
]) {
  assert.equal(outputText.includes(forbiddenText), false, `Library contains site data: ${forbiddenText}`)
}

console.log('Library package exports and content boundaries verified.')
