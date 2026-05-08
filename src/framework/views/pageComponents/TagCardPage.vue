<template>
  <div class="tag-card-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ title }}</h1>
      <p class="theme-page-description">{{ description }}</p>
    </div>

    <div class="theme-page-status mb-6 text-sm">
      共 {{ tags.length }} 个标签
    </div>

    <div v-if="tags.length > 0" class="grid grid-cols-1 gap-4">
      <router-link
        v-for="tag in tags"
        :key="tag.id"
        :to="getTagRoute(tag)"
        class="tag-summary-card theme-grid-card rounded-2xl p-5 transition-shadow flex flex-col gap-3"
      >
        <div class="tag-summary-head flex items-start justify-between gap-4">
          <h2 class="tag-summary-title theme-section-title text-lg font-bold">
            #{{ tag.name }}
          </h2>
          <span class="tag-summary-count theme-muted-note text-sm shrink-0">
            {{ tag.articleCount || 0 }} 篇
          </span>
        </div>

        <p class="tag-summary-description theme-page-description text-sm">
          查看与“{{ tag.name }}”相关的文章内容。
        </p>
      </router-link>
    </div>

    <div v-else class="theme-empty-state py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <h2 class="theme-empty-title text-xl font-bold mb-2">暂无标签</h2>
      <p class="theme-empty-text mb-6">目前没有可用的文章标签</p>
    </div>
  </div>
</template>

<script setup>
import { getTagRoute } from '../../utils/routeLinks'

defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.theme-page-status {
  color: rgb(100 116 139);
}

.tag-summary-card {
  min-width: 0;
}

.tag-summary-title,
.tag-summary-description {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .tag-summary-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
  }

  .tag-summary-title {
    font-size: 1rem;
    line-height: 1.4;
  }

  .tag-summary-count {
    font-size: 0.82rem;
  }
}
</style>
