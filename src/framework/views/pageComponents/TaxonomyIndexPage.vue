<template>
  <section class="taxonomy-index" :class="taxonomyClass">
    <div v-if="page.items.length > 0 && !isTagPage" class="taxonomy-panel">
      <RouterLink
        v-for="(item, index) in normalizedItems"
        :key="item.key"
        :to="item.to"
        class="taxonomy-row"
        :style="{ '--taxonomy-delay': `${Math.min(index, 10) * 22}ms` }"
      >
        <span class="taxonomy-row-icon" aria-hidden="true">
          <svg v-if="isTagPage" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </span>

        <span class="taxonomy-row-main">
          <span class="taxonomy-row-title">{{ item.title }}</span>
          <span v-if="item.description" class="taxonomy-row-description">{{ item.description }}</span>
        </span>

        <span class="taxonomy-row-meta">
          <span class="taxonomy-row-count">{{ item.count }} 项</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="taxonomy-row-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </RouterLink>
    </div>

    <div v-else-if="page.items.length > 0" class="taxonomy-tag-cloud">
      <RouterLink
        v-for="(item, index) in normalizedItems"
        :key="item.key"
        :to="item.to"
        class="taxonomy-tag-pill"
        :style="{ '--taxonomy-delay': `${Math.min(index, 18) * 18}ms`, '--taxonomy-weight': item.weight }"
      >
        <span class="taxonomy-tag-name">{{ item.title }}</span>
        <span class="taxonomy-tag-count">{{ item.count }}</span>
      </RouterLink>
    </div>

    <div v-else class="theme-empty-state py-8 text-center">
      <p class="theme-empty-text">{{ page.emptyText || '这个页面还没有内容。' }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

const isTagPage = computed(() => props.page?.key === 'tags')
const taxonomyClass = computed(() => (isTagPage.value ? 'taxonomy-index-tags' : 'taxonomy-index-categories'))

const normalizedItems = computed(() => (
  props.page.items
    .map((item, index) => {
      const title = String(item?.title || '').trim()
      const count = Number.parseInt(String(item?.meta || '').match(/\d+/)?.[0] || '0', 10)

      return {
        key: item?.key || `${props.page.key}-${index}`,
        title,
        description: String(item?.description || '').trim(),
        count: Number.isFinite(count) ? count : 0,
        to: item?.to || '/',
        weight: 0
      }
    })
    .filter(item => item.title)
    .map((item, _, list) => {
      const maxCount = Math.max(...list.map(entry => entry.count), 1)
      const normalizedWeight = maxCount > 0 ? item.count / maxCount : 0

      return {
        ...item,
        weight: (0.78 + normalizedWeight * 0.42).toFixed(2)
      }
    })
))
</script>

<style scoped>
.taxonomy-index {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.taxonomy-panel {
  overflow: hidden;
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-panel);
  background: var(--theme-panel-background);
  box-shadow: var(--theme-shadow-xs);
  backdrop-filter: blur(18px) saturate(1.04);
  -webkit-backdrop-filter: blur(18px) saturate(1.04);
}

.taxonomy-row {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.75rem;
  padding: 0.625rem 0.75rem;
  color: inherit;
  text-decoration: none;
  animation: taxonomy-row-enter var(--theme-motion-slow) ease both;
  animation-delay: var(--taxonomy-delay);
  transition: background-color var(--theme-motion-fast) ease;
}

.taxonomy-row + .taxonomy-row {
  border-top: 1px solid rgba(226, 232, 240, 0.72);
}

.taxonomy-row:hover {
  background: rgba(248, 250, 252, 0.78);
}

.taxonomy-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(203, 213, 225, 0.78);
  border-radius: var(--theme-radius-control);
  background: rgba(248, 250, 252, 0.76);
  color: rgb(71 85 105);
  flex-shrink: 0;
}

.taxonomy-row-icon svg {
  width: 0.9375rem;
  height: 0.9375rem;
}

.taxonomy-row-main {
  min-width: 0;
}

