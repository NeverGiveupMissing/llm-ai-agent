<template>
  <div ref="messageListRef" class="chat-message-list">
    <div class="messages-container">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-logo">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#gradient)"
            stroke-width="1.5"
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00f2fe" />
                <stop offset="100%" stop-color="#b186ff" />
              </linearGradient>
            </defs>
            <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
          </svg>
        </div>
        <h2 class="empty-title">有什么可以帮你的？</h2>
      </div>

      <div v-else class="messages-scroll">
        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          :id="`message-${index}`"
          class="message-wrapper"
        >
          <ChatMessage
            :message="msg"
            :is-last="msg.id === lastMessageId"
            :session-id="props.sessionId"
            @regenerate="handleRegenerate"
            @edit="handleEdit"
            @delete="handleDeleteMessage"
          />
        </div>
      </div>
    </div>

    <!-- 右侧快捷跳转导航 -->
    i
    <div
      v-if="messages.length > 2"
      class="message-navigation"
      :class="{ collapsed: isNavigationCollapsed }"
    >
      <!-- 收起/展开按钮 -->
      <button
        class="nav-toggle-btn"
        @click="toggleNavigation"
        :title="isNavigationCollapsed ? '展开导航' : '收起导航'"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'rotate-180': isNavigationCollapsed }"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <!-- 导航内容 -->
      <transition name="nav-fade">
        <div v-if="!isNavigationCollapsed" class="nav-content">
          <div
            v-for="(msg, index) in messages"
            :key="msg.id"
            class="nav-item"
            :class="{
              active: activeMessageIndex === index,
              'nav-user': msg.role === 'user',
              'nav-assistant': msg.role === 'assistant',
            }"
            @click="scrollToMessage(index)"
            :title="`消息 ${index + 1}`"
          >
            <span class="nav-text">{{ getMessagePreview(msg) }}</span>
            <!-- 删除按钮 -->
            <button
              class="nav-delete-btn"
              @click.stop="handleNavDelete(msg.id, index)"
              title="删除此消息"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup name="ChatMessageList">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useDialog } from 'naive-ui'
import ChatMessage from './ChatMessage/index.vue'
import { utils } from '@/utils/http'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  sessionId: { type: String, default: '' },
})
const emit = defineEmits(['regenerate', 'edit', 'delete'])

const dialogApi = useDialog()

const messageListRef = ref(null)
const lastMessageId = ref('')
const activeMessageIndex = ref(0)
const isNavigationCollapsed = ref(true) // 默认关闭快捷导航面板
let observer = null

const scrollToEnd = () => {
  nextTick(() => {
    utils.scrollToBottom(messageListRef.value)
    if (props.messages.length > 0)
      lastMessageId.value = props.messages[props.messages.length - 1].id
  })
}

