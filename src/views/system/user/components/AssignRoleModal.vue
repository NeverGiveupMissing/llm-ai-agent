<template>
  <BaseModal
    v-model:show="visible"
    title="分配角色"
    :loading="submitting"
    width="500px"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <BaseForm ref="formRef" v-model="formData" :fields="formFields" label-width="80px" />
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'submit'])

const message = useMessage()
const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  userName: '',
  roleIds: [],
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'userName',
    label: '用户',
    type: 'input',
    disabled: true,
    // ✅ 移除 defaultValue，由 watch 统一管理
  },
  {
    key: 'roleIds',
    label: '角色',
    type: 'select',
    // ✅ 移除 required，避免初始化时触发校验错误
    multiple: true,
    filterable: true,
    placeholder: '请选择角色',
    // ✅ 使用计算属性确保 options 响应式
    options: props.roleOptions || [],
  },
])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 重置表单 - 必须在 watch 之前定义
const resetForm = () => {
  formData.userName = ''
  formData.roleIds = []
  formRef.value?.restoreValidation()
}

// 监听弹窗打开，回填数据
watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.user) {
      // ✅ 弹窗打开且有用户数据时回填
      await nextTick()
      
      formData.userName = props.user.user_name || ''
      
      // ✅ 从 roles 数组中提取 role_id
      try {
        if (Array.isArray(props.user.roles) && props.user.roles.length > 0) {
          formData.roleIds = props.user.roles
            .map((role) => role?.role_id)
            .filter((id) => id != null && id !== '')
        } else {
          formData.roleIds = []
        }
      } catch (error) {
        console.error('❌ 提取角色ID失败:', error)
        formData.roleIds = []
      }
    } else if (!newVal) {
      // ✅ 弹窗关闭时重置表单
      resetForm()
    }
  },
)

// 提交表单
const handleSubmit = async () => {
  // ✅ 手动校验：角色必须选择至少一个
  if (!formData.roleIds || formData.roleIds.length === 0) {
    message.warning('请至少选择一个角色')
    return
  }

  submitting.value = true
  try {
    emit('submit', formData.roleIds)
  } finally {
    submitting.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  resetForm()
}
</script>
