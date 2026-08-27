<template>
  <div class="sidebar-section">
    <div class="sidebar-section-header">
      <h4 class="sidebar-section-title">{{ title }}</h4>
      <span
        v-if="items && showItemCount"
        class="sidebar-section-count"
        :aria-label="`共 ${items} 项`"
      >
        {{ items }}
      </span>
    </div>

    <div class="sidebar-section-content">
      <div class="sidebar-section-surface">
        <slot></slot>
      </div>
    </div>

    <RouterLink
      v-if="viewAllTo"
      :to="viewAllTo"
      class="sidebar-section-view-all"
    >
      {{ viewAllLabel }}
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Number,
    default: 0
  },
  showItemCount: {
    type: Boolean,
    default: false
  },
  viewAllTo: {
    type: String,
    default: ''
  },
  viewAllLabel: {
    type: String,
    default: '查看全部'
  }
})
</script>

<style scoped>
.sidebar-section {
  position: relative;
}

.sidebar-section + .sidebar-section {
  margin-top: 0;
}

.sidebar-section::before {
  content: none;
}

.sidebar-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.62rem;
}

.sidebar-section-title {
  margin: 0;
  font-size: 0.84375rem;
  line-height: 1.25;
  font-weight: 650;
  letter-spacing: 0;
  text-transform: none;
  color: var(--theme-heading-color);
  white-space: nowrap;
}

.sidebar-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--theme-text-faint);
  font-size: 0.6875rem;
  line-height: 1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sidebar-section-content {
  transition: opacity 0.2s ease;
}

.sidebar-section-surface {
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.sidebar-section-view-all {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  margin-top: 0.55rem;
  color: var(--theme-link);
  font-size: 0.76rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.16s ease;
}

.sidebar-section-view-all:hover {
  color: var(--theme-link-hover);
}
</style>
