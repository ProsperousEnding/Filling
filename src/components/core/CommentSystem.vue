<template>
  <div class="comment-system">
    <!-- 评论标题 -->
    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
      评论
      <span class="text-gray-500 dark:text-gray-400 text-sm font-normal">({{ total }})</span>
    </h3>
    
    <!-- 评论表单 -->
    <div v-if="config.enableComments" class="mb-8">
      <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">发表评论</h4>
        
        <!-- 评论回复提示 -->
        <div v-if="replyTo" class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex justify-between items-center">
            <div class="text-sm">
              回复给: <span class="font-medium">{{ replyTo.author }}</span>
            </div>
            <button 
              @click="cancelReply" 
              class="text-gray-500 hover:text-primary"
            >
              取消回复
            </button>
          </div>
        </div>
        
        <!-- 评论表单 -->
        <form @submit.prevent="submitComment">
          <!-- 评论内容 -->
          <div class="mb-4">
            <textarea 
              v-model="commentForm.content" 
              rows="4" 
              placeholder="请输入评论内容..." 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- 作者姓名 -->
            <div>
              <input 
                v-model="commentForm.author" 
                type="text" 
                placeholder="昵称" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <!-- 作者邮箱 -->
            <div>
              <input 
                v-model="commentForm.email" 
                type="email" 
                placeholder="邮箱（不会公开）" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="flex justify-end">
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">提交中...</span>
              <span v-else>{{ replyTo ? '提交回复' : '提交评论' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div>
      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="inline-flex items-center text-gray-500">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          加载评论中...
        </div>
      </div>
      
      <!-- 暂无评论 -->
      <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500">
        暂无评论，快来成为第一个评论的人吧！
      </div>
      
      <!-- 评论列表 -->
      <div v-else class="space-y-6">
        <div 
          v-for="comment in comments" 
          :key="comment.id" 
          class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6"
        >
          <!-- 评论头部 -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <img 
                :src="getAvatarUrl(comment.email)" 
                :alt="comment.author" 
                class="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h4 class="text-md font-medium text-gray-900 dark:text-gray-100">
                  {{ comment.author }}
                </h4>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(comment.createdAt) }}
                </span>
              </div>
            </div>
            
            <!-- 回复按钮 -->
            <button 
              v-if="config.enableComments" 
              @click="reply(comment)" 
              class="text-sm text-primary hover:text-blue-600"
            >
              回复
            </button>
          </div>
          
          <!-- 评论内容 -->
          <div class="text-gray-700 dark:text-gray-300 mb-4">
            {{ comment.content }}
          </div>
          
          <!-- 评论回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-4">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md"
            >
              <!-- 回复头部 -->
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center">
                  <img 
                    :src="getAvatarUrl(reply.email)" 
                    :alt="reply.author" 
                    class="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ reply.author }}
                    </h5>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(reply.createdAt) }}
                    </span>
                  </div>
                </div>
                
                <!-- 回复按钮 -->
                <button 
                  v-if="config.enableComments" 
                  @click="reply(comment, reply)" 
                  class="text-xs text-primary hover:text-blue-600"
                >
                  回复
                </button>
              </div>
              
              <!-- 回复内容 -->
              <div class="text-sm text-gray-700 dark:text-gray-300">
                <span v-if="reply.replyTo" class="text-primary">@{{ reply.replyTo }}</span>
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <button 
          @click="loadMore"
          class="btn-secondary"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore">加载中...</span>
          <span v-else>加载更多</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCommentStore } from '../../stores/comment'
import { useConfigStore } from '../../stores/config'

// 组件属性
const props = defineProps({
  articleId: {
    type: String,
    required: true
  }
})

// 获取store
const commentStore = useCommentStore()
const configStore = useConfigStore()
const config = configStore

// 状态
const comments = ref([])
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const pageSize = computed(() => configStore.pageSize)

// 评论表单
const commentForm = ref({
  content: '',
  author: '',
  email: ''
})

// 回复相关
const replyTo = ref(null)

// 初始化评论
onMounted(async () => {
  loadComments()
  
  // 加载上次评论者信息（如果有的话）
  const savedAuthor = localStorage.getItem('vue-blog-comment-author')
  const savedEmail = localStorage.getItem('vue-blog-comment-email')
  if (savedAuthor) commentForm.value.author = savedAuthor
  if (savedEmail) commentForm.value.email = savedEmail
})

// 加载评论
const loadComments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    const response = await commentStore.fetchComments(props.articleId, params)
    comments.value = response.data || []
    total.value = response.total || 0
    hasMore.value = currentPage.value * pageSize.value < total.value
  } catch (error) {
    console.error('加载评论失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多评论
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  try {
    currentPage.value++
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    const response = await commentStore.fetchComments(props.articleId, params)
    comments.value = [...comments.value, ...(response.data || [])]
    hasMore.value = currentPage.value * pageSize.value < total.value
  } catch (error) {
    console.error('加载更多评论失败:', error)
    currentPage.value--
  } finally {
    loadingMore.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentForm.value.content.trim()) return
  submitting.value = true
  
  try {
    // 保存评论者信息
    localStorage.setItem('vue-blog-comment-author', commentForm.value.author)
    localStorage.setItem('vue-blog-comment-email', commentForm.value.email)
    
    if (replyTo.value) {
      // 提交回复
      await commentStore.replyToComment(
        props.articleId, 
        replyTo.value.id, 
        {
          ...commentForm.value,
          replyTo: replyTo.value.replyAuthor || replyTo.value.author
        }
      )
    } else {
      // 提交新评论
      await commentStore.addNewComment(props.articleId, commentForm.value)
    }
    
    // 清空表单和回复状态
    commentForm.value.content = ''
    replyTo.value = null
    
    // 重新加载评论（回到第一页）
    currentPage.value = 1
    await loadComments()
  } catch (error) {
    console.error('提交评论失败:', error)
    alert('评论提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 回复评论
const reply = (comment, replyComment = null) => {
  if (replyComment) {
    replyTo.value = {
      id: comment.id,
      author: replyComment.author,
      replyAuthor: replyComment.author
    }
  } else {
    replyTo.value = {
      id: comment.id,
      author: comment.author
    }
  }
  
  // 滚动到评论表单
  const commentForm = document.querySelector('.comment-system form')
  if (commentForm) {
    commentForm.scrollIntoView({ behavior: 'smooth' })
  }
}

// 取消回复
const cancelReply = () => {
  replyTo.value = null
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取头像URL
const getAvatarUrl = (email) => {
  if (!email) return 'https://via.placeholder.com/80'
  const md5 = require('md5')
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=80`
}
</script> 