<template>
  <BaseModal
    v-model:show="visible"
    :title="isEdit ? '编辑菜单' : '新增菜单'"
    :loading="submitting"
    width="700px"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <BaseForm
      ref="formRef"
      v-model="formData"
      :fields="formFields"
      label-width="100px"
      :rules="rules"
    >
      <template #field-parentId>
        <n-tree-select
          v-model:value="formData.parentId"
          :options="menuOptions"
          placeholder="请选择上级菜单"
          clearable
          label-field="menuName"
          key-field="menuId"
          children-field="children"
          default-expand-all
        />
      </template>
      <template #field-businessType>
        <div>
          <n-select
            v-model:value="businessType"
            :options="businessTypeOptions.map((opt) => ({ label: opt.label, value: opt.value }))"
            placeholder="请选择业务类型"
            clearable
          />
          <n-text depth="3" style="display: block; margin-top: 8px; font-size: 12px;">
            💡 选择业务类型将自动应用对应的权限拦截逻辑与标准颜色
          </n-text>
        </div>
      </template>
    </BaseForm>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useMessage, NText } from 'naive-ui'
import { createMenu, updateMenu } from '@/api/menu'

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
const isEdit = computed(() => !!props.row?.menuId)

// 表单数据
const formData = reactive({
  menuName: '',
  parentId: '0',
  orderNum: 0,
  path: '',
  component: '',
  query: '',
  routeName: '',
  isFrame: 1,
  isCache: 0,
  menuType: 'C',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remark: '',
})

// 业务类型选项
const businessTypeOptions = [
  { label: '新增 (add)', value: 'add', suffix: ':add', defaultName: '新增' },
  { label: '编辑 (edit)', value: 'edit', suffix: ':edit', defaultName: '编辑' },
  { label: '删除 (remove)', value: 'remove', suffix: ':remove', defaultName: '删除' },
  { label: '导出 (export)', value: 'export', suffix: ':export', defaultName: '导出' },
  { label: '其他 (custom)', value: 'custom', suffix: '', defaultName: '' },
]

// 业务类型绑定值
const businessType = ref('custom')

// ✅ 监听 businessType 变化，触发联动逻辑
watch(
  () => businessType.value,
  (newVal) => {
    console.log('👀 Watch 监听到 businessType 变化:', newVal)
    
    if (formData.menuType !== 'F') {
      console.log('⚠️ 不是按钮类型，跳过联动')
      return
    }
    
    const option = businessTypeOptions.find((opt) => opt.value === newVal)
    if (!option) {
      console.warn('⚠️ 未找到业务类型选项:', newVal)
      return
    }

    console.log('🔵 执行业务类型联动:', option)

    // 1. 自动填充菜单名称（如果为空）
    if (!formData.menuName && option.defaultName) {
      formData.menuName = option.defaultName
      console.log('✅ 自动填充菜单名称:', formData.menuName)
    }

    // 2. 自动填充权限标识
    if (formData.parentId && formData.parentId !== '0') {
      // 查找上级菜单
      const parentMenu = findMenuById(menuOptions.value, formData.parentId)
      console.log('🔍 查找上级菜单:', {
        parentId: formData.parentId,
        parentMenu,
        menuOptions: menuOptions.value,
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
        console.warn('⚠️ 未找到上级菜单，无法生成 perms')
        console.log('🔍 可用的菜单选项:', menuOptions.value)
      }
    } else {
      console.warn('⚠️ 未选择上级菜单或上级菜单为主类目，无法生成 perms', {
        parentId: formData.parentId,
      })
    }
  }
)

// ✅ 辅助函数：递归查找菜单节点
const findMenuById = (menus, targetId) => {
  for (const menu of menus) {
    if (String(menu.menuId) === String(targetId)) {
      return menu
    }
    if (menu.children && menu.children.length > 0) {
      const found = findMenuById(menu.children, targetId)
      if (found) return found
    }
  }
  return null
}

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
]

// 是否外链选项
const isFrameOptions = [
  { label: '是', value: 0 },
  { label: '否', value: 1 },
]

