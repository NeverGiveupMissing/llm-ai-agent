<template>
  <n-modal v-model:show="visible" preset="card" title="重命名分组" style="width: 400px">
    <n-space vertical>
      <n-input-group>
        <n-input-group-label>分组名称：</n-input-group-label>
        <n-input v-model:value="groupName" placeholder="请输入新的分组名称" />
      </n-input-group>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('update:visible', false)">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NModal, NSpace, NButton, NInputGroup, NInputGroupLabel } from 'naive-ui'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  initialName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const groupName = ref('')

watch(
  () => props.initialName,
  (newVal) => {
    groupName.value = newVal
  },
  { immediate: true }
)

const handleConfirm = () => {
  if (!groupName.value.trim()) {
    return
  }
  emit('confirm', groupName.value)
}
</script>
