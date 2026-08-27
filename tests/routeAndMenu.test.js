import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOG_PATH_PATTERNS,
  getArticlePath,
  normalizeBlogRoutePatterns
} from '../src/framework/router/routeManifest.js'
import {
  menuPageUsesExternalSource,
  menuPageUsesFileSource,
  menuPageUsesFolderSource
} from '../src/framework/utils/menuPageSource.js'
import {
  getMenuConfigDiagnostics,
  normalizeMenuConfig,
  resolveHeaderMenuGroups,
  resolveMenuPageRegistry,
  resolveMenuPages,
  resolveMobileHeaderMenuGroups
} from '../src/framework/utils/menuConfig.js'
import {
  getSidebarLayoutDiagnostics,
  getSidebarMenuLayoutDiagnostics,
  resolveSidebarComponents
} from '../src/framework/utils/sidebarLayout.js'
import {
  DESKTOP_SIDEBAR_MIN_WIDTH,
  usesSidebarDrawer
} from '../src/framework/utils/sidebarViewport.js'
import {
  resolveFeatureMenuConfig,
  resolveSponsorDisplayTargets
} from '../src/framework/utils/featurePageConfig.js'

test('feature configs register their pages without duplicate site menu entries', () => {
  const menus = resolveFeatureMenuConfig({
    pages: [
      { key: 'about', title: 'About', component: 'context', content: 'About' }
    ]
  }, {
    guestbook: { enabled: true },
    sponsor: { enabled: true, show: ['articles', 'page'] }
  })
  const pages = resolveMenuPages(menus)

  assert.equal(pages.some(page => page.key === 'guestbook' && page.component === 'guestbook'), true)
  assert.equal(pages.some(page => page.key === 'sponsor' && page.component === 'sponsor'), true)
})

test('legacy feature page entries stay authoritative', () => {
  const menus = resolveFeatureMenuConfig({
    pages: [
      { key: 'guestbook', title: 'Messages', component: 'guestbook', visible: false }
    ]
  }, {
    guestbook: { enabled: true }
  })

  assert.equal(menus.pages.length, 1)
  assert.equal(menus.pages[0].title, 'Messages')
  assert.equal(menus.pages[0].visible, false)
})

test('sponsor display targets support the simple and legacy forms', () => {
  assert.deepEqual(resolveSponsorDisplayTargets({ show: ['article', 'page', 'unknown'] }), [
    'articles',
    'page'
  ])
  assert.deepEqual(resolveSponsorDisplayTargets({
    show_on_articles: false,
    page_enabled: true
  }), ['page'])
})

test('route patterns preserve required parameters', () => {
  const patterns = normalizeBlogRoutePatterns({
    article: '/posts/:id',
    category_page: '/topics/:id/p/:page',
    tag_page: '/invalid-without-params'
  })

  assert.equal(patterns.articleDetail, '/posts/:id')
  assert.equal(patterns.categoryPage, '/topics/:id/p/:page')
  assert.equal(patterns.tagPage, BLOG_PATH_PATTERNS.tagPage)
  assert.equal(getArticlePath('hello world', patterns), '/posts/hello%20world')
})

test('menu source detection keeps built-in and configured pages separate', () => {
  const contextPage = { builtIn: false, file: 'about.md' }
  const collectionPage = { builtIn: false, folder: 'projects' }
  const builtInPage = { builtIn: true, folder: 'articles' }

  assert.equal(menuPageUsesFileSource(contextPage, 'context'), true)
  assert.equal(menuPageUsesFolderSource(collectionPage, 'grid'), true)
  assert.equal(menuPageUsesExternalSource(collectionPage, 'grid'), true)
  assert.equal(menuPageUsesExternalSource(builtInPage, 'grid'), false)
})

test('menu pages keep route availability separate from navigation visibility', () => {
  const menuConfig = {
    pages: [
      { key: 'about', title: 'About', component: 'context' },
      { key: 'private', title: 'Private', component: 'context', visible: false },
      { key: 'disabled', title: 'Disabled', component: 'context', enabled: false }
    ]
  }
  const pages = resolveMenuPages(menuConfig)
  const pageRegistry = resolveMenuPageRegistry(menuConfig)
  const context = { pageRegistry }
  const desktopItems = resolveHeaderMenuGroups(menuConfig, context)[0].rendererProps.items
  const mobileItems = resolveMobileHeaderMenuGroups(menuConfig, context)[0].rendererProps.items

  assert.equal(pages.some(page => page.key === 'private'), true)
  assert.equal(pages.some(page => page.key === 'disabled'), false)
  const desktopPageKeys = desktopItems.flatMap(item => (
    item.children.length > 0 ? item.children.map(child => child.key) : [item.key]
  ))

  assert.equal(desktopPageKeys.includes('private'), false)
  assert.deepEqual(
    desktopPageKeys,
    mobileItems.map(item => item.key)
  )
})

