import assert from 'node:assert/strict'
import test from 'node:test'

import { scrollBlogViewport } from '../src/framework/utils/blogScroll.js'

test('blog scrolling targets the internal main viewport', () => {
  const calls = []
  const container = {
    scrollTo(options) {
      calls.push(options)
    }
  }
  const windowCalls = []

  const result = scrollBlogViewport({ top: 120, behavior: 'smooth' }, {
    document: {
      querySelector(selector) {
        return selector === '.theme-main' ? container : null
      }
    },
    window: {
      scrollTo(options) {
        windowCalls.push(options)
      }
    }
  })

  assert.equal(result, container)
  assert.deepEqual(calls, [{ top: 120, left: 0, behavior: 'smooth' }])
  assert.deepEqual(windowCalls, [])
})

test('blog scrolling falls back to the window without an internal viewport', () => {
  const calls = []

  const result = scrollBlogViewport({}, {
    document: {
      querySelector() {
        return null
      }
    },
    window: {
      scrollTo(options) {
        calls.push(options)
      }
    }
  })

  assert.equal(result, null)
  assert.deepEqual(calls, [{ top: 0, left: 0, behavior: 'auto' }])
})
