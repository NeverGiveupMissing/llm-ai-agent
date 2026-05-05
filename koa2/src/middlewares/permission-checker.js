// 说明：通用权限检查中间件 - 用于导出和删除等敏感操作的权限验证
// 路径：koa2/src/middlewares/permission-checker.js

const userModel = require('../modules/user/model')

/**
 * 通用权限检查中间件
 * 针对导出和删除操作进行权限验证
 *
 * @param {Object} options - 配置选项
 * @param {String} options.permission - 需要的权限标识，如 'system:common:export'
 * @param {Boolean} options.checkAdmin - 是否检查 admin 角色（默认 true）
 * @returns {Function} Koa 中间件函数
 */
function permissionChecker(options = {}) {
  const { permission = 'system:common:export', checkAdmin = true } = options

  return async (ctx, next) => {
    try {
      // 获取用户 ID（从 authMiddleware 中设置）
      const user_id = ctx.state.user_id

      if (!user_id) {
        console.warn('⚠️ [PermissionChecker] 未找到用户 ID，请先通过认证')
        ctx.status = 401
        ctx.unauthorized('未登录')
        return
      }

      // ✅ 获取用户角色
      const roles = await userModel.getUserRoles(user_id)

      if (!roles || roles.length === 0) {
        console.warn(`⚠️ [PermissionChecker] 用户 ${user_id} 没有分配任何角色`)
        ctx.status = 403
        ctx.forbidden('您没有执行此操作的权限')
        return
      }

      // ✅ 检查是否是超级管理员（如果启用）
      if (checkAdmin) {
        const isAdmin = roles.some((role) => {
          const roleKey = role.role_key || role.roleKey || ''
          return roleKey.toLowerCase().includes('admin')
        })

        if (isAdmin) {
          console.log(`✅ [PermissionChecker] 用户 ${user_id} 是超级管理员，直接放行`)
          await next()
          return
        }
      }

      // ✅ 检查用户是否有指定权限
      // 从角色的菜单权限中查找
      const hasPermission = await checkUserPermission(user_id, permission)

      if (!hasPermission) {
        console.warn(`⚠️ [PermissionChecker] 用户 ${user_id} 缺少权限: ${permission}`)
        ctx.status = 403
        ctx.forbidden(`您没有执行此操作的权限（需要权限: ${permission}）`)
        return
      }

      console.log(`✅ [PermissionChecker] 用户 ${user_id} 权限校验通过: ${permission}`)
      await next()
    } catch (error) {
      console.error('❌ [PermissionChecker] 权限检查失败:', error.message)
      ctx.status = 500
      ctx.error('权限检查失败')
    }
  }
}

/**
 * 检查用户是否有指定权限
 * 通过查询用户的角色关联的菜单权限来判断
 *
 * @param {Number} user_id - 用户 ID
 * @param {String} permission - 权限标识
 * @returns {Boolean} 是否有权限
 */
async function checkUserPermission(user_id, permission) {
  try {
    // 1. 获取用户的所有角色 ID
    const userRoles = await userModel.getUserRoles(user_id)
    if (!userRoles || userRoles.length === 0) {
      return false
    }

    const roleIds = userRoles.map((role) => role.role_id)

    // 2. 查询这些角色关联的菜单权限
    const menuModel = require('../modules/menu/model')
    const menus = await menuModel.getMenusByRoleIds(roleIds)

    if (!menus || menus.length === 0) {
      return false
    }

    // 3. 检查菜单中是否包含指定的权限标识
    // 兼容 snake_case 和 camelCase
    const hasPermission = menus.some((menu) => {
      const perms = menu.perms || menu.perms
      if (!perms) return false

      // 支持多个权限用逗号分隔
      const permsArray = typeof perms === 'string' ? perms.split(',') : perms
      return permsArray.includes(permission)
    })

    return hasPermission
  } catch (error) {
    console.error('❌ [checkUserPermission] 查询权限失败:', error.message)
    return false
  }
}

/**
 * 导出权限检查中间件
 * 专门用于导出操作的权限验证
 */
function exportPermissionChecker() {
  return permissionChecker({
    permission: 'system:common:export',
    checkAdmin: true,
  })
}

/**
 * 删除权限检查中间件
 * 专门用于删除操作的权限验证
 */
function deletePermissionChecker() {
  return permissionChecker({
    permission: 'system:common:delete',
    checkAdmin: true,
  })
}

module.exports = {
  permissionChecker,
  exportPermissionChecker,
  deletePermissionChecker,
  checkUserPermission,
}
