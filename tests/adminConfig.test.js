import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAdminConfigModel,
  getArrayItemTemplate,
  getFieldOptions,
  normalizeFieldPath
} from '../src/site/admin/adminConfigModel.js'

test('admin config models preserve current values while filling guided form defaults', () => {
  const model = createAdminConfigModel('site', {
    title: 'Current title',
    features: {
      sidebar_visible: false
    },
    custom_section: {
      value: 'preserved'
    }
  })

  assert.equal(model.title, 'Current title')
  assert.equal(model.features.sidebar_visible, false)
  assert.equal(model.features.show_read_time, true)
  assert.equal(model.custom_section.value, 'preserved')
})

test('repeatable admin fields return independent item templates', () => {
  const first = getArrayItemTemplate('profile.social_links')
  const second = getArrayItemTemplate('profile.social_links')

  first.name = 'GitHub'

  assert.equal(second.name, '')
  assert.equal(second.enabled, true)
  assert.equal(getArrayItemTemplate('unknown.items'), null)
})

test('admin field options normalize array indexes and derive theme presets', () => {
  assert.equal(
    normalizeFieldPath('site.menus.pages.2.component'),
    'site.menus.pages.*.component'
  )
  assert.deepEqual(
    getFieldOptions('site.menus.pages.2.component'),
    ['context', 'list', 'card', 'grid', 'timeline', 'friends']
  )
  assert.deepEqual(
    getFieldOptions('theme.current_preset', {
      presets: { default: {}, forest: {} }
    }),
    ['default', 'forest']
  )
  assert.deepEqual(
    getFieldOptions('cover.seeded_style'),
    [
      'picsum',
      'cataas',
      'mwm-anime',
      'mwm-scenery',
      'paugram-anime',
      'dmoe-anime',
      'loremflickr',
      'paugram-bing'
    ]
  )
})
