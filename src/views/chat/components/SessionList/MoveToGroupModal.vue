<template>
  <n-modal v-model:show="moveToGroupModalVisible" preset="card" title="移动到分组" style="width: 400px">
    <n-space vertical>
      <div style="font-size: 14px; color: #666">选择目标分组：</div>
      <n-space vertical>
        <n-button
          v-for="group in groups"
          :key="group.id"
          :type="targetGroupId === group.id ? 'primary' : 'default'"
          block
          @click="targetGroupId = group.id"
        >
          <template #icon>
            <n-icon><FolderOutline /></n-icon>
          </template>
          {{ group.name }}
        </n-button>
      </n-space>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="moveToGroupModalVisible = false">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NModal, NSpace, NButton, NIcon } from 'naive-ui'
import { FolderOutline } from '@vicons/ionicons5'

const props = defineProps({
  visible: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
})

// 💡 遵循 RuoYi 规范，显式声明对外的双向绑定事件 update:visible
const emit = defineEmits(['update:visible', 'confirm'])

// 💡 计算属性更名为 moveToGroupModalVisible，打通 Naive UI 的 v-model:show 与父组件传进来的 props.visible
const moveToGroupModalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const msgApi = useMessage()

const targetGroupId = ref(null)

const handleConfirm = () => {
  if (!targetGroupId.value) {
    msgApi.warning('请选择目标分组')
    return
  }
  emit('confirm', targetGroupId.value)
  targetGroupId.value = null
}
</script>
