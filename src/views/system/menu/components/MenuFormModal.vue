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
  menu_type: 'C',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remark: '',
  businessType: 'custom', // ✅ 业务类型字段加入 formData
})

// 业务类型选项
const businessTypeOptions = [
  { label: '新增 (add)', value: 'add', suffix: ':add', defaultName: '新增' },
  { label: '编辑 (edit)', value: 'edit', suffix: ':edit', defaultName: '编辑' },
  { label: '删除 (remove)', value: 'remove', suffix: ':remove', defaultName: '删除' },
  { label: '导出 (export)', value: 'export', suffix: ':export', defaultName: '导出' },
  { label: '其他 (custom)', value: 'custom', suffix: '', defaultName: '' },
]

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
]

// 是否外链选项
const isFrameOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]

// 可见性选项
const visibleOptions = [
  { label: '显示', value: '0' },
  { label: '隐藏', value: '1' },
]

// 状态选项
const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

// ✅ 表单字段配置（BaseForm 数据驱动）
const formFields = computed(() => [
  // 上级菜单
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
  // 菜单类型
  {
    key: 'menu_type',
    label: '菜单类型',
    type: 'radio',
    span: 2,
    options: menuTypeOptions,
  },
  // 菜单图标（非按钮类型显示）
  {
    key: 'icon',
    label: '菜单图标',
    type: 'icon-picker',
    placeholder: '请选择或输入图标名称',
    show: (model) => model.menu_type !== 'F',
  },
  // 显示顺序
  {
    key: 'order_num',
    label: '显示顺序',
    type: 'input-number',
    min: 0,
    step: 1,
    style: { width: '100%' },
  },
  // 菜单名称
  {
    key: 'menu_name',
    label: '菜单名称',
    type: 'input',
    required: true,
  },
  // 是否外链（仅菜单类型显示）
  {
    key: 'is_frame',
    label: '是否外链',
    type: 'radio',
    options: isFrameOptions,
    helpContent: '选择是外链则路由地址需要以 http(s):// 开头',
    disabled: (model) => !!model.component,
    show: (model) => model.menu_type === 'C',
  },
  // 路由地址（非按钮类型显示）
  {
    key: 'path',
    label: '路由地址',
    type: 'input',
    helpContent: '访问的路由地址，如：user，如外网地址需内链访问则以 http(s):// 开头',
    show: (model) => model.menu_type !== 'F',
  },
  // 组件路径（仅菜单类型显示）
  {
    key: 'component',
    label: '组件路径',
    type: 'input',
    helpContent: '访问的组件路径，如：system/user/index，默认在 views 目录下',
    show: (model) => model.menu_type === 'C',
  },
  // 权限标识（非目录类型显示）
  {
    key: 'perms',
    label: '权限标识',
    type: 'input',
    helpContent: '控制器中定义的权限字符，如：system:user:list',
    show: (model) => model.menu_type !== 'M',
  },
  // 业务类型（仅按钮类型显示）
  {
    key: 'businessType',
    label: '业务类型',
    type: 'select',
    span: 2,
    options: businessTypeOptions.map((opt) => ({ label: opt.label, value: opt.value })),
    placeholder: '请选择业务类型',
    clearable: true,
    show: (model) => model.menu_type === 'F',
  },
  // 显示状态（非按钮类型显示）
  {
    key: 'visible',
    label: '显示状态',
    type: 'radio',
    options: visibleOptions,
    helpContent: '选择隐藏则路由将不会出现在侧边栏，但仍然可以访问',
    show: (model) => model.menu_type !== 'F',
  },
  // 菜单状态（非按钮类型显示）
  {
    key: 'status',
    label: '菜单状态',
    type: 'radio',
    options: statusOptions,
    helpContent: '选择停用则路由将不会出现在侧边栏，也不能被访问',
    show: (model) => model.menu_type !== 'F',
  },
  // 备注（非按钮类型显示）
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    span: 2,
    rows: 3,
    show: (model) => model.menu_type !== 'F',
  },
])

