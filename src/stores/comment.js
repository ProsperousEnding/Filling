import { defineStore } from 'pinia'
import { getArticleComments, addComment, replyComment } from '../api/comments'

export const useCommentStore = defineStore('comment', {
  state: () => ({
    comments: [],
    total: 0,
    loading: false,
    error: null
  }),
  
  actions: {
    // 获取文章评论
    async fetchComments(articleId, params = { page: 1, pageSize: 10 }) {
      this.loading = true
      try {
        const response = await getArticleComments(articleId, params)
        this.comments = response.data
        this.total = response.total
        return response
      } catch (error) {
        this.error = error.message || '获取评论失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 添加评论
    async addNewComment(articleId, data) {
      this.loading = true
      try {
        const response = await addComment(articleId, data)
        // 更新评论列表
        this.comments = [response, ...this.comments]
        this.total += 1
        return response
      } catch (error) {
        this.error = error.message || '添加评论失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 回复评论
    async replyToComment(articleId, commentId, data) {
      this.loading = true
      try {
        const response = await replyComment(articleId, commentId, data)
        
        // 更新评论列表中的回复
        const commentIndex = this.comments.findIndex(comment => comment.id === commentId)
        if (commentIndex !== -1) {
          const comment = this.comments[commentIndex]
          if (!comment.replies) {
            comment.replies = []
          }
          comment.replies.push(response)
          this.comments[commentIndex] = { ...comment }
        }
        
        return response
      } catch (error) {
        this.error = error.message || '回复评论失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 清除评论
    clearComments() {
      this.comments = []
      this.total = 0
    }
  }
}) 