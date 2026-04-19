<template>
  <div class="chat-input-wrapper">
    <div class="input-card">
      <n-input
        v-model:value="inputValue"
        type="textarea"
        placeholder="输入你的问题..."
        :autosize="{ minRows: 1, maxRows: 6 }"
        class="chat-textarea"
        @keydown.enter.prevent="handleSend"
      />
      <div class="input-toolbar">
        <div class="toolbar-left">
          <!-- 会话历史按钮（ChatGPT 风格） -->
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <button class="action-icon-btn" @click="handleToggleSessionList">
                <n-icon size="18"><MenuOutline /></n-icon>
              </button>
            </template>
            会话历史
          </n-tooltip>
        </div>
        <div class="toolbar-right">
          <n-button
            v-if="loading"
            type="error"
            size="small"
            ghost
            class="stop-btn"
            @click="handleAbort"
          >
            停止
          </n-button>
          <button class="send-btn" :disabled="!inputValue.trim() || loading" @click="handleSend">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="input-disclaimer">AI 生成的内容可能不准确，请核查重要信息。</div>
  </div>
</template>

<script setup name="ChatInput">
import { ref } from 'vue'
import { NInput, NButton, NTooltip, NIcon } from 'naive-ui'
import { MenuOutline } from '@vicons/ionicons5'

const props = defineProps({
  loading: { type: Boolean, default: false },
  showSessionList: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'abort', 'update:showSessionList'])

const inputValue = ref('')

const handleSend = () => {
  const content = inputValue.value.trim()
  if (!content || props.loading) return
  emit('send', content)
  inputValue.value = ''
}

const handleAbort = () => emit('abort')
const handleToggleSessionList = () => emit('update:showSessionList', !props.showSessionList)
</script>

<style scoped>
.chat-input-wrapper {
  padding: 0 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-card {
  width: 100%;
  max-width: 768px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 24px;
  padding: 10px 14px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.03);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input-card:focus-within {
  border-color: #c5c5c5;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.06);
}

.chat-textarea :deep(.n-input__textarea-el) {
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  padding: 4px 0;
  border: none;
  box-shadow: none;
  outline: none;
}

.chat-textarea :deep(.n-input__border),
.chat-textarea :deep(.n-input__state-border) {
  display: none;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: #f0f0f0;
  color: #10a37f;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #10a37f;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #0d8c6d;
}
.send-btn:disabled {
  background: #e5e5e5;
  color: #aaa;
  cursor: not-allowed;
}

.stop-btn :deep(.n-button__content) {
  font-size: 12px;
}

.input-disclaimer {
  margin-top: 8px;
  font-size: 11px;
  color: #999;
  text-align: center;
}
</style>
