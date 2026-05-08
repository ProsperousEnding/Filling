<template>
  <div class="menu-page-timeline">
    <div
      v-for="(item, index) in page.items"
      :key="item.key"
      :class="getTimelineRowClass(item, index)"
    >
      <div class="menu-page-timeline-axis" aria-hidden="true">
        <span :class="getTimelineDotClass(item)"></span>
        <span class="menu-page-timeline-stamp-badge">
          {{ getTimelineStamp(item) }}
        </span>
      </div>

      <component
        :is="resolveItemTag(item)"
        :to="item.to || undefined"
        :href="item.href || undefined"
        :class="getTimelineCardClass(item)"
        :data-stamp="getTimelineStamp(item)"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
      >
        <div class="menu-page-timeline-card-inner" :data-stamp="getTimelineStamp(item)">
          <div class="menu-page-timeline-mobile-stamp" aria-hidden="true">
            <span class="menu-page-timeline-stamp-badge menu-page-timeline-stamp-badge-mobile">
              {{ getTimelineStamp(item) }}
            </span>
          </div>

          <template v-if="isArchiveEntry(item)">
            <div class="menu-page-timeline-archive-head">
              <div class="menu-page-timeline-archive-topline">
                <span class="menu-page-timeline-archive-eyebrow">年度目录</span>
                <span v-if="getArchiveCountLabel(item)" class="menu-page-timeline-archive-count">
                  {{ getArchiveCountLabel(item) }}
                </span>
              </div>

              <h2 class="menu-page-timeline-archive-title">
                {{ getDisplayTitle(item) }}
              </h2>

              <p class="menu-page-timeline-archive-description">
                {{ getSecondaryText(item) }}
              </p>
            </div>

            <ul v-if="getArchivePreviewLines(item).length > 0" class="menu-page-timeline-directory">
              <li
                v-for="preview in getArchivePreviewLines(item)"
                :key="`${item.key}-${preview.date}-${preview.title}`"
                class="menu-page-timeline-directory-item"
              >
                <span v-if="preview.date" class="menu-page-timeline-directory-date">
                  {{ preview.date }}
                </span>
                <span class="menu-page-timeline-directory-title">
                  {{ preview.title }}
                </span>
              </li>
            </ul>

            <div class="menu-page-timeline-action-row menu-page-timeline-action-row-archive">
              <span class="theme-muted-note text-sm">
                收录最近归档文章预览
              </span>

              <span class="menu-page-timeline-action theme-inline-link inline-flex items-center text-sm font-medium">
                {{ getActionLabel(item) }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </template>

          <template v-else>
            <div class="menu-page-timeline-head">
              <div class="menu-page-timeline-head-top">
                <span
                  v-if="getInlineMetaText(item)"
                  class="theme-badge inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getInlineMetaText(item) }}
                </span>

                <span
                  v-if="getPrimaryBadge(item)"
                  class="article-card-category inline-block px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200"
                >
                  {{ getPrimaryBadge(item) }}
                </span>
              </div>

              <h2 class="theme-section-title text-xl font-bold leading-snug">
                {{ getDisplayTitle(item) }}
              </h2>

              <p v-if="getDisplayDescription(item)" class="theme-page-description leading-7">
                {{ getDisplayDescription(item) }}
              </p>
            </div>

            <div v-if="getTags(item).length > 0" class="menu-page-timeline-tags">
              <span
                v-for="tag in getTags(item)"
                :key="`${item.key}-${tag.label}`"
                class="theme-tag-inline inline-flex items-center px-3 py-1 rounded-full text-sm"
              >
                #{{ tag.label }}
              </span>
            </div>

            <ul v-if="getDetailLines(item).length > 0" class="menu-page-timeline-details">
              <li
                v-for="detail in getDetailLines(item)"
                :key="`${item.key}-${detail}`"
                class="theme-inline-meta text-sm"
              >
                {{ detail }}
              </li>
            </ul>

            <div class="menu-page-timeline-action-row">
              <span class="theme-muted-note text-sm">
                {{ getSecondaryText(item) }}
              </span>

              <span class="menu-page-timeline-action theme-inline-link inline-flex items-center text-sm font-medium">
                {{ getActionLabel(item) }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </template>
        </div>
      </component>
    </div>

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
  getMenuItemDetails,
  getMenuItemPrimaryBadge,
  getMenuItemTags,
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

function getPrimaryBadge(item) {
  return getMenuItemPrimaryBadge(item)
}

function getTags(item) {
  return getMenuItemTags(item, 4)
}

function getDetailLines(item) {
  return getMenuItemDetails(item, 4)
}

function getArchivePreviewLines(item) {
  if (!isArchiveEntry(item)) {
    return []
  }

  return getDetailLines(item)
    .map((detail) => {
      const [date, ...titleParts] = String(detail || '').split(' · ')
      const title = titleParts.join(' · ').trim()

      if (!title) {
        return {
          date: '',
          title: String(detail || '').trim()
        }
      }

      return {
        date: date.trim(),
        title
      }
    })
    .filter(preview => preview.title)
}

function isArchiveEntry(item) {
  return String(item?.kind || '').trim().toLowerCase() === 'archive'
}

function getActionLabel(item) {
  if (isArchiveEntry(item)) {
    return item?.meta || '查看归档'
  }

  return getMenuItemActionLabel(item)
}

function getTimelineStamp(item) {
  if (isArchiveEntry(item)) {
    const matchedYear = String(item?.title || '').match(/\d{4}/)
    return matchedYear?.[0] || item?.title || item?.description || '归档'
  }

  return item?.meta || item?.footer || '目录'
}

function getArchiveCountLabel(item) {
  if (!isArchiveEntry(item)) {
    return ''
  }

  return item?.description || ''
}

function getInlineMetaText(item) {
  if (isArchiveEntry(item)) {
    return item?.description || ''
  }

  return item?.meta && getTimelineStamp(item) !== item.meta ? item.meta : ''
}

function getDisplayTitle(item) {
  return item?.title || ''
}

function getDisplayDescription(item) {
  if (isArchiveEntry(item)) {
    return ''
  }

  return item?.description || ''
}

function getSecondaryText(item) {
  if (item?.footer) {
    return item.footer
  }

  if (isArchiveEntry(item)) {
    return '按年份浏览全站文章目录'
  }

  return isArticleLikeMenuItem(item) ? '归档文章' : '目录条目'
}

function getTimelineCardClass(item) {
  return [
    'menu-page-timeline-card',
    'theme-grid-card',
    'rounded-2xl',
    'p-5',
    'md:p-6',
    isArchiveEntry(item) ? 'menu-page-timeline-card-archive' : 'menu-page-timeline-card-entry'
  ]
}

function getTimelineDotClass(item) {
  return [
    'menu-page-timeline-dot',
    isArchiveEntry(item) ? 'menu-page-timeline-dot-archive' : 'menu-page-timeline-dot-entry'
  ]
}

function getTimelineRowClass(item, index) {
  return [
    'menu-page-timeline-row',
    index % 2 === 0 ? 'menu-page-timeline-row-left' : 'menu-page-timeline-row-right',
    isArchiveEntry(item) ? 'menu-page-timeline-row-archive' : 'menu-page-timeline-row-entry'
  ]
}
</script>

<style scoped>
.menu-page-timeline-head,
.menu-page-timeline-archive-head,
.menu-page-timeline-details,
.menu-page-timeline-action-row,
.menu-page-timeline-directory-item {
  min-width: 0;
}

.menu-page-timeline-archive-title,
.menu-page-timeline-archive-description,
.menu-page-timeline-directory-title,
.menu-page-timeline :deep(.theme-section-title),
.menu-page-timeline :deep(.theme-page-description),
.menu-page-timeline :deep(.theme-inline-meta),
.menu-page-timeline-action-row > span {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .menu-page-timeline-action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .menu-page-timeline-action {
    align-self: flex-start;
  }

  .menu-page-timeline-archive-title {
    font-size: 1.32rem;
    line-height: 1.08;
  }

  .menu-page-timeline :deep(.theme-section-title) {
    font-size: 1.05rem;
    line-height: 1.42;
  }
}
</style>