// ✅ 监听 businessType 变化，触发联动逻辑
watch(
  () => formData.businessType,
  (newVal) => {
    console.log('👀 Watch 监听到 businessType 变化:', newVal)

    if (formData.menu_type !== 'F') {
      console.log('️ 不是按钮类型,跳过联动')
      return
    }

    const option = businessTypeOptions.find((opt) => opt.value === newVal)
    if (!option) {
      console.warn('⚠️ 未找到业务类型选项:', newVal)
      return
    }

    console.log('🔵 执行业务类型联动:', option)

    // 1. 自动填充菜单名称(如果为空)
    if (!formData.menu_name && option.defaultName) {
      formData.menu_name = option.defaultName
      console.log('✅ 自动填充菜单名称:', formData.menu_name)
    }

    // 2. 自动填充权限标识
    if (formData.parent_id && formData.parent_id !== '0') {
      // 查找上级菜单
      const parentMenu = findMenuById(props.menuOptions, formData.parent_id)
      console.log('🔍 查找上级菜单:', {
        parent_id: formData.parent_id,
        parentMenu,
        menuOptions: props.menuOptions,
      })

      if (parentMenu) {
        // 获取父级 perms 前缀
        const parentPerms = parentMenu.perms || parentMenu.path || ''
        const basePerms = parentPerms.split(':').slice(0, -1).join(':') || parentPerms

        // 拼接完整 perms
        formData.perms = `${basePerms}${option.suffix}`
        console.log('✅ 自动生成权限标识:', formData.perms)

        // 清除权限标识字段的校验错误
        setTimeout(() => {
          formRef.value?.restoreValidation()
          console.log('✅ 已清除表单校验')
        }, 100)
      } else {
        console.warn('⚠️ 未找到上级菜单,无法生成 perms')
        console.log('🔍 可用的菜单选项:', props.menuOptions)
      }
    } else {
      console.warn('⚠️ 未选择上级菜单或上级菜单为主类目,无法生成 perms', {
        parent_id: formData.parent_id,
      })
    }
  },
)

// 表单验证规则
const rules = computed(() => {
  const baseRules = {
    menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    order_num: [{ required: true, type: 'number', message: '请输入排序', trigger: 'blur' }],
  }

  // ✅ 按钮类型：业务类型和权限标识必填
  if (formData.menu_type === 'F') {
    baseRules.perms = [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
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
  formData.menu_type = 'C'
  formData.visible = '0'
  formData.status = '0'
  formData.perms = ''
  formData.icon = ''
  formData.remark = ''
  formData.businessType = 'custom' // ✅ 重置业务类型
  formRef.value?.restoreValidation()
}

// 监听 menuType 变化，重置业务类型
watch(
  () => formData.menu_type,
  (newType) => {
    if (newType !== 'F') {
      formData.businessType = 'custom'
    }
  },
)

// 监听弹窗显示状态
watch(
  () => props.show,
  (val) => {
    if (val) {
      // 新增子菜单模式
      if (props.row && !props.row.menu_id) {
        formData.parent_id = String(props.row.parent_id)
        // 根据父菜单类型设置子菜单类型
        const parentMenuType = props.row.parent_menu_type
        if (parentMenuType === 'M') {
          formData.menu_type = 'C' // 目录的子菜单默认是菜单
        } else {
          formData.menu_type = 'F' // 菜单的子菜单默认是按钮
        }
      } else if (props.row?.menu_id) {
        // 编辑模式:使用下划线格式
        const row = props.row
        const menuName = row.menu_name || ''
        const parentId = row.parent_id !== undefined ? row.parent_id : '0'
        const orderNum = row.order_num ?? 0
        const path = row.path || ''
        const component = row.component || ''
        const menuType = row.menu_type || 'C'
        const isFrame = row.is_frame !== undefined ? row.is_frame : 1
        const visible = row.visible || '0'
        const status = row.status || '0'
        const perms = row.perms || ''
        const icon = row.icon || ''

        Object.assign(formData, {
          menu_name: menuName,
          parent_id: String(parentId),
          order_num: orderNum,
          path,
          component,
          menu_type: menuType,
          is_frame: isFrame,
          visible,
          status,
          perms,
          icon,
        })

        console.log('===== 菜单表单回显数据 =====')
        console.log('原始数据:', row)
        console.log('回显后的表单数据:', formData)

        // ✅ 回填业务类型:根据 perms 后缀自动识别
        if (menuType === 'F' && perms) {
          const matchedOption = businessTypeOptions.find((opt) => perms.endsWith(opt.suffix))
          formData.businessType = matchedOption?.value || 'custom'
          console.log('回显业务类型:', formData.businessType)
        } else {
          formData.businessType = 'custom'
        }
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
    // 数据净化:根据菜单类型清理无关字段
    const submitData = { ...formData }

    // 按钮类型:清空无关字段
    if (submitData.menu_type === 'F') {
      submitData.path = null
      submitData.component = null
      submitData.icon = null
      submitData.order_num = null
      submitData.visible = null
      submitData.status = null
    }
    // 目录类型:清空组件路径和权限标识
    else if (submitData.menu_type === 'M') {
      submitData.component = null
      submitData.perms = null
    }

    // ✅ 使用下划线命名提交给后端
    const backendData = {
      menu_name: submitData.menu_name,
      parent_id: Number(submitData.parent_id),
      menu_type: submitData.menu_type,
      order_num: submitData.order_num,
      path: submitData.path,
      component: submitData.component,
      query: submitData.query || null,
      route_name: submitData.route_name || null,
      is_frame: submitData.is_frame,
      perms: submitData.perms,
      icon: submitData.icon,
      visible: submitData.visible,
      status: submitData.status,
      remark: submitData.remark || null,
    }

    // ✅ 获取菜单ID
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
