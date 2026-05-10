<template>
  <div class="icon-picker">
    <n-input-group>
      <n-input
        v-model:value="localValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:value="handleInputChange"
      />
      <n-popover v-model:show="popoverVisible" trigger="click" :width="320" placement="bottom-end" :show-arrow="true">
        <template #trigger>
          <n-button :disabled="disabled">
            <template #icon>
              <n-icon v-if="localValue && currentIcon" :size="18"><component :is="currentIcon" /></n-icon>
              <n-icon v-else :size="18"><AppsOutline /></n-icon>
            </template>
          </n-button>
        </template>
        <div class="icon-picker-popover">
          <n-input v-model:value="searchKeyword" placeholder="搜索图标名称..." clearable size="small" style="margin-bottom: 12px">
            <template #prefix><n-icon><SearchOutline /></n-icon></template>
          </n-input>
          <div v-if="filteredIcons.length > 0" class="icon-grid">
            <div v-for="icon in filteredIcons" :key="icon.name" class="icon-item" :class="{ active: localValue === icon.name }" @click="selectIcon(icon.name)">
              <n-icon :size="20"><component :is="icon.component" /></n-icon>
              <span class="icon-label">{{ icon.label }}</span>
            </div>
          </div>
          <div v-else class="empty-state"><n-empty description="未找到匹配的图标" size="small" /></div>
        </div>
      </n-popover>
    </n-input-group>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NInput, NButton, NIcon, NPopover, NInputGroup, NEmpty } from 'naive-ui'
import {
  // defaultIcons 中使用的图标
  HomeOutline,
  GridOutline,
  ChatbubbleEllipsesOutline,
  ConstructOutline,
  BookOutline,
  ArchiveOutline,
  SettingsOutline,
  PersonOutline,
  PeopleOutline,
  MenuOutline,
  FileTrayFullOutline,
  HammerOutline,
  ServerOutline,
  CodeSlashOutline,
  DocumentTextOutline,
  FolderOutline,
  DownloadOutline,
  CloudUploadOutline,
  AddCircleOutline,
  PencilOutline,
  TrashOutline,
  SearchOutline,
  RefreshOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  InformationCircleOutline,
  // 弹出框按钮图标
  AppsOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请选择图标',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // 可选：传入自定义图标列表
  iconList: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['update:value', 'change'])

const localValue = ref(props.value)
const popoverVisible = ref(false)
const searchKeyword = ref('')

// 默认图标列表（使用 @vicons/ionicons5）
const defaultIcons = [
  { name: 'home', label: '首页', component: HomeOutline },
  { name: 'dashboard', label: '仪表盘', component: GridOutline },
  { name: 'chat', label: '对话', component: ChatbubbleEllipsesOutline },
  { name: 'agent', label: '智能体', component: ConstructOutline },
  { name: 'knowledge', label: '知识库', component: BookOutline },
  { name: 'memory', label: '记忆', component: ArchiveOutline },
  { name: 'settings', label: '设置', component: SettingsOutline },
  { name: 'user', label: '用户', component: PersonOutline },
  { name: 'role', label: '角色', component: PeopleOutline },
  { name: 'menu', label: '菜单', component: MenuOutline },
  { name: 'log', label: '日志', component: FileTrayFullOutline },
  { name: 'tool', label: '工具', component: HammerOutline },
  { name: 'database', label: '数据库', component: ServerOutline },
  { name: 'code', label: '代码', component: CodeSlashOutline },
  { name: 'document', label: '文档', component: DocumentTextOutline },
  { name: 'folder', label: '文件夹', component: FolderOutline },
  { name: 'download', label: '下载', component: DownloadOutline },
  { name: 'upload', label: '上传', component: CloudUploadOutline },
  { name: 'add', label: '添加', component: AddCircleOutline },
  { name: 'edit', label: '编辑', component: PencilOutline },
  { name: 'delete', label: '删除', component: TrashOutline },
  { name: 'search', label: '搜索', component: SearchOutline },
  { name: 'refresh', label: '刷新', component: RefreshOutline },
  { name: 'checkmark', label: '成功', component: CheckmarkCircleOutline },
  { name: 'warning', label: '警告', component: WarningOutline },
  { name: 'information', label: '信息', component: InformationCircleOutline },
]

// 使用传入的图标列表或默认列表
const iconList = computed(() => props.iconList || defaultIcons)

// 当前显示的图标组件
const currentIcon = computed(() => {
  const icon = iconList.value.find((item) => item.name === localValue.value)
  return icon ? icon.component : null
})

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!searchKeyword.value) {
    return iconList.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return iconList.value.filter(
    (icon) =>
      icon.name.toLowerCase().includes(keyword) || icon.label.toLowerCase().includes(keyword),
  )
})

// 选择图标
const selectIcon = (name) => {
  localValue.value = name
  popoverVisible.value = false
  searchKeyword.value = ''
  emit('update:value', name)
  emit('change', name)
}

// 输入框变化
const handleInputChange = (value) => {
  emit('update:value', value)
  emit('change', value)
}
</script>

<style scoped>
.icon-picker {
  width: 100%;
}

.icon-picker-trigger {
  cursor: pointer;
}

.icon-picker-popover {
  padding: 12px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.icon-item:hover {
  background: #f5f5f5;
  border-color: #1890ff;
}

.icon-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.icon-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.icon-item.active .icon-label {
  color: #1890ff;
}
</style>
