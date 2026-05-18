<template>
  <div class="menu-page-card-list" :style="containerStyle">
    <component
      v-for="item in page.items"
      :is="resolveItemTag(item)"
      :key="item.key"
      :to="item.to || undefined"
      :href="item.href || undefined"
      :class="getCardItemClass(item)"
      :target="item.external ? '_blank' : undefined"
      :rel="item.external ? 'noreferrer' : undefined"
    >
      <template v-if="usesArticleCard(item)">
        <div
          v-if="showItemCover(item)"
          class="menu-page-card-cover h-48 overflow-hidden"
          :style="coverShellStyle"
        >
          <img
            :src="getItemCover(item)"
            :alt="item.title"
            class="h-full w-full transition-transform duration-500"
            :loading="coverListConfig.loading"
            :style="coverImageStyle"
          />
        </div>
        <div
          v-else-if="showCoverPlaceholder"
          class="menu-page-card-cover-placeholder h-48"
          :data-placeholder="coverListConfig.placeholder"
        >
          <svg v-if="coverListConfig.placeholder === 'icon'" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div class="article-card-body p-6 flex flex-col flex-grow">
          <div class="menu-page-card-meta-row article-card-meta mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span
              v-if="getPrimaryBadge(item)"
              class="article-card-category inline-block px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200"
            >
              {{ getPrimaryBadge(item) }}
            </span>

            <span v-if="item.meta" class="article-card-date text-xs">
              {{ item.meta }}
            </span>
          </div>

          <div class="article-card-copy">
            <h2 class="menu-page-card-article-title article-card-title text-lg leading-[1.35] font-medium mb-3 transition-colors duration-200">
              <span class="article-card-title-link block">{{ item.title }}</span>
            </h2>

            <p
              v-if="item.description"
              class="menu-page-card-article-description article-card-excerpt text-sm mb-4 flex-grow leading-relaxed"
            >
              {{ item.description }}
            </p>
          </div>

          <div class="mt-auto">
            <div v-if="getTags(item).length > 0" class="article-card-tags flex flex-wrap gap-2 mb-4">
              <span
                v-for="tag in getTags(item)"
                :key="`${item.key}-${tag.label}`"
                class="article-card-tag inline-block px-2 py-0.5 text-xs rounded-full transition-colors duration-200"
              >
                #{{ tag.label }}
              </span>
            </div>

            <ul v-if="getDetailLines(item).length > 0" class="space-y-2 mb-4">
              <li
                v-for="detail in getDetailLines(item)"
                :key="`${item.key}-${detail}`"
                class="theme-inline-meta text-sm"
              >
                {{ detail }}
              </li>
            </ul>

            <div class="menu-page-card-action-row flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span v-if="item.footer" class="theme-muted-note text-xs">
                {{ item.footer }}
              </span>

              <span class="article-card-read-link inline-flex items-center self-start text-sm font-medium transition-colors duration-200 rounded-lg px-3 py-1">
                {{ getActionLabel(item) }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="p-6 flex h-full flex-col gap-4">
          <div class="menu-page-card-entry-head flex flex-col gap-4 sm:flex-row sm:items-start">
            <span class="theme-icon-badge w-10 h-10 flex items-center justify-center rounded-full shrink-0">
              <svg v-if="getItemIconKind(item) === 'tag'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <svg v-else-if="getItemIconKind(item) === 'archive'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <svg v-else-if="['category', 'folder', 'project'].includes(getItemIconKind(item))" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <svg v-else-if="getItemIconKind(item) === 'profile'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 8h10M7 12h10m-7 4h7M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            </span>

            <div class="min-w-0 flex-1">
              <div class="menu-page-card-entry-title-row flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h2 class="menu-page-card-entry-title theme-section-title text-xl font-bold leading-snug">
                  {{ item.title }}
                </h2>
                <span v-if="item.meta" class="theme-muted-note text-sm shrink-0">
                  {{ item.meta }}
                </span>
              </div>

              <p v-if="item.description" class="menu-page-card-entry-description theme-page-description mt-3">
                {{ item.description }}
              </p>
            </div>
          </div>

          <ul v-if="getDetailLines(item).length > 0" class="space-y-2">
            <li
              v-for="detail in getDetailLines(item)"
              :key="`${item.key}-${detail}`"
              class="theme-inline-meta text-sm"
            >
              {{ detail }}
            </li>
          </ul>

          <div class="menu-page-card-entry-footer theme-muted-note mt-auto text-sm">
            {{ item.footer || getActionLabel(item) }}
          </div>
        </div>
      </template>
    </component>

    <div
      v-if="page.items.length === 0"
      class="theme-empty-state py-8 text-center"
    >
      <p class="theme-empty-text">{{ page.emptyText || '这个页面还没有内容。' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/config'
import {
  getMenuItemActionLabel,
  getMenuItemCover,
  getMenuItemDetails,
  getMenuItemIconKind,
  getMenuItemPrimaryBadge,
  getMenuItemTags,
  hasMenuItemCover,
  isArticleLikeMenuItem,
  resolveMenuItemTag
} from './menuPageItemPresentation.js'

const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

const configStore = useConfigStore()
const coverResolveOptions = computed(() => ({
  coverConfig: configStore.coverConfig,
  style: configStore.coverStyle
}))

const coverListConfig = computed(() => {
  const list = configStore.coverConfig?.list || {}

  return {
    showCover: list.showCover !== false,
    loading: list.loading === 'eager' ? 'eager' : 'lazy',
    aspectRatio: String(list.aspectRatio || '').trim(),
    objectFit: String(list.objectFit || 'cover').trim() || 'cover',
    placeholder: ['none', 'gradient', 'icon'].includes(String(list.placeholder || '').trim())
      ? String(list.placeholder || '').trim()
      : 'gradient'
  }
})

const coverShellStyle = computed(() => (
  coverListConfig.value.aspectRatio
    ? { aspectRatio: coverListConfig.value.aspectRatio, height: 'auto' }
    : {}
))

const coverImageStyle = computed(() => ({
  objectFit: coverListConfig.value.objectFit
}))

const showCoverPlaceholder = computed(() => (
  coverListConfig.value.showCover && coverListConfig.value.placeholder !== 'none'
))

const containerStyle = computed(() => {
  const columns = Number.parseInt(props.page?.layout?.columns, 10)
  const wideColumns = Number.parseInt(props.page?.layout?.wideColumns, 10)
  const normalizedColumns = Number.isFinite(columns) && columns > 0 ? Math.min(columns, 4) : null
  const normalizedWideColumns = Number.isFinite(wideColumns) && wideColumns > 0
    ? Math.min(Math.max(wideColumns, normalizedColumns || 1), 4)
    : normalizedColumns

  return {
    ...(normalizedColumns ? { '--menu-page-card-columns': String(normalizedColumns) } : {}),
    ...(normalizedWideColumns ? { '--menu-page-card-wide-columns': String(normalizedWideColumns) } : {})
  }
})

function resolveItemTag(item) {
  return resolveMenuItemTag(item)
}

function hasItemCover(item) {
  return hasMenuItemCover(item, coverResolveOptions.value)
}

function showItemCover(item) {
  return coverListConfig.value.showCover && hasItemCover(item)
}

function getItemCover(item) {
  return getMenuItemCover(item, coverResolveOptions.value)
}

function usesArticleCard(item) {
  return isArticleLikeMenuItem(item, coverResolveOptions.value)
}

function getPrimaryBadge(item) {
  return getMenuItemPrimaryBadge(item)
}

function getTags(item) {
  return getMenuItemTags(item, 4)
}

function getDetailLines(item) {
  return getMenuItemDetails(item, 3)
}

function getItemIconKind(item) {
  return getMenuItemIconKind(item)
}

function getActionLabel(item) {
  return getMenuItemActionLabel(item)
}

function getCardItemClass(item) {
  return [
    'menu-page-card-item',
    usesArticleCard(item) ? 'article-card-shell' : 'theme-grid-card',
    'rounded-2xl',
    'overflow-hidden',
    'transition-all',
    'duration-300',
    'flex',
    'flex-col'
  ]
}
</script>

<style scoped>
.menu-page-card-meta-row,
.menu-page-card-action-row,
.menu-page-card-entry-head,
.menu-page-card-entry-title-row {
  min-width: 0;
}

.menu-page-card-article-title,
.menu-page-card-article-description,
.menu-page-card-entry-title,
.menu-page-card-entry-description,
.menu-page-card-entry-footer {
  overflow-wrap: anywhere;
}

.menu-page-card-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(37 99 235);
  background:
    radial-gradient(circle at 18% 18%, rgba(191, 219, 254, 0.82), transparent 34%),
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.menu-page-card-cover-placeholder[data-placeholder='icon'] {
  background: rgba(248, 250, 252, 0.96);
  color: rgb(148 163 184);
}

@media (max-width: 640px) {
  .menu-page-card-entry-title {
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .menu-page-card-entry-footer {
    font-size: 0.82rem;
  }
}
</style>
