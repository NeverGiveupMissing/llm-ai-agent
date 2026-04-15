<template>
  <div class="chat-container">
    <ChatMessageList :messages="messages" />
    <ChatInput :loading="loading" @send="handleSend" @abort="handleAbort" />
  </div>
</template>

<script setup name="ChatMessageIndex">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import { createChatStream } from '@/api/chat'
import { generateId } from '@/utils/sse'
import { CHAT_CONFIG } from '@/utils/constants'

const message = useMessage()
const messages = ref([])
const loading = ref(false)

let chatStream = null
let aiMessageId = null

const handleSend = async (content) => {
  if (!content.trim()) return

  const trimmedContent = content.trim()

  const userMessageId = generateId()
  const userMessage = {
    id: userMessageId,
    role: 'user',
    content: trimmedContent,
    timestamp: Date.now(),
  }
  messages.value.push(userMessage)

  aiMessageId = generateId()
  const aiMessage = {
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  }
  messages.value.push(aiMessage)

  loading.value = true

  chatStream = createChatStream()

  try {
    const messageHistory = messages.value
      .filter((m) => m.id !== aiMessageId)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    console.log('发送消息历史:', messageHistory)

    await chatStream.send(messageHistory, {
      useTypewriter: CHAT_CONFIG.TYPEWRITER_ENABLED,
      typewriterDelay: CHAT_CONFIG.TYPEWRITER_DELAY,
      onChunk: (chunk) => {
        console.log('收到数据块:', chunk)
        const aiMsg = messages.value.find((m) => m.id === aiMessageId)
        if (aiMsg) {
          aiMsg.content += chunk
        }
      },
      onDone: () => {
        console.log('流式传输完成')
        const aiMsg = messages.value.find((m) => m.id === aiMessageId)
        if (aiMsg) {
          aiMsg.isStreaming = false
        }
        loading.value = false
        aiMessageId = null
      },
      onError: (error) => {
        console.error('请求错误:', error)
        message.error(`请求失败: ${error.message || '未知错误'}`)
        loading.value = false

        const aiErrorIndex = messages.value.findIndex((m) => m.id === aiMessageId)
        if (aiErrorIndex !== -1) {
          messages.value.splice(aiErrorIndex, 1)
        }

        const userErrorIndex = messages.value.findIndex((m) => m.id === userMessageId)
        if (userErrorIndex !== -1) {
          messages.value.splice(userErrorIndex, 1)
        }

        aiMessageId = null
      },
    })
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('发生错误:', error)
      message.error(`发生错误: ${error.message || '未知错误'}`)

      const aiErrorIndex = messages.value.findIndex((m) => m.id === aiMessageId)
      if (aiErrorIndex !== -1) {
        messages.value.splice(aiErrorIndex, 1)
      }

      aiMessageId = null
    }
    loading.value = false
  }
}

const handleAbort = () => {
  if (chatStream && !chatStream.isAborted()) {
    chatStream.abort()

    const streamingMsg = messages.value.find((m) => m.isStreaming)
    if (streamingMsg) {
      streamingMsg.isStreaming = false
    }

    loading.value = false
    aiMessageId = null
    message.info('已停止生成')
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}
</style>
