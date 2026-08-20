import assert from 'node:assert/strict'
import test from 'node:test'

import { parseToml } from '../src/framework/utils/tomlParser.js'

test('parseToml supports TOML strings, inline tables and nested arrays', () => {
  const config = parseToml(`
title = 'A # B'
escaped = "first\\nsecond"
point = { x = 1, y = 2 }
matrix = [[1, 2], [3, 4]]
`)

  assert.equal(config.title, 'A # B')
  assert.equal(config.escaped, 'first\nsecond')
  assert.deepEqual(config.point, { x: 1, y: 2 })
  assert.deepEqual(config.matrix, [[1, 2], [3, 4]])
})

test('parseToml supports tables and arrays of tables used by blog config', () => {
  const config = parseToml(`
[footer]
text = "Footer"

[[menus.pages]]
key = "about"
component = "context"

[[menus.pages]]
key = "projects"
component = "grid"
`)

  assert.equal(config.footer.text, 'Footer')
  assert.deepEqual(config.menus.pages, [
    { key: 'about', component: 'context' },
    { key: 'projects', component: 'grid' }
  ])
})

test('parseToml reports invalid TOML instead of returning partial data', () => {
  assert.throws(() => parseToml('title = "unterminated'))
})
