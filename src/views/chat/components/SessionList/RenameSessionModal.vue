<template>
  <n-modal v-model:show="visible" preset="card" title="重命名会话" style="width: 400px">
    <n-input
      v-model:value="title"
      placeholder="请输入新的会话名称"
      @keydown.enter="handleConfirm"
    />

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
import { NModal, NSpace, NButton, NInput } from 'naive-ui'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  initialTitle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const title = ref('')

watch(
  () => props.initialTitle,
  (newVal) => {
    title.value = newVal
  },
  { immediate: true }
)

const handleConfirm = () => {
  if (!title.value.trim()) {
    return
  }
  emit('confirm', title.value)
}
</script>
