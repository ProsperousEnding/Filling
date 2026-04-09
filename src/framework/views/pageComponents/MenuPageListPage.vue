<template>
  <div class="menu-page-list">
    <component
      v-for="item in page.items"
      :is="resolveItemTag(item)"
      :key="item.key"
      :to="item.to || undefined"
      :href="item.href || undefined"
      :class="getListItemClass(item)"
      :target="item.external ? '_blank' : undefined"
      :rel="item.external ? 'noreferrer' : undefined"
    >
      <template v-if="usesHeroSurface(item)">
        <img
          v-if="hasItemCover(item)"
          :src="getItemCover(item)"
          :alt="item.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        <div
          v-else
          class="article-feed-card-fallback absolute inset-0 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div class="article-feed-card-overlay absolute inset-0"></div>

        <div class="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5 md:p-6">
          <div class="flex items-start justify-between gap-4">
            <span
              v-if="getPrimaryBadge(item)"
              class="article-feed-category inline-block px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium rounded-full transition-colors duration-200"
            >
              {{ getPrimaryBadge(item) }}
            </span>

            <div v-if="getHeroTags(item).length > 0" class="flex flex-wrap justify-end">
              <span
                v-for="tag in getHeroTags(item)"
                :key="`${item.key}-${tag.label}`"
                class="article-feed-tag ml-1 md:ml-2 mb-1 px-2 py-0.5 text-xs rounded-full transition-colors duration-200"
              >
                #{{ tag.label }}
              </span>
              <span
                v-if="getRemainingHeroTagCount(item) > 0"
                class="article-feed-tag-more text-xs ml-1 md:ml-2"
              >
                +{{ getRemainingHeroTagCount(item) }}
              </span>
            </div>
          </div>

          <div class="mt-4 md:mt-6 mb-auto max-w-3xl">
            <h2 class="article-feed-title text-lg md:text-xl leading-[1.32] font-semibold transition-colors duration-200">
              <span class="article-feed-title-link block">{{ item.title }}</span>
            </h2>

            <p
              v-if="item.description"
              class="article-feed-excerpt text-xs md:text-sm leading-relaxed mt-1 md:mt-2 mb-2 md:mb-3 max-w-3xl"
            >
              {{ item.description }}
            </p>
          </div>

          <div class="article-feed-footer flex items-center justify-between gap-4">
            <div class="flex flex-col">
              <div v-if="item.meta" class="article-feed-date-row flex items-center text-xs">
                {{ item.meta }}
              </div>
              <div v-else-if="item.footer" class="article-feed-date-row flex items-center text-xs">
                {{ item.footer }}
              </div>
            </div>

            <span class="article-feed-read-link px-3 py-1 md:px-4 md:py-1.5 text-xs font-medium rounded-full transition-colors duration-300 flex items-center">
              {{ getActionLabel(item) }}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-3.5 md:w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="mb-3 flex items-center gap-3">
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

              <p v-if="item.meta" class="theme-muted-note text-sm">{{ item.meta }}</p>
            </div>

            <h2 class="theme-section-title text-xl font-bold leading-tight">
              {{ item.title }}
            </h2>

            <p v-if="item.description" class="theme-page-description mt-2">
              {{ item.description }}
            </p>

            <ul v-if="getDetailLines(item).length > 0" class="mt-4 space-y-2">
              <li
                v-for="detail in getDetailLines(item)"
                :key="`${item.key}-${detail}`"
                class="theme-inline-meta text-sm"
              >
                {{ detail }}
              </li>
            </ul>
          </div>

          <span class="theme-muted-note text-sm shrink-0">
            {{ item.footer || getActionLabel(item) }}
          </span>
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
  getMenuItemRemainingTagCount,
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

const HERO_TAG_LIMIT = 3

function resolveItemTag(item) {
  return resolveMenuItemTag(item)
}

function hasItemCover(item) {
  return hasMenuItemCover(item)
}

function getItemCover(item) {
  return getMenuItemCover(item)
}

function usesHeroSurface(item) {
  return isArticleLikeMenuItem(item)
}

function getPrimaryBadge(item) {
  return getMenuItemPrimaryBadge(item)
}

function getHeroTags(item) {
  return getMenuItemTags(item, HERO_TAG_LIMIT)
}

function getRemainingHeroTagCount(item) {
  return getMenuItemRemainingTagCount(item, HERO_TAG_LIMIT)
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

function getListItemClass(item) {
  if (usesHeroSurface(item)) {
    return [
      'menu-page-list-item',
      'article-feed-card',
      'relative',
      'h-52',
      'sm:h-56',
      'md:h-64',
      'rounded-lg',
      'md:rounded-xl',
      'overflow-hidden',
      'transition-all',
      'duration-300',
      !hasItemCover(item) ? 'article-feed-card-without-cover' : ''
    ]
  }

  return [
    'menu-page-list-item',
    'theme-list-row',
    'block',
    'rounded-2xl',
    'p-5',
    'transition-shadow'
  ]
}
</script>
