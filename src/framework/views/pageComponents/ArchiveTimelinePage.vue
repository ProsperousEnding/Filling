<template>
  <div class="archive-timeline-page">
    <div v-if="groupedDays.length > 0" class="archive-timeline">
      <section
        v-for="group in groupedDays"
        :key="group.key"
        class="archive-day"
      >
        <div class="archive-day-stamp">
          <span class="archive-day-date">{{ group.date }}</span>
          <span class="archive-day-dot" aria-hidden="true"></span>
        </div>

        <div class="archive-day-panel">
          <RouterLink
            v-for="article in group.articles"
            :key="article.key"
            :to="article.to"
            class="archive-article-row"
          >
            <span class="archive-article-main">
              <span class="archive-article-title">{{ article.title }}</span>
              <span v-if="article.description" class="archive-article-description">
                {{ article.description }}
              </span>
            </span>

            <span class="archive-article-meta">
              <span v-if="article.category" class="archive-article-category">
                {{ article.category }}
              </span>
              <span v-if="article.readTime" class="archive-article-read-time">
                {{ article.readTime }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="archive-article-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </RouterLink>
        </div>
      </section>
    </div>

    <div v-else class="theme-empty-state py-8 text-center">
      <p class="theme-empty-text">{{ page.emptyText || '这里还没有归档内容。' }}</p>
    </div>
  </div>
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

function normalizeString(value) {
  return String(value || '').trim()
}

function normalizeDateStamp(value) {
  const rawValue = normalizeString(value)
  const matched = rawValue.match(/\d{4}-\d{2}-\d{2}/)

  if (matched) {
    return matched[0]
  }

  return rawValue || '未注明日期'
}

function normalizeYearStamp(value) {
  const rawValue = normalizeString(value)
  const matched = rawValue.match(/\d{4}/)

  return matched ? matched[0] : ''
}

function normalizeArticle(item = {}) {
  const kind = normalizeString(item.kind).toLowerCase()
  const archiveYear = kind === 'archive'
    ? normalizeYearStamp(`${item.title || ''} ${item.key || ''} ${item.date || ''}`)
    : ''
  const date = archiveYear || normalizeDateStamp(item.meta || item.createdAt || item.date)

  return {
    key: item.key || item.to || item.title,
    title: normalizeString(item.title),
    description: normalizeString(item.description),
    date,
    to: item.to || '/',
    category: normalizeString(item.category?.label || item.category?.name || item.category),
    readTime: normalizeString(item.footer)
  }
}

const groupedDays = computed(() => {
  const groups = new Map()

  props.page.items
    .map(normalizeArticle)
    .filter(article => article.title)
    .forEach((article) => {
      if (!groups.has(article.date)) {
        groups.set(article.date, [])
      }

      groups.get(article.date).push(article)
    })

  return Array.from(groups.entries()).map(([date, articles]) => ({
    key: `archive-day-${date}`,
    date,
    articles
  }))
})
</script>

<style scoped>
.archive-timeline-page {
  max-width: none;
  margin: 0;
}

.archive-timeline {
  --archive-axis-x: 6.125rem;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.archive-timeline::before {
  content: '';
  position: absolute;
  top: 0.8rem;
  bottom: 0.8rem;
  left: var(--archive-axis-x);
  z-index: 0;
  width: 2px;
  border-radius: 9999px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(148, 163, 184, 0.22) 8%,
    rgba(148, 163, 184, 0.46) 50%,
    rgba(148, 163, 184, 0.22) 92%,
    transparent
  );
  transform: translateX(-1px);
}

.archive-day {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  min-height: 0;
}

.archive-day:nth-child(odd) .archive-day-panel,
.archive-day:nth-child(even) .archive-day-panel {
  grid-column: 2;
  justify-self: stretch;
}

.archive-day:nth-child(odd) .archive-day-stamp,
.archive-day:nth-child(even) .archive-day-stamp {
  grid-column: 1;
}

.archive-day:nth-child(odd) .archive-day-panel::after,
.archive-day:nth-child(even) .archive-day-panel::after {
  content: '';
  position: absolute;
  top: 1.55rem;
  width: 1rem;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0.46));
}

.archive-day:nth-child(odd) .archive-day-panel::after {
  left: -1rem;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.46), rgba(148, 163, 184, 0.08));
}

.archive-day:nth-child(even) .archive-day-panel::after {
  left: -1rem;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.46), rgba(148, 163, 184, 0.08));
}

.archive-day + .archive-day {
  margin-top: 0;
}

.archive-day-stamp {
  position: relative;
  z-index: 2;
  grid-column: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 1.05rem;
}

.archive-day-date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: max-content;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1;
  font-weight: 750;
  letter-spacing: 0;
  white-space: nowrap;
  box-shadow: none;
}

.archive-day-dot {
  width: 0.625rem;
  height: 0.625rem;
  border: 2px solid rgba(219, 234, 254, 0.96);
  border-radius: 9999px;
  background: rgb(var(--theme-primary-rgb));
  box-shadow:
    0 0 0 3px rgba(var(--theme-primary-rgb), 0.08);
}

.archive-day-panel {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-panel);
  background: var(--theme-panel-background);
  box-shadow: var(--theme-shadow-xs);
  backdrop-filter: blur(18px) saturate(1.04);
  -webkit-backdrop-filter: blur(18px) saturate(1.04);
}

