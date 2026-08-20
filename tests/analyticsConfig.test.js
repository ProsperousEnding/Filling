import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeAnalyticsConfig } from '../src/framework/utils/analyticsConfig.js'

test('analytics stays disabled until a configured provider is ready', () => {
  assert.equal(normalizeAnalyticsConfig({ enabled: true }).enabled, false)

  const config = normalizeAnalyticsConfig({
    enabled: true,
    respect_dnt: true,
    umami: {
      enabled: true,
      website_id: 'website-id',
      domains: ['example.com', '']
    }
  })

  assert.equal(config.enabled, true)
  assert.equal(config.respectDnt, true)
  assert.equal(config.umami.ready, true)
  assert.equal(config.umami.scriptUrl, 'https://cloud.umami.is/script.js')
  assert.deepEqual(config.umami.domains, ['example.com'])
  assert.deepEqual(config.providers, ['umami'])
})

test('analytics rejects local script protocols and accepts camel-case runtime flags', () => {
  const config = normalizeAnalyticsConfig({
    enabled: true,
    trackLocalhost: true,
    plausible: {
      enabled: true,
      script_url: 'javascript:alert(1)'
    }
  })

  assert.equal(config.enabled, false)
  assert.equal(config.trackLocalhost, true)
  assert.equal(config.plausible.scriptUrl, '')
  assert.equal(config.plausible.ready, false)
})

test('analytics can select one provider without duplicate enable switches', () => {
  const config = normalizeAnalyticsConfig({
    provider: 'ga4',
    google_analytics: {
      measurement_id: 'G-TEST123'
    },
    clarity: {
      enabled: true,
      project_id: 'ignored-legacy-provider'
    }
  })

  assert.equal(config.enabled, true)
  assert.equal(config.provider, 'google_analytics')
  assert.equal(config.googleAnalytics.ready, true)
  assert.equal(config.clarity.enabled, false)
  assert.deepEqual(config.providers, ['googleAnalytics'])
})

test('an explicit analytics disable still overrides a selected provider', () => {
  const config = normalizeAnalyticsConfig({
    enabled: false,
    provider: 'umami',
    umami: {
      website_id: 'website-id'
    }
  })

  assert.equal(config.enabled, false)
  assert.equal(config.umami.enabled, false)
})
