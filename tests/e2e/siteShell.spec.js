import { expect, test } from '@playwright/test'
import { installCoverFixture, sitePath } from './helpers.js'

const COVER_FIXTURE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f766e" />
    <rect x="600" width="600" height="630" fill="#f59e0b" />
  </svg>
`

test.describe('static fallback', () => {
  test.use({ javaScriptEnabled: false })

  test('renders the complete Vue homepage without JavaScript', async ({ page }) => {
    await page.goto(sitePath('/'))

    await expect(page.locator('#app[data-vue-prerendered="true"]')).toBeVisible()
    await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
    await expect(page.locator('.article-feed-card')).toHaveCount(5)
    await expect(page.locator('.sidebar-container-desktop')).toBeVisible()
    await expect(page.locator('.article-feed-card img[src]')).toHaveCount(5)
    await expect(page.locator('.article-feed-card').first()).toHaveAttribute('href', /\/article\//u)
  })

  test('keeps article lists and article content readable without JavaScript', async ({ page }) => {
    await page.goto(sitePath('/articles'))

    const staticPreview = page.locator('[data-static-preview="true"]')
    const articleLinks = staticPreview.locator('.ssg-list-title a')

    await expect(staticPreview).toBeVisible()
    await expect(articleLinks).toHaveCount(5)
    await expect(page.locator('link[rel="stylesheet"][href$="/themes/default.css"]')).toHaveCount(1)

    await articleLinks.first().click()

    await expect(page.locator('[data-static-preview="true"] .ssg-article')).toBeVisible()
    await expect(page.locator('.ssg-article-content')).not.toBeEmpty()
  })
})

test('keeps the fallback visible while a non-prerendered route starts', async ({ page }) => {
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
  await expect(page.locator('[data-static-preview="true"]')).toBeVisible()

  releaseMainScript()
  await navigation
  await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
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

test('hydrates the article list and defers offscreen covers', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await installCoverFixture(page, COVER_FIXTURE)

  await page.goto(sitePath('/articles'))

  const cards = page.locator('.menu-page-card-list .menu-page-card-item')
  const covers = cards.locator('img')

  await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
  await expect(cards).toHaveCount(5)
  await expect(covers).toHaveCount(5)
  await expect.poll(async () => covers.evaluateAll(images => (
    images.filter(image => image.hasAttribute('src')).length
  ))).toBeLessThan(5)

  for (let index = 0; index < await covers.count(); index += 1) {
    await covers.nth(index).scrollIntoViewIfNeeded()
  }

  await expect.poll(async () => covers.evaluateAll(images => (
    images.filter(image => image.hasAttribute('src')).length
  ))).toBe(5)
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
