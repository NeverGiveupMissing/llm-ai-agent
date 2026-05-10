<template>
  <BaseModal
    v-model:show="visible"
    :title="isEdit ? '编辑角色' : '新增角色'"
    :loading="submitting"
    width="500px"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <BaseForm ref="formRef" v-model="formData" :fields="formFields" label-width="100px" />
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useMessage } from 'naive-ui' // ✅ 引入 message

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'success'])

const message = useMessage() // ✅ 初始化 message
const formRef = ref(null)
const submitting = ref(false)

const isEdit = computed(() => !!props.row?.role_id) // ✅ 使用下划线命名

// 表单数据
const formData = reactive({
  role_key: '', // ✅ 角色标识（英文）
  role_name: '', // ✅ 角色名称
  role_sort: 0, // ✅ 显示排序
  status: '0', // ✅ 状态（0正常 1停用）
  remark: '', // ✅ 备注
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'role_key',
    label: '角色标识',
    type: 'input',
    required: true,
    placeholder: '请输入角色标识（英文）',
    disabled: isEdit.value, // ✅ 编辑时禁用
    rules: [
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        message: '角色标识必须以字母开头，只能包含字母、数字、下划线和横线',
        trigger: 'blur',
      },
    ],
  },
  {
    key: 'role_name',
    label: '角色名称',
    type: 'input',
    required: true,
    placeholder: '请输入角色名称',
  },
  {
    key: 'role_sort',
    label: '显示排序',
    type: 'input-number',
    min: 0,
    placeholder: '请输入排序',
  },
  {
    key: 'status',
    label: '状态',
    type: 'radio',
    options: [
      { label: '正常', value: '0' },
      { label: '停用', value: '1' },
    ],
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    rows: 3,
    placeholder: '请输入备注',
  },
])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 重置表单
const resetForm = () => {
  formData.role_key = ''
  formData.role_name = ''
  formData.role_sort = 0
  formData.status = '0'
  formData.remark = ''
  formRef.value?.restoreValidation()
}

// 监听 row 变化回填数据
watch(
  () => props.row,
  (row) => {
    if (row) {
      // ✅ 编辑模式：直接使用下划线字段名
      formData.role_key = row.role_key || ''
      formData.role_name = row.role_name || ''
      formData.role_sort = row.role_sort || 0
      formData.status = row.status || '0'
      formData.remark = row.remark || ''
    } else {
      // ✅ 新增模式：重置表单
      resetForm()
    }
  },
  { immediate: true },
)

// 提交表单
const handleSubmit = async () => {
  try {
    // ✅ Naive UI 的 validate() 验证通过时返回 undefined，失败时抛出错误
    await formRef.value?.validate()
  } catch (error) {
    // 统一捕获校验错误，禁止向上传递
    console.warn('表单验证拦截:', error)
    message.error('请填写必填项')
    return // 阻止提交
  }

  submitting.value = true
  try {
    emit('success', { ...formData })
  } catch (error) {
    console.error('提交失败:', error)
    message.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  resetForm()
}
</script>
