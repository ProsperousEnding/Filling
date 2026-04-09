<template>
  <div class="sidebar-section">
    <div class="sidebar-section-header">
      <h4 class="sidebar-section-title">{{ title }}</h4>
      <span v-if="items && showItemCount" class="sidebar-section-count">
        {{ items }}
      </span>
    </div>

    <div class="sidebar-section-content">
      <div class="sidebar-section-surface">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  }
})
</script>

<style scoped>
.sidebar-section {
  position: relative;
}

.sidebar-section + .sidebar-section {
  margin-top: 0.95rem;
}

.sidebar-section::before {
  content: none;
}

.sidebar-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.72rem;
}

.sidebar-section-title {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  color: rgb(30 41 59);
  white-space: nowrap;
}

.sidebar-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.38rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: rgb(148 163 184);
  font-size: 0.7rem;
  line-height: 1;
  font-weight: 500;
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

.dark .sidebar-section-title {
  color: rgb(226 232 240);
}

.dark .sidebar-section-count {
  background: rgba(30, 41, 59, 0.88);
  border-color: rgba(71, 85, 105, 0.82);
  color: rgb(156 163 175);
}
</style>
