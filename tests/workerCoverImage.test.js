import assert from 'node:assert/strict'
import test from 'node:test'

import { getOptimizedCover } from '../worker/src/cover-image.js'

const PROXY_URL = 'https://filling-config-api.initzo.com/image/cover'

function createRequest(source, width = 800) {
  const url = new URL(PROXY_URL)
  url.searchParams.set('url', source)
  url.searchParams.set('width', String(width))
  return new Request(url, {
    headers: { Accept: 'image/avif,image/webp,image/*' }
  })
}

function createImagesBinding(options = {}) {
  const calls = {}
  const transformedResponse = options.response || new Response('optimized', {
    headers: { 'Content-Type': 'image/webp' }
  })

  return {
    calls,
    binding: {
      input(stream) {
        calls.input = stream

        if (options.error) {
          throw options.error
        }

        return {
          transform(transformOptions) {
            calls.transform = transformOptions
            return this
          },
          async output(outputOptions) {
            calls.output = outputOptions
            return {
              response() {
                return transformedResponse
              }
            }
          }
        }
      }
    }
  }
}

test('cover image route allows only known sources and fixed widths', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return new Response('unexpected')
  }

  const disallowedHost = await getOptimizedCover(
    createRequest('https://attacker.example/image.webp'),
    {},
    fetchImpl
  )
  const disallowedWidth = await getOptimizedCover(
    createRequest('https://tc.alcy.cc/tc/demo.webp', 777),
    {},
    fetchImpl
  )

  assert.equal(disallowedHost.status, 400)
  assert.equal(disallowedWidth.status, 400)
  assert.equal(fetchCalls, 0)
})

test('cover image route passes bounded transformation options to Cloudflare', async () => {
  let receivedRequest = null
  const images = createImagesBinding()
  const response = await getOptimizedCover(
    createRequest('https://tc.alcy.cc/tc/demo.webp', 800),
    { IMAGES: images.binding },
    async request => {
      receivedRequest = request
      return new Response('source', {
        headers: { 'Content-Type': 'image/jpeg' }
      })
    }
  )

  assert.equal(response.status, 200)
  assert.equal(receivedRequest.url, 'https://tc.alcy.cc/tc/demo.webp')
  assert.equal(response.headers.get('Content-Type'), 'image/webp')
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=86400, stale-while-revalidate=604800')
  assert.ok(images.calls.input instanceof ReadableStream)
  assert.deepEqual(images.calls.transform, { fit: 'scale-down', width: 800 })
  assert.deepEqual(images.calls.output, { format: 'image/webp', quality: 82 })
})

test('random MWM covers resolve a fresh source before applying a cached transformation', async () => {
  const calls = []
  const images = createImagesBinding()
  const response = await getOptimizedCover(
    createRequest('https://t.alcy.cc/pc/?seed=12', 480),
    { IMAGES: images.binding },
    async request => {
      calls.push(request)

      if (calls.length === 1) {
        return new Response(null, {
          status: 302,
          headers: { Location: 'https://tc.alcy.cc/tc/random.webp' }
        })
      }

      return new Response('source', {
        headers: { 'Content-Type': 'image/jpeg' }
      })
    }
  )

  assert.equal(response.status, 200)
  assert.equal(calls.length, 2)
  assert.equal(new URL(calls[0].url).searchParams.has('_filling'), true)
  assert.equal(calls[1].url, 'https://tc.alcy.cc/tc/random.webp')
  assert.deepEqual(images.calls.transform, { fit: 'scale-down', width: 480 })
})

test('cover image route redirects to the original source when transformation fails', async () => {
  const source = 'https://tc.alcy.cc/tc/demo.webp'
  const images = createImagesBinding({ error: new Error('unavailable') })
  const response = await getOptimizedCover(
    createRequest(source),
    { IMAGES: images.binding },
    async () => new Response('source')
  )

  assert.equal(response.status, 307)
  assert.equal(response.headers.get('Location'), source)
})

test('cover image route redirects without fetching when the Images binding is unavailable', async () => {
  const source = 'https://tc.alcy.cc/tc/demo.webp'
  let fetchCalls = 0
  const response = await getOptimizedCover(createRequest(source), {}, async () => {
    fetchCalls += 1
    return new Response('unexpected')
  })

  assert.equal(response.status, 307)
  assert.equal(response.headers.get('Location'), source)
  assert.equal(fetchCalls, 0)
})
