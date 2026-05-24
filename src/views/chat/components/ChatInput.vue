<template>
  <div class="chat-input-wrapper">
    <div class="input-area">
      <div class="input-container">
        <n-input
          ref="inputRef"
          v-model:value="inputValue"
          type="textarea"
          :placeholder="placeholder"
          :autosize="{ minRows: 1, maxRows: 8 }"
          :disabled="loading"
          @keydown.enter.exact.prevent="handleSend"
        />
      </div>
      <div class="action-buttons">
        <n-button
          text
          size="large"
          :type="showMemoryPanel ? 'primary' : 'default'"
          @click="toggleMemoryPanel"
          title="记忆中心"
          class="memory-btn"
        >
          <template #icon>
            <n-icon><SparklesOutline /></n-icon>
          </template>
        </n-button>
        <n-button
          v-if="loading"
          text
          size="large"
          type="error"
          @click="handleAbort"
          title="停止生成"
          class="stop-btn"
        >
          <template #icon>
            <n-icon><StopOutline /></n-icon>
          </template>
        </n-button>
        <n-button
          v-else
          text
          size="large"
          type="primary"
          :disabled="!inputValue.trim()"
          @click="handleSend"
          title="发送"
          class="send-btn"
        >
          <template #icon>
            <n-icon><SendOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="input-tip">按 Enter 发送，Shift + Enter 换行</div>
  </div>
</template>

<script setup name="ChatInput">
import { ref, watch } from 'vue'
import { NInput, NButton, NIcon, NSpace } from 'naive-ui'
import { SendOutline, StopOutline, ListOutline, SparklesOutline } from '@vicons/ionicons5'

const props = defineProps({
  loading: { type: Boolean, default: false },
  showMemoryPanel: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'abort', 'update:showMemoryPanel'])

const inputValue = ref('')
const placeholder = ref('请输入内容...')

const handleSend = () => {
  if (inputValue.value.trim()) {
    emit('send', inputValue.value)
    inputValue.value = ''
  }
}

const handleAbort = () => {
  emit('abort')
}

const toggleMemoryPanel = () => {
  emit('update:showMemoryPanel', !props.showMemoryPanel)
}

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      inputValue.value = ''
    }
  },
)

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<style scoped>
.chat-input-wrapper {
  position: relative;
  z-index: 2;
}

.input-area {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.input-container {
  flex: 1;
}

/* Naive UI 输入框深度覆盖 - 青蓝发光 */
:deep(.n-input) {
  background: rgba(16, 22, 42, 0.6) !important;
  border: 1px solid rgba(0, 242, 254, 0.3) !important;
  border-radius: 12px !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.n-input:hover) {
  border-color: rgba(0, 242, 254, 0.5) !important;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.2) !important;
}

:deep(.n-input:focus) {
  border-color: rgba(0, 242, 254, 0.8) !important;
  box-shadow: 0 0 25px rgba(0, 242, 254, 0.3) !important;
}

:deep(.n-input .n-input__textarea-el) {
  color: #e0e0e0 !important;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.n-input .n-input__textarea-el::placeholder) {
  color: rgba(224, 224, 224, 0.5) !important;
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  gap: 12px;
}

/* 按钮样式 - 青蓝发光 */
:deep(.n-button) {
  background: rgba(16, 22, 42, 0.6) !important;
  border: 1px solid rgba(0, 242, 254, 0.3) !important;
  border-radius: 12px !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  color: #00f2fe !important;
}

:deep(.n-button:hover:not(:disabled)) {
  border-color: rgba(0, 242, 254, 0.6) !important;
  box-shadow: 0 0 25px rgba(0, 242, 254, 0.3) !important;
  transform: translateY(-2px);
}

:deep(.n-button:disabled) {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

:deep(.n-button .n-icon) {
  font-size: 20px;
}

/* 发送按钮特殊效果 */
.send-btn:deep(.n-button) {
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(177, 134, 255, 0.2)) !important;
  border-color: rgba(0, 242, 254, 0.5) !important;
}

.send-btn:deep(.n-button:hover:not(:disabled)) {
  box-shadow: 0 0 30px rgba(0, 242, 254, 0.5) !important;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 242, 254, 0.6);
  }
}

.input-tip {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: rgba(224, 224, 224, 0.5);
}
</style>