.taxonomy-row-title {
  display: block;
  color: rgb(15 23 42);
  font-size: 0.875rem;
  line-height: 1.32;
  font-weight: 700;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.taxonomy-index-tags .taxonomy-row-title {
  color: rgb(37 99 235);
}

.taxonomy-row-description {
  display: -webkit-box;
  margin-top: 0.2rem;
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.taxonomy-row-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
  color: rgb(148 163 184);
}

.taxonomy-row-count {
  display: inline-flex;
  min-height: 1.25rem;
  align-items: center;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: rgb(100 116 139);
  font-size: 0.6875rem;
  line-height: 1.1;
  font-weight: 600;
  white-space: nowrap;
}

.taxonomy-row-arrow {
  width: 0.98rem;
  height: 0.98rem;
  color: rgb(148 163 184);
}

.taxonomy-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.875rem;
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-panel);
  background: var(--theme-panel-background);
  box-shadow: var(--theme-shadow-xs);
  backdrop-filter: blur(18px) saturate(1.04);
  -webkit-backdrop-filter: blur(18px) saturate(1.04);
}

.taxonomy-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 1.75rem;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 0.4375rem;
  background: rgba(248, 250, 252, 0.86);
  color: rgb(37 99 235);
  font-size: calc(0.75rem * var(--taxonomy-weight));
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0;
  text-decoration: none;
  animation: taxonomy-row-enter var(--theme-motion-slow) ease both;
  animation-delay: var(--taxonomy-delay);
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.taxonomy-tag-pill:hover {
  border-color: rgba(147, 197, 253, 0.9);
  background: rgba(239, 246, 255, 0.94);
  color: rgb(29 78 216);
  transform: translateY(-1px);
}

.taxonomy-tag-name {
  overflow-wrap: anywhere;
}

.taxonomy-tag-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: auto;
  height: auto;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: rgb(100 116 139);
  font-size: 0.68rem;
  line-height: 1;
  font-weight: 600;
}

@keyframes taxonomy-row-enter {
  from {
    opacity: 0;
    transform: translateY(0.28rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(.dark .taxonomy-panel) {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: var(--theme-shadow-xs);
}

:global(.dark .taxonomy-tag-cloud) {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: var(--theme-shadow-xs);
}

:global(.dark .taxonomy-tag-pill) {
  border-color: rgba(51, 65, 85, 0.9);
  background: rgba(30, 41, 59, 0.82);
  color: rgb(191 219 254);
}

:global(.dark .taxonomy-tag-pill:hover) {
  border-color: rgba(96, 165, 250, 0.62);
  background: rgba(30, 64, 175, 0.24);
  color: rgb(219 234 254);
}

:global(.dark .taxonomy-tag-count) {
  background: transparent;
  color: rgb(203 213 225);
}

:global(.dark .taxonomy-row + .taxonomy-row) {
  border-top-color: rgba(51, 65, 85, 0.72);
}

:global(.dark .taxonomy-row:hover) {
  background: rgba(30, 41, 59, 0.72);
}

:global(.dark .taxonomy-row-icon) {
  background: rgba(30, 41, 59, 0.76);
  border-color: rgba(71, 85, 105, 0.76);
  color: rgb(203 213 225);
}

:global(.dark .taxonomy-row-description),
:global(.dark .taxonomy-row-meta),
:global(.dark .taxonomy-row-arrow) {
  color: rgb(148 163 184);
}

:global(.dark .taxonomy-row-title) {
  color: rgb(248 250 252);
}

:global(.dark .taxonomy-index-tags .taxonomy-row-title) {
  color: rgb(191 219 254);
}

:global(.dark .taxonomy-row-count) {
  background: transparent;
  color: rgb(203 213 225);
}

@media (max-width: 520px) {
  .taxonomy-index {
    gap: 0.7rem;
  }

  .taxonomy-panel {
    border-radius: 1rem;
  }

  .taxonomy-tag-cloud {
    gap: 0.5rem;
    padding: 0.88rem;
    border-radius: 1.12rem;
  }

  .taxonomy-tag-pill {
    min-height: 2rem;
    padding: 0.34rem 0.64rem;
    font-size: 0.78rem;
  }

  .taxonomy-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.7rem;
    min-height: 4.25rem;
    padding: 0.78rem 0.82rem;
  }

  .taxonomy-row-icon {
    width: 2.08rem;
    height: 2.08rem;
  }

  .taxonomy-row-meta {
    grid-column: auto;
    justify-content: flex-end;
    margin-top: 0;
  }

  .taxonomy-row-arrow {
    display: none;
  }
}
</style>
