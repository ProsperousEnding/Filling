import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VueBlogFramework',
      fileName: (format) => `vue-blog-framework.${format}.js`
    },
    rollupOptions: {
      // 排除不打包的依赖
      external: ['vue', 'vue-router', 'pinia', 'axios'],
      output: {
        // 为外部依赖提供全局变量
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
          axios: 'axios'
        }
      }
    }
  }
}) 