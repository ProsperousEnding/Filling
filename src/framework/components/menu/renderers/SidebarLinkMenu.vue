<template>
  <ul class="sidebar-nav-list" :class="{ 'sidebar-nav-list-tags': variant === 'tags' }">
    <li v-for="item in normalizedItems" :key="item.key">
      <component
        :is="item.external ? 'a' : RouterLink"
        :to="item.external ? undefined : item.to"
        :href="item.external ? item.href : undefined"
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item-tag': variant === 'tags' }"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
        active-class="sidebar-nav-item-active"
      >
        <span class="sidebar-nav-label" :class="{ 'sidebar-nav-label-shift': variant !== 'tags' }">
          {{ item.label }}
        </span>
        <span v-if="item.badge" :class="variant === 'tags' ? 'sidebar-tag-count' : 'sidebar-nav-badge'">
          {{ item.badge }}
        </span>
      </component>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  variant: {
    type: String,
    default: 'default'
  }
})

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map((item, index) => {
      return {
        key: item?.key || item?.id || item?.slug || item?.name || `sidebar-menu-item-${index}`,
        label: item?.label || item?.name || item?.title || '',
        badge: item?.badge || '',
        to: item?.to || item?.path || '/',
        href: item?.href || '',
        external: item?.external === true
      }
    })
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

.sidebar-nav-list > li + li {
  margin-top: 0.22rem;
}

.sidebar-nav-list-tags {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sidebar-nav-list-tags > li + li {
  margin-top: 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 0.5rem;
  min-height: 1.8rem;
  padding: 0;
  border-radius: 0;
  color: rgb(71 85 105);
  font-size: 0.98rem;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.sidebar-nav-item-tag {
  justify-content: flex-start;
  min-height: auto;
  width: auto;
  padding: 0.26rem 0.66rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  border: 1px solid rgba(226, 232, 240, 0.92);
  font-size: 0.8rem;
  line-height: 1.2;
}

.sidebar-nav-item:hover {
  background: transparent;
  color: rgb(37 99 235);
}

.sidebar-nav-item-active {
  background: transparent;
  color: rgb(37 99 235);
}

.sidebar-nav-label {
  min-width: 0;
  flex: 1 1 auto;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.34rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  color: rgb(148 163 184);
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 500;
  flex-shrink: 0;
}

.sidebar-tag-count {
  color: currentColor;
  opacity: 0.45;
  font-size: 0.7rem;
}

:global(.dark) .sidebar-nav-item {
  color: rgb(209 213 219);
}

:global(.dark) .sidebar-nav-item-tag,
:global(.dark) .sidebar-nav-badge {
  background: rgba(30, 41, 59, 0.86);
  border-color: rgba(71, 85, 105, 0.82);
}

:global(.dark) .sidebar-tag-count {
  color: rgb(156 163 175);
}

:global(.dark) .sidebar-nav-item-active {
  background: transparent;
  color: rgb(191 219 254);
}

:global(.dark) .sidebar-nav-item:hover {
  background: rgba(55, 65, 81, 0.72);
  color: rgb(191 219 254);
}
</style>
