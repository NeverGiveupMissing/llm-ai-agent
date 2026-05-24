<template>
  <n-modal v-model:show="renameModalVisible" preset="card" title="重命名会话" style="width: 400px">
    <n-input
      v-model:value="title"
      placeholder="请输入新的会话名称"
      @keydown.enter="handleConfirm"
    />

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

// 💡 遵循 RuoYi 规范，显式声明对外的双向绑定事件 update:visible
const emit = defineEmits(['update:visible', 'confirm'])

// 💡 计算属性更名为 renameModalVisible，打通 Naive UI 的 v-model:show 与父组件传进来的 props.visible
const renameModalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const msgApi = useMessage()

const title = ref('')

watch(
  () => props.initialTitle,
  (newVal) => {
    title.value = newVal
  },
  { immediate: true },
)

const handleConfirm = () => {
  if (!title.value.trim()) {
    msgApi.warning('会话名称不能为空')
    return
  }
  emit('confirm', title.value)
}
</script>
