<template>
  <n-modal v-model:show="createGroupModalVisible" preset="card" title="新建分组" style="width: 500px">
    <n-space vertical>
      <n-input-group>
        <n-input-group-label>分组名称：</n-input-group-label>
        <n-input v-model:value="groupName" placeholder="请输入分组名称" />
      </n-input-group>

      <div>
        <div style="margin-bottom: 8px; font-size: 14px; color: #666">选择图标：</div>
        <n-space wrap>
          <n-button
            v-for="icon in presetIcons"
            :key="icon.key"
            :type="selectedIcon === icon.component ? 'primary' : 'default'"
            @click="selectedIcon = icon.component"
          >
            <template #icon>
              <n-icon><component :is="icon.component" /></n-icon>
            </template>
            {{ icon.label }}
          </n-button>
        </n-space>
      </div>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="createGroupModalVisible = false">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NModal, NSpace, NButton, NIcon, NInputGroup, NInputGroupLabel } from 'naive-ui'
import {
  FolderOutline,
  AddCircleOutline,
  DownloadOutline,
  DocumentTextOutline,
  DocumentOutline,
  FileTrayFullOutline,
  CodeSlashOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

// 💡 遵循 RuoYi 规范，显式声明对外的双向绑定事件 update:visible
const emit = defineEmits(['update:visible', 'confirm'])

// 💡 计算属性更名为 createGroupModalVisible，打通 Naive UI 的 v-model:show 与父组件传进来的 props.visible
const createGroupModalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const msgApi = useMessage()

const groupName = ref('')
const selectedIcon = ref(FolderOutline)

const presetIcons = [
  { key: 'folder', label: '文件夹', component: FolderOutline },
  { key: 'add-circle', label: '添加', component: AddCircleOutline },
  { key: 'download', label: '下载', component: DownloadOutline },
  { key: 'document-text', label: '文档', component: DocumentTextOutline },
  { key: 'document', label: '文件', component: DocumentOutline },
  { key: 'file-tray', label: '托盘', component: FileTrayFullOutline },
  { key: 'code', label: '代码', component: CodeSlashOutline },
]

const handleConfirm = () => {
  if (!groupName.value.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }
  emit('confirm', {
    name: groupName.value,
    icon: selectedIcon.value,
  })
  groupName.value = ''
  selectedIcon.value = FolderOutline
}
</script>
