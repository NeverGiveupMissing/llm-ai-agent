// 说明：按钮级权限指令 - 控制元素的显示/隐藏
// 用法：
// v-hasPermi="'user:delete'"                    - 单个权限
// v-hasPermi="['user:delete', 'user:edit']"     - 多个权限（任一即可）
// 
// ✅ 分表重构后：直接在 permissions 数组中查找，不再需要树形遍历
// permissions 数组包含所有权限标识（菜单 M/C + 按钮 perms），直接判断字符串是否存在
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'
import { checkIsAdmin } from '@/utils/permission'

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  },
}

/**
 * 检查按钮权限并控制元素显示
 * ✅ 分表重构后：只需在 permissions 数组中查找字符串，无需树形遍历
 * @param {HTMLElement} el - DOM元素
 * @param {Object} binding - 绑定信息
 */
function checkPermission(el, binding) {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()
  const { value } = binding

  // 解析权限配置
  let permissionCodes = value
  
  // 支持字符串或数组
  if (typeof value === 'string') {
    permissionCodes = [value]
  } else if (Array.isArray(value)) {
    permissionCodes = value
  } else {
    console.warn('v-hasPermi 指令的值必须是字符串或数组')
    return
  }

  // 检查是否为超级管理员（最高优先级）
  const isAdmin = checkIsAdmin(userStore.roles)
  if (isAdmin) {
    return // 超级管理员直接放行
  }

  // ✅ 分表重构后：直接在 permissions 数组中查找，无需树形遍历
  // permissions 包含所有权限标识（菜单 M/C + 按钮 perms），直接判断字符串是否存在
  const hasPermission = permissionCodes.some(code => 
    permissionStore.permissions.includes(code)
  )

  // 无权限时直接移除 DOM 元素（不是隐藏）
  if (!hasPermission) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
}