test('registered pages automatically reach desktop overflow and the flat mobile menu', () => {
  const menuConfig = {
    pages: [
      { key: 'about', title: 'About', component: 'context', content: 'About page' },
      { key: 'friends', title: 'Friends', component: 'friends' }
    ]
  }
  const pageRegistry = resolveMenuPageRegistry(menuConfig)
  const desktopItems = resolveHeaderMenuGroups(menuConfig, { pageRegistry })[0].rendererProps.items
  const mobileItems = resolveMobileHeaderMenuGroups(menuConfig, { pageRegistry })[0].rendererProps.items

  assert.deepEqual(
    desktopItems.slice(0, 5).map(item => item.key),
    ['home', 'articles', 'categories', 'tags', 'archive']
  )
  assert.deepEqual(desktopItems[5].children.map(item => item.key), ['about', 'friends'])
  assert.equal(mobileItems.some(item => item.key === 'about'), true)
  assert.equal(mobileItems.some(item => item.key === 'friends'), true)
  assert.deepEqual(getMenuConfigDiagnostics(menuConfig), [])
})

test('guided navigation links join automatic desktop and mobile menus', () => {
  const menuConfig = {
    links: [{
      key: 'github',
      label: 'GitHub',
      target: 'https://github.com/example',
      menu_group: 'more'
    }]
  }
  const desktopItems = resolveHeaderMenuGroups(menuConfig)[0].rendererProps.items
  const mobileItems = resolveMobileHeaderMenuGroups(menuConfig)[0].rendererProps.items
  const desktopLink = desktopItems.at(-1).children.find(item => item.key === 'github')
  const mobileLink = mobileItems.find(item => item.key === 'github')

  assert.equal(desktopLink.href, 'https://github.com/example')
  assert.equal(desktopLink.external, true)
  assert.equal(mobileLink.href, 'https://github.com/example')
  assert.deepEqual(getMenuConfigDiagnostics(menuConfig), [])
})

test('guided navigation links cannot reuse built-in page keys', () => {
  const diagnostics = getMenuConfigDiagnostics({
    links: [{ key: 'home', label: 'Homepage', target: 'https://example.com' }]
  })

  assert.equal(diagnostics.some(diagnostic => (
    diagnostic.code === 'duplicate-menu-link-key'
    && diagnostic.path === 'menus.links[0].key'
  )), true)
})

test('primary menu metadata can promote and order a custom page', () => {
  const menuConfig = {
    pages: [
      {
        key: 'projects',
        title: 'Projects',
        component: 'grid',
        items: [{ title: 'Demo' }],
        menu_group: 'primary',
        menu_order: 15
      },
      { key: 'about', title: 'About', component: 'context', content: 'About page' }
    ]
  }
  const pageRegistry = resolveMenuPageRegistry(menuConfig)
  const desktopItems = resolveHeaderMenuGroups(menuConfig, { pageRegistry })[0].rendererProps.items
  const mobileItems = resolveMobileHeaderMenuGroups(menuConfig, { pageRegistry })[0].rendererProps.items

  assert.deepEqual(
    desktopItems.slice(0, 5).map(item => item.key),
    ['home', 'projects', 'articles', 'categories', 'tags']
  )
  assert.deepEqual(desktopItems[5].children.map(item => item.key), ['archive', 'about'])
  assert.deepEqual(
    mobileItems.slice(0, 3).map(item => item.key),
    ['home', 'projects', 'articles']
  )
})

test('custom page routes cannot overlap built-in or collection detail routes', () => {
  const menuConfig = {
    pages: [
      {
        key: 'article-demo',
        title: 'Article demo',
        path: '/article/demo',
        component: 'context',
        content: 'Demo'
      },
      {
        key: 'article-collection',
        title: 'Article collection',
        path: '/article',
        component: 'grid',
        folder: 'article-collection'
      },
      {
        key: 'projects',
        title: 'Projects',
        path: '/projects',
        component: 'grid',
        folder: 'projects'
      },
      {
        key: 'project-demo',
        title: 'Project demo',
        path: '/projects/demo',
        component: 'context',
        content: 'Demo'
      }
    ]
  }
  const diagnostics = getMenuConfigDiagnostics(menuConfig)
  const routeConflicts = diagnostics.filter(diagnostic => (
    diagnostic.code === 'conflicting-menu-page-route'
  ))
  const resolvedPageKeys = new Set(resolveMenuPages(menuConfig).map(page => page.key))

  assert.equal(routeConflicts.length, 3)
  assert.equal(resolvedPageKeys.has('article-demo'), false)
  assert.equal(resolvedPageKeys.has('article-collection'), false)
  assert.equal(resolvedPageKeys.has('projects'), true)
  assert.equal(resolvedPageKeys.has('project-demo'), false)
})

