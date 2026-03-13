<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white font-sf-pro">个人日志</h1>
        <button class="secondary-btn" @click="goBack">返回设置</button>
      </div>
      
      <div class="panel">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title">我的日志</h2>
          <button class="primary-btn" @click="addLog">新建日志</button>
        </div>
        
        <div v-if="logs.length > 0" class="space-y-4">
          <div v-for="(log, index) in logs" :key="log.id" class="log-card">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{{ log.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ log.content }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <span>{{ formatDate(log.date) }}</span>
                </div>
              </div>
              <div class="flex gap-2 ml-4">
                <button class="text-sm text-primary hover:text-primary/80" @click="editLog(log)">编辑</button>
                <button class="text-sm text-red-500 hover:text-red-400" @click="deleteLog(log.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400 mb-4">还没有任何日志记录</p>
          <button class="primary-btn" @click="addLog">创建第一条日志</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const logs = ref([])

onMounted(() => {
  const stored = localStorage.getItem('personal-logs')
  if (stored) {
    logs.value = JSON.parse(stored)
  }
})

const saveLogs = () => {
  localStorage.setItem('personal-logs', JSON.stringify(logs.value))
}

const addLog = () => {
  const title = prompt('请输入日志标题：')
  if (title) {
    const content = prompt('请输入日志内容：')
    if (content) {
      logs.value.unshift({
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toISOString()
      })
      saveLogs()
    }
  }
}

const editLog = (log) => {
  const title = prompt('编辑标题：', log.title)
  if (title !== null) {
    const content = prompt('编辑内容：', log.content)
    if (content !== null) {
      log.title = title
      log.content = content
      saveLogs()
    }
  }
}

const deleteLog = (id) => {
  if (confirm('确定要删除这条日志吗？')) {
    logs.value = logs.value.filter(log => log.id !== id)
    saveLogs()
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push({ path: '/settings/profile' })
}
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
.section-title { 
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
.dark .section-title { color: rgb(243, 244, 246); }
.primary-btn { 
  padding: 0.625rem 1rem;
  background-color: rgb(59, 130, 246);
  color: white;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}
.primary-btn:hover { background-color: rgba(59, 130, 246, 0.9); }
.secondary-btn { 
  padding: 0.375rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: rgb(59, 130, 246);
  font-size: 0.875rem;
  transition: all 0.2s;
}
.secondary-btn:hover { background-color: rgba(59, 130, 246, 0.1); }
.log-card { 
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: rgba(249, 250, 251, 0.7);
  border: 1px solid rgb(243, 244, 246);
}
.dark .log-card {
  background-color: rgba(55, 65, 81, 0.6);
  border-color: rgb(75, 85, 99);
}
.font-sf-pro { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif; }
</style>
