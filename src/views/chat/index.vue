<template>
  <div class="chat-container">
    <!-- 左侧:会话历史侧边栏 -->
    <div class="session-sidebar" :class="{ collapsed: !showSessionList }">
      <!-- 侧边栏内容 -->
      <div class="sidebar-content" style="position: fixed">
        <SessionList
          ref="sessionListRef"
          :sessions="sessions"
          :current-session-id="currentSessionId"
          :loading="sessionLoading"
          @select="handleSelectSession"
          @create="handleCreateSession"
          @delete="handleDeleteSession"
          @rename="handleRenameSession"
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
          :style="toggleBtnStyle"
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
      <!-- API 配置提示 -->
      <n-alert
        v-if="showApiWarning"
        type="warning"
        closable
        @close="showApiWarning = false"
        style="margin: 16px 16px 0"
      >
        <template #header> ⚠️ 记忆功能暂时不可用 </template>
        检测到 Embedding API 配置问题，记忆提取功能暂时禁用，但不影响正常聊天。
        <br />
        <strong>解决建议：</strong>
        <ol style="margin: 8px 0; padding-left: 20px">
          <li>检查后端 <code>koa2/.env</code> 文件中的 <code>API_KEY</code> 是否有效</li>
          <li>确认 <code>BASE_URL</code> 是否正确（当前：{{ apiBaseUrl }}）</li>
          <li>验证 <code>EMBEDDING_MODEL</code> 是否受支持（当前：{{ embeddingModel }}）</li>
          <li>联系 API 提供商确认账户额度和权限</li>
        </ol>
      </n-alert>

      <div class="messages-area">
        <ChatMessageList
          :messages="messages"
          :session-id="currentSessionId"
          @regenerate="handleRegenerate"
          @edit="handleEditMessage"
          @delete="handleDeleteMessage"
        />
      </div>
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
      :user_id="currentuser_id"
    />
  </div>
</template>

