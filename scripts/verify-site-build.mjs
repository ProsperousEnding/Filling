import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const distDir = path.join(rootDir, 'dist')
const indexHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')

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

console.log('Static site routes, metadata, and deployment files verified.')
