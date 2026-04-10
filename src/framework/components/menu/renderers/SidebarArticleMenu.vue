<template>
  <ul class="sidebar-nav-list sidebar-nav-list-latest">
    <li v-for="item in normalizedItems" :key="item.key">
      <component
        :is="item.external ? 'a' : RouterLink"
        :to="item.external ? undefined : item.to"
        :href="item.external ? item.href : undefined"
        class="sidebar-nav-item sidebar-nav-item-article"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
      >
        <div class="sidebar-nav-meta">
          <MeasuredText
            tag="h5"
            class="sidebar-nav-title"
            :text="item.label"
            :lines="2"
          />
          <div class="sidebar-nav-submeta">
            <span class="sidebar-nav-submeta-item">
              <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-nav-submeta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="sidebar-nav-date">{{ item.meta }}</span>
            </span>
          </div>
        </div>
      </component>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import MeasuredText from '../../core/MeasuredText.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map((item, index) => ({
      key: item?.key || item?.id || item?.slug || `sidebar-article-${index}`,
      label: String(item?.label || item?.title || ''),
      meta: String(item?.meta || ''),
      to: item?.to || item?.path || '/',
      href: item?.href || '',
      external: item?.external === true
    }))
    .filter(item => item.label)
))
</script>

<style scoped>
.sidebar-nav-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar-nav-list-latest > li + li {
  margin-top: 0.62rem;
}

.sidebar-nav-item {
  color: rgb(71 85 105);
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.sidebar-nav-item-article {
  display: block;
  min-height: auto;
  padding: 0;
  border-radius: 0;
}

.sidebar-nav-item:hover {
  color: rgb(37 99 235);
}

.sidebar-nav-meta {
  min-width: 0;
}

.sidebar-nav-title {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.35;
  font-weight: 600;
  color: inherit;
}

.sidebar-nav-submeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.18rem;
  margin-top: 0.18rem;
  color: rgb(100 116 139);
  font-size: 0.74rem;
}

.sidebar-nav-submeta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.sidebar-nav-submeta-icon {
  width: 0.78rem;
  height: 0.78rem;
  flex-shrink: 0;
}

.sidebar-nav-date {
  display: block;
  margin: 0;
  font-size: 0.75rem;
}

:global(.dark) .sidebar-nav-item {
  color: rgb(209 213 219);
}

:global(.dark) .sidebar-nav-item:hover {
  color: rgb(191 219 254);
}

:global(.dark) .sidebar-nav-submeta,
:global(.dark) .sidebar-nav-date {
  color: rgb(156 163 175);
}
</style>
