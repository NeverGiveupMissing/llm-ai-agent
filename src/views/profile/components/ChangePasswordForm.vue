<template>
  <n-card title="修改密码" size="small" :bordered="false">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100"
      style="max-width: 500px"
    >
      <n-form-item label="旧密码" path="oldPassword">
        <n-input
          v-model:value="formData.oldPassword"
          type="password"
          placeholder="请输入旧密码"
          show-password-on="click"
        />
      </n-form-item>

      <n-form-item label="新密码" path="newPassword">
        <n-input
          v-model:value="formData.newPassword"
          type="password"
          placeholder="请输入新密码（至少6位）"
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

      <n-form-item>
        <n-button type="primary" @click="handleSubmit">
          修改密码
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import { changePassword } from '@/api/auth'

const message = useMessage()

// Emits
const emit = defineEmits(['password-changed'])

// 表单引用
const formRef = ref(null)

// 表单数据
const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 自定义验证器：确认密码
const validateConfirmPassword = (rule, value) => {
  if (!value) {
    return new Error('请再次输入新密码')
  }
  if (value !== formData.newPassword) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

// 表单验证规则
const formRules = {
  oldPassword: {
    required: true,
    message: '请输入旧密码',
    trigger: 'blur',
  },
  newPassword: [
    {
      required: true,
      message: '请输入新密码',
      trigger: 'blur',
    },
    {
      min: 6,
      message: '密码长度不能少于6位',
      trigger: 'blur',
    },
  ],
  confirmPassword: {
    required: true,
    validator: validateConfirmPassword,
    trigger: 'blur',
  },
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const res = await changePassword({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    })

    if (res.code === 200) {
      message.success('密码修改成功，请重新登录')
      
      // 清空表单
      formData.oldPassword = ''
      formData.newPassword = ''
      formData.confirmPassword = ''
      
      // 通知父组件
      emit('password-changed')
    } else {
      message.error(res.message || '密码修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    if (error?.errors) {
      // 表单验证错误
      return
    }
    message.error(error.response?.data?.message || '密码修改失败')
  }
}
</script>
