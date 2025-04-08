# Vue博客框架

这是一个基于Vue3的可集成博客框架，旨在提供一个易于集成、可定制的博客解决方案，支持各类网站轻松添加博客功能。

## 技术栈

- **核心框架**: Vue 3
- **开发语言**: JavaScript
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP客户端**: Axios
- **CSS框架**: Tailwind CSS

## 主要功能

- 文章列表展示
- 文章详情页
- 分类/标签系统
- 评论系统
- 搜索功能
- 归档功能
- 响应式设计
- 自定义主题
- Markdown支持
- 代码高亮

## 快速开始

### 安装

```bash
npm install vue-blog-framework
```

### 基本使用

#### 作为Vue插件使用

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import VueBlog from 'vue-blog-framework'
import 'vue-blog-framework/style.css'

const app = createApp(App)
app.use(VueBlog, {
  // 配置选项
  apiBaseUrl: 'https://api.example.com',
  theme: 'light',
  pageSize: 10
})
app.mount('#app')
```

#### 使用组件

```javascript
import { BlogContainer } from 'vue-blog-framework'
import 'vue-blog-framework/style.css'

export default {
  components: {
    BlogContainer
  },
  setup() {
    return {
      blogConfig: {
        apiBaseUrl: 'https://api.example.com',
        theme: 'dark',
        pageSize: 8
      }
    }
  }
}
```

```html
<template>
  <BlogContainer :config="blogConfig">
    <!-- 自定义内容 -->
  </BlogContainer>
</template>
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建演示应用
npm run build

# 构建库
npm run build:lib
```

## 贡献

欢迎提交Issue和Pull Request。

## 许可证

[MIT](LICENSE)
