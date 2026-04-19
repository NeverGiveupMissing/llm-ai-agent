<template>
  <div class="chat-message" :class="`role-${message.role}`">
    <div class="message-icon">
      <div v-if="message.role === 'user'" class="icon-user">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div v-else class="icon-ai">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
          <path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.5"></path>
        </svg>
      </div>
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

      <!-- 悬停操作按钮 -->
      <div v-if="showActions" class="message-actions">
        <button class="action-btn" @click="handleCopy" title="复制">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="action-btn" @click="handleRegenerate" title="重新生成">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"></path>
            <path d="M3 3v9h9"></path>
          </svg>
        </button>
        <button
          class="action-btn"
          :class="{ active: feedback === 'good' }"
          @click="handleFeedback('good')"
          title="赞"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M7 10v12"></path>
            <path
              d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"
            ></path>
          </svg>
        </button>
        <button
          class="action-btn"
          :class="{ active: feedback === 'bad' }"
          @click="handleFeedback('bad')"
          title="踩"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 14V2"></path>
            <path
              d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup name="ChatMessage">
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps({
  message: { type: Object, required: true },
  isLast: { type: Boolean, default: false },
})

const emit = defineEmits(['regenerate'])
const msgApi = useMessage()
const feedback = ref(null)

const isThinking = computed(
  () => props.message.role === 'assistant' && props.message.isStreaming && !props.message.content,
)
const showActions = computed(
  () => props.message.role === 'assistant' && !props.message.isStreaming && props.isLast,
)

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    msgApi.success('已复制')
  } catch {
    msgApi.error('复制失败')
  }
}

const handleRegenerate = () => emit('regenerate', props.message.id)
const handleFeedback = (type) => {
  feedback.value = feedback.value === type ? null : type
  msgApi.info(feedback.value ? `已${feedback.value === 'good' ? '点赞' : '点踩'}` : '已取消')
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s;
}

.message-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f7f7f8;
  color: #666;
}

.icon-ai {
  background: #10a37f;
  color: #fff;
}

.message-content {
  flex: 1;
  max-width: 100%;
  position: relative;
}

.message-text {
  font-size: 15px;
  line-height: 1.7;
  color: #0d0d0d;
  white-space: pre-wrap;
  word-break: break-word;
}

.role-user .message-text {
  color: #0d0d0d;
}

.role-assistant .message-text {
  color: #333;
}

/* 悬停操作栏 */
.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f7f7f8;
  color: #0d0d0d;
}

.action-btn.active {
  color: #10a37f;
  background: #e6f4ea;
}

/* 思考动画 */
.thinking-animation {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
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

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #10a37f;
  font-weight: 500;
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
</style>
