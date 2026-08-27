import { expect, test } from '@playwright/test'
import { installCoverFixture, sitePath } from './helpers.js'

const COVER_FIXTURE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f766e" />
    <rect x="600" width="600" height="630" fill="#f59e0b" />
  </svg>
`

test.describe('prerendered pages', () => {
  test.use({ javaScriptEnabled: false })

  test('renders the complete Vue homepage without JavaScript', async ({ page }) => {
    await page.goto(sitePath('/'))

    await expect(page.locator('#app[data-vue-prerendered="true"]')).toBeVisible()
    await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
    await expect(page.locator('.article-feed-card')).toHaveCount(5)
    await expect(page.locator('.sidebar-container-desktop')).toBeVisible()
    await expect(page.locator('.article-feed-card img[src]')).toHaveCount(5)
    await expect(page.locator('.article-feed-card').first()).toHaveAttribute('href', /\/article\//u)
    await expect(page.locator('.article-feed-card img').first()).toHaveAttribute('loading', 'eager')
    await expect(page.locator('.article-feed-card img').first()).toHaveAttribute('fetchpriority', 'high')
    await expect(page.locator('.article-feed-card img').nth(1)).toHaveAttribute('loading', 'lazy')
  })

  test('keeps the themed article list and article content readable without JavaScript', async ({ page }) => {
    await page.goto(sitePath('/articles'))

    const prerenderedRoot = page.locator('#app[data-vue-prerendered="true"]')
    const articleLinks = prerenderedRoot.locator('a.article-card-shell')

    await expect(prerenderedRoot).toBeVisible()
    await expect(articleLinks).toHaveCount(5)
    await expect(page.locator('link[rel="stylesheet"][href$="/themes/default.css"]')).toHaveCount(1)

    await articleLinks.first().click()

    await expect(page.locator('#app[data-vue-prerendered="true"] .article-detail-shell')).toBeVisible()
    await expect(page.locator('.article-content')).not.toBeEmpty()
  })
})

test('keeps the same prerendered article list visible while hydration starts', async ({ page }) => {
  let releaseMainScript
  const mainScriptGate = new Promise(resolve => {
    releaseMainScript = resolve
  })

  await page.addInitScript(() => localStorage.setItem('vue-blog-theme', 'dark'))
  await page.route(/\/assets\/index-[^/]+\.js$/u, async (route) => {
    await mainScriptGate
    await route.continue()
  })

  const navigation = page.goto(sitePath('/articles'))
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('#app[data-vue-prerendered="true"]')).toBeVisible()
  await expect(page.locator('.article-card-shell')).toHaveCount(5)

  releaseMainScript()
  await navigation
  await expect(page.locator('#app')).not.toHaveAttribute('data-vue-prerendered', 'true')
  await expect(page.locator('.article-card-shell')).toHaveCount(5)
})

test('hydrates the prerendered homepage in place', async ({ page }) => {
  const hydrationMessages = []
  page.on('console', (message) => {
    if (/hydration/iu.test(message.text())) {
      hydrationMessages.push(message.text())
    }
  })

  await page.goto(sitePath('/'))

  await expect(page.locator('#app')).not.toHaveAttribute('data-vue-prerendered', 'true')
  await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
  await expect(page.locator('.article-feed-card')).toHaveCount(5)
  expect(hydrationMessages).toEqual([])
})

test('hydrates the article list with one prioritized cover and native lazy loading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await installCoverFixture(page, COVER_FIXTURE)

  await page.goto(sitePath('/articles'))

  const cards = page.locator('.menu-page-card-list .menu-page-card-item')
  const covers = cards.locator('img')

  await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
  await expect(cards).toHaveCount(5)
  await expect(covers).toHaveCount(5)
  await expect(covers.first()).toHaveAttribute('loading', 'eager')
  await expect(covers.first()).toHaveAttribute('fetchpriority', 'high')
  await expect(covers.nth(1)).toHaveAttribute('loading', 'lazy')
  await expect(covers.nth(1)).toHaveAttribute('fetchpriority', 'low')
  await expect(page.locator('.menu-page-card-list .menu-page-card-item img[src]')).toHaveCount(5)
})

test('keeps responsive homepage content stable through mobile hydration', async ({ page }) => {
  let releaseMainScript
  const mainScriptGate = new Promise(resolve => {
    releaseMainScript = resolve
  })
  const hydrationMessages = []

  await page.setViewportSize({ width: 390, height: 844 })
  page.on('console', (message) => {
    if (/hydration/iu.test(message.text())) hydrationMessages.push(message.text())
  })
  await page.route(/\/assets\/index-[^/]+\.js$/u, async (route) => {
    await mainScriptGate
    await route.continue()
  })

  const navigation = page.goto(sitePath('/'))
  await expect(page.locator('#app[data-vue-prerendered="true"]')).toBeVisible()
  const beforeHydration = await page.locator('.article-feed-card').first().evaluate(card => ({
    excerptClass: card.querySelector('.article-feed-excerpt')?.className,
    sidebarCount: document.querySelectorAll('.sidebar-container-desktop').length,
    tagClasses: Array.from(card.querySelectorAll('.article-feed-tag')).map(tag => tag.className),
    tagTexts: Array.from(card.querySelectorAll('.article-feed-tag')).map(tag => tag.textContent.trim())
  }))

  releaseMainScript()
  await navigation
  await expect(page.locator('#app')).not.toHaveAttribute('data-vue-prerendered', 'true')

  const afterHydration = await page.locator('.article-feed-card').first().evaluate(card => ({
    excerptClass: card.querySelector('.article-feed-excerpt')?.className,
    sidebarCount: document.querySelectorAll('.sidebar-container-desktop').length,
    tagClasses: Array.from(card.querySelectorAll('.article-feed-tag')).map(tag => tag.className),
    tagTexts: Array.from(card.querySelectorAll('.article-feed-tag')).map(tag => tag.textContent.trim())
  }))

  expect(afterHydration).toEqual(beforeHydration)
  expect(hydrationMessages).toEqual([])
})

test('redirects a direct extensionless request to its prerendered directory URL', async ({ page }) => {
  const canonicalUrl = sitePath('/articles')

  await page.goto(canonicalUrl.replace(/\/$/u, ''))

  await expect(page).toHaveURL(new RegExp(`${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`, 'u'))
  await expect(page.locator('.article-card-shell')).toHaveCount(5)
  await expect(page.locator('#app')).not.toHaveAttribute('data-vue-prerendered', 'true')
})

test('article list has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installCoverFixture(page, COVER_FIXTURE)

  await page.goto(sitePath('/articles'))
  await expect(page.locator('.menu-page-card-list')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }))).toEqual({
    documentWidth: 390,
    viewportWidth: 390
  })
})
