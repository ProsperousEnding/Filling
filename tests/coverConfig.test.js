import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_SEEDED_COVER_URLS,
  SEEDED_COVER_STYLES,
  createSeededArticleCover
} from '../src/framework/utils/articleCover.js'
import { normalizeCoverConfig } from '../src/framework/utils/coverConfig.js'

test('built-in cover sources contain only the maintained providers', () => {
  assert.deepEqual(SEEDED_COVER_STYLES, [
    'picsum',
    'cataas',
    'mwm-anime',
    'mwm-scenery',
    'paugram-anime',
    'dmoe-anime',
    'loremflickr',
    'paugram-bing'
  ])
  assert.deepEqual(Object.keys(DEFAULT_SEEDED_COVER_URLS), SEEDED_COVER_STYLES)
})

test('new cover presets resolve to direct image endpoints', () => {
  const options = { width: 1200, height: 630 }

  assert.match(
    createSeededArticleCover('article-one', { ...options, style: 'paugram-anime' }),
    /^https:\/\/api\.paugram\.com\/wallpaper\/\?seed=\d+$/u
  )
  assert.match(
    createSeededArticleCover('article-one', { ...options, style: 'dmoe-anime' }),
    /^https:\/\/www\.dmoe\.cc\/random\.php\?seed=\d+$/u
  )
  assert.match(
    createSeededArticleCover('article-one', { ...options, style: 'loremflickr' }),
    /^https:\/\/loremflickr\.com\/1200\/630\/landscape\?lock=\d+$/u
  )
  assert.match(
    createSeededArticleCover('article-one', { ...options, style: 'paugram-bing' }),
    /^https:\/\/api\.paugram\.com\/bing\/\?seed=\d+$/u
  )
})

test('removed cover sources fall back unless a custom URL is configured', () => {
  const staleConfig = normalizeCoverConfig({
    seeded_style: 'xjh-acg',
    source_switch: {
      enabled: true,
      sources: ['xjh-acg', 'picsum']
    }
  })

  assert.equal(staleConfig.seededStyle, 'picsum')
  assert.deepEqual(staleConfig.sourceSwitch.sources, ['picsum'])

  const customConfig = normalizeCoverConfig({
    seeded_style: 'custom-cover',
    source_urls: {
      'custom-cover': 'https://images.example.com/{seed}.webp'
    },
    source_switch: {
      enabled: true,
      sources: ['custom-cover', 'picsum']
    }
  })

  assert.equal(customConfig.seededStyle, 'custom-cover')
  assert.deepEqual(customConfig.sourceSwitch.sources, ['custom-cover', 'picsum'])
})
