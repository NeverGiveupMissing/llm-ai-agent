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

const isEdit = computed(() => !!props.row?.roleId) // ✅ 后端已通过中间件转换为驼峰

// 表单数据
const formData = reactive({
  roleKey: '', // ✅ 角色标识（英文）
  roleName: '', // ✅ 角色名称
  roleSort: 0, // ✅ 显示排序
  status: '0', // ✅ 状态（0正常 1停用）
  remark: '', // ✅ 备注
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'roleKey',
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
    key: 'roleName',
    label: '角色名称',
    type: 'input',
    required: true,
    placeholder: '请输入角色名称',
  },
  {
    key: 'roleSort',
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
  formData.roleKey = ''
  formData.roleName = ''
  formData.roleSort = 0
  formData.status = '0'
  formData.remark = ''
  formRef.value?.restoreValidation()
}

// 监听 row 变化回填数据
watch(
  () => props.row,
  (row) => {
    if (row) {
      // ✅ 编辑模式：直接赋值，使用后端返回的驼峰字段名
      formData.roleKey = row.roleKey || ''
      formData.roleName = row.roleName || ''
      formData.roleSort = row.roleSort || 0
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
    // 验证失败，显示错误提示
    message.error('请填写必填项')
    console.log('表单验证失败:', error)
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
