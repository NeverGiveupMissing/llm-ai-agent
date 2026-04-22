<template>
  <div ref="messageListRef" class="chat-message-list">
    <div class="messages-container">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-logo">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10a37f"
            stroke-width="1.5"
          >
            <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
          </svg>
        </div>
        <h2 class="empty-title">有什么可以帮你的？</h2>
      </div>

      <div v-else class="messages-scroll">
        <div v-for="msg in messages" :key="msg.id">
          <ChatMessage :message="msg" :is-last="msg.id === lastMessageId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ChatMessageList">
import { ref, watch, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'
import { scrollToBottom } from '@/utils/http'

const props = defineProps({ messages: { type: Array, default: () => [] } })

const messageListRef = ref(null)
const lastMessageId = ref('')

const scrollToEnd = () => {
  nextTick(() => {
    scrollToBottom(messageListRef.value)
    if (props.messages.length > 0)
      lastMessageId.value = props.messages[props.messages.length - 1].id
  })
}

watch(() => props.messages.length, scrollToEnd)
watch(
  () => props.messages.map((m) => m.content).join(''),
  () => {
    if (props.messages.some((m) => m.isStreaming)) scrollToEnd()
  },
)
</script>

<style scoped>
.chat-message-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 0 16px;
}

.messages-container {
  width: 100%;
  max-width: 768px;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.messages-scroll {
  padding-bottom: 20px;
}
</style>
