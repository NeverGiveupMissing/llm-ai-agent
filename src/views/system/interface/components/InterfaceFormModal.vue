<template>
  <BaseModal
    v-model:show="modalVisible"
    :title="isEdit ? '编辑接口' : '新增接口'"
    width="600px"
    :loading="submitting"
    @confirm="handleSubmit"
    @cancel="handleCancel"
  >
    <BaseForm
      ref="formRef"
      v-model="formData"
      :fields="fields"
      label-width="100px"
      label-placement="left"
    />
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import BaseForm from '@/components/BaseForm/index.vue'
import BaseModal from '@/components/BaseModal/index.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: null,
  },
  fields: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:show', 'success'])

const message = useMessage()
const formRef = ref(null)
const modalVisible = ref(false)
const submitting = ref(false)

// 是否为编辑模式
const isEdit = ref(false)

// 表单数据
const formData = ref({
  api_name: '',
  api_url: '',
  api_method: 'GET',
  api_category: '',
  status: '0',
  remark: '',
})

// 监听 props.show 变化
watch(
  () => props.show,
  (val) => {
    modalVisible.value = val
    if (val) {
      isEdit.value = !!props.row
      if (props.row) {
        // 编辑模式：填充表单数据
        formData.value = {
          api_name: props.row.api_name || '',
          api_url: props.row.api_url || '',
          api_method: props.row.api_method || 'GET',
          api_category: props.row.api_category || '',
          status: props.row.status || '0',
          remark: props.row.remark || '',
        }
      } else {
        // 新增模式：重置表单
        resetForm()
      }
    }
  },
)

// 监听 modalVisible 变化，同步到父组件
watch(modalVisible, (val) => {
  emit('update:show', val)
})

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  // ✅ 使用 BaseForm 的 validate 方法进行校验（在 submitForm 内部已处理）
  try {
    await formRef.value.validate()
    submitting.value = true

    emit('success', {
      isEdit: isEdit.value,
      data: { ...formData.value },
    })
  } catch (error) {
    // 统一捕获校验错误，禁止向上传递
    console.warn('表单验证拦截:', error)
    if (error?.errors) {
      message.error('请填写必填项')
    }
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.value = {
    api_name: '',
    api_url: '',
    api_method: 'GET',
    api_category: '',
    status: '0',
    remark: '',
  }
  formRef.value?.restoreValidation()
}
</script>
