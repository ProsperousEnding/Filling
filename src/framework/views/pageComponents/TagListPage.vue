<template>
  <div class="tag-list-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ title }}</h1>
      <p class="theme-page-description">{{ description }}</p>
    </div>

    <div class="theme-page-status mb-6 text-sm">
      共 {{ tags.length }} 个标签
    </div>

    <div v-if="tags.length > 0">
      <div class="tag-pill-list flex flex-wrap gap-3 mb-12">
        <router-link
          v-for="tag in tags"
          :key="tag.id"
          :to="getTagRoute(tag)"
          class="tag-pill theme-tag-pill inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="getTagToneClass(tag.articleCount)"
        >
          <span class="tag-pill-label">{{ tag.name }}</span>
          <span class="theme-tag-pill-count ml-2 px-2 py-0.5 rounded-full text-xs">
            {{ tag.articleCount || 0 }}
          </span>
        </router-link>
      </div>

      <div class="space-y-8">
        <div
          v-for="group in groupedTags"
          :key="group.letter"
          class="theme-section-divider pt-4"
        >
          <h2 class="theme-section-title text-lg font-bold mb-4">
            {{ group.letter }}
          </h2>

          <div class="space-y-3">
            <router-link
              v-for="tag in group.tags"
              :key="tag.id"
              :to="getTagRoute(tag)"
              class="tag-list-row theme-list-row flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-shadow"
            >
              <span class="tag-list-row-label font-medium">{{ tag.name }}</span>
              <span class="tag-list-row-count theme-muted-note text-sm">{{ tag.articleCount || 0 }} 篇</span>
            </router-link>
          </div>
        </div>
      </div>
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
import { computed } from 'vue'
import { getTagRoute } from '../../utils/routeLinks'

const props = defineProps({
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

const groupedTags = computed(() => {
  const groups = {}
  const sortedTags = [...props.tags].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  sortedTags.forEach((tag) => {
    const firstChar = tag.name.charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'

    if (!groups[letter]) {
      groups[letter] = {
        letter,
        tags: []
      }
    }

    groups[letter].tags.push(tag)
  })

  return Object.values(groups).sort((a, b) => {
    if (a.letter === '#') return 1
    if (b.letter === '#') return -1
    return a.letter.localeCompare(b.letter)
  })
})

function getTagToneClass(count) {
  if (!count) return 'theme-tag-tone-base'
  if (count >= 20) return 'theme-tag-tone-strong'
  if (count >= 10) return 'theme-tag-tone-warm'
  if (count >= 5) return 'theme-tag-tone-soft'
  return 'theme-tag-tone-accent'
}
</script>

<style scoped>
.theme-page-status {
  color: rgb(100 116 139);
}

.tag-pill,
.tag-list-row {
  max-width: 100%;
}

.tag-pill-label,
.tag-list-row-label {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .tag-pill-list {
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .tag-pill {
    max-width: 100%;
    padding: 0.6rem 0.9rem;
  }

  .tag-list-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
  }

  .tag-list-row-label {
    font-size: 0.98rem;
    line-height: 1.45;
  }

  .tag-list-row-count {
    font-size: 0.82rem;
  }
}
</style>