const scrollToMessage = (index) => {
  const element = document.getElementById(`message-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    activeMessageIndex.value = index
  }
}

const toggleNavigation = () => {
  isNavigationCollapsed.value = !isNavigationCollapsed.value
}

// 获取消息预览文本（第一行）
const getMessagePreview = (msg) => {
  if (!msg.content) return ''
  // 获取第一行文本，最多显示20个字符
  const firstLine = msg.content.split('\n')[0]
  return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine
}

const handleRegenerate = (messageId) => emit('regenerate', messageId)
const handleEdit = (message) => emit('edit', message)

// 删除消息
const handleDeleteMessage = (messageId) => {
  emit('delete', messageId)
}

// 导航栏删除消息（带二次确认）
const handleNavDelete = (messageId, index) => {
  dialogApi.warning({
    title: '确认删除',
    content: '删除后将无法恢复此消息，确定要删除吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      emit('delete', messageId)
    },
  })
}

// 监听消息滚动，更新当前激活的消息索引
const setupScrollObserver = () => {
  if (!messageListRef.value) return

  const container = messageListRef.value.querySelector('.messages-scroll')
  if (!container) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index)
          if (!isNaN(index)) {
            activeMessageIndex.value = index
          }
        }
      })
    },
    {
      root: container,
      threshold: 0.5,
    },
  )

  // 观察所有消息元素
  nextTick(() => {
    const messageWrappers = container.querySelectorAll('.message-wrapper')
    messageWrappers.forEach((wrapper) => {
      const index = parseInt(wrapper.id.split('-')[1])
      wrapper.dataset.index = index
      observer.observe(wrapper)
    })
  })
}

watch(() => props.messages.length, scrollToEnd)
watch(
  () => props.messages.map((m) => m.content).join(''),
  () => {
    if (props.messages.some((m) => m.isStreaming)) scrollToEnd()
  },
)

// 当消息数量变化时，重新设置观察者
watch(
  () => props.messages.length,
  () => {
    if (observer) {
      observer.disconnect()
    }
    nextTick(() => {
      setupScrollObserver()
    })
  },
)

onMounted(() => {
  nextTick(() => {
    setupScrollObserver()
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.chat-message-list {
  flex: 1;
  overflow-y: auto; /* ✅ 允许纵向滚动 */
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  padding: 20px 16px;
  position: relative;
  /* ✅ 暗色科技感滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 242, 254, 0.3) transparent;
}

/* Webkit 浏览器滚动条样式 */
.chat-message-list::-webkit-scrollbar {
  width: 8px;
}

.chat-message-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-message-list::-webkit-scrollbar-thumb {
  background: rgba(0, 242, 254, 0.3);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.chat-message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 242, 254, 0.5);
}

.messages-container {
  width: 100%;
  max-width: 768px;
  display: flex;
  flex-direction: column;
  padding-right: 40px;
}

/* ✅ 消息气泡流容器 - Flex 布局 */
.messages-scroll {
  display: flex;
  flex-direction: column;
  gap: 20px; /* ✅ 气泡之间保持 20px 呼吸间距 */
  padding-bottom: 20px;

  /* ✅ 换成带有极高透明度的深色底 */
  background: rgba(10, 12, 26, 0.35) !important;

  /* ✅ 开启高斯模糊，让星空在顶部也朦胧地透过来 */
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;

  /* ✅ 加一条极其细微的底部青蓝发光线，把上下稍微隔开一点 */
  border-bottom: 1px solid rgba(0, 242, 254, 0.15) !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 30px;
}

.empty-logo {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(90deg, #00f2fe 0%, #b186ff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s ease infinite;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.message-wrapper {
  scroll-margin-top: 20px;
  scroll-margin-bottom: 20px;
}

/* 右侧快捷跳转导航 - 毛玻璃效果 */
.message-navigation {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  max-height: 60vh;
  padding: 8px 4px;
  background: rgba(16, 22, 42, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 242, 254, 0.2);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1);
  border-radius: 12px;
  z-index: 10;
  transition: all 0.3s ease;
}

.message-navigation.collapsed {
  padding: 8px;
  background: rgba(16, 22, 42, 0.6);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.05);
}

/* 收起/展开按钮 */
.nav-toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 242, 254, 0.3);
  background: rgba(16, 22, 42, 0.6);
  border-radius: 50%;
  color: #00f2fe;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
  flex-shrink: 0;
}

.nav-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
  border-color: rgba(0, 242, 254, 0.6);
}

.nav-toggle-btn:active {
  transform: scale(0.95);
}

.nav-toggle-btn svg {
  transition: transform 0.3s ease;
}

.nav-toggle-btn svg.rotate-180 {
  transform: rotate(180deg);
}

/* 导航内容 */
.nav-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(60vh - 60px);
  overflow-y: auto;
  padding-right: 4px;
}

.message-navigation.collapsed .nav-content {
  display: none;
}

/* 滚动条样式 */
.nav-content::-webkit-scrollbar {
  width: 3px;
}

.nav-content::-webkit-scrollbar-track {
  background: transparent;
}

.nav-content::-webkit-scrollbar-thumb {
  background: rgba(0, 242, 254, 0.3);
  border-radius: 3px;
}

.nav-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 242, 254, 0.5);
}

.nav-item {
  min-width: 120px;
  max-width: 180px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: rgba(16, 22, 42, 0.4);
  border: 1px solid rgba(0, 242, 254, 0.2);
  color: #e0e0e0;
}

.nav-item:hover {
  background: rgba(0, 242, 254, 0.1);
  transform: translateX(-4px);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.2);
  border-color: rgba(0, 242, 254, 0.4);
}

.nav-item:hover .nav-delete-btn {
  opacity: 1;
}

.nav-item.active {
  background: rgba(177, 134, 255, 0.2);
  border-color: rgba(177, 134, 255, 0.4);
  box-shadow: 0 0 15px rgba(177, 134, 255, 0.2);
}

/* 导航删除按钮 */
.nav-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.nav-delete-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.nav-item.active .nav-delete-btn {
  color: rgba(255, 255, 255, 0.6);
}

.nav-item.active .nav-delete-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-item.active {
  background: linear-gradient(135deg, #10a37f 0%, #0ea5e9 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
}

.nav-item.active .nav-text {
  color: white;
}

.nav-user {
  background: rgba(16, 22, 42, 0.6);
  border: 1px solid rgba(0, 242, 254, 0.3);
}

.nav-user:hover {
  background: rgba(0, 242, 254, 0.15);
  border-color: rgba(0, 242, 254, 0.5);
}

.nav-user.active {
  background: linear-gradient(135deg, #0ea5e9 0%, #667eea 100%);
  border-color: transparent;
}

.nav-assistant {
  background: rgba(16, 22, 42, 0.5);
  border: 1px solid rgba(0, 242, 254, 0.25);
}

.nav-assistant:hover {
  background: rgba(0, 242, 254, 0.12);
  border-color: rgba(0, 242, 254, 0.4);
}

.nav-assistant.active {
  background: linear-gradient(135deg, #22c55e 0%, #10a37f 100%);
  border-color: transparent;
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8); /* ✅ 改为白色半透明 */
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-user .nav-text {
  color: rgba(255, 255, 255, 0.9); /* ✅ 用户消息文本更亮 */
}

.nav-assistant .nav-text {
  color: rgba(255, 255, 255, 0.9); /* ✅ AI 消息文本更亮 */
}

.nav-item.active .nav-text {
  color: white; /* ✅ 激活状态纯白 */
}

/* 导航内容展开/收起动画 */
.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
}

.nav-fade-enter-to,
.nav-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
  max-height: calc(60vh - 60px);
}
</style>