<script setup name="ChatMessageIndex">
import { ref, onMounted, computed } from 'vue'
import { useMessage, useDialog, NButton, NIcon, NAlert } from 'naive-ui'
import { ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import SessionList from './components/SessionList/index.vue'
import MemoryPanel from './components/MemoryPanel/index.vue'
import { createChatStream } from './components/util.js'
import { utils } from '@/utils/http'
import { CHAT_CONFIG } from '@/utils/constants'
import { createSession, updateSession, getSessionList } from '@/api/session'
import { getSessionMessages, deleteMessage } from '@/api/chat'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'

// 常量
const SIDEBAR_WIDTH = 210
const COLLAPSED_SIDEBAR_WIDTH = 64
const SESSION_SIDEBAR_WIDTH = 233

const msgApi = useMessage()
const dialogApi = useDialog()
const userStore = useUserStore()
const appStore = useAppStore()
const messages = ref([])
const loading = ref(false)
const showSessionList = ref(true) // 默认展开会话历史
const showMemoryPanel = ref(false)
const showApiWarning = ref(false) // 是否显示 API 配置警告
const currentSessionId = ref('')
const currentuser_id = ref('')
const memoryPanelRef = ref(null)
const sessionListRef = ref(null) // ✅ SessionList 组件引用
const sessions = ref([]) // 会话列表
const sessionLoading = ref(false) // 会话列表加载状态

// API 配置信息（从环境变量读取）
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.laozhang.ai/v1'
const embeddingModel = 'text-embedding-ada-002'

// 计算会话列表切换按钮的位置
const toggleBtnStyle = computed(() => {
  const mainSidebarWidth = appStore.collapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH
  const offset = showSessionList.value
    ? mainSidebarWidth + SESSION_SIDEBAR_WIDTH - 10 // 展开时：主侧边栏 + 会话侧边栏
    : mainSidebarWidth + 10 // 折叠时：主侧边栏 + 小偏移

  return {
    position: 'fixed',
    top: '76px',
    left: `${offset}px`,
    zIndex: 100,
    transition: 'left 0.3s ease',
  }
})

let chatStream = null
let aiMessageId = null

const initSession = async () => {
  const saved = localStorage.getItem('current_session_id')

  // ✅ 优先使用 userStore 中的用户 ID（已登录用户）
  // 如果未登录，使用 localStorage 或生成临时 ID
  currentuser_id.value =
    userStore.userInfo?.id || localStorage.getItem('user_id') || 'user_' + Date.now()

  console.log('🔍 初始化会话, user_id:', currentuser_id.value)
  console.log(' userStore.userInfo:', userStore.userInfo)
  console.log('🔍 localStorage user_id:', localStorage.getItem('user_id'))

  // 如果没有保存 user_id，存储到 localStorage
  if (!localStorage.getItem('user_id')) {
    localStorage.setItem('user_id', currentuser_id.value)
  }

  // ✅ 刷新会话列表
  await refreshSessionList()

  // ✅ 验证保存的会话ID是否有效
  if (saved) {
    try {
      // 尝试获取会话列表，检查该会话是否存在
      console.log('📡 调用 getSessionList, user_id:', currentuser_id.value)
      const res = await getSessionList(currentuser_id.value)
      // ✅ 拦截器返回完整对象 { code, message, data }
      const sessions = res.data || []
      const sessionExists = sessions.some((s) => s.id === saved)

      if (sessionExists) {
        currentSessionId.value = saved
        console.log('✅ 使用已保存的会话:', saved)

        // ✅ 加载该会话的消息历史
        try {
          const msgRes = await getSessionMessages(saved, 100, 0)
          // ✅ 拦截器返回完整对象 { code, message, data }
          const loadedMessages = msgRes.data || []

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
      console.error('❌ 验证会话失败，创建新会话:', error)
      console.error(' 错误详情:', error.response?.data || error.message)
      localStorage.removeItem('current_session_id')
      await handleCreateSession()
    }
  } else {
    console.log(' 无保存的会话，创建新会话')
    await handleCreateSession()
  }
}

const handleCreateSession = async () => {
  try {
    const res = await createSession(currentuser_id.value)
    // ✅ 拦截器返回完整对象 { code, message, data }
    const session = res.data
    currentSessionId.value = session.id
    localStorage.setItem('current_session_id', session.id)
    messages.value = []
    msgApi.success('已创建新会话')

    // 刷新会话列表
    await refreshSessionList()
  } catch (error) {
    msgApi.error('创建会话失败')
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

  const user_id = utils.generateId()
  messages.value.push({ id: user_id, role: 'user', content: trimmed, timestamp: Date.now() })

  aiMessageId = utils.generateId()
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
                // 友好提示：记忆提取失败不影响聊天
                if (err.message?.includes('401') || err.message?.includes('Embedding')) {
                  console.warn('⚠️ 记忆功能暂时不可用，但不影响聊天')
                  // 显示警告提示
                  showApiWarning.value = true
                  msgApi.warning('记忆功能暂时不可用，但不影响聊天', {
                    duration: 3000,
                  })
                } else {
                  console.error('提取记忆失败:', err)
                }
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

const handleEditMessage = async (message) => {
  try {
    console.log('️ 开始编辑消息:', message.id)

    // 找到编辑消息的索引
    const editIndex = messages.value.findIndex((m) => m.id === message.id)
    if (editIndex === -1) {
      msgApi.error('未找到要编辑的消息')
      return
    }

    // 删除该消息及其之后的所有消息
    messages.value = messages.value.slice(0, editIndex)

    // 使用编辑后的内容重新发送
    console.log(' 使用新内容重新发送:', message.content)
    await handleSend(message.content)

    msgApi.success('消息已更新，正在重新生成回复...')
  } catch {
    msgApi.error('编辑消息失败')
  }
}

// 删除消息
const handleDeleteMessage = async (messageId) => {
  try {
    //  判断是否是历史消息（从数据库加载的消息有 timestamp）
    const message = messages.value.find((m) => m.id === messageId)
    const isHistoricalMessage = message?.timestamp

    if (isHistoricalMessage) {
      // 历史消息：调用后端删除
      console.log('️ 删除历史消息:', messageId)
      await deleteMessage(messageId)
      console.log('✅ 已从数据库删除消息:', messageId)
    } else {
      // 新发送的消息：仅前端删除，不调用后端
      console.log('️ 仅前端删除消息（新发送）:', messageId)
    }

    // 从本地消息列表中移除
    const index = messages.value.findIndex((m) => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    
    // ✅ 刷新会话列表，同步数据
    await refreshSessionList()
    console.log('✅ 删除消息后已刷新会话列表')
  } catch (error) {
    console.error('删除消息失败:', error)
    msgApi.error('删除消息失败: ' + (error.message || '未知错误'))
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

// 🏷️ 刷新会话列表
const refreshSessionList = async () => {
  try {
    sessionLoading.value = true
    const res = await getSessionList(currentuser_id.value)
    sessions.value = res.data || []
    console.log('✅ 刷新会话列表成功，共', sessions.value.length, '个会话')
    
    // ✅ 同时调用子组件的 fetchSessions 方法，确保数据同步
    if (sessionListRef.value && sessionListRef.value.fetchSessions) {
      await sessionListRef.value.fetchSessions()
      console.log('✅ 已同步刷新子组件会话列表')
    }
  } catch (error) {
    console.error('❌ 刷新会话列表失败:', error)
  } finally {
    sessionLoading.value = false
  }
}

// 选择会话
const handleSelectSession = async (session) => {
  //  兼容处理：支持传入 session 对象或 sessionId 字符串
  const sessionId = typeof session === 'string' ? session : session?.id

  if (!sessionId) {
    console.warn('⚠️ 无效的 session ID')
    return
  }

  currentSessionId.value = sessionId
  localStorage.setItem('current_session_id', sessionId)

  try {
    const msgRes = await getSessionMessages(sessionId, 100, 0)
    const loadedMessages = msgRes.data || []

    messages.value = loadedMessages.map((msg) => ({
      id: msg.id.toString(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime(),
      isStreaming: false,
    }))

    console.log(`✅ 加载了 ${messages.value.length} 条历史消息`)
  } catch (error) {
    console.error('加载历史消息失败:', error)
    messages.value = []
    msgApi.error('加载消息失败')
  }
}

// 删除会话
const handleDeleteSession = async (sessionId) => {
  try {
    dialogApi.warning({
      title: '确认删除',
      content: '确定要删除这个会话吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        // TODO: 调用删除会话 API
        if (currentSessionId.value === sessionId) {
          await handleCreateSession()
        }
        await refreshSessionList()
        msgApi.success('会话已删除')
      },
    })
  } catch (error) {
    msgApi.error('删除会话失败')
  }
}

// 重命名会话
const handleRenameSession = async (sessionId, newTitle) => {
  try {
    // 子组件已经调用了 updateSession，这里只需要刷新列表
    await refreshSessionList()
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
/* ✅ 引入 Chat 页面专属样式 */
@import './chat-styles.css';

.chat-container {
  display: flex;
  height: calc(100vh - 80px); /* ✅ 使用视口高度，而不是父容器的百分比 */
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;
  overflow: hidden;
}

/* 星空背景点缀 */
.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(0, 242, 254, 0.8), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(177, 134, 255, 0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(2px 2px at 160px 120px, rgba(0, 242, 254, 0.6), transparent),
    radial-gradient(1px 1px at 230px 80px, rgba(177, 134, 255, 0.8), transparent);
  background-size: 250px 150px;
  animation: twinkle 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* 左侧会话侧边栏 - 青蓝发光 */
.session-sidebar {
  position: relative;
  width: 233px;
  flex-shrink: 0;
  background: rgba(16, 22, 42, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 242, 254, 0.2);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  z-index: 1;
}

.session-sidebar.collapsed {
  width: 0 !important;
  border-right: none;
  box-shadow: none;
}

.sidebar-content {
  width: 233px;
  height: calc(100vh - 80px); /* ✅ 减去header高度 */
  transition: all 0.3s ease;
  overflow-y: auto;
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
  overflow: hidden;
  z-index: 1;
  padding: 20px;
  gap: 20px;
}

.messages-area {
  flex: 1;
  background: rgba(16, 22, 42, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(177, 134, 255, 0.2);
  box-shadow: 0 0 15px rgba(177, 134, 255, 0.1);
  border-radius: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

/* 滚动条美化 - 极光紫 */
.messages-area::-webkit-scrollbar {
  width: 8px;
}

.messages-area::-webkit-scrollbar-track {
  background: rgba(16, 22, 42, 0.3);
  border-radius: 4px;
}

.messages-area::-webkit-scrollbar-thumb {
  background: rgba(177, 134, 255, 0.3);
  border-radius: 4px;
  transition: background 0.3s;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: rgba(177, 134, 255, 0.5);
}
</style>
