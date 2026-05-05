<template>
  <div class="api-docs-container">
    <n-card :bordered="false" class="api-docs-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">📚 API 文档</span>
            <n-tag type="info" size="small" style="margin-left: 8px"> Swagger UI </n-tag>
          </div>
          <n-space>
            <n-button size="small" @click="openInNewTab">
              <template #icon>
                <span></span>
              </template>
              新窗口打开
            </n-button>
            <n-button size="small" @click="refreshIframe">
              <template #icon>
                <span></span>
              </template>
              刷新
            </n-button>
          </n-space>
        </div>
      </template>

      <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
        API 文档由 Swagger UI 生成，首次加载可能需要几秒钟。您也可以点击"新窗口打开"获得更好的体验。
      </n-alert>

      <div class="iframe-wrapper">
        <div v-if="error" class="error-overlay">
          <p style="color: #ff4d4f; font-size: 16px">️ API 文档加载失败</p>
          <p style="color: #666; margin-top: 8px">{{ error }}</p>
          <n-space style="margin-top: 16px">
            <n-button type="primary" @click="refreshIframe"> 重试 </n-button>
            <n-button @click="openInNewTab"> 新窗口打开 </n-button>
          </n-space>
        </div>
        <iframe
          v-show="!error"
          ref="iframeRef"
          :src="iframeSrc"
          frameborder="0"
          class="logs-iframe"
          allow="cross-origin-isolated"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          @load="handleLoad"
        ></iframe>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { NCard, NButton, NAlert, NTag, NSpace, useMessage } from 'naive-ui'
import { API_PREFIX } from '@/utils/constants'

const msgApi = useMessage()
const iframeSrc = ref(`${API_PREFIX}-docs`)
const iframeRef = ref(null)
const error = ref('')
let loadTimeout = null

onMounted(() => {
  console.log('📚 API 文档地址:', iframeSrc.value)

  loadTimeout = setTimeout(() => {
    if (!error.value) {
      error.value = '加载超时，建议使用"新窗口打开"功能'
      msgApi.warning('API 文档加载超时')
    }
  }, 15000)
})

onUnmounted(() => {
  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }
})

const handleLoad = () => {
  console.log('✅ iframe 加载完成')
  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }
  error.value = ''
}

const openInNewTab = () => {
  // 直接打开远程服务器的 API 文档地址
  const url = 'http://8.153.193.2:65432/koa2api-docs'
  window.open(url, '_blank')
}

const refreshIframe = () => {
  error.value = ''

  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }

  const currentSrc = iframeSrc.value
  iframeSrc.value = ''

  setTimeout(() => {
    loadTimeout = setTimeout(() => {
      if (!error.value) {
        error.value = '加载超时，建议使用"新窗口打开"功能'
        msgApi.warning('API 文档加载超时')
      }
    }, 15000)

    iframeSrc.value = currentSrc
  }, 50)
}
</script>

<style scoped>
.api-docs-container {
  height: 100%;
  padding: 16px;
}

.api-docs-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.iframe-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 260px);
  min-height: 500px;
}

.logs-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}
</style>
