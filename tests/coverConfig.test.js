import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import test from 'node:test'

import {
  DEFAULT_SEEDED_COVER_STYLE,
  DEFAULT_SEEDED_COVER_URLS,
  SEEDED_COVER_STYLES,
  createArticleCoverSrcset,
  createOptimizedArticleCoverUrl,
  createSeededArticleCover,
  resetRuntimeRandomCoverPool,
  resolveDisplayArticleCover
} from '../src/framework/utils/articleCover.js'
import { normalizeCoverConfig } from '../src/framework/utils/coverConfig.js'
import { parseToml } from '../src/framework/utils/tomlParser.js'

test('built-in cover sources contain only the maintained providers', () => {
  assert.equal(DEFAULT_SEEDED_COVER_STYLE, 'mwm-anime')
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

test('responsive cover candidates are generated only for size-aware providers', () => {
  assert.equal(
    createArticleCoverSrcset('https://picsum.photos/seed/demo/1200/630.webp', {
      widths: [480, 800, 1200]
    }),
    [
      'https://picsum.photos/seed/demo/480/252.webp 480w',
      'https://picsum.photos/seed/demo/800/420.webp 800w',
      'https://picsum.photos/seed/demo/1200/630.webp 1200w'
    ].join(', ')
  )
  assert.match(
    createArticleCoverSrcset('https://cataas.com/cat?seed=12', {
      widths: [480, 800]
    }),
    /width=480&height=252.*480w, .*width=800&height=420.*800w/u
  )
  assert.equal(
    createArticleCoverSrcset('https://t.alcy.cc/pc/?seed=12'),
    ''
  )
})

test('MWM covers use the configured image proxy and fixed responsive widths', () => {
  const imageProxyUrl = 'https://filling-config-api.initzo.com/image/cover'
  const source = 'https://t.alcy.cc/pc/?seed=12'
  const optimized = createOptimizedArticleCoverUrl(source, {
    imageProxyUrl,
    width: 1200
  })
  const optimizedUrl = new URL(optimized)

  assert.equal(optimizedUrl.origin + optimizedUrl.pathname, imageProxyUrl)
  assert.equal(optimizedUrl.searchParams.get('url'), source)
  assert.equal(optimizedUrl.searchParams.get('width'), '1200')

  const srcset = createArticleCoverSrcset(optimized, { imageProxyUrl })
  assert.match(srcset, /width=480[^,]* 480w/u)
  assert.match(srcset, /width=800[^,]* 800w/u)
  assert.match(srcset, /width=1200[^,]* 1200w/u)
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

test('cover URL pools choose one stable source from the article seed', () => {
  const pool = [
    'https://images.example.com/one.webp',
    'https://images.example.com/two.webp',
    'https://images.example.com/three.webp'
  ]
  const config = normalizeCoverConfig({
    seeded_style: 'mwm-anime',
    source_urls: {
      'mwm-anime': pool
    }
  })
  const options = {
    style: config.seededStyle,
    fixed: true,
    styleUrls: config.styleUrls
  }
  const firstUrl = createSeededArticleCover('article-one', options)

  assert.deepEqual(config.styleUrls['mwm-anime'], pool)
  assert.equal(createSeededArticleCover('article-one', options), firstUrl)
  assert.ok(pool.includes(firstUrl))
  assert.equal(firstUrl.includes('?seed='), false)
  assert.ok(new Set([
    'article-one',
    'article-two',
    'article-three',
    'article-four'
  ].map(seed => createSeededArticleCover(seed, options))).size > 1)
})

test('random cover mode shuffles the configured pool and keeps an article stable in one session', () => {
  const pool = [
    'https://images.example.com/one.webp',
    'https://images.example.com/two.webp'
  ]
  const config = normalizeCoverConfig({
    seeded_style: 'mwm-anime',
    fixed: false,
    source_urls: {
      'mwm-anime': pool
    }
  })
  const articles = ['article-one', 'article-two'].map(slug => ({
    slug,
    title: slug,
    kind: 'article'
  }))
  const covers = articles.map(article => resolveDisplayArticleCover(article, {
    coverConfig: config
  }))

  assert.equal(config.fixed, false)
  assert.equal(new Set(covers).size, articles.length)
  assert.ok(covers.every(cover => pool.includes(cover)))
  assert.equal(resolveDisplayArticleCover(articles[0], { coverConfig: config }), covers[0])
})

test('random cover pools can be reproduced for prerender hydration', () => {
  const pool = [
    'https://images.example.com/one.webp',
    'https://images.example.com/two.webp',
    'https://images.example.com/three.webp'
  ]
  const options = {
    style: 'mwm-anime',
    randomizePool: true,
    styleUrls: { 'mwm-anime': pool }
  }
  const articleSeeds = ['article-one', 'article-two', 'article-three']

  resetRuntimeRandomCoverPool('hydration-seed')
  const prerenderedCovers = articleSeeds.map(seed => createSeededArticleCover(seed, options))
  resetRuntimeRandomCoverPool('hydration-seed')
  const hydratedCovers = articleSeeds.map(seed => createSeededArticleCover(seed, options))

  assert.deepEqual(hydratedCovers, prerenderedCovers)
  assert.equal(new Set(prerenderedCovers).size, articleSeeds.length)
})

test('current fixed cover pool can assign distinct images to every article', () => {
  const projectRoot = resolve(import.meta.dirname, '..')
  const rawConfig = parseToml(readFileSync(resolve(projectRoot, 'blog/config/cover.toml'), 'utf8'))
  const config = normalizeCoverConfig(rawConfig)
  const articleSeeds = readdirSync(resolve(projectRoot, 'blog/content/articles'))
    .filter(fileName => extname(fileName).toLowerCase() === '.md')
    .map(fileName => fileName.slice(0, -extname(fileName).length))
  const covers = articleSeeds.map(seed => createSeededArticleCover(seed, {
    style: config.seededStyle,
    fixed: true,
    styleUrls: config.styleUrls
  }))

  assert.equal(new Set(covers).size, articleSeeds.length)
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
  assert.equal(config.fixed, false)
  assert.equal('seededSource' in config, false)
  assert.equal('sourceSwitch' in config, false)
  assert.equal('styleSwitch' in config, false)
})

test('cover normalization exposes only an explicit image optimization endpoint', () => {
  const config = normalizeCoverConfig({
    image_proxy_url: 'https://images.example.com/image/cover'
  })

  assert.equal(config.imageProxyUrl, 'https://images.example.com/image/cover')
})
