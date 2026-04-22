<template>
  <div class="chat-input-wrapper">
    <div class="input-container">
      <n-input
        ref="inputRef"
        v-model:value="inputValue"
        type="textarea"
        :placeholder="placeholder"
        :autosize="{ minRows: 1, maxRows: 8 }"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleSend"
      >
        <template #suffix>
          <n-space vertical align="end" style="gap: 4px">
            <n-space horizontal>
              <n-button
                text
                size="tiny"
                :type="showMemoryPanel ? 'primary' : 'default'"
                @click="toggleMemoryPanel"
                title="记忆中心"
              >
                <template #icon>
                  <n-icon><SparklesOutline /></n-icon>
                </template>
              </n-button>
              <n-button
                text
                size="tiny"
                :type="showSessionList ? 'primary' : 'default'"
                @click="toggleSessionList"
                title="会话历史"
              >
                <template #icon>
                  <n-icon><ListOutline /></n-icon>
                </template>
              </n-button>
            </n-space>
            <n-button
              v-if="loading"
              text
              size="tiny"
              type="error"
              @click="handleAbort"
              title="停止生成"
            >
              <template #icon>
                <n-icon><StopOutline /></n-icon>
              </template>
            </n-button>
            <n-button
              v-else
              text
              size="tiny"
              type="primary"
              :disabled="!inputValue.trim()"
              @click="handleSend"
              title="发送"
            >
              <template #icon>
                <n-icon><SendOutline /></n-icon>
              </template>
            </n-button>
          </n-space>
        </template>
      </n-input>
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
  showSessionList: { type: Boolean, default: false },
  showMemoryPanel: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'abort', 'update:showSessionList', 'update:showMemoryPanel'])

const inputRef = ref(null)
const inputValue = ref('')

const placeholder = '输入消息...'

const handleSend = () => {
  if (!inputValue.value.trim() || props.loading) return
  emit('send', inputValue.value)
  inputValue.value = ''
}

const handleAbort = () => {
  emit('abort')
}

const toggleSessionList = () => {
  emit('update:showSessionList', !props.showSessionList)
}

const toggleMemoryPanel = () => {
  emit('update:showMemoryPanel', !props.showMemoryPanel)
}

watch(
  () => props.loading,
  (val) => {
    if (!val) {
      setTimeout(() => {
        inputRef.value?.focus()
      }, 100)
    }
  },
)

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<style scoped>
.chat-input-wrapper {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  transition: border-color 0.2s;
}

.input-container:focus-within {
  border-color: #10a37f;
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.1);
}

.input-tip {
  max-width: 800px;
  margin: 8px auto 0;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
