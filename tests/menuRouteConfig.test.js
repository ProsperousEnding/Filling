import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeMenuPagePath,
  routePatternsOverlap
} from '../src/framework/utils/menuRouteConfig.js'

test('menu page paths accept static routes and reject unsafe syntax', () => {
  assert.equal(normalizeMenuPagePath('/项目/demo'), '/项目/demo')
  assert.equal(normalizeMenuPagePath('/docs/'), '/docs')
  assert.equal(normalizeMenuPagePath('/../outside'), '')
  assert.equal(normalizeMenuPagePath('/docs?mode=full'), '')
})

test('route overlap falls back safely when optional variants exceed the cap', () => {
  const largeOptionalPattern = [
    '/docs',
    ...Array.from({ length: 12 }, (_, index) => `:part${index}?`)
  ].join('/')

  assert.equal(routePatternsOverlap(largeOptionalPattern, '/docs/guide'), true)
  assert.equal(routePatternsOverlap(largeOptionalPattern, '/blog/guide'), false)
})
