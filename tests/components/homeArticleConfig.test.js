import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'

import { useConfigStore } from '../../src/framework/stores/config.js'

describe('home article configuration', () => {
  it('keeps strict recommendation modes as the safe default', () => {
    const configStore = useConfigStore(createPinia())

    expect(configStore.homeArticleConfig).toMatchObject({
      mode: 'latest',
      fallbackToLatest: false
    })
  })

  it('normalizes TOML-style home article fields for the runtime selector', () => {
    const configStore = useConfigStore(createPinia())

    configStore.initConfig({
      site: {
        home_articles: {
          mode: 'MIXED',
          page_size: 6,
          sticky_first: false,
          fallback_to_latest: true,
          include_ids: ['intro'],
          exclude_tags: ['draft']
        }
      }
    })

    expect(configStore.homeArticleConfig).toMatchObject({
      mode: 'mixed',
      pageSize: 6,
      stickyFirst: false,
      fallbackToLatest: true,
      includeIds: ['intro'],
      excludeTags: ['draft']
    })
  })

  it('registers enabled feature pages and normalizes sponsor display targets', () => {
    const configStore = useConfigStore(createPinia())

    configStore.initConfig({
      site: {},
      guestbook: {
        enabled: true
      },
      sponsor: {
        enabled: true,
        show: ['page'],
        description: 'Support the site'
      }
    })

    expect(configStore.pageRegistry.guestbook?.component).toBe('guestbook')
    expect(configStore.pageRegistry.sponsor?.component).toBe('sponsor')
    expect(configStore.sponsorConfig.pageEnabled).toBe(true)
    expect(configStore.sponsorConfig.articleEnabled).toBe(false)
  })

  it('enables a ready comment provider when provider is selected', () => {
    const configStore = useConfigStore(createPinia())

    configStore.initConfig({
      site: {},
      comment: {
        provider: 'giscus',
        giscus: {
          repo: 'owner/repo',
          repo_id: 'repo-id',
          category: 'Announcements',
          category_id: 'category-id'
        }
      }
    })

    expect(configStore.commentConfig.enabled).toBe(true)
    expect(configStore.commentConfig.ready).toBe(true)
  })
})
