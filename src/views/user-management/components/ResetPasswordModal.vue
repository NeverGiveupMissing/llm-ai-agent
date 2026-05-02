<template>
  <n-modal
    :show="visible"
    @update:show="handleUpdateVisible"
    preset="card"
    title="重置密码"
    style="width: 500px"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="80"
    >
      <n-form-item label="用户" path="userId">
        <n-input :value="user?.username" disabled />
      </n-form-item>
      
      <n-form-item label="新密码" path="newPassword">
        <n-input
          v-model:value="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password-on="click"
        />
      </n-form-item>
      
      <n-form-item label="确认密码" path="confirmPassword">
        <n-input
          v-model:value="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password-on="click"
        />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          重置
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  newPassword: '',
  confirmPassword: '',
})

// 自定义验证器：确认密码
const validateConfirmPassword = (rule, value) => {
  if (!value) {
    return new Error('请再次输入密码')
  }
  if (value !== formData.newPassword) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

// 表单验证规则
const formRules = {
  newPassword: {
    required: true,
    message: '请输入新密码',
    trigger: 'blur',
    min: 6,
    message: '密码至少6个字符',
  },
  confirmPassword: {
    required: true,
    validator: validateConfirmPassword,
    trigger: 'blur',
  },
}

// 处理弹窗显示状态更新
const handleUpdateVisible = (value) => {
  emit('update:visible', value)
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      resetForm()
    }
  }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    emit('submit', formData.newPassword)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    newPassword: '',
    confirmPassword: '',
  })
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
}
</script>
