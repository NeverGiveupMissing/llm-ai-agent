// 说明：按钮级权限指令 - 控制元素的显示/隐藏
// 用法：
// v-permission="'user:delete'"                    - 单个权限
// v-permission="['user:delete', 'user:edit']"     - 多个权限（任一即可）
import { usePermissionStore } from '@/stores/modules/permission'

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  },
}

/**
 * 检查权限并控制元素显示
 * @param {HTMLElement} el - DOM元素
 * @param {Object} binding - 绑定信息
 */
function checkPermission(el, binding) {
  const permissionStore = usePermissionStore()
  const { value } = binding

  // ⭐ 解析权限配置
  let permissionCodes = value
  
  // 支持字符串或数组
  if (typeof value === 'string') {
    permissionCodes = [value]
  } else if (Array.isArray(value)) {
    permissionCodes = value
  } else {
    console.warn('v-permission 指令的值必须是字符串或数组')
    return
  }

  // ⭐ 检查权限（使用 hasAnyPermission，任一权限即可）
  const hasPermission = permissionStore.hasAnyPermission(permissionCodes)

  // ⭐ 无权限时直接移除DOM元素（不是隐藏）
  if (!hasPermission) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
}
