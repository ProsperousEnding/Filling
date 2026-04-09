<template>
  <div class="menu-page-context">
    <div
      v-if="page.contentHtml"
      class="menu-page-context-copy article-content prose prose-lg dark:prose-invert max-w-none"
      v-html="page.contentHtml"
    ></div>

    <div v-else-if="contentBlocks.length > 0" class="menu-page-context-copy">
      <p
        v-for="(block, index) in contentBlocks"
        :key="`${page.key}-copy-${index}`"
        class="menu-page-context-paragraph"
      >
        {{ block }}
      </p>
    </div>

    <div v-if="page.items.length > 0" class="menu-page-context-list">
      <component
        :is="resolveItemTag(item)"
        v-for="item in page.items"
        :key="item.key"
        :to="item.to || undefined"
        :href="item.href || undefined"
        class="menu-page-context-item theme-list-row"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
      >
        <p v-if="item.meta" class="menu-page-item-meta theme-muted-note">{{ item.meta }}</p>
        <h2 class="menu-page-item-title theme-section-title">{{ item.title }}</h2>
        <p v-if="item.description" class="menu-page-item-description theme-page-description">{{ item.description }}</p>
      </component>
    </div>

    <div
      v-if="!page.contentHtml && contentBlocks.length === 0 && page.items.length === 0"
      class="theme-empty-state py-8 text-center"
    >
      <p class="theme-empty-text">这个页面还没有配置内容。</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  page: {
    type: Object,
    required: true
  },
  contentBlocks: {
    type: Array,
    default: () => []
  }
})

function resolveItemTag(item) {
  if (item?.href) return 'a'
  if (item?.to) return 'router-link'
  return 'article'
}
</script>
