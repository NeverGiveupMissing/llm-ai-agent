<!-- src/views/ChatView.vue -->

<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.role]">
        <div class="content">{{ msg.content }}</div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="thinking">🤔 正在思考...</div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="inputText"
        placeholder="输入你的问题... (Ctrl+Enter 发送)"
        @keyup.ctrl.enter="sendMessage"
      ></textarea>

      <div class="actions">
        <button @click="sendMessage" :disabled="loading">
          {{ loading ? '发送中...' : '发送' }}
        </button>
        <button v-if="loading" @click="stopMessage">停止</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { chatApi } from '@/api/index'

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
let abortController = null

const sendMessage = async () => {
  if (!inputText.value.trim()) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: inputText.value,
  })

  const userMessage = inputText.value
  inputText.value = ''
  loading.value = true

  // 创建 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })

  // 创建中止控制器
  abortController = new AbortController()

  // ✅ 调用封装的 API，而不是直接写路径
  await chatApi.streamChat(
    { message: userMessage, query: userMessage },
    {
      onChunk: (chunk) => {
        messages.value[aiMessageIndex].content += chunk
      },
      onDone: () => {
        loading.value = false
        abortController = null
      },
      onError: (err) => {
        console.error(err)
        messages.value[aiMessageIndex].content = '错误：' + err.message
        loading.value = false
      },
    },
    abortController.signal,
  )
}

const stopMessage = () => {
  if (abortController) {
    abortController.abort()
    loading.value = false
  }
}
</script>