// 是否缓存选项
const isCacheOptions = [
  { label: '缓存', value: 0 },
  { label: '不缓存', value: 1 },
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

// 动态表单字段
const formFields = computed(() => [
  {
    key: 'parentId',
    label: '上级菜单',
    type: 'custom',
  },
  {
    key: 'menuType',
    label: '菜单类型',
    type: 'radio',
    options: menuTypeOptions,
  },
  {
    key: 'menuName',
    label: '菜单名称',
    type: 'input',
    placeholder: '请输入菜单名称',
  },
  {
    key: 'businessType',
    label: '业务类型',
    type: 'select',
    placeholder: '请选择业务类型',
    options: businessTypeOptions.map((opt) => ({ label: opt.label, value: opt.value })),
    hidden: (formData) => formData.menuType !== 'F',
  },
  {
    key: 'perms',
    label: '权限标识',
    type: 'input',
    placeholder: '请输入权限标识（如：system:user:add）',
    hidden: (formData) => formData.menuType === 'M',
  },
  {
    key: 'icon',
    label: '菜单图标',
    type: 'input',
    placeholder: '请输入图标名称（如：home）',
    hidden: (formData) => formData.menuType === 'F',
  },
  {
    key: 'orderNum',
    label: '显示排序',
    type: 'input-number',
    min: 0,
    placeholder: '请输入排序',
    hidden: (formData) => formData.menuType === 'F',
  },
  {
    key: 'path',
    label: '路由地址',
    type: 'input',
    placeholder: '请输入路由地址',
    hidden: (formData) => formData.menuType === 'F',
  },
  {
    key: 'component',
    label: '组件路径',
    type: 'input',
    placeholder: '请输入组件路径（如：system/user/index）',
    hidden: (formData) => formData.menuType !== 'C',
  },
  {
    key: 'visible',
    label: '显示状态',
    type: 'radio',
    options: visibleOptions,
    hidden: (formData) => formData.menuType === 'F',
  },
  {
    key: 'status',
    label: '菜单状态',
    type: 'radio',
    options: statusOptions,
  },
])

// 表单验证规则
const rules = computed(() => {
  const baseRules = {
    menuName: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
    ],
    orderNum: [
      { required: true, type: 'number', message: '请输入排序', trigger: 'blur' },
    ],
  }

  // ✅ 按钮类型：业务类型和权限标识必填
  if (formData.menuType === 'F') {
    baseRules.perms = [
      { required: true, message: '请输入权限标识', trigger: 'blur' },
    ]
  }

  return baseRules
})

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 重置表单
const resetForm = () => {
  formData.menuName = ''
  formData.parentId = '0'
  formData.orderNum = 0
  formData.path = ''
  formData.component = ''
  formData.query = ''
  formData.routeName = ''
  formData.isFrame = 1
  formData.isCache = 0
  formData.menuType = 'C'
  formData.visible = '0'
  formData.status = '0'
  formData.perms = ''
  formData.icon = ''
  formData.remark = ''
  businessType.value = 'custom' // ✅ 重置业务类型
  formRef.value?.restoreValidation()
}

// 监听 menuType 变化，重置业务类型
watch(
  () => formData.menuType,
  (newType) => {
    if (newType !== 'F') {
      businessType.value = 'custom'
    }
  }
)

// ✅ 监听 businessType 变化，确保联动逻辑可靠执行
watch(
  () => businessType.value,
  (newType, oldType) => {
    // 只在从空值变为有效值时触发（避免与 @update:value 重复执行）
    if (newType && newType !== oldType && formData.menuType === 'F') {
      console.log('👀 Watch 监听到 businessType 变化:', oldType, '->', newType)
      // 如果需要，可以在这里添加额外的联动逻辑
    }
  }
)

// 监听 row 变化回填数据
watch(
  () => props.row,
  (row) => {
    if (row) {
      // 如果是新增子菜单（只有 parentId，没有 menuId）
      if (row.parentId && !row.menuId) {
        resetForm()
        formData.parentId = String(row.parentId)
        // 根据父菜单类型设置子菜单类型
        if (row.parentMenuType === 'M') {
          formData.menuType = 'C' // 目录的子菜单默认是菜单
        } else {
          formData.menuType = 'F' // 菜单的子菜单默认是按钮
        }
      } else if (row.menuId) {
        // 编辑模式
        Object.assign(formData, {
          menuName: row.menuName || '',
          parentId: row.parentId !== undefined ? String(row.parentId) : '0',
          orderNum: row.orderNum || 0,
          path: row.path || '',
          component: row.component || '',
          menuType: row.menuType || 'C',
          visible: row.visible || '0',
          status: row.status || '0',
          perms: row.perms || '',
          icon: row.icon || '',
        })
        
        // ✅ 回填业务类型：根据 perms 后缀自动识别
        if (row.menuType === 'F' && row.perms) {
          const matchedOption = businessTypeOptions.find((opt) => row.perms.endsWith(opt.suffix))
          businessType.value = matchedOption?.value || 'custom'
        } else {
          businessType.value = 'custom'
        }
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写必填项')
    throw new Error('Validation failed')
  }

  submitting.value = true
  try {
    // 数据净化：根据菜单类型清理无关字段
    const submitData = { ...formData }

    // 按钮类型：清空无关字段
    if (submitData.menuType === 'F') {
      submitData.path = null
      submitData.component = null
      submitData.icon = null
      submitData.orderNum = null
      submitData.visible = null
      submitData.status = null
    }
    // 目录类型：清空组件路径和权限标识
    else if (submitData.menuType === 'M') {
      submitData.component = null
      submitData.perms = null
    }

    // 转换为下划线命名（后端要求）- ✅ 现在由中间件自动处理，这里保持驼峰即可
    const backendData = {
      menuName: submitData.menuName,
      parentId: Number(submitData.parentId),
      menuType: submitData.menuType,
      orderNum: submitData.orderNum,
      path: submitData.path,
      component: submitData.component,
      perms: submitData.perms,
      icon: submitData.icon,
      visible: submitData.visible,
      status: submitData.status,
    }

    if (isEdit.value) {
      await updateMenu(props.row.menuId, backendData)
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
:deep(.base-form) {
  width: 100%;
}

/* 自定义字段样式 */
:deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
