<template>
  <div class="user-message-wrapper">
    <div class="message-content user-content">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="edit-mode">
        <div class="edit-content-wrapper">
          <n-input
            v-model:value="editContent"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 8 }"
            placeholder="编辑消息内容..."
            @keydown.enter.exact.prevent="handleSave"
            @keydown.escape="handleCancel"
          />
          <div class="edit-actions">
            <n-button size="small" @click="handleCancel">取消</n-button>
            <n-button
              size="small"
              type="primary"
              @click="handleSave"
              :disabled="!editContent.trim()"
            >
              保存
            </n-button>
          </div>
        </div>
      </div>
      <!-- 显示模式 -->
      <div v-else class="message-text">{{ content }}</div>
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
import { ref } from 'vue'
import { NInput, NButton } from 'naive-ui'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['edit', 'save', 'cancel'])

const isEditing = ref(false)
const editContent = ref('')

// 开始编辑
const startEdit = () => {
  isEditing.value = true
  editContent.value = props.content
}

// 保存编辑
const handleSave = () => {
  if (editContent.value.trim()) {
    emit('save', editContent.value.trim())
    isEditing.value = false
    editContent.value = ''
  }
}

// 取消编辑
const handleCancel = () => {
  isEditing.value = false
  editContent.value = ''
  emit('cancel')
}

// 暴露方法供父组件调用
defineExpose({
  startEdit,
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
  background: #f5f5f5;
  color: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.user-content .message-text {
  color: #000;
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

/* 编辑模式样式 */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-content-wrapper {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
