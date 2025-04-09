<template>
  <div class="sidebar-section mb-8">
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium text-gray-900 dark:text-gray-100 font-sf-pro">{{ title }}</h4>
      <span 
        v-if="items && showItemCount" 
        class="text-xs bg-gray-100/70 dark:bg-gray-700/70 backdrop-blur-sm px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400"
      >
        {{ items }}
      </span>
    </div>
    
    <div class="sidebar-section-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
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

.sidebar-section::before {
  content: '';
  position: absolute;
  top: 0.25rem;
  left: -1rem;
  height: 1rem;
  width: 0.25rem;
  border-radius: 0.125rem;
  background-color: rgb(var(--color-primary) / 0.5);
  opacity: 0;
  transform: translateX(-0.5rem);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.sidebar-section:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.sidebar-section-content {
  transition: opacity 0.2s ease;
}
</style> 