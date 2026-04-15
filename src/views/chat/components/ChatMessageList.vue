<template>
  <div ref="messageListRef" class="chat-message-list">
    <div v-if="messages.length === 0" class="empty-state">
      <n-empty description="开始新的对话">
        <template #icon>
          <n-icon :size="48" color="#ccc">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
              />
              <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z" />
            </svg>
          </n-icon>
        </template>
      </n-empty>
    </div>
    <div v-else v-for="msg in messages" :key="msg.id">
      <ChatMessage :message="msg" :is-last="msg.id === lastMessageId" />
    </div>
  </div>
</template>

<script setup name="ChatMessageList">
import { ref, watch, nextTick } from 'vue'
import { NEmpty, NIcon } from 'naive-ui'
import ChatMessage from './ChatMessage.vue'
import { scrollToBottom } from '@/utils/sse'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
})

const messageListRef = ref(null)
const lastMessageId = ref('')

const scrollToEnd = () => {
  nextTick(() => {
    scrollToBottom(messageListRef.value)
    if (props.messages.length > 0) {
      lastMessageId.value = props.messages[props.messages.length - 1].id
    }
  })
}

watch(
  () => props.messages.length,
  () => {
    scrollToEnd()
  },
)

watch(
  () => props.messages.map((m) => m.content).join(''),
  () => {
    const streamingMsg = props.messages.find((m) => m.isStreaming)
    if (streamingMsg) {
      scrollToEnd()
    }
  },
)
</script>

<style scoped>
.chat-message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
