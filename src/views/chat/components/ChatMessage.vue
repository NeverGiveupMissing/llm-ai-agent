<!-- src/views/chat/components/ChatMessage.vue -->
<template>
  <div class="chat-message" :class="`role-${message.role}`">
    <div class="message-avatar">
      <n-avatar v-if="message.role === 'user'" :size="36" round> 用户 </n-avatar>
      <n-avatar v-else :size="36" round type="primary"> AI </n-avatar>
    </div>
    <div class="message-content">
      <div class="message-text">
        {{ message.content }}
        <span v-if="message.isStreaming" class="typing-indicator">▎</span>
      </div>
      <div class="message-time">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script>
import { NAvatar } from 'naive-ui'

export default {
  name: 'ChatMessage',
  components: {
    NAvatar,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
    isLast: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return {
      formatTime,
    }
  },
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
}

.role-user {
  flex-direction: row-reverse;
  background-color: #f0f7ff;
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
}

.typing-indicator {
  animation: blink 1s infinite;
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

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
