<template>
  <BaseModal
    v-model:show="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    :loading="loading"
    width="600px"
    @confirm="handleConfirm"
    @closed="handleClosed"
  >
    <BaseForm ref="baseFormRef" v-model="formData" :fields="fields" :cols="2" label-width="80px" />
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useForm } from '@/components/BaseForm/useForm'
import { createUser, updateUser } from '@/api/user'

const props = defineProps({
  show: Boolean,
  row: { type: Object, default: null },
  fields: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:show', 'success'])
const message = useMessage()

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

const isEdit = computed(() => !!props.row?.user_id)

// 根据 fields 动态生成初始值
const getInitialValues = () => {
  const initialValues = {}
  props.fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      initialValues[field.key] = field.defaultValue
    } else {
      // 默认值
      switch (field.type) {
        case 'switch':
          initialValues[field.key] = field.uncheckedValue ?? 0
          break
        case 'radio':
        case 'select':
          initialValues[field.key] = ''
          break
        case 'checkbox':
          initialValues[field.key] = []
          break
        default:
          initialValues[field.key] = ''
      }
    }
  })
  return initialValues
}

const { formData, loading, resetForm, setFormData, submitForm } = useForm(getInitialValues())

watch(
  () => props.row,
  (row) => {
    row ? setFormData(row) : resetForm()
  },
  { immediate: true },
)

const baseFormRef = ref(null)

const handleConfirm = async () => {
  // ✅ 调用封装后的 submitForm，校验逻辑已在 useForm 内部处理
  await submitForm(async (data) => {
    // ✅ 严格使用下划线字段进行二次校验
    if (data.phonenumber && !/^1[3-9]\d{9}$/.test(data.phonenumber)) {
      throw new Error('请输入正确的手机号码')
    }
    if (data.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      throw new Error('请输入正确的邮箱地址')
    }

    // ✅ 业务逻辑：调用 API
    if (isEdit.value) {
      const res = await updateUser(data.user_id, data)
      message.success(res.message || '修改成功')
    } else {
      const res = await createUser(data)
      message.success(res.message || '新增成功')
    }
    
    // ✅ 成功后关闭弹窗并触发成功事件
    emit('success')
    visible.value = false
  })
}

const handleClosed = () => {
  resetForm()
}
</script>
