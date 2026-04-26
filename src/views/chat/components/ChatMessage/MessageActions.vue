<template>
  <div class="message-actions-fixed">
    <button class="action-icon-btn" @click="handleCopy" title="复制">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 0-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
    <button class="action-icon-btn" @click="handleRegenerate" title="重新生成">
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
    <button class="action-icon-btn" @click="handleShare" title="分享">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
      </svg>
    </button>
    <button
      class="action-icon-btn"
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
      class="action-icon-btn"
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
</template>

<script setup name="MessageActions">
import { ref } from 'vue'

const emit = defineEmits(['copy', 'regenerate', 'share', 'feedback'])

const feedback = ref(null)

const handleCopy = () => {
  emit('copy')
}

const handleRegenerate = () => {
  emit('regenerate')
}

const handleShare = () => {
  emit('share')
}

const handleFeedback = (type) => {
  feedback.value = type
  emit('feedback', type)
}
</script>

<style scoped>
.message-actions-fixed {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-message:hover .message-actions-fixed {
  opacity: 1;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.action-icon-btn.active {
  color: #10a37f;
  background: #e6f4ea;
}
</style>