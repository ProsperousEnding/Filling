import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import siteConfig from '../src/framework/generated/siteConfig.generated.js'
import { resolveThemePresetAssetPath } from '../src/framework/utils/themeAsset.js'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const distDir = path.join(rootDir, 'dist')
const indexHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
const configuredThemeCssFile = resolveThemePresetAssetPath(siteConfig.theme, 'css')
const themeStylesheetMatch = indexHtml.match(/<link id="vue-blog-theme-css" rel="stylesheet" href="([^"]+)" \/>/u)

if (configuredThemeCssFile) {
  assert.ok(themeStylesheetMatch, 'Site index must preload the configured theme stylesheet.')
  assert.equal(
    themeStylesheetMatch[1].endsWith(`/${configuredThemeCssFile}`),
    true,
    `Site index theme stylesheet must match ${configuredThemeCssFile}.`
  )
} else {
  assert.equal(themeStylesheetMatch, null, 'Site index must not inject an unconfigured theme stylesheet.')
}

for (const expectedText of [
  '<link rel="canonical"',
  '<meta property="og:title"',
  '<meta name="twitter:card"',
  '<script type="module"',
  '<link rel="stylesheet"'
]) {
  assert.equal(indexHtml.includes(expectedText), true, `Site index is missing: ${expectedText}`)
}

for (const requiredFile of [
  '404.html',
  'robots.txt',
  'rss.xml',
  'sitemap.xml',
  '.nojekyll',
  path.join('admin', 'config', 'index.html'),
  path.join('articles', 'index.html'),
  path.join('guestbook', 'index.html')
]) {
  await access(path.join(distDir, requiredFile))
}

const adminHtml = await readFile(path.join(distDir, 'admin', 'config', 'index.html'), 'utf8')
assert.equal(adminHtml.includes('<meta name="robots" content="noindex,nofollow"'), true)

const articleDirectory = path.join(distDir, 'article')
const articleSlugs = await readdir(articleDirectory)
assert.ok(articleSlugs.length > 0, 'Site build did not generate article routes.')

const articleHtml = await readFile(
  path.join(articleDirectory, articleSlugs[0], 'index.html'),
  'utf8'
)
assert.equal(articleHtml.includes('<meta property="og:type" content="article"'), true)
assert.equal(articleHtml.includes('<link rel="canonical"'), true)
assert.equal(articleHtml.includes('data-vue-prerendered="true"'), true)
assert.equal(articleHtml.includes('data-static-preview="true"'), false)
assert.equal(articleHtml.includes('class="article-detail-shell'), true)
assert.equal(/<div id="app">\s*<\/div>/u.test(articleHtml), false)

const articlesHtml = await readFile(path.join(distDir, 'articles', 'index.html'), 'utf8')
assert.equal(articlesHtml.includes('data-vue-prerendered="true"'), true)
assert.equal(articlesHtml.includes('article-card-shell'), true)
assert.equal(articlesHtml.includes('/article/'), true)
assert.match(
  articlesHtml,
  /href="[^"]*\/article\/[^"]+\/"/u,
  'Static article links must target their generated index.html directories.'
)

assert.equal(indexHtml.includes('data-vue-prerendered="true"'), true)
assert.equal(indexHtml.includes('data-static-preview="true"'), false)
assert.equal(indexHtml.includes('class="menu-page-list"'), true)
assert.equal(indexHtml.includes('class="sidebar-container sidebar-container-desktop"'), true)
assert.match(indexHtml, /<a href="\/article\/[^"]+" class="menu-page-list-item/u)
assert.match(indexHtml, /<img[^>]+src="https:\/\//u)

const notFoundHtml = await readFile(path.join(distDir, '404.html'), 'utf8')
assert.equal(notFoundHtml.includes('页面未找到'), true)
assert.equal(notFoundHtml.includes('data-vue-prerendered="true"'), true)
assert.equal(notFoundHtml.includes('data-static-preview="true"'), false)

console.log('Static site routes, metadata, and deployment files verified.')
