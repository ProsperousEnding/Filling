import assert from 'node:assert/strict'
import test from 'node:test'

import { getConfigDiagnostics } from '../src/framework/utils/configDiagnostics.js'

test('config diagnostics accepts simple provider and feature configurations', () => {
  const diagnostics = getConfigDiagnostics({
    site: {
      home_articles: { mode: 'mixed', page_size: 8 }
    },
    comment: {
      provider: 'giscus',
      giscus: {
        repo: 'owner/repo',
        repo_id: 'repo-id',
        category: 'Announcements',
        category_id: 'category-id'
      }
    },
    analytics: {
      provider: 'umami',
      umami: { website_id: 'website-id' }
    },
    sponsor: {
      enabled: true,
      show: ['articles', 'page']
    }
  })

  assert.deepEqual(diagnostics, [])
})

test('config diagnostics reports invalid values and dependent fields', () => {
  const diagnostics = getConfigDiagnostics({
    site: {
      home_articles: { mode: 'random', page_size: 0 }
    },
    analytics: {
      provider: 'clarity',
      clarity: {}
    },
    sponsor: {
      show: ['sidebar']
    }
  })
  const paths = diagnostics.map(diagnostic => diagnostic.path)

  assert.equal(paths.includes('site.home_articles.mode'), true)
  assert.equal(paths.includes('site.home_articles.page_size'), true)
  assert.equal(paths.includes('analytics.clarity.project_id'), true)
  assert.equal(paths.includes('sponsor.show[0]'), true)
  assert.equal(diagnostics.every(diagnostic => diagnostic.level === 'error'), true)
})

test('config diagnostics warns about unknown top-level fields', () => {
  const diagnostics = getConfigDiagnostics({
    font: {
      enabled: true,
      preset_name: 'sans'
    }
  })

  assert.deepEqual(diagnostics, [{
    level: 'warning',
    code: 'unknown-config-field',
    path: 'font.preset_name',
    message: 'Unknown field "preset_name"; check the spelling or remove it.'
  }])
})

test('config diagnostics reports the removed visitor cover source switch', () => {
  const diagnostics = getConfigDiagnostics({
    cover: {
      source_switch: {
        enabled: true
      }
    }
  })

  assert.deepEqual(diagnostics, [{
    level: 'warning',
    code: 'unknown-config-field',
    path: 'cover.source_switch',
    message: 'Unknown field "source_switch"; check the spelling or remove it.'
  }])
})

test('config diagnostics only requires a pool when fixed random covers are enabled', () => {
  const randomDiagnostics = getConfigDiagnostics({
    cover: {
      fallback: 'seeded',
      seeded_style: 'mwm-anime',
      fixed: false
    }
  })
  const missingPoolDiagnostics = getConfigDiagnostics({
    cover: {
      fallback: 'seeded',
      seeded_style: 'mwm-anime',
      fixed: true
    }
  })
  const fixedDiagnostics = getConfigDiagnostics({
    cover: {
      fallback: 'seeded',
      seeded_style: 'mwm-anime',
      fixed: true,
      source_urls: {
        'mwm-anime': [
          'https://images.example.com/one.webp',
          'https://images.example.com/two.webp'
        ]
      }
    }
  })

  assert.equal(
    randomDiagnostics.some(diagnostic => diagnostic.code === 'missing-fixed-cover-source'),
    false
  )
  assert.equal(
    missingPoolDiagnostics.some(diagnostic => diagnostic.code === 'missing-fixed-cover-source'),
    true
  )
  assert.equal(
    fixedDiagnostics.some(diagnostic => diagnostic.code === 'missing-fixed-cover-source'),
    false
  )
})
