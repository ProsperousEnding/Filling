<template>
  <div class="category-list-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ title }}</h1>
      <p class="theme-page-description">{{ description }}</p>
    </div>

    <div v-if="categories.length > 0" class="space-y-4">
      <router-link
        v-for="category in categories"
        :key="category.id"
        :to="getCategoryRoute(category)"
        class="theme-list-row block rounded-2xl p-5 transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="theme-section-title text-xl font-bold">
              {{ category.name }}
            </h2>
            <p class="theme-page-description mt-2">
              {{ category.description || `查看 ${category.name} 分类下的所有文章` }}
            </p>
          </div>
          <span class="theme-muted-note shrink-0 text-sm">
            {{ category.articleCount || 0 }} 篇
          </span>
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
