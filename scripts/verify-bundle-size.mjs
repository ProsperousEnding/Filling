import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const projectRoot = path.resolve(import.meta.dirname, '..')
const distDirectory = path.join(projectRoot, 'dist')
const budgets = Object.freeze({
  initialCssGzip: 28 * 1024,
  initialJsGzip: 110 * 1024
})

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveAssetPath(assetUrl) {
  const pathname = decodeURIComponent(new URL(assetUrl, 'https://build.local').pathname)
  const candidates = [pathname.replace(/^\/+/, '')]

  for (const marker of ['/assets/', '/themes/']) {
    const markerIndex = pathname.indexOf(marker)

    if (markerIndex >= 0) {
      candidates.push(pathname.slice(markerIndex + 1))
    }
  }

  for (const relativePath of new Set(candidates)) {
    const assetPath = path.resolve(distDirectory, relativePath)
    const relativeAssetPath = path.relative(distDirectory, assetPath)

    if (
      relativeAssetPath
      && !relativeAssetPath.startsWith('..')
      && !path.isAbsolute(relativeAssetPath)
      && await pathExists(assetPath)
    ) {
      return assetPath
    }
  }

  throw new Error(`Cannot resolve built asset URL: ${assetUrl}`)
}

async function measureGzip(assetPath) {
  const source = await readFile(assetPath)
  return {
    assetPath: path.relative(projectRoot, assetPath),
    bytes: gzipSync(source).byteLength
  }
}

function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`
}

async function collectStylesheetPaths(stylesheetUrls) {
  const pendingPaths = await Promise.all(stylesheetUrls.map(resolveAssetPath))
  const resolvedPaths = new Set()

  while (pendingPaths.length > 0) {
    const stylesheetPath = pendingPaths.pop()

    if (resolvedPaths.has(stylesheetPath)) continue
    resolvedPaths.add(stylesheetPath)

    const source = await readFile(stylesheetPath, 'utf8')
    const importUrls = Array.from(source.matchAll(
      /@import\s+(?:url\()?\s*['"]([^'"]+)['"]\s*\)?[^;]*;/gu
    ), match => match[1])

    for (const importUrl of importUrls) {
      if (/^(?:data:|https?:|\/\/)/iu.test(importUrl)) continue

      const importPath = path.resolve(path.dirname(stylesheetPath), importUrl)
      const relativeImportPath = path.relative(distDirectory, importPath)

      if (
        relativeImportPath
        && !relativeImportPath.startsWith('..')
        && !path.isAbsolute(relativeImportPath)
        && await pathExists(importPath)
      ) {
        pendingPaths.push(importPath)
      }
    }
  }

  return [...resolvedPaths]
}

async function measureAssets(assetPaths) {
  const measurements = await Promise.all([...new Set(assetPaths)].map(measureGzip))

  return {
    assets: measurements,
    bytes: measurements.reduce((total, measurement) => total + measurement.bytes, 0)
  }
}

function assertBudget(label, measurement, budget) {
  const assetSummary = measurement.assets
    .map(asset => `${asset.assetPath} (${formatKilobytes(asset.bytes)})`)
    .join(', ')

  if (measurement.bytes > budget) {
    throw new Error(
      `${label} is ${formatKilobytes(measurement.bytes)}; budget is ${formatKilobytes(budget)}. Assets: ${assetSummary}`
    )
  }

  console.log(`${label}: ${formatKilobytes(measurement.bytes)} / ${formatKilobytes(budget)}`)
  console.log(`  ${assetSummary}`)
}

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8')
const initialScriptUrls = Array.from(indexHtml.matchAll(
  /<(?:script[^>]+type="module"[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="([^"]+)"/gu
), match => match[1])
const initialStylesheetUrls = Array.from(indexHtml.matchAll(
  /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gu
), match => match[1])

if (initialScriptUrls.length === 0 || initialStylesheetUrls.length === 0) {
  throw new Error('Built index.html does not expose initial script and stylesheet assets.')
}

const [initialJsPaths, initialCssPaths] = await Promise.all([
  Promise.all(initialScriptUrls.map(resolveAssetPath)),
  collectStylesheetPaths(initialStylesheetUrls)
])
const [initialJs, initialCss] = await Promise.all([
  measureAssets(initialJsPaths),
  measureAssets(initialCssPaths)
])

assertBudget('Initial JavaScript gzip', initialJs, budgets.initialJsGzip)
assertBudget('Initial stylesheet gzip', initialCss, budgets.initialCssGzip)
