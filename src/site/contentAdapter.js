import markdownContentService from '@framework/adapters/markdown/contentService'
import {
  loadMenuPageItemDetail,
  loadMenuPageSource
} from '@framework/adapters/markdown/menuPageSourceService'

export function createSiteContentAdapter(options = {}) {
  return {
    ...markdownContentService,
    baseUrl: options.baseUrl || '/',
    getConfig: options.getConfig,
    loadMenuPageItemDetail,
    loadMenuPageSource
  }
}

export const siteContentAdapter = createSiteContentAdapter()

export default siteContentAdapter
