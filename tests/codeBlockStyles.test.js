import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const sharedThemeUrl = new URL('../public/themes/shared.css', import.meta.url)
const frameworkStyleUrl = new URL('../src/framework/style.css', import.meta.url)

test('shared article styles leave enhanced code block backgrounds to their configured theme', async () => {
  const [sharedTheme, frameworkStyle] = await Promise.all([
    readFile(sharedThemeUrl, 'utf8'),
    readFile(frameworkStyleUrl, 'utf8')
  ])

  assert.match(
    sharedTheme,
    /:where\(pre:not\(\.markdown-code-block__pre\)\)/,
    'the shared pre style must exclude enhanced code blocks'
  )
  assert.doesNotMatch(
    sharedTheme,
    /:where\(pre\)\s*\{/,
    'a broad article pre selector would override configured code block themes'
  )
  assert.match(
    frameworkStyle,
    /\.markdown-code-block__pre\s*\{[^}]*background:\s*transparent\s*!important;/s,
    'the enhanced pre element must reveal its theme-owned wrapper background'
  )
})
