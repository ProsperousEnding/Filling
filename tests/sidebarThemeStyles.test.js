import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const sharedThemeUrl = new URL('../public/themes/shared.css', import.meta.url)
const sidebarStyleUrl = new URL('../src/framework/components/layout/Sidebar.css', import.meta.url)
const sidebarLinkMenuUrl = new URL(
  '../src/framework/components/menu/renderers/SidebarLinkMenu.vue',
  import.meta.url
)
const builtInThemeUrls = ['default', 'forest', 'ocean'].map(
  name => new URL(`../public/themes/${name}.css`, import.meta.url)
)

test('sidebar material is driven by theme tokens', async () => {
  const [sharedTheme, sidebarStyle, sidebarLinkMenu, ...builtInThemes] = await Promise.all([
    readFile(sharedThemeUrl, 'utf8'),
    readFile(sidebarStyleUrl, 'utf8'),
    readFile(sidebarLinkMenuUrl, 'utf8'),
    ...builtInThemeUrls.map(url => readFile(url, 'utf8'))
  ])

  const requiredTokens = [
    '--theme-sidebar-surface',
    '--theme-sidebar-border',
    '--theme-sidebar-highlight',
    '--theme-sidebar-contact-shadow',
    '--theme-sidebar-avatar-surface',
    '--theme-sidebar-avatar-border',
    '--theme-sidebar-tag-surface',
    '--theme-sidebar-radius',
    '--theme-sidebar-blur',
    '--theme-sidebar-saturation'
  ]

  requiredTokens.forEach(token => {
    assert.match(sharedTheme, new RegExp(`${token}:`), `${token} must have a shared default`)
  })

  assert.match(sidebarStyle, /background:\s*var\(--theme-sidebar-surface/)
  assert.match(sidebarStyle, /background:\s*var\(--theme-sidebar-avatar-surface/)
  assert.match(sidebarStyle, /border-radius:\s*var\(--theme-sidebar-radius/)
  assert.match(sidebarStyle, /blur\(var\(--theme-sidebar-blur/)
  assert.match(sidebarLinkMenu, /background:\s*var\(--theme-sidebar-tag-surface/)

  builtInThemes.forEach(theme => {
    assert.match(theme, /@import url\('\.\/shared\.css'\);/)
  })
})
