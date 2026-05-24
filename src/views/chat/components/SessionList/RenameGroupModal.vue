<template>
  <n-modal v-model:show="renameModalVisible" preset="card" title="重命名分组" style="width: 400px">
    <n-space vertical>
      <n-input-group>
        <n-input-group-label>分组名称：</n-input-group-label>
        <n-input v-model:value="groupName" placeholder="请输入新的分组名称" />
      </n-input-group>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="renameModalVisible = false">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NModal, NSpace, NButton, NInputGroup, NInputGroupLabel } from 'naive-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialName: { type: String, default: '' },
})

// 💡 遵循 RuoYi 规范，显式声明对外的双向绑定事件 update:visible
const emit = defineEmits(['update:visible', 'confirm'])

// 💡 计算属性更名为 renameModalVisible，打通 Naive UI 的 v-model:show 与父组件传进来的 props.visible
const renameModalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const msgApi = useMessage()

const groupName = ref('')

watch(
  () => props.initialName,
  (newVal) => {
    groupName.value = newVal
  },
  { immediate: true },
)

const handleConfirm = () => {
  if (!groupName.value.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }
  emit('confirm', groupName.value)
}
</script>
