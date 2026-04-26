<template>
  <div class="chat-container">
    <!-- 左侧:会话历史侧边栏 -->
    <div class="session-sidebar" :class="{ collapsed: !showSessionList }">
      <!-- 侧边栏内容 -->
      <div class="sidebar-content" style="position: fixed">
        <SessionList
          ref="sessionListRef"
          v-model:show="showSessionList"
          :current-session-id="currentSessionId"
          @select="handleSelectSession"
          @create="handleCreateSession"
        />
      </div>
    </div>

    <!-- 展开/收起按钮（使用Naive UI样式，带tooltip提示） -->
    <n-tooltip trigger="hover" placement="right">
      <template #trigger>
        <n-button
          class="sidebar-toggle-btn"
          circle
          size="small"
          :type="showSessionList ? 'primary' : 'default'"
          @click="toggleSessionList"
        >
          <template #icon>
            <n-icon>
              <ChevronBackOutline v-if="showSessionList" />
              <ChevronForwardOutline v-else />
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ showSessionList ? '收起会话列表' : '展开会话列表' }}
    </n-tooltip>

    <!-- 主内容区 -->
    <div class="chat-main">
      <ChatMessageList
        :messages="messages"
        @regenerate="handleRegenerate"
        @edit="handleEditMessage"
        @delete="handleDeleteMessage"
      />
      <ChatInput
        :loading="loading"
        :show-memory-panel="showMemoryPanel"
        @send="handleSend"
        @abort="handleAbort"
        @update:show-memory-panel="showMemoryPanel = $event"
      />
    </div>

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
import { useMessage, useDialog, NButton, NIcon } from 'naive-ui'
import { ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import SessionList from './components/SessionList.vue'
import MemoryPanel from './components/MemoryPanel/index.vue'
import { createChatStream } from './components/util.js'
import { generateId } from '@/utils/http'
import { CHAT_CONFIG } from '@/utils/constants'
import { createSession, updateSession, getSessionList } from '@/api/session'
import { getSessionMessages, deleteMessage } from '@/api/chat'

const msgApi = useMessage()
const dialogApi = useDialog()
const messages = ref([])
const loading = ref(false)
const showSessionList = ref(true) // 默认展开会话历史
const showMemoryPanel = ref(false)
const currentSessionId = ref('')
const currentUserId = ref('')
const memoryPanelRef = ref(null)
const sessionListRef = ref(null)
const editingMessage = ref(null)

let chatStream = null
let aiMessageId = null

const initSession = async () => {
  const saved = localStorage.getItem('current_session_id')
  const savedUserId = localStorage.getItem('userId')

  // 确保 userId 始终有值
  currentUserId.value = savedUserId || 'user_' + Date.now()
  if (!savedUserId) {
    localStorage.setItem('userId', currentUserId.value)
  }

  // ✅ 验证保存的会话ID是否有效
  if (saved) {
    try {
      // 尝试获取会话列表，检查该会话是否存在
      const res = await getSessionList(currentUserId.value)
      const sessions = res.data || res || []
      const sessionExists = sessions.some((s) => s.id === saved)

      if (sessionExists) {
        currentSessionId.value = saved
        console.log('✅ 使用已保存的会话:', saved)

        // ✅ 加载该会话的消息历史
        try {
          const msgRes = await getSessionMessages(saved, 100, 0)
          const loadedMessages = msgRes.data || msgRes || []

          messages.value = loadedMessages.map((msg) => ({
            id: msg.id.toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            isStreaming: false,
          }))

          console.log(`✅ 加载了 ${messages.value.length} 条历史消息`)
        } catch (loadError) {
          console.error('加载历史消息失败:', loadError)
          messages.value = []
        }
      } else {
        console.warn('⚠️ 保存的会话不存在，创建新会话')
        localStorage.removeItem('current_session_id')
        await handleCreateSession()
      }
    } catch (error) {
      console.error('验证会话失败，创建新会话:', error)
      localStorage.removeItem('current_session_id')
      await handleCreateSession()
    }
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

    // ✅ 刷新会话列表，让新会话立即显示并高亮选中
    if (sessionListRef.value && sessionListRef.value.fetchSessions) {
      await sessionListRef.value.fetchSessions()
    }
  } catch (error) {
    msgApi.error('创建会话失败')
  }
}

const handleSelectSession = async (session) => {
  currentSessionId.value = session.id
  localStorage.setItem('current_session_id', session.id)

  try {
    // 从数据库加载消息历史
    const res = await getSessionMessages(session.id, 100, 0)
    const loadedMessages = res.data || res || []

    // 转换为前端消息格式
    messages.value = loadedMessages.map((msg) => ({
      id: msg.id.toString(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime(),
      isStreaming: false,
    }))

    console.log(`✅ 已切换到会话: ${session.title}, 加载了 ${messages.value.length} 条消息`)
    msgApi.success(`已切换到：${session.title}`)
  } catch (error) {
    console.error('加载消息历史失败:', error)
    messages.value = []
    msgApi.warning('加载消息历史失败')
  }
}

const handleSend = async (content) => {
  if (!content.trim()) return

  // ✅ 验证会话ID是否有效
  if (!currentSessionId.value) {
    msgApi.error('会话未初始化,请刷新页面重试')
    console.error('❌ 发送消息时 sessionId 为空')
    return
  }

  const trimmed = content.trim()

  // 如果是编辑模式，删除原消息及之后的所有消息
  if (editingMessage.value) {
    const editIndex = messages.value.findIndex((m) => m.id === editingMessage.value.id)
    if (editIndex !== -1) {
      messages.value = messages.value.slice(0, editIndex)
      editingMessage.value = null
    }
  }

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

    console.log('📤 发送消息, sessionId:', currentSessionId.value)

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

          // ✅ 异步更新会话计数（不阻塞）
          updateSessionMessageCount().catch((err) => {
            console.error('更新会话计数失败:', err)
          })

          // 🏷️ 异步刷新会话列表以显示新生成的标题（延迟2秒等待后端生成完成）
          setTimeout(() => {
            refreshSessionList().catch((err) => {
              console.error('刷新会话列表失败:', err)
            })
          }, 2000)

          // ✅ 异步提取记忆（不阻塞用户交互，不显示 loading）
          if (memoryPanelRef.value) {
            const fullHistory = history.concat([{ role: 'assistant', content: m?.content || '' }])
            memoryPanelRef.value
              .fetchExtractedMemories(fullHistory, { skipLoading: true })
              .catch((err) => {
                console.error('提取记忆失败:', err)
              })
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

const handleEditMessage = (message) => {
  editingMessage.value = message
  msgApi.info('编辑模式：修改消息后将重新生成回复')
}

// 删除消息
const handleDeleteMessage = async (messageId) => {
  try {
    // 先调用后端接口删除数据库记录
    await deleteMessage(messageId)

    // 删除成功后，从本地消息列表中移除
    const index = messages.value.findIndex((m) => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    // 错误提示已在 deleteMessage 的调用处（ChatMessage 组件）显示
  }
}

const handleRegenerate = async (messageId) => {
  const msgIndex = messages.value.findIndex((m) => m.id === messageId)
  if (msgIndex === -1) return

  const targetMessage = messages.value[msgIndex]

  // 找到这条AI消息对应的用户消息
  let userMessageIndex = -1
  for (let i = msgIndex - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      userMessageIndex = i
      break
    }
  }

  if (userMessageIndex === -1) {
    msgApi.warning('找不到对应的用户消息')
    return
  }

  // 保存用户消息内容（在删除前）
  const userMessageContent = messages.value[userMessageIndex].content

  // 删除从用户消息开始的所有后续消息
  messages.value = messages.value.slice(0, userMessageIndex)

  // 重新发送用户消息
  if (userMessageContent) {
    await handleSend(userMessageContent)
  }
}

const updateSessionMessageCount = async () => {
  try {
    if (!currentSessionId.value) {
      console.warn('当前会话ID为空，跳过更新')
      return
    }
    const count = messages.value.length
    if (typeof count !== 'number' || count < 0) {
      console.warn('消息计数无效:', count)
      return
    }

    // ✅ 异步执行，不阻塞用户，忽略错误提示
    updateSession(currentSessionId.value, { message_count: count }, { skipErrorMsg: true }).catch(
      (error) => {
        console.error('更新会话计数失败（非关键错误）:', error)
      },
    )
  } catch (error) {
    console.error('更新会话计数失败', error)
  }
}

// 🏷️ 刷新会话列表（用于显示新生成的标题）
const refreshSessionList = async () => {
  try {
    if (sessionListRef.value && sessionListRef.value.fetchSessions) {
      await sessionListRef.value.fetchSessions()
      console.log('✅ 会话列表已刷新')
    }
  } catch (error) {
    console.error('刷新会话列表失败:', error)
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

const toggleSessionList = () => {
  showSessionList.value = !showSessionList.value
}

onMounted(() => initSession())
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
}

/* 左侧会话侧边栏 */
.session-sidebar {
  position: relative;
  width: 233px;
  flex-shrink: 0;
  border-right: 1px solid #e5e5e5;
  transition: all 0.3s ease;
  overflow: hidden;
}

.session-sidebar.collapsed {
  width: 0 !important;
  border-right: none;
}

/* 展开/收起按钮（使用Naive UI样式，固定定位） */
.sidebar-toggle-btn {
  position: fixed !important;
  top: 76px !important;
  left: 212px !important;
  z-index: 100 !important;
  transition: left 0.3s ease !important;
}

.sidebar-content {
  width: 233px;
  height: 100%;
  transition: all 0.3s ease;
}

.session-sidebar.collapsed .sidebar-content {
  width: 0;
}

/* 主内容区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}
</style>
