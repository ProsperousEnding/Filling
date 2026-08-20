import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAdminConfigDiff,
  formatAdminDiffValue
} from '../src/site/admin/adminConfigDiff.js'

test('admin config diff reports nested additions, removals and changes', () => {
  const changes = createAdminConfigDiff({
    title: 'Old',
    features: { enabled: true, legacy: 'remove' },
    pages: [{ key: 'about' }]
  }, {
    title: 'New',
    features: { enabled: false },
    pages: [{ key: 'about' }, { key: 'friends' }]
  })

  assert.deepEqual(changes.map(change => [change.path, change.kind]), [
    ['title', 'changed'],
    ['features.enabled', 'changed'],
    ['features.legacy', 'removed'],
    ['pages[1]', 'added']
  ])
})

test('admin config diff formats values for compact publish review', () => {
  assert.equal(formatAdminDiffValue(undefined), '未设置')
  assert.equal(formatAdminDiffValue(false), '关闭')
  assert.equal(formatAdminDiffValue(''), '空值')
  assert.equal(formatAdminDiffValue('123456', 5), '1234…')
})
