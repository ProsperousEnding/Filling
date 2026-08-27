import '@framework/style.css'

import { createSiteApp } from './createSiteApp'
import { prepareRuntimeHandoff } from './runtimeHandoff'

async function bootstrap() {
  const prerenderedRoot = document.querySelector('#app[data-vue-prerendered="true"]')
  const runtimeHandoff = prerenderedRoot ? null : prepareRuntimeHandoff()

  try {
    const { app } = await createSiteApp({
      hydrate: Boolean(prerenderedRoot)
    })

    app.mount(prerenderedRoot || runtimeHandoff.mountTarget)

    if (prerenderedRoot) {
      prerenderedRoot.removeAttribute('data-vue-prerendered')
    } else {
      await runtimeHandoff.complete()
    }
  } catch (error) {
    runtimeHandoff?.abort()
    throw error
  }
}

bootstrap().catch(error => console.error(error))
