<template>
  <div class="user-message-wrapper">
    <div class="message-content user-content">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="edit-mode">
        <n-input
          v-model:value="editContent"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 8 }"
          placeholder="编辑消息内容..."
          @keydown.enter.exact.prevent="handleSave"
          @keydown.escape="handleCancel"
        />
        <div class="edit-actions">
          <n-button size="small" class="cancel-btn" @click="handleCancel">取消</n-button>
          <n-button size="small" type="primary" @click="handleSave" :disabled="!editContent.trim()">
            保存
          </n-button>
        </div>
      </div>
      <!-- 显示模式 -->
      <div v-else class="message-text">{{ content }}</div>

      <!-- ✅ 操作按钮组 -->
      <div v-if="!isEditing" class="action-buttons-wrapper">
        <n-button text circle size="tiny" class="action-btn" @click="$emit('copy')" title="复制">
          <template #icon>
            <n-icon><CopyOutline /></n-icon>
          </template>
        </n-button>
        <n-button text circle size="tiny" class="action-btn" @click="$emit('edit')" title="编辑">
          <template #icon>
            <n-icon><CreateOutline /></n-icon>
          </template>
        </n-button>
        <n-button text circle size="tiny" class="action-btn" @click="$emit('share')" title="分享">
          <template #icon>
            <n-icon><ShareOutline /></n-icon>
          </template>
        </n-button>
      </div>
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
import { NInput, NButton, NIcon } from 'naive-ui'
import { CopyOutline, CreateOutline, ShareOutline } from '@vicons/ionicons5'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['edit', 'save', 'cancel', 'copy', 'share'])

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
/* ✅ 用户消息容器 - 靠右对齐 */
.user-message-wrapper {
  display: flex;
  flex-direction: row-reverse; /* ✅ 头像在右，气泡在左 */
  gap: 16px;
  align-self: flex-end; /* ✅ 靠右对齐 */
}

/* ✅ 用户消息气泡 - 毛玻璃深蓝色 + 相对定位 */
.user-content {
  position: relative; /* ✅ 为绝对定位按钮提供参照 */
  max-width: 70%;
  background: rgba(24, 30, 56, 0.4); /* ✅ 极度轻薄的半透明深蓝色 */
  backdrop-filter: blur(12px); /* ✅ 毛玻璃模糊 */
  -webkit-backdrop-filter: blur(12px);
  color: white;
  padding: 20px 16px;
  border-radius: 18px;
  border: 1px solid rgba(0, 242, 254, 0.25); /* ✅ 青蓝色高光边框 */
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.08); /* ✅ 青蓝色外发光 */
  text-align: right; /* ✅ 文字右对齐 */
  transition: all 0.3s ease; /* ✅ 平滑过渡 */
}

/* ✅ 鼠标悬浮时的全息亮化特效 */
.user-content:hover {
  background: rgba(25, 32, 64, 0.65); /* ✅ 背景变亮 */
  border-color: rgba(0, 242, 254, 0.45); /* ✅ 边框加亮 */
  box-shadow: 0 6px 25px rgba(0, 242, 254, 0.2); /* ✅ 增强青蓝色外发光 */
}

.user-content .message-text {
  color: white; /* ✅ 白色文字 */
  line-height: 1.6;
  word-break: break-word;
  font-size: 15px;
}

/* ✅ 操作按钮组 - 绝对定位在气泡内部左下角 */
.action-buttons-wrapper {
  position: absolute;
  top: 40px;
  bottom: 8px;
  left: 12px;
  display: flex;
  gap: 6px;
  opacity: 0; /* ✅ 默认隐藏 */
  transform: translateY(6px); /* ✅ 默认向下偏移 */
  transition: all 0.25s ease-in-out; /* ✅ 淡入动画 */
  pointer-events: none; /* ✅ 隐藏时不响应鼠标 */
}

/* ✅ 悬浮时显示按钮组 */
.user-content:hover .action-buttons-wrapper {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* ✅ 操作按钮样式 */
.action-btn {
  color: rgba(255, 255, 255, 0.4) !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: rgba(255, 255, 255, 1) !important;
  background: rgba(0, 242, 254, 0.15) !important;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
}

/* ✅ 删除按钮特殊样式 */
.action-btn.danger:hover {
  background: rgba(255, 77, 79, 0.2) !important;
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.3);
}

/* ✅ 用户头像 - 精致圆形 + 微光圆环 */
.user-icon {
  flex-shrink: 0; /* ✅ 防止被挤压 */
  width: 40px; /* ✅ 固定大小 */
  height: 40px; /* ✅ 固定大小 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* ✅ 圆形 */
  margin-top: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    /* ✅ 极细微光圆环 */ 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 编辑模式样式 */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 10px; /* ✅ 增加输入框和按钮的间距 */
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 0; /* ✅ 移除多余的顶部边距，由 .edit-mode 的 gap 控制 */
}

/* ✅ 取消按钮白色样式 */
.cancel-btn {
  color: white !important;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}
</style>
