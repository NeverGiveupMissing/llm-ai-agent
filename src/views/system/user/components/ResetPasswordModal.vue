<template>
  <BaseModal
    v-model:show="visible"
    title="重置密码"
    :loading="submitting"
    width="500px"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <BaseForm
      ref="formRef"
      v-model="formData"
      :fields="formFields"
      label-width="80px"
    />
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  newPassword: '',
  confirmPassword: '',
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'user_name',
    label: '用户',
    type: 'input',
    disabled: true,
    defaultValue: props.user?.user_name || '',
  },
  {
    key: 'newPassword',
    label: '新密码',
    type: 'password',
    required: true,
    placeholder: '请输入新密码',
    rules: [
      { min: 6, message: '密码至少6个字符', trigger: 'blur' },
    ],
  },
  {
    key: 'confirmPassword',
    label: '确认密码',
    type: 'password',
    required: true,
    placeholder: '请再次输入新密码',
    rules: [
      {
        validator: (rule, value) => {
          if (!value) {
            return new Error('请再次输入密码')
          }
          if (value !== formData.newPassword) {
            return new Error('两次输入的密码不一致')
          }
          return true
        },
        trigger: 'blur',
      },
    ],
  },
])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    // ✅ 统一捕获校验错误，禁止向上传递
    console.warn('表单验证拦截:', valid)
    return
  }

  submitting.value = true
  try {
    emit('submit', formData.newPassword)
  } finally {
    submitting.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  formData.newPassword = ''
  formData.confirmPassword = ''
  formRef.value?.restoreValidation()
}
</script>
