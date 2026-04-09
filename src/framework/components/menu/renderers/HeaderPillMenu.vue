<template>
  <nav class="site-header-nav hidden md:flex items-center">
    <div class="site-header-nav-shell rounded-full px-1 py-1 flex items-center">
      <component
        :is="item.external ? 'a' : 'router-link'"
        v-for="item in normalizedItems"
        :key="item.key"
        :to="item.external ? undefined : item.to"
        :href="item.external ? item.href : undefined"
        class="site-header-nav-link relative px-4 py-1.5 text-sm rounded-full transition-all duration-200"
        :class="{ 'site-header-nav-link-active': isActive(item) }"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
      >
        {{ item.label }}
      </component>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  activePath: {
    type: String,
    default: ''
  }
})

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map((item, index) => ({
      key: item?.key || item?.path || item?.name || `menu-item-${index}`,
      label: item?.name || item?.label || '',
      to: item?.to || item?.path || '/',
      href: item?.href || '',
      external: item?.external === true,
      matchPath: item?.matchPath || item?.path || item?.to || '/'
    }))
    .filter(item => item.label)
))

function isActive(item) {
  const currentPath = String(props.activePath || '')
  const targetPath = String(item.matchPath || item.to || '')

  if (!currentPath || !targetPath) {
    return false
  }

  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
</script>

<style scoped>
.site-header-nav-shell {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.site-header-nav-link {
  color: rgb(71 85 105);
}

.site-header-nav-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.92);
}

.site-header-nav-link-active {
  color: rgb(15 23 42);
  background: rgb(255 255 255);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

:global(.dark) .site-header-nav-shell {
  background: rgba(15, 23, 42, 0.68);
  border-color: rgba(71, 85, 105, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global(.dark) .site-header-nav-link {
  color: rgb(203 213 225);
}

:global(.dark) .site-header-nav-link:hover {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.92);
}

:global(.dark) .site-header-nav-link-active {
  color: rgb(255 255 255);
  background: rgba(59, 130, 246, 0.22);
  box-shadow: none;
}
</style>
