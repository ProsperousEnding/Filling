<template>
  <div class="menu-page-card-list">
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
        <div v-if="hasItemCover(item)" class="h-48 overflow-hidden">
          <img
            :src="getItemCover(item)"
            :alt="item.title"
            class="h-full w-full object-cover transition-transform duration-500"
            loading="lazy"
          />
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

defineProps({
  page: {
    type: Object,
    required: true
  }
})

function resolveItemTag(item) {
  return resolveMenuItemTag(item)
}

function hasItemCover(item) {
  return hasMenuItemCover(item)
}

function getItemCover(item) {
  return getMenuItemCover(item)
}

function usesArticleCard(item) {
  return isArticleLikeMenuItem(item)
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
