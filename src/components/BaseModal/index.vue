<!-- 
/**
 * BaseModal 公共弹窗组件
 * @description 基于 Naive UI NModal 封装的通用弹窗组件，提供统一的确认/取消操作、表单校验集成等功能
 * @author System
 * @date 2026-05-13
 * 
 * ✅ Loading 状态管理规范：
 * - 项目已配置全局 Loading（路由守卫/请求拦截器），默认无需手动处理 loading
 * - 本组件的 loading 属性仅在特殊场景下使用（如：弹窗内表单提交需防止重复点击、局部操作需阻塞交互）
 * - 调用方通过 :loading="xxx" 传入局部 loading 状态，组件会自动显示在确认按钮上并禁用操作
 */
-->
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

// ✅ 统一的确认按钮处理逻辑
const handleConfirm = async () => {
  try {
    // 触发业务层的 confirm 事件
    await emit('confirm')

    // 如果需要自动关闭
    if (props.closeOnConfirm) emit('update:show', false)
  } catch (error) {
    // 统一捕获异常，禁止向上传递
    console.warn('Modal confirm 处理异常:', error)
    // 不关闭弹窗，让用户修正错误
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>
