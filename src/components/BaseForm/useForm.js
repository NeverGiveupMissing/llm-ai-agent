import { ref } from 'vue'
import { useMessage } from 'naive-ui'

export function useForm(initialValues = {}) {
  const formData = ref({ ...initialValues })
  const formRef = ref(null)
  const loading = ref(false)
  const message = useMessage()

  const resetForm = () => {
    formData.value = { ...initialValues }
    formRef.value?.restoreValidation()
  }

  const setFormData = (data) => {
    // ✅ 保持下划线命名，不做驼峰转换
    formData.value = { ...initialValues, ...data }
  }

  const validateForm = async () => {
    try {
      await formRef.value?.validate()
      return true
    } catch (errors) {
      // ✅ 使用 message.error 弹窗提示，禁止使用 console.warn
      message.error('请检查表单填写是否正确')
      return false
    }
  }

  const submitForm = async (submitFn) => {
    // ✅ 先进行表单校验，在内部完全捕获异常
    const valid = await validateForm()
    if (!valid) return false

    loading.value = true
    try {
      // ✅ 传递原始数据（保持下划线命名）
      await submitFn(formData.value)
      return true
    } catch (error) {
      // ✅ 捕获业务逻辑错误（如手机号格式校验失败）
      // console.error('提交失败:', error)
      message.error(error.message || '操作失败')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    formData,
    formRef,
    loading,
    resetForm,
    setFormData,
    validateForm,
    submitForm,
  }
}
