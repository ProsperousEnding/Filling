import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@blog': resolve(__dirname, 'blog'),
      '@site': resolve(__dirname, 'src/site'),
      '@framework': resolve(__dirname, 'src/framework')
    }
  },
  plugins: [vue()],
  build: {
    outDir: 'dist-lib',
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/framework/index.js'),
      name: 'VueBlogFramework',
      fileName: format => format === 'umd'
        ? 'vue-blog-framework.umd.cjs'
        : 'vue-blog-framework.es.js',
      cssFileName: 'style'
    },
    rollupOptions: {
      // 排除不打包的依赖
      external: ['vue', 'vue-router', 'pinia'],
      output: {
        exports: 'named',
        // 为外部依赖提供全局变量
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia'
        }
      }
    }
  }
}) 
