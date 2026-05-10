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
  user_name: '',
  role_ids: [],
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'user_name',
    label: '用户',
    type: 'input',
    disabled: true,
  },
  {
    key: 'role_ids',
    label: '角色',
    type: 'select',
    multiple: true,
    filterable: true,
    placeholder: '请选择角色',
    // ✅ 确保 options 的 value 统一为数字类型
    options: props.roleOptions || [],
  },
])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 重置表单
const resetForm = () => {
  formData.user_name = ''
  formData.role_ids = []
  formRef.value?.restoreValidation()
}

// ✅ 同时监听 show 和 roleOptions 的变化
watch(
  () => [props.show, props.roleOptions],
  async ([newVal, options]) => {
    if (newVal && props.user) {
      await nextTick()

      formData.user_name = props.user.user_name || ''

      try {
        let roles = props.user.roles
        // ✅ 兼容后端可能返回 JSON 字符串的情况
        if (typeof roles === 'string') {
          try {
            roles = JSON.parse(roles)
          } catch (e) {
            roles = []
          }
        }

        if (roles && Array.isArray(roles) && roles.length > 0) {
          formData.role_ids = roles
            .map((role) => {
              const role_id = role?.role_id || role?.role_id || role?.id
              return role_id != null ? Number(role_id) : null
            })
            .filter((id) => id != null && !isNaN(id))
          
          console.log('✅ [AssignRoleModal] 回显角色 IDs:', formData.role_ids)
          if (options && options.length > 0) {
            console.log(
              ' [AssignRoleModal] options 第一个元素的 value:',
              options[0].value,
              '类型:',
              typeof options[0].value,
            )
          }
        } else {
          console.log('⚠️ [AssignRoleModal] 用户没有角色或roles为空数组', roles)
          formData.role_ids = []
        }
      } catch (error) {
        console.error(' [AssignRoleModal] 提取角色ID失败:', error)
        formData.role_ids = []
      }
    } else if (!newVal) {
      resetForm()
    }
  },
  { immediate: false },
)

// 提交表单
const handleSubmit = async () => {
  if (!formData.role_ids || formData.role_ids.length === 0) {
    message.warning('请至少选择一个角色')
    return
  }

  submitting.value = true
  try {
    emit('submit', formData.role_ids)
  } finally {
    submitting.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  resetForm()
}
</script>
