import { expect, test } from '@playwright/test'

import { installCoverFixture, sitePath } from './helpers.js'

const COVER_FIXTURE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#315c68" />
    <rect x="0" y="430" width="1200" height="200" fill="#d8a24a" />
    <circle cx="880" cy="210" r="132" fill="#e8e4dc" />
  </svg>
`

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Visual baselines are recorded with Chromium.')
  await page.addInitScript(() => localStorage.setItem('vue-blog-theme', 'light'))
  await installCoverFixture(page, COVER_FIXTURE)
})

test('article list visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(sitePath('/articles'))
  await expect(page.locator('[data-static-preview="true"]')).toHaveCount(0)
  await expect(page.locator('.menu-page-card-list')).toBeVisible()
  await expect(page.locator('.menu-page-card-list img').first()).toHaveJSProperty('complete', true)

  await expect(page).toHaveScreenshot('articles-light.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.03,
    threshold: 0.25
  })
})

test('article detail mobile visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('vue-blog-theme', 'dark'))
  await page.goto(sitePath('/article/config-site-and-theme'))
  await expect(page.locator('.article-detail-page-background-image')).toBeVisible()

  await expect(page).toHaveScreenshot('article-detail-mobile-dark.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.03,
    threshold: 0.25
  })
})
