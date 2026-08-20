import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAbsoluteUrl,
  resolveMetadataAssetUrl,
  resolveShareImageUrl,
  stripBasePath
} from '../src/framework/utils/pageMetadataModel.js'

test('metadata URLs apply the deployment base path consistently', () => {
  assert.equal(
    buildAbsoluteUrl('blog.example.com/', '/project/', '/article/hello'),
    'https://blog.example.com/project/article/hello'
  )
  assert.equal(
    resolveMetadataAssetUrl('images/cover.webp', { basePath: '/project/' }),
    '/project/images/cover.webp'
  )
  assert.equal(stripBasePath('/project/article/hello', '/project/'), '/article/hello')
})

test('share image resolution prefers page images and supports seeded fallback', () => {
  const config = {
    enabled: true,
    preferPageImage: true,
    fallback: 'seeded',
    defaultImage: ''
  }

  assert.equal(resolveShareImageUrl({
    pageImage: 'images/page.webp',
    shareImageConfig: config,
    siteUrl: 'https://example.com',
    basePath: '/blog/'
  }), 'https://example.com/blog/images/page.webp')

  assert.equal(resolveShareImageUrl({
    seed: 'hello',
    shareImageConfig: config,
    createSeededImage: seed => `seeded:${seed}`
  }), 'seeded:hello')
})
