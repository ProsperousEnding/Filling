import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'

import { createSiteApp } from './createSiteApp'
import { resetRuntimeRandomCoverPool } from '@framework/utils/articleCover'

export async function render(url, options = {}) {
  const baseUrl = options.baseUrl || import.meta.env.BASE_URL
  resetRuntimeRandomCoverPool(options.coverPoolSeed)
  const { app, runtimeContext } = await createSiteApp({
    baseUrl,
    history: createMemoryHistory(baseUrl),
    ssr: true,
    url
  })

  const renderContext = {}
  const html = await renderToString(app, renderContext)

  return {
    html,
    modules: Array.from(renderContext.modules || []),
    prerenderState: runtimeContext.prerenderState
  }
}
