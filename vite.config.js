import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), // Vue 3 核心插件
    vueDevTools(), // Vue 开发者工具（调试用）
    VueSetupExtend(), // 支持 <script setup name="xxx"> 语法
    Components({
      resolvers: [NaiveUiResolver()], // 自动按需引入 Naive UI 组件，无需手动 import
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Replace with your actual backend URL
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/app/, '') // Uncomment if needed
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
