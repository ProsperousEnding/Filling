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

/**
 * 设置API基础URL
 * @param {string} baseURL - API基础URL
 */
export const setBaseUrl = (baseURL) => {
  api.defaults.baseURL = baseURL
}

// 导入API模块
import * as articlesAPI from './articles'
import * as categoriesAPI from './categories'
import * as tagsAPI from './tags'
import * as commentsAPI from './comments'
import * as searchAPI from './search'

// 导出API
export const articles = articlesAPI
export const categories = categoriesAPI
export const tags = tagsAPI
export const comments = commentsAPI
export const search = searchAPI

export default api