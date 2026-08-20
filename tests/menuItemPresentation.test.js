import assert from 'node:assert/strict'
import test from 'node:test'

import { RouterLink } from 'vue-router'

import {
  getMenuItemComponent,
  getMenuItemHref,
  getMenuItemTo,
  hasMenuItemTarget,
  isMenuItemActive,
  normalizeMenuItems
} from '../src/framework/utils/menuItemPresentation.js'

test('menu presentation normalizes nested items and removes empty labels', () => {
  assert.deepEqual(normalizeMenuItems([
    {
      key: 'more',
      name: 'More',
      children: [
        { path: '/about', label: 'About' },
        { path: '/hidden' }
      ]
    },
    { path: '/missing-label' }
  ]), [
    {
      key: 'more',
      label: 'More',
      to: '',
      href: '',
      external: false,
      matchPath: '',
      icon: '',
      description: '',
      meta: '',
      children: [{
        key: '/about',
        label: 'About',
        to: '/about',
        href: '',
        external: false,
        matchPath: '/about',
        icon: '',
        description: '',
        meta: '',
        children: []
      }]
    }
  ])
})

test('menu presentation resolves links and target attributes consistently', () => {
  const internal = { to: '/articles', children: [] }
  const external = { href: 'https://example.com', external: true, children: [] }
  const group = { children: [{}] }

  assert.equal(hasMenuItemTarget(internal), true)
  assert.equal(getMenuItemComponent(internal), RouterLink)
  assert.equal(getMenuItemTo(internal), '/articles')
  assert.equal(getMenuItemHref(internal), undefined)

  assert.equal(getMenuItemComponent(external), 'a')
  assert.equal(getMenuItemTo(external), undefined)
  assert.equal(getMenuItemHref(external), 'https://example.com')

  assert.equal(hasMenuItemTarget(group), false)
  assert.equal(getMenuItemComponent(group), 'button')
  assert.equal(getMenuItemComponent(group, 'div'), 'div')
})

test('menu presentation marks exact, descendant, and parent items active', () => {
  const item = {
    to: '',
    children: [
      { matchPath: '/articles', to: '/articles', children: [] }
    ]
  }

  assert.equal(isMenuItemActive(item, '/articles/example'), true)
  assert.equal(isMenuItemActive(item.children[0], '/tags'), false)
  assert.equal(isMenuItemActive({ to: '/', children: [] }, '/articles'), false)
  assert.equal(isMenuItemActive({ to: '/', children: [] }, '/'), true)
})
