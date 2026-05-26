<template>
  <div class="group-header">
    <div class="group-title" @click="$emit('toggle-collapse')">
      <!-- 置顶标识 -->
      <n-icon v-if="group.is_pinned" size="14" color="#ff9800" title="已置顶">
        <PinOutline />
      </n-icon>

      <n-icon size="14">
        <component :is="isCollapsed ? ChevronForwardOutline : ChevronDownOutline" />
      </n-icon>

      <!-- 动态渲染分组图标 -->
      <n-icon v-if="group.icon" size="16">
        <component :is="getIconComponent(group.icon)" />
      </n-icon>

      <span>{{ group.name }}</span>
      <span class="group-count">({{ sessionCount }})</span>
    </div>

    <!-- 分组操作按钮 -->
    <div class="group-actions">
      <n-button
        text
        size="tiny"
        @click.stop="$emit('pin')"
        :title="group.is_pinned ? '取消置顶' : '置顶'"
      >
        <template #icon>
          <n-icon><PinOutline /></n-icon>
        </template>
      </n-button>

      <n-dropdown
        trigger="click"
        :options="[
          { label: '重命名', key: 'rename' },
          { label: '删除', key: 'delete' },
        ]"
        @select="(key) => $emit('menu-select', key)"
      >
        <n-button text size="tiny" @click.stop title="更多操作">
          <template #icon>
            <n-icon><EllipsisHorizontalOutline /></n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>

<script setup>
import { NIcon, NButton, NDropdown } from 'naive-ui'
import {
  PinOutline,
  ChevronForwardOutline,
  ChevronDownOutline,
  FolderOutline,
  EllipsisHorizontalOutline,
  // 分组图标
  DocumentTextOutline,
  ChatbubbleEllipsesOutline,
  BookOutline,
  ArchiveOutline,
  GridOutline,
  CodeSlashOutline,
} from '@vicons/ionicons5'

// 图标名称到组件的映射表
const iconMap = {
  DocumentTextOutline,
  ChatbubbleEllipsesOutline,
  BookOutline,
  ArchiveOutline,
  GridOutline,
  CodeSlashOutline,
  FolderOutline,
}

// 根据图标名称获取组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FolderOutline
}

defineProps({
  group: {
    type: Object,
    required: true,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  sessionCount: {
    type: Number,
    default: 0,
  },
})

defineEmits(['toggle-collapse', 'pin', 'menu-select'])
</script>

<style scoped>
:deep(.group-header) {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  border-right: 1px solid #e5e7eb;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.group-count {
  font-size: 12px;
  color: #999;
}

.group-actions {
  display: flex;
  gap: 4px;
}
</style>