test('route conflicts include optional and repeatable dynamic parameters', () => {
  const optionalDiagnostics = getMenuConfigDiagnostics({
    pages: [
      {
        key: 'article-root',
        title: 'Article root',
        path: '/article',
        component: 'context',
        content: 'Article root'
      }
    ]
  }, {
    articleDetail: '/article/:id?'
  })
  const repeatableDiagnostics = getMenuConfigDiagnostics({
    pages: [
      {
        key: 'docs-guide',
        title: 'Docs guide',
        path: '/docs/guide/start',
        component: 'context',
        content: 'Guide'
      }
    ]
  }, {
    articleDetail: '/docs/:id(.*)*'
  })

  assert.equal(
    optionalDiagnostics.some(diagnostic => diagnostic.code === 'conflicting-menu-page-route'),
    true
  )
  assert.equal(
    repeatableDiagnostics.some(diagnostic => diagnostic.code === 'conflicting-menu-page-route'),
    true
  )
})

test('menu page keys and static paths reject unsafe values', () => {
  const diagnostics = getMenuConfigDiagnostics({
    pages: [
      { key: 'My Page', title: 'Bad key', component: 'context', content: 'Bad key' },
      { key: 'traversal', title: 'Traversal', path: '/../outside', component: 'context', content: 'Bad path' },
      { key: 'encoded', title: 'Encoded', path: '/%2e%2e/outside', component: 'context', content: 'Bad path' },
      { key: 'query', title: 'Query', path: '/docs?mode=full', component: 'context', content: 'Bad path' },
      { title: 'Missing key', component: 'context', content: 'Missing key' }
    ]
  })
  const diagnosticCodes = diagnostics.map(diagnostic => diagnostic.code)

  assert.equal(diagnosticCodes.includes('invalid-menu-page-key'), true)
  assert.equal(diagnosticCodes.filter(code => code === 'invalid-menu-page-path').length, 3)
  assert.equal(diagnosticCodes.includes('missing-menu-page-key'), true)
})

test('automatic header menus reject more pinned pages than their primary limit', () => {
  const menuConfig = {
    pages: Array.from({ length: 6 }, (_, index) => ({
      key: `pinned-${index + 1}`,
      title: `Pinned ${index + 1}`,
      component: 'context',
      content: 'Pinned page',
      menu_group: 'primary',
      menu_order: index + 1
    }))
  }
  const diagnostics = getMenuConfigDiagnostics(menuConfig)

  assert.equal(
    diagnostics.some(diagnostic => diagnostic.code === 'too-many-primary-menu-pages'),
    true
  )
})

test('primary limit works independently of the desktop renderer name', () => {
  const menuConfig = {
    header: [
      {
        key: 'compact',
        renderer: 'header-stack',
        source: 'blog-nav',
        primary_limit: 2,
        items: []
      }
    ],
    pages: [
      { key: 'about', title: 'About', component: 'context', content: 'About page' }
    ]
  }
  const pageRegistry = resolveMenuPageRegistry(menuConfig)
  const desktopItems = resolveHeaderMenuGroups(menuConfig, { pageRegistry })[0].rendererProps.items

  assert.deepEqual(desktopItems.slice(0, 2).map(item => item.key), ['home', 'articles'])
  assert.deepEqual(
    desktopItems[2].children.map(item => item.key),
    ['categories', 'tags', 'archive', 'about']
  )
})

test('explicit menu trees reject duplicate sibling keys and unsupported depth', () => {
  const diagnostics = getMenuConfigDiagnostics({
    header: [
      {
        key: 'main',
        renderer: 'header-pill',
        source: 'blog-nav',
        items: [
          {
            key: 'group',
            label: 'Group',
            children: [
              {
                key: 'same',
                label: 'One',
                to: '/one',
                children: [
                  { key: 'deep', label: 'Deep', to: '/deep' }
                ]
              },
              { key: 'same', label: 'Two', to: '/two' }
            ]
          }
        ]
      }
    ]
  })
  const diagnosticCodes = diagnostics.map(diagnostic => diagnostic.code)

  assert.equal(diagnosticCodes.includes('duplicate-menu-item-key'), true)
  assert.equal(diagnosticCodes.includes('menu-item-depth-exceeded'), true)
})

