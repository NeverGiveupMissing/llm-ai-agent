import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'

// 🏢 引入企业级工程化插件
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// const target = 'http://127.0.0.1:65432'
const target = 'http://yumanyi.top'

export default defineConfig(({ mode }) => {
  // 获取当前是否为生产环境打包
  const isProd = mode === 'production'

  return {
    plugins: [
      vue(),
      // 仅在非生产环境开启开发者工具，提升生产打包速度
      !isProd && vueDevTools(),
      VueSetupExtend(),
      Components({
        resolvers: [NaiveUiResolver()],
      }),

      // 🛑 【企业级优化 1】：生产环境开启 Gzip 静态预压缩
      isProd &&
        viteCompression({
          verbose: true, // 是否在控制台输出压缩结果
          disable: false, // 是否禁用
          threshold: 10240, // 体积大于 10KB 的文件才进行压缩
          algorithm: 'gzip', // 压缩算法
          ext: '.gz', // 生成的文件后缀
        }),

      // 📊 【企业级优化 2】：打包体积可视化分析（编译后在根目录生成 stats.html）
      isProd &&
        visualizer({
          open: false, // 打包完成后是否自动打开浏览器
          filename: 'stats.html',
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean), // 过滤掉返回 false 的插件

    server: {
      host: '0.0.0.0', // 允许局域网内其他设备通过 IP 访问（方便手机或他人联调）
      port: 5173,
      proxy: {
        '/koa2api': { target, changeOrigin: true },
        '/koa2api-docs': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // ⚡ 【企业级优化 3】：全面打磨构建配置
    build: {
      target: 'es2015', // 转换为兼容性较好的标准
      chunkSizeWarningLimit: 1000, // 提升大文件警告阈值
      reportCompressedSize: false, // 禁用计算压缩大小，能显著缩短大型项目的打包时间
      sourcemap: false, // 生产环境关闭 sourcemap，避免源码暴露并减小体积

      // 🧹 【企业级优化 4】：利用 Terser 彻底拔除线上代码的 Debug 残留
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除所有 console.log
          drop_debugger: true, // 生产环境移除所有 debugger
        },
      },

      // 📦 【企业级优化 5】：精细化三方依赖拆分策略（Anti-Vendor Collapse）
      rollupOptions: {
        output: {
          // 规范静态资源打包归类：不让图片、字体、js、css 乱哄哄地堆在根目录
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',

          // 对大文件进行防木桶效应拆分，避免一个 vendor 包过大
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. 抽离 UI 组件库（体积最大，独立缓存）
              if (id.includes('naive-ui')) {
                return 'naive-ui-vendor'
              }
              // 2. 抽离 Vue 生态核心基础设施（Vue, Router, Pinia）
              if (id.includes('vue') || id.includes('@vue')) {
                return 'vue-core-vendor'
              }
              // 3. 抽离图标库（体积大、更新极少，独立缓存收益极高）
              if (id.includes('@vicons')) {
                return 'icons-vendor'
              }
              // 4. 抽离 Markdown/代码高亮（仅在 Chat 页面使用，按需加载）
              if (id.includes('markdown-it') || id.includes('highlight.js')) {
                return 'markdown-vendor'
              }
              // 5. 抽离常用的全栈工具库（如 axios, crypto-js, lodash）
              if (id.includes('axios') || id.includes('lodash') || id.includes('crypto-js')) {
                return 'utils-vendor'
              }
              // 6. 其余兜底放入公共三方包
              return 'common-vendor'
            }
          },
        },
      },
    },
  }
})
