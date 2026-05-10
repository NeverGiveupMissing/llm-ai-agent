<template>
  <div
    :style="
      label
        ? 'display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;'
        : 'display: inline-block; vertical-align: middle;'
    "
    class="field-help-wrapper"
  >
    <span v-if="label" class="field-help-label" style="line-height: 1">
      {{ label }}
    </span>

    <n-tooltip
      trigger="hover"
      :show-arrow="true"
      :disabled="!content"
      :theme-overrides="themeOverrides"
      :to="false"
    >
      <template #trigger>
        <n-icon
          :size="iconSize"
          :component="HelpCircleOutline"
          class="field-help-icon"
          :class="{ 'field-help-icon--disabled': !content }"
        />
      </template>
      <span class="field-help-content">{{ content }}</span>
    </n-tooltip>
  </div>
</template>

<script setup>
import { NTooltip, NIcon } from 'naive-ui'
import { HelpCircleOutline } from '@vicons/ionicons5'

defineProps({
  /**
   * 表单项名称（可选）
   */
  label: {
    type: String,
    default: '',
  },
  /**
   * 提示内容
   */
  content: {
    type: String,
    required: true,
  },
  /**
   * 图标大小
   */
  iconSize: {
    type: Number,
    default: 14,
  },
  /**
   * 弹出位置
   */
  placement: {
    type: String,
    default: 'top',
  },
})

// 主题覆盖：更柔和的样式，解决白板问题
const themeOverrides = {
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#333', // 深色文字
  backgroundColor: '#fff', // 明确设置背景色为白色
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  zIndex: 10000,
}
</script>

<style scoped>
.field-help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #e6a23c; /* 黄色/橙色 */
  cursor: help;
  transition: all 0.2s ease;
  vertical-align: middle;
  margin-right: 4px;
}

.field-help-icon:hover {
  color: #d9952f; /* 悬停时加深 */
}

.field-help-icon--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.field-help-content {
  white-space: normal; /* 允许换行，防止文字溢出 */
  word-break: break-word; /* 长单词换行 */
  line-height: 1.5; /* 提高可读性 */
}
</style>
