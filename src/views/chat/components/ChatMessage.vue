<template>
  <div class="chat-message" :class="`role-${message.role}`">
    <div class="message-avatar">
      <n-avatar v-if="message.role === 'user'" :size="36" round> 用户 </n-avatar>
      <n-avatar v-else :size="36" round type="primary"> AI </n-avatar>
    </div>
    <div class="message-content">
      <!-- 思考中动画 -->
      <div v-if="isThinking" class="thinking-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <!-- 消息内容 -->
      <div v-else class="message-text">
        {{ message.content }}
        <span v-if="message.isStreaming" class="typing-cursor">▎</span>
      </div>

      <!-- AI 消息操作按钮和免责声明 -->
      <template v-if="message.role === 'assistant' && !isThinking">
        <!-- 操作按钮栏 -->
        <div v-if="showActions" class="message-actions">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text size="small" @click="handleCopy">
                <template #icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </template>
              </n-button>
            </template>
            复制
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text size="small" @click="handleRegenerate">
                <template #icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
                    <path d="M3 3v9h9" />
                  </svg>
                </template>
              </n-button>
            </template>
            重新生成
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                text
                size="small"
                :type="feedback === 'good' ? 'success' : 'default'"
                @click="handleFeedback('good')"
              >
                <template #icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M7 10v12" />
                    <path
                      d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"
                    />
                  </svg>
                </template>
              </n-button>
            </template>
            赞
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                text
                size="small"
                :type="feedback === 'bad' ? 'error' : 'default'"
                @click="handleFeedback('bad')"
              >
                <template #icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M17 14V2" />
                    <path
                      d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"
                    />
                  </svg>
                </template>
              </n-button>
            </template>
            踩
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text size="small" @click="handleShare">
                <template #icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" x2="12" y1="2" y2="15" />
                  </svg>
                </template>
              </n-button>
            </template>
            分享
          </n-tooltip>
        </div>

        <!-- 免责声明 -->
        <div class="ai-disclaimer">本回答由 AI 生成，内容仅供参考，请仔细甄别。</div>

        <div class="message-time">
          {{ formatTime(message.timestamp) }}
        </div>
      </template>

      <!-- 用户消息时间 -->
      <div v-if="message.role === 'user'" class="message-time">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup name="ChatMessage">
import { computed, ref } from 'vue'
import { NAvatar, useMessage, NTooltip, NButton } from 'naive-ui'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['regenerate'])
const msgApi = useMessage() // 🔑 重命名避免与 props.message 冲突
const feedback = ref(null)

// 判断是否处于思考状态
const isThinking = computed(() => {
  return props.message.role === 'assistant' && props.message.isStreaming && !props.message.content
})

// 是否显示操作按钮（完成且是最后一条消息）
const showActions = computed(() => {
  return props.message.role === 'assistant' && !props.message.isStreaming && props.isLast
})

// 复制消息内容
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    msgApi.success('已复制到剪贴板')
  } catch (error) {
    msgApi.error('复制失败')
  }
}

// 重新生成
const handleRegenerate = () => {
  emit('regenerate', props.message.id)
}

// 反馈（赞/踩）
const handleFeedback = (type) => {
  feedback.value = feedback.value === type ? null : type
  msgApi.info(feedback.value ? `已${feedback.value === 'good' ? '点赞' : '点踩'}` : '已取消反馈')
}

// 分享
const handleShare = () => {
  msgApi.info('分享功能开发中...')
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.chat-message:hover {
  background-color: #f5f5f5;
}

.role-user {
  flex-direction: row-reverse;
  background-color: #f0f7ff;
}

.role-user:hover {
  background-color: #e6f0ff;
}

.role-assistant {
  background-color: #fafafa;
}

.message-content {
  max-width: 70%;
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 思考中动画 */
.thinking-animation {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
}

.thinking-animation .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-animation .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-animation .dot:nth-child(2) {
  animation-delay: -0.16s;
}

.thinking-animation .dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 打字机光标 */
.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #1677ff;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* AI 消息操作按钮 */
.message-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
}

.message-actions :deep(.n-button) {
  padding: 4px;
  min-width: 28px;
  height: 28px;
}

.message-actions :deep(.n-button .n-button__icon) {
  margin: 0;
}

/* 免责声明 */
.ai-disclaimer {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
