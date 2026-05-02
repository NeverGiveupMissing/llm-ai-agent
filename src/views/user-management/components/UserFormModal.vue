<template>
  <n-modal
    :show="visible"
    @update:show="handleUpdateVisible"
    preset="card"
    :title="isEditMode ? '编辑用户' : '新增用户'"
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
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="formData.username" placeholder="请输入用户名" />
      </n-form-item>
      
      <n-form-item label="密码" path="password" v-if="!isEditMode">
        <n-input
          v-model:value="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password-on="click"
        />
      </n-form-item>
      
      <n-form-item label="邮箱" path="email">
        <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
      </n-form-item>
      
      <n-form-item label="头像URL" path="avatarUrl">
        <n-input v-model:value="formData.avatarUrl" placeholder="请输入头像URL" />
      </n-form-item>
      
      <n-form-item label="状态" path="status">
        <n-select
          v-model:value="formData.status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditMode ? '更新' : '创建' }}
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
  isEditMode: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const submitting = ref(false)

// 状态选项
const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'inactive' },
]

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  email: '',
  avatarUrl: '',
  status: 'active',
})

// 表单验证规则
const formRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur',
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur',
    min: 6,
    message: '密码至少6个字符',
  },
  email: {
    required: true,
    message: '请输入邮箱',
    trigger: 'blur',
    validator: (rule, value) => {
      if (!value) return new Error('请输入邮箱')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return new Error('请输入有效的邮箱地址')
      }
      return true
    },
  },
}

// 处理弹窗显示状态更新
const handleUpdateVisible = (value) => {
  emit('update:visible', value)
}

// 监听弹窗显示状态和数据变化
watch(
  () => [props.visible, props.userData],
  ([newVisible, newUserData]) => {
    if (newVisible) {
      if (props.isEditMode && newUserData) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          username: newUserData.username,
          email: newUserData.email || '',
          avatarUrl: newUserData.avatar_url || '',
          status: newUserData.status,
        })
      } else {
        // 新增模式，重置表单
        resetForm()
      }
    }
  },
  { immediate: true }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    emit('submit', { ...formData })
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
    username: '',
    password: '',
    email: '',
    avatarUrl: '',
    status: 'active',
  })
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
}
</script>