.archive-day-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.archive-article-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  min-height: 3.5rem;
  padding: 0.625rem 0.75rem;
  color: inherit;
  text-decoration: none;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.archive-article-row + .archive-article-row {
  border-top: 1px solid rgba(226, 232, 240, 0.66);
}

.archive-article-row:hover {
  background: rgba(241, 245, 249, 0.76);
}

.archive-article-row:focus-visible {
  outline: 2px solid rgba(var(--theme-primary-rgb), 0.38);
  outline-offset: -2px;
}

.archive-article-main {
  min-width: 0;
}

.archive-article-title {
  display: block;
  overflow-wrap: anywhere;
  color: rgb(15 23 42);
  font-size: 0.875rem;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: 0;
}

.archive-article-description {
  display: -webkit-box;
  margin-top: 0.34rem;
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.archive-article-meta {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.44rem;
  color: rgb(148 163 184);
  white-space: nowrap;
}

.archive-article-category,
.archive-article-read-time {
  display: inline-flex;
  align-items: center;
  min-height: 1.38rem;
  padding: 0.14rem 0.5rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0.375rem;
  background: rgba(248, 250, 252, 0.82);
  color: rgb(100 116 139);
  font-size: 0.72rem;
  line-height: 1.1;
  font-weight: 650;
}

.archive-article-arrow {
  width: 0.98rem;
  height: 0.98rem;
  color: rgb(148 163 184);
  transition:
    color 0.16s ease,
    transform 0.16s ease;
}

.archive-article-row:hover .archive-article-arrow {
  color: rgb(var(--theme-primary-rgb));
  transform: translateX(2px);
}

:global(.dark .archive-timeline) {
  color: rgb(226 232 240);
}

:global(.dark .archive-timeline::before) {
  background: linear-gradient(
    180deg,
    transparent,
    rgba(71, 85, 105, 0.62) 10%,
    rgba(71, 85, 105, 0.62) 90%,
    transparent
  );
}

:global(.dark .archive-day:nth-child(odd) .archive-day-panel::after),
:global(.dark .archive-day:nth-child(even) .archive-day-panel::after) {
  background: linear-gradient(90deg, rgba(71, 85, 105, 0.08), rgba(71, 85, 105, 0.7));
}

:global(.dark .archive-day:nth-child(even) .archive-day-panel::after) {
  background: linear-gradient(90deg, rgba(71, 85, 105, 0.7), rgba(71, 85, 105, 0.08));
}

:global(.dark .archive-day-date),
:global(.dark .archive-article-category),
:global(.dark .archive-article-read-time) {
  border-color: rgba(51, 65, 85, 0.75);
  background: rgba(30, 41, 59, 0.88);
  color: rgb(203 213 225);
}

:global(.dark .archive-day-date) {
  border: 0;
  background: transparent;
}

:global(.dark .archive-day-dot) {
  border-color: rgba(30, 41, 59, 0.96);
}

:global(.dark .archive-day-panel) {
  border-color: rgba(51, 65, 85, 0.72);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.62)),
    rgba(15, 23, 42, 0.72);
  box-shadow: var(--theme-shadow-xs);
}

:global(.dark .archive-day-panel::before) {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

:global(.dark .archive-article-description),
:global(.dark .archive-article-meta),
:global(.dark .archive-article-arrow) {
  color: rgb(148 163 184);
}

:global(.dark .archive-article-row + .archive-article-row) {
  border-top-color: rgba(51, 65, 85, 0.62);
}

:global(.dark .archive-article-row:hover) {
  background: rgba(30, 41, 59, 0.72);
}

:global(.dark .archive-article-title) {
  color: rgb(248 250 252);
}

@media (max-width: 980px) {
  .archive-timeline {
    --archive-axis-x: 1.05rem;
    gap: 0.95rem;
    padding-left: 0;
  }

  .archive-day {
    display: grid;
    grid-template-columns: 2.15rem minmax(0, 1fr);
    min-height: 0;
  }

  .archive-day:nth-child(odd) .archive-day-panel,
  .archive-day:nth-child(even) .archive-day-panel {
    grid-column: 2;
    justify-self: stretch;
  }

  .archive-day-stamp {
    grid-column: 1;
    align-items: center;
    padding-top: 0.3rem;
  }

  .archive-day-date {
    position: absolute;
    left: 2.55rem;
    top: 0;
    z-index: 2;
    height: 1.56rem;
    font-size: 0.74rem;
  }

  .archive-day-panel {
    width: 100%;
    border-radius: 1.05rem;
    padding-top: 1.05rem;
  }

  .archive-day:nth-child(odd) .archive-day-panel::after,
  .archive-day:nth-child(even) .archive-day-panel::after {
    top: 1.66rem;
    left: -1.08rem;
    width: 1.08rem;
    background: rgba(148, 163, 184, 0.38);
  }
}

@media (max-width: 760px) {
  .archive-article-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.48rem;
    min-height: 0;
    padding: 0.78rem 0.8rem;
  }

  .archive-article-title {
    font-size: 0.95rem;
  }

  .archive-article-meta {
    justify-content: flex-start;
  }

  .archive-article-arrow {
    display: none;
  }
}
</style>
