import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'

import {
  getMenuItemTargetProps,
  resolveMenuItemTag
} from '../../src/framework/views/pageComponents/menuPageItemPresentation.js'

describe('menu page item links', () => {
  it('uses RouterLink for internal targets without an overriding href', () => {
    expect(resolveMenuItemTag({ to: { name: 'ArticleDetail', params: { id: 'demo' } } })).toBe(RouterLink)
    expect(resolveMenuItemTag({ href: 'https://example.com' })).toBe('a')
    expect(resolveMenuItemTag({})).toBe('article')
    expect(getMenuItemTargetProps({ to: '/article/demo/' })).toEqual({ to: '/article/demo/' })
    expect(getMenuItemTargetProps({ href: 'https://example.com' })).toEqual({ href: 'https://example.com' })
  })
})
