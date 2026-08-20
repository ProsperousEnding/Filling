const CONTENT_ADAPTER_ERROR = '[vue-blog] Content adapter is not configured.'

const emptyContentAdapter = Object.freeze({})
let currentContentAdapter = emptyContentAdapter

export function configureContentAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new TypeError('[vue-blog] Content adapter must be an object.')
  }

  currentContentAdapter = adapter
  return currentContentAdapter
}

export function getContentAdapter() {
  return currentContentAdapter
}

export function resetContentAdapter() {
  currentContentAdapter = emptyContentAdapter
}

const contentAdapter = new Proxy({}, {
  get(_target, property) {
    const value = currentContentAdapter[property]

    if (typeof value === 'function') {
      return value.bind(currentContentAdapter)
    }

    if (value !== undefined) {
      return value
    }

    if (typeof property === 'string') {
      return () => {
        throw new Error(`${CONTENT_ADAPTER_ERROR} Missing method: ${property}`)
      }
    }

    return undefined
  }
})

export default contentAdapter
