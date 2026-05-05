<template>
  <template v-if="!hasPermission">
    <!-- 无权限时不渲染任何内容 -->
    <slot name="no-permission"></slot>
  </template>

  <template v-else-if="businessAction === 'delete'">
    <!-- 删除按钮需要二次确认 -->
    <n-popconfirm
      :positive-text="positiveText"
      :negative-text="negativeText"
      @positive-click="handleConfirm"
    >
      <template #trigger>
        <n-button
          :disabled="isDisabled || loading"
          :loading="loading"
          :type="uiType"
          v-bind="computedButtonProps"
          @click="handleClick"
        >
          <slot>{{ buttonText }}</slot>
        </n-button>
      </template>
      <slot name="confirm-text">
        {{ confirmMessage }}
      </slot>
    </n-popconfirm>
  </template>

  <template v-else>
    <!-- 普通按钮 -->
    <n-button
      :disabled="isDisabled || loading"
      :loading="loading"
      :type="uiType"
      v-bind="computedButtonProps"
      @click="handleClick"
    >
      <slot>{{ buttonText }}</slot>
    </n-button>
  </template>
</template>

<script setup name="CommonButton">
import { computed } from 'vue'
import { NButton, NPopconfirm } from 'naive-ui'
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'
import { checkIsAdmin, checkPermissionCodes } from '@/utils/permission'

const props = defineProps({
  // 按钮类型：
  // - 业务类型：add | edit | delete | export | import | query | reset
  // - 原生类型：primary | success | warning | error | info | default
  type: {
    type: String,
    default: 'default', // ✅ 默认值改为 'default'，避免空字符串导致的边界问题
  },
  // 按钮文本（默认根据 type 自动生成）
  text: {
    type: String,
    default: '',
  },
  // 权限标识（字符串或数组）
  perms: {
    type: [String, Array],
    default: '',
  },
  // 强制检查权限（即使没有 perms 也会检查）
  forceCheck: {
    type: Boolean,
    default: false,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 二次确认提示消息
  confirmMessage: {
    type: String,
    default: '确认要删除所选数据吗？',
  },
  // 确认按钮文本
  positiveText: {
    type: String,
    default: '确定',
  },
  // 取消按钮文本
  negativeText: {
    type: String,
    default: '取消',
  },
  // 按钮尺寸：small (表格内) | medium (工具栏)
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  // 其他传递给 NButton 的属性
  buttonProps: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['click', 'confirm'])

// ✅ 1. 定义映射常量（业务类型 → Naive UI 主题色）
const BUSINESS_ACTION_MAP = {
  add: 'primary',
  query: 'primary',
  edit: 'info',
  import: 'info',
  export: 'warning',
  delete: 'error',
  reset: 'default',
  assign_role: 'primary',
}

// 业务白名单（所有支持自动映射的类型）
const BUSINESS_ACTIONS = Object.keys(BUSINESS_ACTION_MAP)

// 默认文本映射
const DEFAULT_TEXT_MAP = {
  add: '新增',
  query: '搜索',
  edit: '修改',
  import: '导入',
  export: '导出',
  delete: '删除',
  reset: '重置',
  assign_role: '分配角色',
}

// ✅ 2. 智能计算属性
// 2.1 识别是否为业务动作
const isBusinessAction = computed(() => BUSINESS_ACTIONS.includes(props.type))

// 2.2 UI 样式类型（传给底层 n-button）
const uiType = computed(() => {
  // 业务类型：返回映射的主题色
  if (isBusinessAction.value) {
    return BUSINESS_ACTION_MAP[props.type]
  }
  // 原生类型：原样返回（如 'tertiary', 'success' 等）
  return props.type || 'default'
})

// 2.3 业务动作类型（用于权限校验）
const businessAction = computed(() => {
  return isBusinessAction.value ? props.type : ''
})

// 2.4 计算按钮文本
const buttonText = computed(() => {
  // 业务类型：使用默认文本
  if (isBusinessAction.value) {
    return props.text || DEFAULT_TEXT_MAP[props.type] || ''
  }
  // 原生类型：必须手动传入 text
  return props.text
})

// 计算按钮属性 - 锁定样式规范
const buttonProps = computed(() => {
  return {
    secondary: true, // ✅ 业务类型统一使用 secondary 轻量化风格
    strong: true, // ✅ 加粗文字提升可读性
    size: props.size,
    ...props.buttonProps,
  }
})

// ✅ 表格内操作列专用配置（纯文字按钮风格）
const tableActionProps = computed(() => {
  return {
    text: true, // ✅ 表格内使用 text 纯文字按钮（极简风格）
    strong: false, // ✅ 表格内不加粗
    size: props.size || 'small',
    ...props.buttonProps,
  }
})

// 计算最终按钮属性（根据是否为表格内操作自动选择样式）
const computedButtonProps = computed(() => {
  // 如果外部传入了明确的样式覆盖，使用外部配置
  if (props.buttonProps.secondary !== undefined || props.buttonProps.quaternary !== undefined) {
    return buttonProps.value
  }
  // 否则根据 size 自动判断：small 为表格内操作，使用纯文字样式
  if (props.size === 'small') {
    return tableActionProps.value
  }
  return buttonProps.value
})

// 计算是否禁用
const isDisabled = computed(() => {
  return props.disabled
})

// ✅ 建议 1: 提取 isAdmin 为独立的计算属性，提高复用性
const isAdmin = computed(() => {
  const userStore = useUserStore()
  return checkIsAdmin(userStore.userInfo.roles)
})

// 计算是否有权限显示按钮
const hasPermission = computed(() => {
  const permissionStore = usePermissionStore()

  // ✅ 1. 超级管理员放行（最高优先级）
  if (isAdmin.value) {
    return true
  }

  // ✅ 2. 强制检查模式：必须执行权限校验
  if (props.forceCheck) {
    // 如果没有 perms，默认隐藏
    if (!props.perms) {
      console.warn('CommonButton 开启了 forceCheck 但未设置 perms 属性')
      return false
    }
    return checkPermissionCodes(permissionStore, props.perms)
  }

  // ✅ 3. 按需校验核心规则（仅对业务类型生效）
  // 规则1：映射结果为 'error' (delete) 或 'warning' (export) 时，自动触发权限校验
  if (businessAction.value === 'delete' || businessAction.value === 'export') {
    const defaultPerms =
      businessAction.value === 'delete' ? 'system:common:delete' : 'system:common:export'
    const permissionCodes = props.perms || defaultPerms
    return checkPermissionCodes(permissionStore, permissionCodes)
  }

  // 规则2：明确传入了 perms 属性，必须进行权限校验
  if (props.perms) {
    return checkPermissionCodes(permissionStore, props.perms)
  }

  // 规则3：默认情况下，所有按钮类型均认为拥有权限（返回 true）
  // 原生类型（primary/error/tertiary 等）直接走这里，不会触发自动拦截
  return true
})

// 处理点击事件
const handleClick = (event) => {
  // 只有业务类型的 delete 才需要拦截点击（已通过 popconfirm 处理）
  if (businessAction.value !== 'delete') {
    emit('click', event)
  }
}

// 处理确认事件
const handleConfirm = (event) => {
  emit('confirm', event)
  emit('click', event)
}
</script>
