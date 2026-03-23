<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white font-sf-pro">文章管理</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">管理 docs/articles 下的 Markdown 文章</p>
        </div>

        <div class="flex items-center gap-2">
          <button class="primary-btn inline-flex items-center gap-2" @click="createArticle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            新增文章
          </button>
          <button class="secondary-btn" @click="goBack">返回设置</button>
        </div>
      </div>

      <div class="panel">
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">正在加载文章...</div>

        <div v-else-if="errorMessage" class="status-error mb-4">
          {{ errorMessage }}
        </div>

        <div v-if="!loading && articles.length > 0" class="article-list">
          <article v-for="article in articles" :key="article.id" class="article-card">
            <div class="row-main">
              <div class="row-left">
                <span class="item-title truncate">{{ article.title || article.id }}</span>
                <span class="item-id">ID: {{ article.id }}</span>
              </div>

              <div class="row-right">
                <span v-if="article.date" class="publish-time">{{ formatShortDate(article.date) }}</span>
                <div class="actions">
                  <button class="icon-btn" :title="'Edit ' + (article.title || article.id)" @click="editArticle(article.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button class="icon-btn danger" :title="'Delete ' + (article.title || article.id)" @click="removeArticle(article.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="!loading" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400 mb-4">暂无文章</p>
          <button class="primary-btn inline-flex items-center gap-2" @click="createArticle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            创建第一篇文章
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { deleteEditableArticle, listEditableArticles } from '../../api/articleEditor'

const router = useRouter()
const articles = ref([])
const loading = ref(false)
const errorMessage = ref('')

const fetchArticles = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    articles.value = await listEditableArticles()
  } catch (error) {
    console.error('加载文章列表失败:', error)
    errorMessage.value = error?.response?.data?.error || '加载失败。请确认当前在 pnpm dev 环境运行。'
  } finally {
    loading.value = false
  }
}

const createArticle = () => {
  router.push({ name: 'ArticleEditorCreate' })
}

const editArticle = (id) => {
  router.push({ name: 'ArticleEditorEdit', params: { id } })
}

const removeArticle = async (id) => {
  if (!confirm(`确定删除文章 ${id}.md 吗？`)) return

  try {
    await deleteEditableArticle(id)
    articles.value = articles.value.filter(article => article.id !== id)
  } catch (error) {
    console.error('删除文章失败:', error)
    alert(error?.response?.data?.error || '删除失败')
  }
}

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatShortDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const goBack = () => {
  router.push({ path: '/settings/profile' })
}

onMounted(() => {
  fetchArticles()
})
</script>

<style>
.container { min-height: calc(100vh - 8rem); }
.panel {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid rgb(243, 244, 246);
}
.dark .panel {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgb(55, 65, 81);
}
.primary-btn {
  padding: 0.625rem 1rem;
  background-color: rgb(59, 130, 246);
  color: #fff;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}
.primary-btn:hover { background-color: rgba(59, 130, 246, 0.9); }
.secondary-btn {
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: rgb(59, 130, 246);
  font-size: 0.875rem;
  transition: all 0.2s;
}
.secondary-btn:hover { background-color: rgba(59, 130, 246, 0.1); }
.article-list {
  display: grid;
  gap: 0.22rem;
}
.article-card {
  margin: 0;
  padding: 0.44rem 0.62rem;
  border-radius: 0.75rem;
  background-color: rgba(249, 250, 251, 0.7);
  border: 1px solid rgb(243, 244, 246);
}
.dark .article-card {
  background-color: rgba(55, 65, 81, 0.55);
  border-color: rgb(75, 85, 99);
}
.row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-width: 0;
}
.row-left {
  min-width: 0;
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
}
.item-title {
  display: block;
  margin: 0;
  min-width: 0;
  max-width: 100%;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.25;
  color: rgb(15, 23, 42);
}
.dark .item-title {
  color: rgb(226, 232, 240);
}
.item-id {
  flex-shrink: 0;
  font-size: 0.68rem;
  color: rgb(100, 116, 139);
  white-space: nowrap;
}
.dark .item-id {
  color: rgb(148, 163, 184);
}
.row-right {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
}
.publish-time {
  font-size: 0.68rem;
  color: rgb(100, 116, 139);
  white-space: nowrap;
}
.dark .publish-time {
  color: rgb(148, 163, 184);
}
.actions {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
}
.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.22rem;
  font-size: 0.7rem;
  color: rgb(107, 114, 128);
}
.dark .meta-line { color: rgb(156, 163, 175); }
.meta-line span {
  line-height: 1.2;
}
.desc-text {
  margin-top: 0.34rem;
  font-size: 0.82rem;
  color: rgb(75, 85, 99);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .desc-text { color: rgb(209, 213, 219); }
.tag-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  margin-top: 0.42rem;
}
.badge,
.tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}
.badge {
  background-color: rgba(59, 130, 246, 0.12);
  color: rgb(37, 99, 235);
}
.tag {
  background-color: rgba(156, 163, 175, 0.2);
  color: rgb(75, 85, 99);
}
.dark .tag {
  background-color: rgba(107, 114, 128, 0.35);
  color: rgb(209, 213, 219);
}
.icon-btn {
  width: 1.68rem;
  height: 1.68rem;
  padding: 0;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.45);
  color: rgb(51, 65, 85);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  line-height: 0;
}
.icon-btn:hover {
  color: rgb(37, 99, 235);
  border-color: rgba(59, 130, 246, 0.45);
  background: rgba(59, 130, 246, 0.08);
}
.action-icon {
  width: 0.86rem;
  height: 0.86rem;
  display: block;
  stroke-width: 2.15;
  fill: none;
}
.icon-btn.danger {
  color: rgb(220, 38, 38);
  border-color: rgba(239, 68, 68, 0.35);
}
.icon-btn.danger:hover {
  color: rgb(185, 28, 28);
  background: rgba(239, 68, 68, 0.1);
}
.status-error {
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(185, 28, 28);
}
@media (max-width: 900px) {
  .item-id {
    display: none;
  }
  .publish-time {
    display: none;
  }
}

.font-sf-pro {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
</style>