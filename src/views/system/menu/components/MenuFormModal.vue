<template>
  <BaseModal
    v-model:show="visible"
    :title="isEdit ? '编辑菜单' : '新增菜单'"
    :loading="submitting"
    width="800px"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <BaseForm
      ref="formRef"
      v-model="formData"
      :fields="formFields"
      :rules="rules"
      :cols="2"
      label-placement="left"
      label-width="100px"
    />
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { createMenu, updateMenu } from '@/api/menu'
import FieldHelp from '@/components/FieldHelp/index.vue'
import IconPicker from '@/components/IconPicker/index.vue'
import BaseForm from '@/components/BaseForm/index.vue'

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
const submitting = ref(false)

// 是否编辑模式
const isEdit = computed(() => !!props.row?.menu_id)

// 表单数据
const formData = reactive({
  menu_name: '',
  parent_id: '0',
  order_num: 0,
  path: '',
  component: '',
  query: '',
  route_name: '',
  is_frame: 0, // 默认非外链
  is_cache: 1, // 默认不缓存
  visible: '0', // 默认显示
  status: '0',
  perms: '',
  icon: '',
  remark: '',
})

// 是否外链选项
const isFrameOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]

// 是否缓存选项
const isCacheOptions = [
  { label: '缓存', value: 1 },
  { label: '不缓存', value: 0 },
]

// 状态选项
const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

// ✅ 表单字段配置（BaseForm 数据驱动）
const formFields = computed(() => [
  // ===== 第一行：上级菜单（占据整行） =====
  {
    key: 'parent_id',
    label: '上级菜单',
    type: 'tree-select',
    span: 2,
    options: props.menuOptions,
    labelField: 'menu_name',
    keyField: 'menu_id',
    childrenField: 'children',
    clearable: true,
    placeholder: '请选择上级菜单',
  },
  // ===== 第二行：菜单名称 | 显示顺序 =====
  {
    key: 'menu_name',
    label: '菜单名称',
    type: 'input',
    required: true,
  },
  {
    key: 'order_num',
    label: '显示顺序',
    type: 'input-number',
    min: 0,
    step: 1,
    style: { width: '100%' },
  },
  // ===== 第三行：菜单图标 | 是否外链 =====
  {
    key: 'icon',
    label: '菜单图标',
    type: 'icon-picker',
    placeholder: '请选择或输入图标名称',
  },
  {
    key: 'is_frame',
    label: '是否外链',
    type: 'radio',
    options: isFrameOptions,
    helpContent: '选择是外链则路由地址需要以 http(s):// 开头',
  },
  // ===== 第四行：路由地址 | 组件路径 =====
  {
    key: 'path',
    label: '路由地址',
    type: 'input',
    required: true,
    helpContent: '访问的路由地址，如：user，如外网地址需内链访问则以 http(s):// 开头',
  },
  {
    key: 'component',
    label: '组件路径',
    type: 'input',
    helpContent: '访问的组件路径，如：system/user/index，默认在 views 目录下',
  },
  // ===== 第五行：权限标识 | 路由参数 =====
  {
    key: 'perms',
    label: '权限标识',
    type: 'input',
    helpContent: '控制器中定义的权限字符，如：system:user:list',
  },
  {
    key: 'query',
    label: '路由参数',
    type: 'input',
    placeholder: '如：{"id": 1, "status": 0}',
    helpContent: '路由跳转时默认传递的参数，JSON 格式',
  },
  // ===== 第六行：是否缓存 | 显示状态 =====
  {
    key: 'is_cache',
    label: '是否缓存',
    type: 'radio',
    options: isCacheOptions,
    helpContent: '选择缓存则页面会被 keep-alive 缓存，再次访问不需要重新加载',
  },
  {
    key: 'visible',
    label: '显示状态',
    type: 'radio',
    options: [
      { label: '显示', value: '0' },
      { label: '隐藏', value: '1' },
    ],
    helpContent: '选择隐藏则路由将不会出现在侧边栏，但仍然可以访问',
  },
  // ===== 第七行：菜单状态（占据整行） =====
  {
    key: 'status',
    label: '菜单状态',
    type: 'radio',
    span: 2,
    options: statusOptions,
    helpContent: '选择停用则路由将不会出现在侧边栏，也不能被访问',
  },
  // ===== 第八行：备注（占据整行） =====
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    span: 2,
    rows: 3,
  },
])



