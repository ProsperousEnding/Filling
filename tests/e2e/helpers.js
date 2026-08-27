const rawBasePath = String(process.env.PLAYWRIGHT_BASE_PATH || '/').trim()
const normalizedBasePath = rawBasePath === '/'
  ? '/'
  : `/${rawBasePath.replace(/^\/+|\/+$/gu, '')}/`

export function sitePath(path = '/') {
  const normalizedPath = String(path || '/').replace(/^\/+|\/+$/gu, '')

  if (!normalizedPath) {
    return normalizedBasePath
  }

  return `${normalizedBasePath}${normalizedPath}/`.replace(/\/{2,}/gu, '/')
}

export async function installCoverFixture(page, fixture) {
  let requestCount = 0
  const fulfillCover = async (route) => {
    requestCount += 1
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: fixture
    })
  }

  await page.route('**/image/cover**', fulfillCover)
  await page.route('https://t.alcy.cc/**', fulfillCover)
  await page.route('https://tc.alcy.cc/**', fulfillCover)

  return () => requestCount
}
