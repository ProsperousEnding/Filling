import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAdminConfigModel,
  createAdminConfigOverrides,
  getAdminNumberBounds,
  getArrayItemTemplate,
  getFieldHint,
  getFieldOptions,
  isAdminFieldVisible,
  normalizeFieldPath
} from '../src/site/admin/adminConfigModel.js'
import { createAdminConfigDiff } from '../src/site/admin/adminConfigDiff.js'

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

test('admin config overrides omit defaults without losing custom values', () => {
  const model = createAdminConfigModel('cover', {
    seeded_style: 'mwm-scenery',
    custom_source: {
      endpoint: 'https://example.com/image'
    }
  })

  assert.deepEqual(createAdminConfigOverrides('cover', model), {
    seeded_style: 'mwm-scenery',
    custom_source: {
      endpoint: 'https://example.com/image'
    }
  })
})

test('admin config overrides preserve custom menu pages while pruning site defaults', () => {
  const model = createAdminConfigModel('site', {
    title: 'Filling',
    menus: {
      pages: [{
        key: 'about',
        title: '关于',
        component: 'context',
        file: 'about.md'
      }]
    }
  })

  assert.deepEqual(createAdminConfigOverrides('site', model), {
    title: 'Filling',
    menus: {
      pages: [{
        key: 'about',
        title: '关于',
        component: 'context',
        file: 'about.md'
      }]
    }
  })
})

test('admin form serialization preserves explicitly configured defaults', () => {
  const configured = {
    seo: {
      lang: 'zh-CN',
      keywords: [],
      theme_color: '#f8fafc',
      favicon: '',
      robots: 'index,follow'
    },
    header: {
      leading_visual: {
        visible: true,
        type: 'dots',
        title_size: '18'
      }
    },
    menus: {
      pages: [{
        key: 'about',
        title: '关于',
        component: 'context',
        file: 'about.md'
      }]
    }
  }
  const model = createAdminConfigModel('site', configured)
  model.menus.pages.push({
    key: 'friends',
    title: '友链',
    component: 'friends'
  })

  const serialized = createAdminConfigOverrides('site', model, configured)

  assert.deepEqual(serialized.seo, configured.seo)
  assert.deepEqual(serialized.header, configured.header)
  assert.equal(serialized.menus.pages.length, 2)
  assert.equal(Object.prototype.hasOwnProperty.call(serialized, 'pagination'), false)
  assert.equal(
    createAdminConfigDiff(configured, serialized)
      .every(change => change.path.startsWith('menus.pages[1]')),
    true
  )
})

test('admin form serialization keeps an explicit field when it is reset to its default', () => {
  const configured = { seeded_style: 'mwm-anime' }
  const model = createAdminConfigModel('cover', configured)
  model.seeded_style = 'picsum'

  assert.deepEqual(createAdminConfigOverrides('cover', model, configured), {
    seeded_style: 'picsum'
  })
})

test('admin form activation fields serialize values required by the runtime', () => {
  const fontModel = createAdminConfigModel('font', {})
  fontModel.enabled = true
  fontModel.preset = 'sans'

  assert.deepEqual(createAdminConfigOverrides('font', fontModel, {}), {
    enabled: true,
    preset: 'sans'
  })

  const commentModel = createAdminConfigModel('comment', {})
  commentModel.provider = 'giscus'
  Object.assign(commentModel.giscus, {
    repo: 'owner/repo',
    repo_id: 'R_example',
    category: 'General',
    category_id: 'D_example'
  })

  assert.deepEqual(createAdminConfigOverrides('comment', commentModel, {}), {
    provider: 'giscus',
    giscus: {
      repo: 'owner/repo',
      repo_id: 'R_example',
      category: 'General',
      category_id: 'D_example'
    }
  })
})

test('guided site structure only serializes sidebar and layout changes', () => {
  const model = createAdminConfigModel('site', {})
  model.sidebar.desktop_components = ['profile', 'search']
  model.page_layouts.home.allow_switch = true

  assert.deepEqual(createAdminConfigOverrides('site', model, {}), {
    sidebar: {
      desktop_components: ['profile', 'search']
    },
    page_layouts: {
      home: {
        allow_switch: true
      }
    }
  })
})

test('admin select options only expose values accepted by runtime validation', () => {
  assert.deepEqual(getFieldOptions('site.header.leading_visual.type'), ['dots', 'image'])
  assert.deepEqual(getFieldOptions('font.preload'), ['none', 'marked', 'all'])
  assert.deepEqual(getFieldOptions('comment.provider'), ['', 'giscus', 'utterances'])
})

test('admin field metadata follows active configuration branches', () => {
  assert.equal(isAdminFieldVisible('background.image', {
    enabled: true,
    mode: 'gradient'
  }), false)
  assert.equal(isAdminFieldVisible('background.gradient_light', {
    enabled: true,
    mode: 'gradient'
  }), true)
  assert.equal(isAdminFieldVisible('comment.giscus', { provider: 'utterances' }), false)
  assert.equal(isAdminFieldVisible('comment.utterances', { provider: 'utterances' }), true)
  assert.equal(isAdminFieldVisible('analytics.umami', { provider: '' }), false)
  assert.equal(getFieldHint('site.seo.favicon').includes('public/'), true)
  assert.deepEqual(getAdminNumberBounds('cover.detail.watermark.opacity'), {
    min: 0,
    max: 1,
    step: 0.05
  })
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
