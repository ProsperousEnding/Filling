import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import { resolveStaticRouteOutputFile } from '../scripts/static-route-output.mjs'

const outputDirectory = path.resolve('/project/dist')

test('static route output stays inside the configured directory', () => {
  assert.equal(
    resolveStaticRouteOutputFile(outputDirectory, '/about'),
    path.join(outputDirectory, 'about', 'index.html')
  )
  assert.equal(
    resolveStaticRouteOutputFile(outputDirectory, '/article/hello%20world'),
    path.join(outputDirectory, 'article', 'hello world', 'index.html')
  )
})

test('static route output rejects traversal and URL-only syntax', () => {
  for (const routePath of [
    '',
    '/../outside',
    '/%2e%2e/outside',
    '/article%2Foutside',
    '/docs?mode=full',
    '/docs#part',
    '/invalid%E0%A4%A'
  ]) {
    assert.throws(() => resolveStaticRouteOutputFile(outputDirectory, routePath))
  }
})
