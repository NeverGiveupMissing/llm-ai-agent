<template>
  <n-card title="个人资料" size="small" :bordered="false">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100"
      style="max-width: 600px"
    >
      <n-form-item label="用户名" path="username">
        <n-input
          v-model:value="formData.username"
          placeholder="请输入用户名"
          disabled
        />
      </n-form-item>

      <n-form-item label="邮箱" path="email">
        <n-input
          v-model:value="formData.email"
          placeholder="请输入邮箱"
        />
      </n-form-item>

      <n-form-item label="昵称" path="nickname">
        <n-input
          v-model:value="formData.nickname"
          placeholder="请输入昵称"
        />
      </n-form-item>

      <n-form-item label="手机号" path="phone">
        <n-input
          v-model:value="formData.phone"
          placeholder="请输入手机号"
        />
      </n-form-item>

      <n-form-item label="个人简介">
        <n-input
          v-model:value="formData.bio"
          type="textarea"
          placeholder="介绍一下自己吧..."
          :rows="3"
          maxlength="200"
          show-count
        />
      </n-form-item>

      <n-form-item>
        <n-button type="primary" @click="handleSubmit">
          保存修改
        </n-button>
        <n-button @click="handleReset" style="margin-left: 12px">
          重置
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { updateUserInfo } from '@/api/auth'

const message = useMessage()

// Props
const props = defineProps({
  userData: {
    type: Object,
    default: () => ({}),
  },
})

// Emits
const emit = defineEmits(['update-success'])

// 表单引用
const formRef = ref(null)

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  bio: '',
})

// 表单验证规则
const formRules = {
  email: {
    type: 'email',
    message: '请输入有效的邮箱地址',
    trigger: ['blur', 'input'],
  },
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号',
    trigger: ['blur', 'input'],
  },
}

// 监听userData变化，填充表单
watch(
  () => props.userData,
  (newData) => {
    if (newData) {
      formData.username = newData.username || ''
      formData.email = newData.email || ''
      formData.nickname = newData.nickname || ''
      formData.phone = newData.phone || ''
      formData.bio = newData.bio || ''
    }
  },
  { immediate: true, deep: true }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const updateData = {
      email: formData.email,
      nickname: formData.nickname,
      phone: formData.phone,
      bio: formData.bio,
    }
    
    const res = await updateUserInfo(updateData)
    
    if (res.code === 200) {
      message.success('资料修改成功')
      emit('update-success')
    } else {
      message.error(res.message || '资料修改失败')
    }
  } catch (error) {
    console.error('资料修改失败:', error)
    if (error?.errors) {
      // 表单验证错误
      return
    }
    message.error(error.response?.data?.message || '资料修改失败')
  }
}

// 重置表单
const handleReset = () => {
  emit('reset')
  message.info('已重置')
}
</script>
