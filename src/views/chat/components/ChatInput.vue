<!-- src/views/chat/components/ChatInput.vue -->
<template>
  <div class="chat-input-wrapper">
    <n-input
      v-model:value="inputValue"
      type="textarea"
      placeholder="输入你的问题... (Enter 发送)"
      :autosize="{ minRows: 1, maxRows: 5 }"
      @keydown.enter.prevent="handleSend"
    />
    <n-button type="primary" :disabled="!inputValue.trim() || loading" @click="handleSend">
      {{ loading ? '发送中...' : '发送' }}
    </n-button>
    <n-button v-if="loading" type="error" ghost @click="handleAbort"> 停止生成 </n-button>
  </div>
</template>

<script>
import { ref } from 'vue'
import { NInput, NButton } from 'naive-ui'

export default {
  name: 'ChatInput',
  components: {
    NInput,
    NButton,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['send', 'abort'],
  setup(props, { emit }) {
    const inputValue = ref('')

    const handleSend = () => {
      const content = inputValue.value.trim()
      if (!content || props.loading) return

      emit('send', content)
      inputValue.value = ''
    }

    const handleAbort = () => {
      emit('abort')
    }

    return {
      inputValue,
      handleSend,
      handleAbort,
    }
  },
}
</script>

<style scoped>
.chat-input-wrapper {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e8e8e8;
  background-color: #fff;
}
</style>
