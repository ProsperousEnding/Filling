<template>
  <footer class="site-footer mt-auto">
    <div class="blog-container site-footer-inner py-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div v-if="friendLinks.length > 0" class="site-footer-links flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span class="site-footer-label">友情链接</span>
          <a
            v-for="link in friendLinks"
            :key="link.id"
            :href="link.url"
            :title="link.description || link.name"
            target="_blank"
            rel="noreferrer"
            class="site-footer-friend-link inline-flex items-center transition-colors"
          >
            {{ link.name }}
          </a>
        </div>

        <div v-if="config.footerText" class="site-footer-text text-sm md:text-right">
          {{ config.footerText }}
        </div>
      </div>
      
      <!-- 底部说明 -->
      <div v-if="config.footerNote" class="site-footer-note mt-6 text-center text-sm">
        <p>{{ config.footerNote }}</p>
      </div>

      <TrustedHtmlBlock
        v-if="config.footerSnippetHtml"
        :html="config.footerSnippetHtml"
        class="site-footer-snippet mt-4 text-center text-sm"
      />
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import TrustedHtmlBlock from '../core/TrustedHtmlBlock.vue'
import { useConfigStore } from '../../stores/config'

// 获取配置store
const configStore = useConfigStore()
const config = configStore

function normalizeExternalUrl(value) {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const friendLinks = computed(() => (
  Array.isArray(config.friendLinks)
    ? config.friendLinks
      .map((link) => {
        const name = String(link?.name || '').trim()
        const url = normalizeExternalUrl(String(link?.url || '').trim())
        const description = String(link?.description || '').trim()

        if (!name || !url) {
          return null
        }

        return {
          id: link.id || `${name}-${url}`,
          name,
          url,
          description
        }
      })
      .filter(Boolean)
    : []
))
</script> 

<style scoped>
.site-footer-snippet {
  color: rgb(100 116 139);
  line-height: 1.8;
}

.site-footer-snippet :deep(a) {
  color: rgb(37 99 235);
  text-decoration: none;
}

.site-footer-snippet :deep(a:hover) {
  text-decoration: underline;
}

.site-footer-snippet :deep(p) {
  margin: 0;
}

.site-footer-snippet :deep(p + p) {
  margin-top: 0.55rem;
}
</style>
