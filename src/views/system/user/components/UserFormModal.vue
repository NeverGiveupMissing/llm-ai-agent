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
  return await submitForm(async (data) => {
    if (isEdit.value) {
      const res = await updateUser(data.user_id, data)
      message.success(res.message || '修改成功')
    } else {
      const res = await createUser(data)
      message.success(res.message || '新增成功')
    }
    emit('success')
    visible.value = false
  })
}

const handleClosed = () => {
  resetForm()
}
</script>
