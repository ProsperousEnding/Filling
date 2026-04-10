<template>
  <nav class="site-mobile-nav-list flex flex-col space-y-2">
    <component
      :is="item.external ? 'a' : RouterLink"
      v-for="item in normalizedItems"
      :key="item.key"
      :to="item.external ? undefined : item.to"
      :href="item.external ? item.href : undefined"
      class="site-mobile-nav-link px-3 py-2 rounded-lg transition-all"
      :target="item.external ? '_blank' : undefined"
      :rel="item.external ? 'noreferrer' : undefined"
      @click="emit('select', item)"
    >
      {{ item.label }}
    </component>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map((item, index) => ({
      key: item?.key || item?.path || item?.name || `menu-item-${index}`,
      label: item?.name || item?.label || '',
      to: item?.to || item?.path || '/',
      href: item?.href || '',
      external: item?.external === true
    }))
    .filter(item => item.label)
))
</script>

<style scoped>
.site-mobile-nav-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.85);
}

.site-mobile-nav-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.96);
}

:global(.dark) .site-mobile-nav-link {
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(71, 85, 105, 0.85);
}

:global(.dark) .site-mobile-nav-link:hover {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.96);
}
</style>
