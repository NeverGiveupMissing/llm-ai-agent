<template>
  <div
    class="session-item"
    :class="{ active: session.id === currentSessionId }"
    @click="$emit('select', session)"
  >
    <div class="item-content">
      <!-- 置顶标志 -->
      <n-icon v-if="session.is_pinned" class="pin-icon" size="14" color="#ff9800" title="已置顶">
        <PinOutline />
      </n-icon>
      <n-icon class="icon" size="16">
        <ChatbubbleEllipsesOutline />
      </n-icon>
      <span class="text">{{ session.title }}</span>
    </div>

    <!-- 更多操作按钮 -->
    <n-dropdown
      trigger="click"
      :options="menuOptions"
      @select="(key) => $emit('menu-select', key, session)"
      placement="right-start"
    >
      <button class="more-btn" @click.stop title="更多操作">
        <n-icon size="16"><EllipsisHorizontalOutline /></n-icon>
      </button>
    </n-dropdown>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { NIcon, NDropdown } from 'naive-ui'
import {
  PinOutline,
  ChatbubbleEllipsesOutline,
  EllipsisHorizontalOutline,
  CreateOutline,
  ShareSocialOutline,
  AddCircleOutline,
  FolderOutline,
  DownloadOutline,
  DocumentTextOutline,
  DocumentOutline,
  FileTrayFullOutline,
  CodeSlashOutline,
  TrashOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  currentSessionId: {
    type: String,
    default: '',
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select', 'menu-select'])

// 💡 将会话菜单选项生成逻辑移到子组件内部
const menuOptions = computed(() => {
  const moveToGroupChildren = [
    {
      label: '新建分组',
      key: 'new-group',
      icon: () => h(NIcon, null, { default: () => h(AddCircleOutline) }),
    },
  ]
  if (props.groups.length > 0) {
    props.groups.forEach((group) => {
      moveToGroupChildren.push({
        label: group.name,
        key: `group-${group.id}`,
        icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
      })
    })
  }

  return [
    {
      label: '重命名',
      key: 'rename',
      icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
    },
    {
      label: props.session.is_pinned ? '取消置顶' : '置顶此对话',
      key: 'pin',
      icon: () => h(NIcon, null, { default: () => h(PinOutline) }),
    },
    {
      label: '分享此对话',
      key: 'share',
      icon: () => h(NIcon, null, { default: () => h(ShareSocialOutline) }),
    },
    { type: 'divider', key: 'd1' },
    {
      label: '移动到分组',
      key: 'move-to-group',
      icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
      children: moveToGroupChildren,
    },
    {
      label: '导出对话',
      key: 'export',
      icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }),
      children: [
        {
          label: 'Markdown',
          key: 'export-markdown',
          icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) }),
        },
        {
          label: 'Word',
          key: 'export-word',
          icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) }),
        },
        {
          label: 'PDF',
          key: 'export-pdf',
          icon: () => h(NIcon, null, { default: () => h(DocumentOutline) }),
        },
        {
          label: 'TXT',
          key: 'export-txt',
          icon: () => h(NIcon, null, { default: () => h(FileTrayFullOutline) }),
        },
        {
          label: 'JSON',
          key: 'export-json',
          icon: () => h(NIcon, null, { default: () => h(CodeSlashOutline) }),
        },
      ],
    },
    { type: 'divider', key: 'd2' },
    {
      label: '删除此对话',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      props: { style: { color: '#ff4d4f' } },
    },
  ]
})
</script>

<style scoped>
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  margin: 2px 0;
}

.session-item:hover {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.15);
}

.session-item.active {
  background: rgba(177, 134, 255, 0.15);
  border: 1px solid rgba(177, 134, 255, 0.3);
  box-shadow: 0 0 15px rgba(177, 134, 255, 0.2);
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.pin-icon {
  flex-shrink: 0;
}

.icon {
  flex-shrink: 0;
  color: rgba(224, 224, 224, 0.7);
}

.session-item.active .icon {
  color: #b186ff;
}

.text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #e0e0e0;
}

.session-item.active .text {
  color: #b186ff;
  font-weight: 500;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  color: rgba(224, 224, 224, 0.6);
}

.session-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background: rgba(0, 242, 254, 0.1);
  border-radius: 4px;
  color: #00f2fe;
}

/* Naive UI 下拉菜单覆盖 */
:deep(.n-dropdown) {
  background: rgba(16, 22, 42, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 242, 254, 0.2) !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1) !important;
}

:deep(.n-dropdown-option) {
  color: #e0e0e0 !important;
}

:deep(.n-dropdown-option:hover) {
  background: rgba(0, 242, 254, 0.1) !important;
  color: #00f2fe !important;
}

:deep(.n-dropdown-divider) {
  background: rgba(0, 242, 254, 0.1) !important;
}
</style>
