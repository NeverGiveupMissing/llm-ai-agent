<template>
  <n-modal
    :show="show"
    :title="title"
    preset="card"
    :style="{ width }"
    :mask-closable="false"
    @update:show="emit('update:show', $event)"
    @after-leave="emit('closed')"
  >
    <!-- 内容区域插槽 -->
    <slot />

    <!-- 底部按钮 -->
    <template v-if="showFooter" #footer>
      <n-space justify="end">
        <CommonButton @click="handleCancel">{{ cancelText }}</CommonButton>
        <CommonButton type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </CommonButton>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  title: { type: String, default: '' },
  width: { type: String, default: '560px' },
  loading: { type: Boolean, default: false },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  showFooter: { type: Boolean, default: true },
  closeOnConfirm: { type: Boolean, default: false },
})

const emit = defineEmits(['update:show', 'confirm', 'cancel', 'closed'])

const handleConfirm = () => {
  emit('confirm')
  if (props.closeOnConfirm) {
    emit('update:show', false)
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>
