import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const projectRoot = path.resolve(import.meta.dirname, '..')
const distDirectory = path.join(projectRoot, 'dist')
const budgets = Object.freeze({
  mainCssGzip: 25 * 1024,
  mainJsGzip: 110 * 1024
})

function resolveAssetPath(assetUrl) {
  const marker = '/assets/'
  const markerIndex = assetUrl.indexOf(marker)

  if (markerIndex < 0) {
    throw new Error(`Cannot resolve built asset URL: ${assetUrl}`)
  }

  return path.join(distDirectory, assetUrl.slice(markerIndex + 1))
}

async function measureGzip(assetUrl) {
  const assetPath = resolveAssetPath(assetUrl)
  const source = await readFile(assetPath)
  return {
    assetPath: path.relative(projectRoot, assetPath),
    bytes: gzipSync(source).byteLength
  }
}

function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`
}

function assertBudget(label, measurement, budget) {
  if (measurement.bytes > budget) {
    throw new Error(
      `${label} ${measurement.assetPath} is ${formatKilobytes(measurement.bytes)}; budget is ${formatKilobytes(budget)}.`
    )
  }

  console.log(`${label}: ${formatKilobytes(measurement.bytes)} / ${formatKilobytes(budget)}`)
}

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8')
const mainScript = indexHtml.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/u)?.[1]
const mainStylesheet = indexHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/u)?.[1]

if (!mainScript || !mainStylesheet) {
  throw new Error('Built index.html does not expose the main script and stylesheet assets.')
}

const [mainJs, mainCss] = await Promise.all([
  measureGzip(mainScript),
  measureGzip(mainStylesheet)
])

assertBudget('Main JavaScript gzip', mainJs, budgets.mainJsGzip)
assertBudget('Main stylesheet gzip', mainCss, budgets.mainCssGzip)
