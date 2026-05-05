<template>
  <div class="max-w-2xl">
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100">
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="formData.username" placeholder="请输入用户名" readonly disabled />
      </n-form-item>

      <n-form-item label="昵称" path="nickname">
        <n-input v-model:value="formData.nickname" placeholder="请输入昵称" />
      </n-form-item>

      <n-form-item label="邮箱" path="email">
        <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
      </n-form-item>

      <n-form-item label="手机号" path="phone">
        <n-input v-model:value="formData.phone" placeholder="请输入手机号" />
      </n-form-item>

      <n-form-item label="性别" path="gender">
        <n-radio-group v-model:value="formData.gender">
          <n-space>
            <n-radio value="male">男</n-radio>
            <n-radio value="female">女</n-radio>
            <n-radio value="other">其他</n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="个人简介" path="bio">
        <n-input
          v-model:value="formData.bio"
          type="textarea"
          placeholder="介绍一下自己吧..."
          :rows="4"
          :maxlength="200"
          show-count
        />
      </n-form-item>

      <n-form-item>
        <n-space>
          <n-button type="primary" @click="handleSubmit" :loading="loading"> 保存修改 </n-button>
          <n-button @click="handleReset"> 重置 </n-button>
        </n-space>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { updateUserInfo } from '@/api/auth'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['success'])

const message = useMessage()
const formRef = ref(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  gender: 'other',
  bio: '',
})

const rules = {
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change'],
    },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: ['blur', 'change'],
    },
  ],
}

// 监听用户信息变化，填充表单
watch(
  () => props.user,
  (newUser) => {
    if (newUser && Object.keys(newUser).length > 0) {
      // 使用展开运算符确保响应式更新
      Object.assign(formData, {
        username: newUser.username || '',
        nickname: newUser.nickname || '',
        email: newUser.email || '',
        phone: newUser.phone || '',
        gender: newUser.gender || 'other',
        bio: newUser.bio || '',
      })
    }
  },
  { immediate: true, deep: true },
)

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await updateUserInfo({
      nickname: formData.nickname,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      bio: formData.bio,
    })

    if (res.code === 200) {
      message.success('资料修改成功')
      emit('success')
    } else {
      message.error(res.message || '资料修改失败')
    }
  } catch (error) {
    if (error?.errors) {
      message.error('请检查表单填写')
    } else {
      message.error(error.message || '修改失败')
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formRef.value?.restoreValidation()
  // 重新从 props.user 填充数据
  if (props.user) {
    Object.assign(formData, {
      username: props.user.username || '',
      nickname: props.user.nickname || '',
      email: props.user.email || '',
      phone: props.user.phone || '',
      gender: props.user.gender || 'other',
      bio: props.user.bio || '',
    })
  }
  message.info('已重置')
}
</script>
