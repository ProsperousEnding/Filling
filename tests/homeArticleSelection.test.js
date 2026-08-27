import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getHomeArticleModeTitle,
  resolveHomeArticlePageTitle,
  selectHomeArticles
} from '../src/framework/utils/homeArticleSelection.js'

const articles = [
  { id: 'latest', title: 'Latest', date: '2026-03-01' },
  { id: 'sticky', title: 'Sticky', date: '2026-01-01', sticky: true },
  {
    id: 'featured',
    title: 'Featured',
    date: '2026-02-01',
    featured: true,
    category: { id: 'vue', name: 'Vue.js' },
    tags: [{ id: 'frontend', name: '前端开发' }]
  },
  { id: 'hidden', title: 'Hidden', date: '2026-04-01', homeHidden: true }
]

test('home article modes expose matching default page titles', () => {
  assert.equal(getHomeArticleModeTitle('latest'), '最新文章')
  assert.equal(getHomeArticleModeTitle('featured'), '精选文章')
  assert.equal(getHomeArticleModeTitle('sticky'), '置顶文章')
  assert.equal(getHomeArticleModeTitle('mixed'), '推荐文章')
  assert.equal(getHomeArticleModeTitle('unsupported'), '最新文章')
})

test('home page title only treats an explicit menu entry as an override', () => {
  assert.equal(resolveHomeArticlePageTitle('mixed'), '推荐文章')
  assert.equal(resolveHomeArticlePageTitle('featured', {
    pages: [{ key: 'home', title: '编辑精选' }]
  }), '编辑精选')
})

test('home article selection applies the same mode, visibility and ordering rules', () => {
  assert.deepEqual(
    selectHomeArticles(articles, { mode: 'mixed' }).map(article => article.id),
    ['sticky', 'featured', 'latest']
  )

  assert.deepEqual(
    selectHomeArticles(articles, {
      mode: 'featured',
      includeIds: ['latest'],
      includeSticky: false
    }).map(article => article.id),
    ['latest', 'featured']
  )
})

test('featured and sticky modes only fall back when explicitly enabled', () => {
  const articlesWithoutFeatured = articles.filter(article => !article.featured)

  assert.deepEqual(
    selectHomeArticles(articlesWithoutFeatured, { mode: 'featured' }),
    []
  )

  assert.deepEqual(
    selectHomeArticles(articlesWithoutFeatured, {
      mode: 'featured',
      fallbackToLatest: true
    }).map(article => article.id),
    ['sticky', 'latest']
  )
})

test('latest mode becomes strictly chronological when priority sorting is disabled', () => {
  const weightedArticles = [
    { id: 'newest', date: '2026-08-01' },
    { id: 'old-weighted', date: '2025-01-01', weight: 100 },
    { id: 'old-sticky', date: '2024-01-01', sticky: true }
  ]

  assert.deepEqual(
    selectHomeArticles(weightedArticles, {
      mode: 'latest',
      stickyFirst: false
    }).map(article => article.id),
    ['newest', 'old-weighted', 'old-sticky']
  )

  assert.deepEqual(
    selectHomeArticles(weightedArticles, {
      mode: 'latest',
      stickyFirst: true
    }).map(article => article.id),
    ['old-sticky', 'old-weighted', 'newest']
  )
})

test('mixed mode prioritizes configured, sticky and featured articles before latest content', () => {
  assert.deepEqual(
    selectHomeArticles(articles, {
      mode: 'mixed',
      includeIds: ['latest']
    }).map(article => article.id),
    ['latest', 'sticky', 'featured']
  )
})

test('home article filters match normalized entity ids and display names', () => {
  assert.deepEqual(
    selectHomeArticles(articles, { categories: ['vue'] }).map(article => article.id),
    ['featured']
  )

  assert.deepEqual(
    selectHomeArticles(articles, { categories: ['Vue.js'] }).map(article => article.id),
    ['featured']
  )

  assert.deepEqual(
    selectHomeArticles(articles, { tags: ['前端开发'] }).map(article => article.id),
    ['featured']
  )
})

test('hidden and excluded articles override manual inclusion', () => {
  assert.deepEqual(
    selectHomeArticles(articles, {
      mode: 'mixed',
      includeIds: ['hidden', 'sticky'],
      excludeIds: ['sticky']
    }).map(article => article.id),
    ['featured', 'latest']
  )

  assert.deepEqual(
    selectHomeArticles(articles, {
      mode: 'latest',
      includeSticky: false
    }).map(article => article.id),
    ['latest', 'featured']
  )

  assert.deepEqual(
    selectHomeArticles(articles, {
      mode: 'latest',
      includeSticky: false,
      includeIds: ['sticky']
    }).map(article => article.id),
    ['sticky', 'latest', 'featured']
  )
})
