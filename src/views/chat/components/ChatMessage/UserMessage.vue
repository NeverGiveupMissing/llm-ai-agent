<template>
  <div class="user-message-wrapper">
    <div class="message-content user-content">
      <div class="message-text">{{ content }}</div>
    </div>
    <div class="message-icon user-icon">
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
  </div>
</template>

<script setup name="UserMessage">
defineProps({
  content: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.user-message-wrapper {
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
}

.user-content {
  max-width: 70%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.user-content .message-text {
  color: white;
  line-height: 1.6;
  word-break: break-word;
  font-size: 15px;
}

.user-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
</style>