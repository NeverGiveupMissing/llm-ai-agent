import { ref } from 'vue'

export function useForm(initialValues = {}) {
  const formData = ref({ ...initialValues })
  const formRef = ref(null)
  const loading = ref(false)

  const resetForm = () => {
    formData.value = { ...initialValues }
    formRef.value?.restoreValidation()
  }

  const setFormData = (data) => {
    formData.value = { ...initialValues, ...data }
  }

  const validateForm = async () => {
    try {
      await formRef.value?.validate()
      return true
    } catch {
      return false
    }
  }

  const submitForm = async (submitFn) => {
    const valid = await validateForm()
    if (!valid) return false
    loading.value = true
    try {
      await submitFn(formData.value)
      return true
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
