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

test('unknown cover sources fall back unless a custom URL is configured', () => {
  const staleConfig = normalizeCoverConfig({
    seeded_style: 'xjh-acg'
  })

  assert.equal(staleConfig.seededStyle, 'mwm-anime')

  const customConfig = normalizeCoverConfig({
    seeded_style: 'custom-cover',
    source_urls: {
      'custom-cover': 'https://images.example.com/{seed}.webp'
    }
  })

  assert.equal(customConfig.seededStyle, 'custom-cover')
})

test('cover normalization exposes no visitor-specific source state', () => {
  const config = normalizeCoverConfig({
    seeded_style: 'mwm-anime',
    source_switch: {
      enabled: true,
      sources: ['mwm-scenery']
    }
  })

  assert.equal(config.seededStyle, 'mwm-anime')
  assert.equal('seededSource' in config, false)
  assert.equal('sourceSwitch' in config, false)
  assert.equal('styleSwitch' in config, false)
})