// 表单验证规则
const rules = computed(() => {
  const baseRules = {
    menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    order_num: [{ required: true, type: 'number', message: '请输入排序', trigger: 'blur' }],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
  }

  return baseRules
})

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 重置表单
const resetForm = () => {
  formData.menu_name = ''
  formData.parent_id = '0'
  formData.order_num = 0
  formData.path = ''
  formData.component = ''
  formData.query = ''
  formData.route_name = ''
  formData.is_frame = 0 // 默认非外链
  formData.visible = '0' // 默认显示
  formData.status = '0'
  formData.perms = ''
  formData.icon = ''
  formData.remark = ''
  formRef.value?.restoreValidation()
}



// 监听弹窗显示状态
watch(
  () => props.show,
  (val) => {
    if (val) {
      // 新增子菜单模式
      if (props.row && !props.row.menu_id) {
        formData.parent_id = String(props.row.parent_id)
      } else if (props.row?.menu_id) {
        // 编辑模式:使用下划线格式
        const row = props.row
        const menuName = row.menu_name || ''
        const parentId = row.parent_id !== undefined ? row.parent_id : '0'
        const orderNum = row.order_num ?? 0
        const path = row.path || ''
        const component = row.component || ''
        const isFrame = row.is_frame !== undefined ? row.is_frame : 1
        const visible = row.visible || '0'
        const status = row.status || '0'
        const perms = row.perms || ''
        const icon = row.icon || ''
        const remark = row.remark || ''

        Object.assign(formData, {
          menu_name: menuName,
          parent_id: String(parentId),
          order_num: orderNum,
          path,
          component,
          is_frame: isFrame,
          visible,
          status,
          perms,
          icon,
          remark,
        })
      } else {
        resetForm()
      }
    }
  },
  { immediate: true },
)

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写必填项')
    // ✅ 统一捕获校验错误，禁止向上传递
    console.warn('表单验证拦截:', valid)
    return
  }

  submitting.value = true
  try {
    // ✅ 数据清洗：根据 component 字段判断菜单类型
    let submitPath = formData.path || null
    let submitComponent = formData.component || null
    let submitPerms = formData.perms || null

    // 静默填充 menu_type
    const isDirectory = !submitComponent || submitComponent.trim() === ''
    const autoMenuType = isDirectory ? 'M' : 'C'

    // 如果是目录(M)，清空 perms 和 component 字段
    if (isDirectory) {
      submitComponent = null
      submitPerms = null
    }

    // 构建提交数据
    const backendData = {
      menu_name: formData.menu_name,
      parent_id: Number(formData.parent_id),
      order_num: formData.order_num,
      path: submitPath,
      component: submitComponent,
      query: formData.query || null,
      route_name: formData.route_name || null,
      is_frame: formData.is_frame,
      visible: formData.visible,
      perms: submitPerms,
      icon: formData.icon || null,
      status: formData.status,
      remark: formData.remark || null,
    }

    // 如果是新增或编辑且 parent_id 为 0（顶级菜单），component 必须为空
    if (formData.parent_id === '0' || formData.parent_id === 0) {
      backendData.component = null
    }

    // 获取菜单ID
    const menu_id = props.row?.menu_id

    if (isEdit.value) {
      await updateMenu(menu_id, backendData)
      message.success('菜单更新成功')
    } else {
      await createMenu(backendData)
      message.success('菜单创建成功')
    }

    emit('success')
  } catch (error) {
    console.error('操作失败:', error)
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

<style scoped>
/* 表单容器样式 */
:deep(.n-form) {
  width: 100%;
}

/* 表单项样式 */
:deep(.n-form-item) {
  margin-bottom: 16px;
}

/* Label 插槽布局 */
:deep(.n-form-item-label) {
  display: flex;
  align-items: center;
}

/* Tooltip 样式增强 */
:deep(.n-tooltip) {
  background-color: #fff !important;
  color: #333 !important;
  border: 1px solid #e0e0e0 !important;
}

:deep(.n-tooltip .n-tooltip__content) {
  color: #333 !important;
}
</style>
