<template>
  <div class="logs-container">
    <n-card :bordered="false" class="logs-card">
      <template #header>
        <div class="card-header">
          <span>API 文档</span>
          <n-button size="small" @click="refreshIframe" :loading="loading">
            <template #icon>
              <span style="font-size: 16px">🔄</span>
            </template>
            刷新
          </n-button>
        </div>
      </template>

      <div class="iframe-wrapper">
        <div v-if="loading" class="loading-overlay">
          <n-spin size="large" />
          <p>加载中...</p>
        </div>
        <iframe
          ref="iframeRef"
          :src="iframeSrc"
          frameborder="0"
          class="logs-iframe"
          @load="handleLoad"
        ></iframe>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NCard, NButton, NSpin } from 'naive-ui'
import { API_PREFIX } from '@/utils/constants'

const iframeSrc = ref(`${API_PREFIX}-docs`)
const iframeRef = ref(null)
const loading = ref(true)

const handleLoad = () => {
  loading.value = false
}

const refreshIframe = () => {
  loading.value = true
  const currentSrc = iframeSrc.value
  iframeSrc.value = ''
  setTimeout(() => {
    iframeSrc.value = currentSrc
  }, 100)
}
</script>

<style scoped>
.logs-container {
  height: 100%;
  padding: 16px;
}

.logs-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.iframe-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.logs-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay {
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
  gap: 16px;
}

.loading-overlay p {
  margin: 0;
  color: #666;
}
</style>
