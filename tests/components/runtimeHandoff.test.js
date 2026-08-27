import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isRuntimeContentReady,
  prepareRuntimeHandoff,
  waitForRuntimeContent
} from '../../src/site/runtimeHandoff'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('runtime handoff', () => {
  it('keeps the static preview until runtime content is ready', async () => {
    document.body.innerHTML = '<div id="app"><div data-static-preview="true">静态内容</div></div>'
    const staticRoot = document.querySelector('#app')
    const handoff = prepareRuntimeHandoff(document)

    expect(handoff.mountTarget).not.toBe(staticRoot)
    expect(handoff.mountTarget.style.visibility).toBe('hidden')

    handoff.mountTarget.innerHTML = `
      <div class="theme-content-column">
        <div class="theme-loading-inline">正在加载文章...</div>
      </div>
    `
    expect(isRuntimeContentReady(handoff.mountTarget)).toBe(false)

    const completion = handoff.complete()
    handoff.mountTarget.querySelector('.theme-content-column').innerHTML = `
      <div class="menu-page-card-list">
        <article class="menu-page-card-item">运行时文章</article>
      </div>
    `
    await completion

    expect(document.querySelector('[data-static-preview="true"]')).toBeNull()
    expect(document.querySelector('#app .menu-page-card-item')?.textContent).toContain('运行时文章')
    expect(document.querySelector('#app')?.style.visibility).toBe('')
  })

  it('waits while a loading placeholder remains', async () => {
    document.body.innerHTML = `
      <div class="theme-content-column">
        <div class="theme-empty-state">内容加载中...</div>
      </div>
    `
    const runtimeRoot = document.body
    let resolved = false
    const waiting = waitForRuntimeContent(runtimeRoot, { quietTime: 10, timeout: 500 })
      .then(() => { resolved = true })

    await new Promise(resolve => setTimeout(resolve, 30))
    expect(resolved).toBe(false)

    runtimeRoot.querySelector('.theme-content-column').innerHTML = `
      <div class="menu-page-context">完整内容</div>
    `
    await waiting
    expect(resolved).toBe(true)
  })
})
