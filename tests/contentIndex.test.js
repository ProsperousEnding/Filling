import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import contentIndex from '../src/framework/generated/contentIndex.generated.js'

test('generated content entries derive article metadata without changing the public index shape', async () => {
  const generatedSource = await readFile(
    new URL('../src/framework/generated/contentIndex.generated.js', import.meta.url),
    'utf8'
  )

  assert.match(generatedSource, /\.\.\.articles\.map\(article =>/u)
  assert.equal(Array.isArray(contentIndex.articles), true)
  assert.equal(Array.isArray(contentIndex.entries), true)

  contentIndex.articles.forEach((article) => {
    const entry = contentIndex.entries.find(item => item.id === `article:${article.id}`)

    assert.ok(entry, `Missing content entry for article ${article.id}`)
    assert.equal(entry.kind, 'article')
    assert.equal(entry.title, article.title)
    assert.equal(entry.cover, article.cover)
    assert.deepEqual(entry.category, article.category)
    assert.deepEqual(entry.tags, article.tags)
  })
})
