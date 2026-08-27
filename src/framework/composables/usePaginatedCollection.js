import { computed, nextTick, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { scrollBlogViewport } from '../utils/blogScroll.js'

function normalizePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function normalizePageSize(value, fallback = 10) {
  const pageSize = Number.parseInt(value, 10)
  return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : fallback
}

function calculateTotalPages(total, pageSize) {
  const totalCount = Math.max(0, Number(total) || 0)
  const resolvedPageSize = normalizePageSize(pageSize)
  return Math.max(1, Math.ceil(totalCount / resolvedPageSize))
}

function isPromiseLike(value) {
  return value !== null && typeof value === 'object' && typeof value.then === 'function'
}

function buildDefaultPageRoute(route, page) {
  const normalizedPage = normalizePage(page)
  const nextQuery = {
    ...route.query
  }

  if (normalizedPage <= 1) {
    delete nextQuery.page
  } else {
    nextQuery.page = normalizedPage
  }

  return {
    path: route.path,
    query: nextQuery
  }
}

export function usePaginatedCollection(options) {
  const {
    pageSize = 10,
    fetchPage,
    watchSources = [],
    resolvePageRoute = null
  } = options

  const route = useRoute()
  const router = useRouter()

  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref(null)
  let activeRequestId = 0

  const resolvedPageSize = computed(() => normalizePageSize(unref(pageSize)))
  const currentPage = computed(() => normalizePage(route.params.page ?? route.query.page))
  const totalPages = computed(() => calculateTotalPages(total.value, resolvedPageSize.value))
  const status = computed(() => {
    if (loading.value) {
      return ready.value ? 'refreshing' : 'loading'
    }

    if (error.value) {
      return 'error'
    }

    return ready.value ? 'success' : 'idle'
  })

  function resolvePageLocation(page) {
    const normalizedPage = normalizePage(page)

    return typeof resolvePageRoute === 'function'
      ? resolvePageRoute({
        page: normalizedPage,
        currentPage: currentPage.value,
        route
      })
      : buildDefaultPageRoute(route, normalizedPage)
  }

  function isCurrentLocation(targetLocation) {
    return router.resolve(targetLocation).fullPath === route.fullPath
  }

  async function scrollToTop() {
    await nextTick()

    scrollBlogViewport({ top: 0, behavior: 'smooth' })
  }

  async function navigateToPage(page, options = {}) {
    const normalizedPage = normalizePage(page)
    const nextRoute = resolvePageLocation(normalizedPage)
    const replace = options.replace === true
    const shouldScroll = options.scroll !== false

    if (isCurrentLocation(nextRoute)) {
      return
    }

    await (replace ? router.replace(nextRoute) : router.push(nextRoute))

    if (shouldScroll) {
      await scrollToTop()
    }
  }

  function applyPageResult(result) {
    items.value = Array.isArray(result?.data) ? result.data : []
    total.value = Number(result?.total) || 0
    ready.value = true
  }

  async function normalizeCurrentPage() {
    const canonicalPage = Math.min(currentPage.value, calculateTotalPages(total.value, resolvedPageSize.value))
    const canonicalLocation = resolvePageLocation(canonicalPage)

    if (!isCurrentLocation(canonicalLocation)) {
      await navigateToPage(canonicalPage, {
        replace: true,
        scroll: false
      })
    }
  }

  function handleRefreshError(fetchError, requestId) {
    if (requestId !== activeRequestId) {
      return
    }

    error.value = fetchError
  }

  function refresh() {
    const requestId = activeRequestId + 1
    activeRequestId = requestId
    error.value = null
    loading.value = true

    try {
      const result = fetchPage({
        page: currentPage.value,
        pageSize: resolvedPageSize.value,
        route
      })

      if (!isPromiseLike(result)) {
        if (requestId !== activeRequestId) {
          return Promise.resolve(result)
        }

        applyPageResult(result)
        loading.value = false

        return normalizeCurrentPage().then(() => result)
      }

      return result
        .then(async (resolvedResult) => {
          if (requestId !== activeRequestId) {
            return resolvedResult
          }

          applyPageResult(resolvedResult)
          await normalizeCurrentPage()
          return resolvedResult
        })
        .catch((fetchError) => {
          handleRefreshError(fetchError, requestId)
          throw fetchError
        })
        .finally(() => {
          if (requestId === activeRequestId) {
            loading.value = false
          }
        })
    } catch (fetchError) {
      handleRefreshError(fetchError, requestId)
      loading.value = false

      return Promise.reject(fetchError)
    }
  }

  function handlePageChange(page) {
    const nextPage = normalizePage(page)

    if (nextPage === currentPage.value) {
      return
    }

    navigateToPage(nextPage).catch(() => {})
  }

  watch(
    [() => route.path, () => route.params.page, () => route.query.page, resolvedPageSize, ...watchSources],
    () => {
      refresh().catch(() => {})
    },
    { immediate: true }
  )

  return {
    items,
    total,
    loading,
    ready,
    error,
    status,
    currentPage,
    pageSize: resolvedPageSize,
    totalPages,
    refresh,
    handlePageChange
  }
}
