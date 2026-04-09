<template>
  <div class="category-card-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ title }}</h1>
      <p class="theme-page-description">{{ description }}</p>
    </div>

    <div v-if="categories.length > 0" class="grid grid-cols-1 gap-4">
      <router-link
        v-for="category in categories"
        :key="category.id"
        :to="getCategoryRoute(category)"
        class="theme-grid-card rounded-2xl transition-shadow p-6 flex flex-col"
      >
        <div class="flex items-center mb-3">
          <span class="theme-icon-badge w-10 h-10 flex items-center justify-center rounded-full mr-3">
            <svg v-if="category.icon" :class="category.icon" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          <h2 class="theme-section-title text-xl font-bold">{{ category.name }}</h2>
        </div>

        <p class="theme-page-description mb-4">
          {{ category.description || `查看 ${category.name} 分类下的所有文章` }}
        </p>

        <div class="theme-muted-note mt-auto text-sm">
          {{ category.articleCount || 0 }} 篇文章
        </div>
      </router-link>
    </div>

    <div v-else class="theme-empty-state py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
      <h2 class="theme-empty-title text-xl font-bold mb-2">暂无分类</h2>
      <p class="theme-empty-text mb-6">目前没有可用的文章分类</p>
    </div>
  </div>
</template>

<script setup>
import { getCategoryRoute } from '../../utils/routeLinks'

defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  categories: {
    type: Array,
    default: () => []
  }
})
</script>
