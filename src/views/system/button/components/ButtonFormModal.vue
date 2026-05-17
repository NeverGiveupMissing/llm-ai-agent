<template>
  <BaseModal
    :show="show"
    :title="isEdit ? '编辑按钮' : '新增按钮'"
    width="600px"
    :mask-closable="false"
    :loading="submitLoading"
    :close-on-confirm="true"
    @update:show="emit('update:show', $event)"
    @confirm="handleSubmit"
  >
    <BaseForm
      ref="formRef"
      v-model="formData"
      :rules="rules"
      :fields="formFields"
      label-width="100px"
    >
      <!-- 所属菜单使用 tree-select，需动态传入 options -->
      <template #field-parent_id="{ field }">
        <n-tree-select
          v-model:value="formData.parent_id"
          :options="menuOptions"
          placeholder="请选择所属菜单"
          clearable
          filterable
          key-field="value"
          label-field="label"
          children-field="children"
          style="width: 100%"
        />
      </template>
    </BaseForm>
  </BaseModal>
</template>

<script setup>
/**
 * 按钮表单弹窗组件
 * @description 用于新增和编辑 sys_button 表中的按钮权限数据
 * @author System
 * @date 2026-05-13
 */
import { ref, reactive, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { createButton, updateButton } from '@/api/button'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: null,
  },
  menuOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'success'])

const message = useMessage()
const formRef = ref(null)
const submitLoading = ref(false)

const isEdit = ref(false)

const formData = reactive({
  button_name: '',
  parent_id: null,
  perms: '',
  order_num: 0,
  status: '0',
  show_location: ['1'], // 默认行内，改为数组支持多选
  icon: '#',
  remark: '',
})

const rules = {
  button_name: [{ required: true, message: '请输入按钮名称', trigger: 'blur' }],
  parent_id: [{ required: true, type: 'number', message: '请选择所属菜单', trigger: 'change' }],
  perms: [{ required: true, message: '请输入权限标识', trigger: 'blur' }],
}

// 展现位置选项
const locationOptions = [
  { label: '工具栏', value: '0' },
  { label: '行内', value: '1' },
  { label: '搜索', value: '2' },
  { label: '隐藏', value: '3' },
]

// 表单字段配置
const formFields = [
  {
    key: 'button_name',
    label: '按钮名称',
    type: 'input',
    placeholder: '请输入按钮名称',
  },
  {
    key: 'parent_id',
    label: '所属菜单',
    type: 'custom', // 使用 custom 类型，通过插槽渲染
  },
  {
    key: 'perms',
    label: '权限标识',
    type: 'input',
    placeholder: '例如：system:user:add',
  },
  {
    key: 'show_location',
    label: '展现位置',
    type: 'checkbox', // 改为多选
    options: locationOptions,
  },
  {
    key: 'icon',
    label: '图标',
    type: 'input',
    placeholder: '请输入图标类名',
  },
  {
    key: 'order_num',
    label: '显示排序',
    type: 'input-number',
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
  },
]

// 重置表单
const resetForm = () => {
  formData.button_name = ''
  formData.parent_id = null
  formData.perms = ''
  formData.order_num = 0
  formData.status = '0'
  formData.show_location = ['1'] // 默认行内，数组格式
  formData.icon = '#'
  formData.remark = ''
}

// 监听 row 变化，填充表单
watch(
  () => props.row,
  (newVal) => {
    if (newVal) {
      isEdit.value = true
      // ✅ 确保字段名与后端返回的下划线命名完全一致
      formData.button_name = newVal.button_name || ''
      formData.parent_id = newVal.parent_id !== undefined ? Number(newVal.parent_id) : null
      formData.perms = newVal.perms || ''
      formData.order_num = newVal.order_num !== undefined ? Number(newVal.order_num) : 0
      formData.status = newVal.status || '0'
      // ✅ 将逗号分隔的字符串转为数组（如 "0,1" => ['0', '1']）
      const loc = newVal.show_location || '1'
      formData.show_location = typeof loc === 'string' && loc ? loc.split(',').filter(Boolean) : ['1']
      formData.icon = newVal.icon || '#'
      formData.remark = newVal.remark || ''
      
      console.log('[ButtonFormModal] 编辑模式 - 原始数据:', newVal)
      console.log('[ButtonFormModal] 编辑模式 - 原始 parent_id:', newVal.parent_id, '类型:', typeof newVal.parent_id)
      console.log('[ButtonFormModal] 编辑模式 - 表单数据:', JSON.parse(JSON.stringify(formData)))
      console.log('[ButtonFormModal] 编辑模式 - parent_id 转换后:', formData.parent_id, '类型:', typeof formData.parent_id)
      console.log('[ButtonFormModal] 接收到的 menuOptions:', props.menuOptions)
    } else {
      isEdit.value = false
      resetForm()
    }
  },
  { immediate: true },
)

// 提交表单
const handleSubmit = async () => {
  try {
    console.log('[ButtonFormModal] 开始提交表单')
    await formRef.value?.validate()
    submitLoading.value = true

    // 将 show_location 数组转为逗号分隔的字符串（如 ['0', '1'] => "0,1"）
    const submitData = {
      ...formData,
      show_location: Array.isArray(formData.show_location) ? formData.show_location.join(',') : formData.show_location,
    }

    console.log('[ButtonFormModal] 提交数据:', submitData)
    console.log('[ButtonFormModal] 是否编辑:', isEdit.value, '按钮 ID:', props.row?.button_id)

    if (isEdit.value) {
      await updateButton(props.row.button_id, submitData)
      message.success('修改成功')
    } else {
      await createButton(submitData)
      message.success('新增成功')
    }

    console.log('[ButtonFormModal] 提交成功，准备触发 success 事件')
    // ✅ 传递完整参数，避免父组件解构 undefined 报错
    emit('success', { isEdit: isEdit.value, data: submitData })
  } catch (error) {
    console.log('[ButtonFormModal] 提交异常:', error)
    if (error?.errors) {
      // 表单验证失败
      console.warn('[ButtonFormModal] 表单验证失败:', error.errors)
      return
    }
    message.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>
