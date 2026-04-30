// 说明：权限状态管理 - 管理用户权限和动态菜单
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  // 用户权限列表（从后端获取）
  const permissions = ref([])

  // 用户角色列表
  const roles = ref([])

  // 动态路由（根据权限过滤后的路由）
  const dynamicRoutes = ref([])

  // 是否已生成动态路由
  const isRoutesGenerated = ref(false)

  // 计算属性：检查是否拥有某个权限
  const hasPermission = computed(() => {
    return (permissionCode) => {
      if (!permissionCode) return true
      return permissions.value.includes(permissionCode)
    }
  })

  // 计算属性：检查是否拥有任一权限
  const hasAnyPermission = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      return permissionCodes.some((code) => permissions.value.includes(code))
    }
  })

  // 计算属性：检查是否拥有所有权限
  const hasAllPermissions = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      return permissionCodes.every((code) => permissions.value.includes(code))
    }
  })

  // 设置权限列表
  function setPermissions(permissionList) {
    permissions.value = permissionList || []
  }

  // 设置角色列表
  function setRoles(roleList) {
    roles.value = roleList || []
  }

  // 根据权限过滤路由
  function filterRoutesByPermission(routes, accessRoutes = []) {
    routes.forEach((route) => {
      // 如果路由没有 meta.permission，则不需要权限验证
      if (!route.meta?.permission) {
        accessRoutes.push(route)
        return
      }

      // 检查权限
      const hasAuth = hasPermission.value(route.meta.permission)
      if (hasAuth) {
        // 有权限，添加该路由
        accessRoutes.push(route)
      }
    })
    return accessRoutes
  }

  // 生成动态路由
  function generateRoutes(asyncRoutes) {
    const accessRoutes = filterRoutesByPermission(asyncRoutes)
    dynamicRoutes.value = accessRoutes
    isRoutesGenerated.value = true
    return accessRoutes
  }

  // 重置权限状态
  function resetPermission() {
    permissions.value = []
    roles.value = []
    dynamicRoutes.value = []
    isRoutesGenerated.value = false
  }

  return {
    permissions,
    roles,
    dynamicRoutes,
    isRoutesGenerated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setPermissions,
    setRoles,
    filterRoutesByPermission,
    generateRoutes,
    resetPermission,
  }
})
