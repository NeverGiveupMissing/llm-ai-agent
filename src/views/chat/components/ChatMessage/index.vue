<template>
  <div class="chat-message" :class="`role-${message.role}`">
    <!-- 删除按钮 -->
    <button class="message-delete-btn" @click="handleDelete" title="删除消息">
      <svg
        width="16"
        height="16"
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

    <!-- 选择复选框 -->
    <MessageCheckbox
      :is-share-mode="isShareMode"
      :is-selected="isSelected"
      :role="message.role"
      @toggle="handleToggleSelect"
    />

    <!-- 用户消息 -->
    <UserMessage
      v-if="message.role === 'user'"
      ref="userMessageRef"
      :content="message.content"
      @save="handleSaveEdit"
      @cancel="handleCancelEdit"
      @copy="handleCopy"
      @edit="handleEdit"
      @share="handleShare"
    />

    <!-- 用户消息操作按钮 - 已隐藏 -->
    <!-- <MessageActions
      v-if="message.role === 'user' && showUserActions"
      role="user"
      @copy="handleCopy"
      @edit="handleEdit"
      @share="handleShare"
    /> -->

    <!-- AI 消息 -->
    <AIMessage
      v-else
      :content="message.content"
      :is-streaming="message.isStreaming"
      :show-actions="showActions"
      @copy="handleCopy"
      @regenerate="handleRegenerate"
      @share="handleShare"
      @feedback="handleFeedback"
    />

    <!-- 底部操作栏(分享模式) -->
    <MessageActionBar
      :show="isShareMode"
      :role="message.role"
      @copy="handleCopy"
      @copy-link="handleCopyLink"
      @regenerate="handleRegenerate"
      @edit="handleEdit"
      @cancel="handleCancelShare"
      @toggle-select="handleToggleSelect"
    />
  </div>
</template>

<script setup name="ChatMessage">
import { computed, ref, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import UserMessage from './UserMessage.vue'
import AIMessage from './AIMessage.vue'
import MessageCheckbox from './MessageCheckbox.vue'
import MessageActions from './MessageActions.vue'
import MessageActionBar from './MessageActionBar.vue'

const props = defineProps({
  message: { type: Object, required: true },
  isLast: { type: Boolean, default: false },
  content: String,
  shareMode: { type: Boolean, default: false },
  sessionId: { type: String, default: '' },
})

const emit = defineEmits(['regenerate', 'edit', 'select', 'share', 'cancelShare', 'delete'])

const msgApi = useMessage()
const dialogApi = useDialog()
const isSelected = ref(false)
const isShareMode = ref(false)
const userMessageRef = ref(null)

// 监听外部 shareMode 变化
watch(
  () => props.shareMode,
  (newVal) => {
    isShareMode.value = newVal
    if (!newVal) {
      isSelected.value = false
    }
  },
  { immediate: true },
)

const showActions = computed(() => props.message.role === 'assistant' && !props.message.isStreaming)

// 用户消息显示操作按钮
const showUserActions = computed(() => props.message.role === 'user')

// 切换选择状态
const handleToggleSelect = (selected) => {
  isSelected.value = selected
  emit('select', {
    messageId: props.message.id,
    selected: isSelected.value,
  })
}

// 分享
const handleShare = () => {
  isShareMode.value = true
  emit('share', props.message.id)
}

// 取消分享
const handleCancelShare = () => {
  isShareMode.value = false
  isSelected.value = false
  emit('cancelShare', props.message.id)
}

// 复制消息
const handleCopy = async () => {
  const content = props.message.content ?? ''

  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content)
      msgApi.success('已复制到剪贴板')
      return
    }

    // 降级方案：使用传统的 execCommand
    fallbackCopy(content)
  } catch (error) {
    console.error('复制失败:', error)
    // 尝试降级方案
    try {
      fallbackCopy(content)
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      msgApi.error('复制失败，请手动选择文本复制')
    }
  }
}

// 降级复制方案
const fallbackCopy = (text) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      msgApi.success('已复制到剪贴板')
    } else {
      throw new Error('execCommand 返回 false')
    }
  } finally {
    document.body.removeChild(textArea)
  }
}

// 复制链接
const handleCopyLink = () => {
  // 使用会话ID生成链接，而不是消息ID
  const sessionId = props.sessionId || localStorage.getItem('current_session_id') || ''
  const link = sessionId
    ? `${window.location.origin}/chat?sessionId=${sessionId}`
    : `${window.location.origin}/chat`
  navigator.clipboard
    .writeText(link)
    .then(() => {
      msgApi.success('链接已复制到剪贴板')
    })
    .catch(() => {
      msgApi.error('复制链接失败')
    })
}

// 编辑消息
const handleEdit = () => {
  // 如果是用户消息，启动编辑模式
  if (props.message.role === 'user' && userMessageRef.value) {
    userMessageRef.value.startEdit()
  } else {
    // 其他消息类型，触发父组件的编辑事件
    emit('edit', props.message)
  }
  isSelected.value = false
}

// 保存编辑
const handleSaveEdit = (newContent) => {
  emit('edit', { ...props.message, content: newContent })
  //  不显示提示，由父组件统一处理并触发重新生成
}

// 取消编辑
const handleCancelEdit = () => {
  msgApi.info('已取消编辑')
}

// 重新生成
const handleRegenerate = () => {
  emit('regenerate', props.message.id)
}

// 反馈
const handleFeedback = (type) => {
  msgApi.success(type === 'good' ? '感谢您的反馈!' : '我们会改进')
}

// 删除消息
const handleDelete = () => {
  dialogApi.warning({
    title: '确认删除',
    content: '删除后将无法恢复此消息，确定要删除吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        //  只触发事件，由父组件统一处理删除逻辑
        emit('delete', props.message.id)
        msgApi.success('删除成功')
      } catch (error) {
        msgApi.error('删除失败')
      }
    },
  })
}
</script>

<style scoped>
.chat-message {
  position: relative;
  padding: 16px 0;
}

.chat-message:hover {
  background: rgba(16, 22, 42, 0.3); /* ✅ 深色半透明背景，符合深色主题 */
  backdrop-filter: blur(10px); /* ✅ 添加毛玻璃效果 */
}

/* 删除按钮 */
.message-delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #999;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
}

.chat-message:hover .message-delete-btn {
  opacity: 1;
}

.message-delete-btn:hover {
  background: #ff4d4f;
  color: white;
}
</style>
