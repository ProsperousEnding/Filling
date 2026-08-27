import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveThemePresetAssetPath } from '../src/framework/utils/themeAsset.js'

test('theme assets follow the configured preset instead of assuming default', () => {
  const theme = {
    current_preset: 'ocean',
    presets: {
      default: {
        css_file: 'themes/default.css'
      },
      ocean: {
        css_file: 'themes/ocean.css',
        js_file: 'themes/ocean.js'
      }
    }
  }

  assert.equal(resolveThemePresetAssetPath(theme, 'css'), 'themes/ocean.css')
  assert.equal(resolveThemePresetAssetPath(theme, 'js'), 'themes/ocean.js')
})

test('theme assets reject external preset URLs', () => {
  assert.equal(resolveThemePresetAssetPath({
    current_preset: 'remote',
    presets: {
      remote: {
        css_file: 'https://example.com/theme.css'
      }
    }
  }), '')
})
