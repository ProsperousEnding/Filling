import { expect, test } from '@playwright/test'
import { installCoverFixture, sitePath } from './helpers.js'

const ARTICLE_PATH = sitePath('/article/config-site-and-theme')
const COVER_SELECTOR = '.article-detail-page-background-image'
const COVER_FIXTURE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#172554" />
    <rect x="600" width="600" height="630" fill="#be123c" />
  </svg>
`

async function openArticleWithCoverFixture(page) {
  const getCoverRequestCount = await installCoverFixture(page, COVER_FIXTURE)

  await page.goto(ARTICLE_PATH)
  await expect(page.locator(COVER_SELECTOR)).toBeVisible()

  return getCoverRequestCount
}

test('article page keeps one proportional cover across theme changes', async ({ page }) => {
  const getCoverRequestCount = await openArticleWithCoverFixture(page)
  const cover = page.locator(COVER_SELECTOR)
  const initialSource = await cover.getAttribute('src')
  const initialTheme = await page.locator('html').getAttribute('data-theme')

  await expect(cover).toHaveCount(1)
  await expect(page.locator('.article-detail-cover-probe')).toHaveCount(0)
  await expect(cover).toHaveCSS('object-fit', 'cover')
  const coverDimensions = await cover.evaluate(image => ({
    height: image.naturalHeight,
    width: image.naturalWidth
  }))
  expect(coverDimensions.width).toBeGreaterThan(0)
  expect(coverDimensions.height).toBeGreaterThan(0)
  expect(coverDimensions.width / coverDimensions.height).toBeCloseTo(1200 / 630, 2)
  expect(initialSource).toMatch(/^https:\/\/tc\.alcy\.cc\/tc\//u)
  expect(getCoverRequestCount()).toBe(1)

  await page.getByRole('button', { name: '切换主题' }).click()
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).not.toBe(initialTheme)
  await expect(cover).toHaveAttribute('src', initialSource)
  expect(getCoverRequestCount()).toBe(1)
})

test('article tables remain readable over a page cover', async ({ page }) => {
  await openArticleWithCoverFixture(page)

  const table = page.locator('.article-detail-content table').first()
  const header = table.locator('th').first()
  const cell = table.locator('td').first()
  const inlineCode = table.locator('code').first()

  if (await page.locator('html').getAttribute('data-theme') === 'dark') {
    await page.getByRole('button', { name: '切换主题' }).click()
  }

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(table).toHaveCSS('background-color', 'rgba(248, 250, 252, 0.88)')
  await expect(header).toHaveCSS('background-color', 'rgba(226, 232, 240, 0.92)')
  await expect(header).toHaveCSS('color', 'rgb(15, 23, 42)')
  await expect(cell).toHaveCSS('text-shadow', 'none')
  await expect(inlineCode).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(inlineCode).toHaveCSS('border-top-style', 'none')
  expect(await inlineCode.evaluate(el => ({
    before: getComputedStyle(el, '::before').content,
    after: getComputedStyle(el, '::after').content
  }))).toEqual({ before: 'none', after: 'none' })

  await page.getByRole('button', { name: '切换主题' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(table).toHaveCSS('background-color', 'rgba(15, 23, 42, 0.68)')
  await expect(header).toHaveCSS('background-color', 'rgba(30, 41, 59, 0.88)')
  await expect(header).toHaveCSS('color', 'rgb(255, 255, 255)')
  await expect(inlineCode).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

test('article page has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openArticleWithCoverFixture(page)

  await expect(page.locator(COVER_SELECTOR)).toHaveCSS('object-fit', 'cover')
  await expect.poll(async () => page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }))).toEqual({
    documentWidth: 390,
    viewportWidth: 390
  })
})

test('article cover loads directly from the configured pool without an image proxy', async ({ page }) => {
  let proxyRequestCount = 0
  await page.route('**/image/cover**', route => {
    proxyRequestCount += 1
    return route.fulfill({ status: 404 })
  })
  await page.route('https://tc.alcy.cc/**', route => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: COVER_FIXTURE
  }))

  await page.goto(ARTICLE_PATH)

  const cover = page.locator(COVER_SELECTOR)
  await expect(cover).toBeVisible()
  await expect(cover).toHaveAttribute('src', /^https:\/\/tc\.alcy\.cc\/tc\//u)
  await expect(cover).toHaveJSProperty('complete', true)
  expect(proxyRequestCount).toBe(0)
})
