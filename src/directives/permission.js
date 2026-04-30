// 说明：权限指令 - 用于控制按钮/组件的显示和禁用
import { usePermissionStore } from '@/stores/modules/permission'

/**
 * 权限指令
 * 用法：
 * v-permission="'user:create'"           - 单个权限
 * v-permission="['user:create', 'user:update']" - 多个权限（任一即可）
 * v-permission="{ code: 'user:create', type: 'disabled' }" - 禁用模式
 */
export default {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    // 解析权限配置
    let permissionCode = value
    let action = 'hide' // 默认隐藏：hide | disabled

    if (typeof value === 'object' && value !== null) {
      permissionCode = value.code
      action = value.type || 'hide'
    } else if (typeof value === 'string') {
      permissionCode = value
    }

    // 检查权限
    let hasPermission = false
    if (Array.isArray(permissionCode)) {
      // 多个权限，检查是否有任一权限
      hasPermission = permissionStore.hasAnyPermission(permissionCode)
    } else {
      // 单个权限
      hasPermission = permissionStore.hasPermission(permissionCode)
    }

    // 没有权限时执行对应操作
    if (!hasPermission) {
      if (action === 'disabled') {
        // 禁用模式
        el.disabled = true
        el.style.pointerEvents = 'none'
        el.style.opacity = '0.5'
        el.setAttribute('disabled', 'disabled')
      } else {
        // 隐藏模式（默认）
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },
}
