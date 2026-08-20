import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { compileStyle, parse } from '@vue/compiler-sfc'

const frameworkRoot = fileURLToPath(new URL('../src/framework/', import.meta.url))

async function collectVueFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectVueFiles(entryPath)
    }

    return entry.isFile() && entry.name.endsWith('.vue') ? [entryPath] : []
  }))

  return files.flat()
}

test('scoped dark mode selectors keep their descendant targets after compilation', async () => {
  const vueFiles = await collectVueFiles(frameworkRoot)
  let checkedSelectorCount = 0

  for (const filename of vueFiles) {
    const source = await readFile(filename, 'utf8')
    const { descriptor } = parse(source, { filename })

    for (const style of descriptor.styles.filter(item => item.scoped)) {
      const styleFilename = style.src
        ? path.resolve(path.dirname(filename), style.src)
        : filename
      const styleSource = style.src
        ? await readFile(styleFilename, 'utf8')
        : style.content
      const darkSelectorCount = (styleSource.match(/:global\(\.dark\s/g) || []).length

      if (darkSelectorCount === 0) continue

      checkedSelectorCount += darkSelectorCount
      assert.doesNotMatch(
        styleSource,
        /:global\(\.dark\)/,
        `${styleFilename} uses a dark prefix that collapses during scoped CSS compilation`
      )

      const compiled = compileStyle({
        source: styleSource,
        filename: styleFilename,
        id: 'data-v-dark-selector-check',
        scoped: true
      })

      assert.deepEqual(compiled.errors, [], `${styleFilename} contains invalid scoped CSS`)
      assert.doesNotMatch(
        compiled.code,
        /(^|})\s*\.dark\s*(?:,|\{)/m,
        `${styleFilename} compiled a dark rule without its target selector`
      )
      assert.doesNotMatch(
        compiled.code,
        /:deep\(/,
        `${styleFilename} left an uncompiled deep selector in its CSS output`
      )
    }
  }

  assert.ok(checkedSelectorCount > 0, 'expected to check at least one dark selector')
})
