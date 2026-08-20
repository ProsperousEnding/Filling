import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAdminMenuPage,
  createAdminMenuRows,
  deriveAdminMenuPageKey,
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

test('admin menu page keys derive from content sources and avoid reserved keys', () => {
  const rows = createAdminMenuRows(configuredPages)

  assert.equal(deriveAdminMenuPageKey({
    component: 'context',
    file: 'pages/projects.md',
    title: '项目'
  }, rows), 'projects')
  assert.equal(deriveAdminMenuPageKey({
    component: 'context',
    file: 'about.md',
    title: '关于我们'
  }, rows), 'about-2')
  assert.equal(deriveAdminMenuPageKey({
    component: 'friends',
    title: '友情链接'
  }, rows), 'friends-2')
  assert.equal(deriveAdminMenuPageKey({
    component: 'context',
    file: '关于.md',
    title: '关于'
  }, rows), 'page')
})

test('new admin menu pages use the implicit custom page order until manually moved', () => {
  const emptyRows = createAdminMenuRows([])
  const firstPage = createAdminMenuPage(emptyRows)
  const nextRows = [...emptyRows, firstPage]
  const secondPage = createAdminMenuPage(nextRows)

  assert.equal(firstPage.menu_order, 1000)
  assert.equal(firstPage._defaultMenuOrder, 1000)
  assert.equal(secondPage.menu_order, 1001)
  assert.equal(secondPage._defaultMenuOrder, 1001)
})
