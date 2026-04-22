<template>
  <div class="chat-container">
    <ChatMessageList :messages="messages" />
    <ChatInput
      :loading="loading"
      :show-session-list="showSessionList"
      :show-memory-panel="showMemoryPanel"
      @send="handleSend"
      @abort="handleAbort"
      @update:show-session-list="showSessionList = $event"
      @update:show-memory-panel="showMemoryPanel = $event"
    />

    <!-- 右侧：会话历史抽屉 -->
    <SessionList
      v-model:show="showSessionList"
      :current-session-id="currentSessionId"
      @select="handleSelectSession"
      @create="handleCreateSession"
    />

    <MemoryPanel
      ref="memoryPanelRef"
      v-model:show="showMemoryPanel"
      :session-id="currentSessionId"
      :user-id="currentUserId"
    />
  </div>
</template>

<script setup name="ChatMessageIndex">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import SessionList from './components/SessionList.vue'
import MemoryPanel from './components/MemoryPanel/index.vue'
import { createChatStream } from './components/util.js'
import { generateId } from '@/utils/sse'
import { CHAT_CONFIG } from '@/utils/constants'
import { createSession, updateSession } from '@/api/session'

const msgApi = useMessage()
const messages = ref([])
const loading = ref(false)
const showSessionList = ref(false)
const showMemoryPanel = ref(false)
const currentSessionId = ref('')
const currentUserId = ref('')
const memoryPanelRef = ref(null)

let chatStream = null
let aiMessageId = null

const initSession = async () => {
  const saved = localStorage.getItem('current_session_id')
  currentUserId.value = localStorage.getItem('userId') || 'anonymous'

  if (saved) {
    currentSessionId.value = saved
  } else {
    await handleCreateSession()
  }
}

const handleCreateSession = async () => {
  try {
    const res = await createSession(currentUserId.value)
    const session = res.data || res
    currentSessionId.value = session.id
    localStorage.setItem('current_session_id', session.id)
    messages.value = []
    msgApi.success('已创建新会话')
  } catch (error) {
    msgApi.error('创建会话失败')
  }
}

const handleSelectSession = async (session) => {
  currentSessionId.value = session.id
  localStorage.setItem('current_session_id', session.id)
  messages.value = []
  msgApi.info(`已切换到：${session.title}`)
}

const handleSend = async (content) => {
  if (!content.trim()) return
  const trimmed = content.trim()

  const userId = generateId()
  messages.value.push({ id: userId, role: 'user', content: trimmed, timestamp: Date.now() })

  aiMessageId = generateId()
  messages.value.push({
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  })
  loading.value = true
  chatStream = createChatStream()

  try {
    const history = messages.value
      .filter((m) => m.id !== aiMessageId)
      .map((m) => ({ role: m.role, content: m.content }))
    await chatStream.send(
      history,
      {
        useTypewriter: CHAT_CONFIG.TYPEWRITER_ENABLED,
        typewriterDelay: CHAT_CONFIG.TYPEWRITER_DELAY,
        onChunk: (chunk) => {
          const m = messages.value.find((x) => x.id === aiMessageId)
          if (m) m.content += chunk
        },
        onDone: async () => {
          const m = messages.value.find((x) => x.id === aiMessageId)
          if (m) m.isStreaming = false
          loading.value = false
          aiMessageId = null

          updateSessionMessageCount()

          if (memoryPanelRef.value) {
            await memoryPanelRef.value.fetchExtractedMemories(
              history.concat([{ role: 'assistant', content: m?.content || '' }]),
            )
          }
        },
        onError: (err) => {
          msgApi.error(`失败：${err.message}`)
          loading.value = false
          const idx = messages.value.findIndex((x) => x.id === aiMessageId)
          if (idx !== -1) messages.value.splice(idx, 1)
          aiMessageId = null
        },
      },
      currentSessionId.value,
    )
  } catch (err) {
    if (err.name !== 'AbortError') msgApi.error(`错误：${err.message}`)
    loading.value = false
  }
}

const updateSessionMessageCount = async () => {
  try {
    if (!currentSessionId.value) {
      console.warn('当前会话ID为空，跳过更新')
      return
    }
    const count = messages.value.length
    await updateSession(currentSessionId.value, { message_count: count })
  } catch (error) {
    console.error('更新会话计数失败', error)
  }
}

const handleAbort = () => {
  if (chatStream && !chatStream.isAborted()) {
    chatStream.abort()
    const m = messages.value.find((x) => x.isStreaming)
    if (m) m.isStreaming = false
    loading.value = false
    aiMessageId = null
    msgApi.info('已停止')
  }
}

onMounted(() => initSession())
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  position: relative;
}
</style>
