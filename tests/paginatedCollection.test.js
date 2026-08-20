import assert from 'node:assert/strict'
import test from 'node:test'

import { createSSRApp, nextTick, reactive } from 'vue'
import { routeLocationKey, routerKey } from 'vue-router'

import { usePaginatedCollection } from '../src/framework/composables/usePaginatedCollection.js'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

function createCollection(fetchPage) {
  const route = reactive({
    path: '/',
    fullPath: '/',
    params: {},
    query: {}
  })
  const router = {
    resolve: location => ({ fullPath: location.path || '/' }),
    push: async () => {},
    replace: async () => {}
  }
  const app = createSSRApp({})
  app.provide(routeLocationKey, route)
  app.provide(routerKey, router)

  return app.runWithContext(() => usePaginatedCollection({ fetchPage }))
}

async function flushPromises() {
  await new Promise(resolve => setImmediate(resolve))
  await nextTick()
}

test('async collections expose an initial loading state before data is ready', async () => {
  const deferred = createDeferred()
  const collection = createCollection(() => deferred.promise)

  assert.equal(collection.status.value, 'loading')
  assert.equal(collection.loading.value, true)
  assert.equal(collection.ready.value, false)

  deferred.resolve({ data: [{ id: 'first' }], total: 1 })
  await flushPromises()

  assert.equal(collection.status.value, 'success')
  assert.equal(collection.ready.value, true)
  assert.deepEqual(collection.items.value, [{ id: 'first' }])
})

test('failed refreshes preserve successfully loaded data and expose the error', async () => {
  let shouldFail = false
  const collection = createCollection(() => (
    shouldFail
      ? Promise.reject(new Error('network unavailable'))
      : Promise.resolve({ data: [{ id: 'cached' }], total: 1 })
  ))

  await flushPromises()
  shouldFail = true
  await assert.rejects(collection.refresh(), /network unavailable/)

  assert.equal(collection.status.value, 'error')
  assert.equal(collection.ready.value, true)
  assert.deepEqual(collection.items.value, [{ id: 'cached' }])
})
