<template>
  <div class="chat-message" :class="`role-${message.role}`">
    <!-- 选择复选框 -->
    <MessageCheckbox
      :is-share-mode="isShareMode"
      :is-selected="isSelected"
      :role="message.role"
      @toggle="handleToggleSelect"
    />

    <!-- 用户消息 -->
    <UserMessage v-if="message.role === 'user'" :content="message.content" />

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
import { useMessage } from 'naive-ui'
import UserMessage from './UserMessage.vue'
import AIMessage from './AIMessage.vue'
import MessageCheckbox from './MessageCheckbox.vue'
import MessageActionBar from './MessageActionBar.vue'

const props = defineProps({
  message: { type: Object, required: true },
  isLast: { type: Boolean, default: false },
  content: String,
  shareMode: { type: Boolean, default: false },
})

const emit = defineEmits(['regenerate', 'edit', 'select', 'share', 'cancelShare'])

const msgApi = useMessage()
const isSelected = ref(false)
const isShareMode = ref(false)

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

const showActions = computed(
  () => props.message.role === 'assistant' && !props.message.isStreaming,
)

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
  const link = `${window.location.origin}/chat/${props.message.id}`
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
  emit('edit', props.message)
  isSelected.value = false
}

// 重新生成
const handleRegenerate = () => {
  emit('regenerate', props.message.id)
}

// 反馈
const handleFeedback = (type) => {
  msgApi.success(type === 'good' ? '感谢您的反馈!' : '我们会改进')
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.chat-message:hover {
  background-color: #f9f9f9;
}

.chat-message.selected {
  background-color: #f0f7ff;
}
</style>
