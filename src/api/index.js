import axios from 'axios'

// 创建Axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加统一的token等认证信息
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 统一处理错误
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// 使用 Markdown 适配器作为内容源
import { articles as mdArticles, categories as mdCategories, tags as mdTags, search as mdSearch } from './markdownAdapter'
// 评论仍然使用后端接口（如无后端可忽略）
import * as commentsAPI from './comments'

// 导出API（内容走本地 Markdown 适配器）
export const articles = mdArticles
export const categories = mdCategories
export const tags = mdTags
export const comments = commentsAPI
export const search = mdSearch

export default api