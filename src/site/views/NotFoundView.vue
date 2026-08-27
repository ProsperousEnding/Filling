<template>
  <section class="theme-empty-state py-12 text-center" aria-labelledby="not-found-title">
    <h1 id="not-found-title" class="theme-empty-title text-2xl font-bold mb-3">
      页面未找到
    </h1>
    <p class="theme-empty-text mb-6">
      这个链接可能已经失效，或者地址输入有误。
    </p>
    <router-link :to="getHomeRoute()" class="btn-primary">
      返回首页
    </router-link>
  </section>
</template>

<script setup>
import { getHomeRoute } from '@framework/utils/routeLinks'
import { usePageMetadata } from '@framework/composables/usePageMetadata'

usePageMetadata({
  title: '页面未找到',
  description: '您访问的页面不存在。',
  robots: 'noindex,follow'
})
</script>