test('menu diagnostics report conflicts and unresolved registrations', () => {
  const diagnostics = getMenuConfigDiagnostics({
    header: [
      {
        key: 'primary',
        renderer: 'missing-renderer',
        source: 'missing-source',
        items: []
      },
      {
        key: 'primary',
        renderer: 'header-pill',
        source: 'blog-nav',
        items: ['missing-page']
      }
    ],
    pages: [
      { key: 'about', title: 'About', path: '/shared' },
      { key: 'docs', title: 'Docs', path: '/shared' },
      {
        key: 'broken',
        title: 'Broken',
        component: 'gird',
        menu_group: 'elsewhere',
        menu_order: 0
      },
      { key: 'duplicate', title: 'Duplicate' },
      { key: 'duplicate', title: 'Duplicate again' }
    ]
  })
  const diagnosticCodes = new Set(diagnostics.map(diagnostic => diagnostic.code))

  assert.equal(diagnosticCodes.has('duplicate-menu-page-key'), true)
  assert.equal(diagnosticCodes.has('duplicate-menu-page-path'), true)
  assert.equal(diagnosticCodes.has('duplicate-menu-entry-key'), true)
  assert.equal(diagnosticCodes.has('unknown-menu-source'), true)
  assert.equal(diagnosticCodes.has('unknown-menu-renderer'), true)
  assert.equal(diagnosticCodes.has('unknown-menu-page'), true)
  assert.equal(diagnosticCodes.has('unreferenced-visible-page'), true)
  assert.equal(diagnosticCodes.has('unknown-menu-page-component'), true)
  assert.equal(diagnosticCodes.has('unknown-menu-group'), true)
  assert.equal(diagnosticCodes.has('invalid-menu-order'), true)
  assert.equal(diagnosticCodes.has('missing-menu-page-file'), true)
})

test('sidebar diagnostics expose invalid and unreachable menu components', () => {
  const layoutDiagnostics = getSidebarLayoutDiagnostics({
    desktop_components: ['categories', 'categories', 'latest_articles']
  })
  const menuConfig = normalizeMenuConfig({
    sidebar: [
      {
        key: 'friends',
        title: 'Friends',
        renderer: 'sidebar-link',
        source: 'friend-links'
      }
    ]
  })
  const reachabilityDiagnostics = getSidebarMenuLayoutDiagnostics({
    desktop_components: ['categories'],
    mobile_components: ['categories']
  }, menuConfig)

  assert.equal(layoutDiagnostics.some(item => item.code === 'duplicate-sidebar-component'), true)
  assert.equal(layoutDiagnostics.some(item => item.code === 'unknown-sidebar-component'), true)
  assert.equal(reachabilityDiagnostics.some(item => item.code === 'unreachable-sidebar-menu'), true)
})

test('sidebar switches from drawer to desktop at the large breakpoint', () => {
  assert.equal(DESKTOP_SIDEBAR_MIN_WIDTH, 1024)
  assert.equal(usesSidebarDrawer(767), true)
  assert.equal(usesSidebarDrawer(900), true)
  assert.equal(usesSidebarDrawer(1023), true)
  assert.equal(usesSidebarDrawer(1024), false)
  assert.equal(usesSidebarDrawer(1440), false)
})

test('default sidebar order prioritizes recent content before taxonomy', () => {
  assert.deepEqual(resolveSidebarComponents({}), [
    'profile',
    'announcement',
    'latest-articles',
    'categories',
    'tags'
  ])
  assert.deepEqual(resolveSidebarComponents({}, { mobile: true }), [
    'profile',
    'latest-articles',
    'categories',
    'tags'
  ])
  assert.deepEqual(resolveSidebarComponents({}, { mobile: true, article: true }), [
    'profile',
    'announcement',
    'latest-articles',
    'categories',
    'tags'
  ])
  assert.deepEqual(resolveSidebarComponents({
    mobile_components: ['profile', 'tags']
  }, { mobile: true, article: true }), ['profile', 'tags'])
})

test('sidebar entries inherit defaults by key or source after reordering', () => {
  const menuConfig = normalizeMenuConfig({
    sidebar: [
      { key: 'tags', renderer: 'sidebar-link', source: 'tags' },
      { key: 'latest', renderer: 'sidebar-article', source: 'latest-articles' },
      { key: 'categories', renderer: 'sidebar-link', source: 'categories' }
    ]
  })

  assert.deepEqual(menuConfig.sidebar.map(entry => entry.limit), [12, 5, 8])
})
