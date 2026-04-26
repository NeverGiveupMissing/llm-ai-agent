<template>
  <transition name="action-bar">
    <div v-if="show" class="message-action-bar">
      <div class="action-bar-left">
        <div class="select-info">
          <div class="checkbox-icon checked" @click="handleToggleSelect">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="select-text">已选择</span>
        </div>
      </div>
      <div class="action-bar-right">
        <button class="bar-action-btn" @click="handleCopy" title="复制文本">
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
          <span>复制文本</span>
        </button>
        <button class="bar-action-btn" @click="handleCopyLink" title="复制链接">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>复制链接</span>
        </button>
        <button
          v-if="showRegenerate"
          class="bar-action-btn"
          @click="handleRegenerate"
          title="重新生成"
        >
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
          <span>重新生成</span>
        </button>
        <button
          v-if="showEdit"
          class="bar-action-btn"
          @click="handleEdit"
          title="编辑"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>编辑</span>
        </button>
        <button class="bar-action-btn cancel-btn" @click="handleCancel" title="取消">
          <span>取消</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup name="MessageActionBar">
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['copy', 'copyLink', 'regenerate', 'edit', 'cancel', 'toggleSelect'])

const showRegenerate = computed(() => props.role === 'assistant')
const showEdit = computed(() => props.role === 'user')

const handleCopy = () => {
  emit('copy')
}

const handleCopyLink = () => {
  emit('copyLink')
}

const handleRegenerate = () => {
  emit('regenerate')
}

const handleEdit = () => {
  emit('edit')
}

const handleCancel = () => {
  emit('cancel')
}

const handleToggleSelect = () => {
  emit('toggleSelect')
}
</script>

<style scoped>
.message-action-bar {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 500px;
  z-index: 10;
}

.action-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.bar-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.bar-action-btn:hover {
  background: #f0f7ff;
}

.bar-action-btn svg {
  flex-shrink: 0;
}

.cancel-btn {
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 操作栏动画 */
.action-bar-enter-active,
.action-bar-leave-active {
  transition: all 0.3s ease;
}

.action-bar-enter-from,
.action-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.action-bar-enter-to,
.action-bar-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.checkbox-icon {
  width: 24px;
  height: 24px;
  border: 2px solid #10a37f;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10a37f 0%, #0ea5e9 100%);
  color: white;
  cursor: pointer;
}
</style>