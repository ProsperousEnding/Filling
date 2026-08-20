import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAdminMenuRows,
  getAdminMenuPreview,
  moveAdminMenuRow,
  serializeAdminMenuRows
} from '../src/site/admin/adminMenuModel.js'

const configuredPages = [
  {
    key: 'about',
    title: '关于',
    component: 'context',
    file: 'about.md'
  },
  {
    key: 'friends',
    title: '友链',
    component: 'friends'
  }
]

test('admin menu rows expose built-in pages without writing unchanged defaults', () => {
  const rows = createAdminMenuRows(configuredPages)
  const serialized = serializeAdminMenuRows(rows)

  assert.equal(rows.filter(row => row.builtIn).length, 6)
  assert.deepEqual(serialized, configuredPages)
})

test('admin menu rows serialize only changed built-in behavior', () => {
  const rows = createAdminMenuRows([])
  const home = rows.find(row => row.key === 'home')
  home.visible = false
  home.label = '开始'

  assert.deepEqual(serializeAdminMenuRows(rows), [{
    key: 'home',
    label: '开始',
    visible: false
  }])
})

test('admin menu ordering and preview follow the runtime primary menu rules', () => {
  const rows = createAdminMenuRows(configuredPages)
  const initialPreview = getAdminMenuPreview(rows)
  const friendsIndex = rows.findIndex(row => row.key === 'friends')
  const movedRows = moveAdminMenuRow(rows, friendsIndex, -1)
  const serialized = serializeAdminMenuRows(movedRows)

  assert.deepEqual(initialPreview.primary.map(row => row.key), [
    'home',
    'articles',
    'categories',
    'tags',
    'archive'
  ])
  assert.deepEqual(initialPreview.overflow.map(row => row.key), ['about', 'friends'])
  assert.ok(serialized.find(page => page.key === 'friends').menu_order < serialized.find(page => page.key === 'about').menu_order)
})

test('admin menu preview keeps pinned pages in their configured order', () => {
  const rows = createAdminMenuRows([{
    key: 'projects',
    title: '项目',
    component: 'grid',
    folder: 'projects',
    menu_group: 'primary'
  }])
  const preview = getAdminMenuPreview(rows)

  assert.deepEqual(preview.primary.map(row => row.key), [
    'home',
    'articles',
    'categories',
    'tags',
    'projects'
  ])
  assert.deepEqual(preview.overflow.map(row => row.key), ['archive'])
})
