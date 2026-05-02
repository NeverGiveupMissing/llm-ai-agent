// 说明：权限业务逻辑 - 处理权限的查询和验证

const permissionModel = require('./model')
const roleModel = require('../role/model')

class PermissionService {
  /**
   * 获取权限列表
   */
  async listPermissions(params) {
    const permissions = await permissionModel.list(params)

    return {
      success: true,
      data: permissions,
      total: permissions.length,
      page: params.page || 1,
      limit: params.limit || 100,
    }
  }

  /**
   * 获取权限树形结构
   */
  async getPermissionTree() {
    const permissions = await permissionModel.list()
    const tree = this.buildPermissionTree(permissions)

    return {
      success: true,
      data: tree,
    }
  }

  /**
   * 构建权限树
   */
  buildPermissionTree(permissions, parentId = null) {
    const tree = []
    
    for (const permission of permissions) {
      if (permission.parent_id === parentId || (!permission.parent_id && parentId === null)) {
        const node = {
          ...permission,
          children: this.buildPermissionTree(permissions, permission.id),
        }
        
        // 如果没有子节点，删除 children 字段
        if (node.children.length === 0) {
          delete node.children
        }
        
        tree.push(node)
      }
    }
    
    return tree
  }

  /**
   * 按模块分组获取权限
   */
  async getPermissionsByModule() {
    const groupedPermissions = await permissionModel.listByModule()

    return {
      success: true,
      data: groupedPermissions,
    }
  }

  /**
   * 获取权限详情
   */
  async getPermissionDetail(permissionId) {
    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    return {
      success: true,
      data: permission,
    }
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId) {
    const permissions = await permissionModel.getUserPermissions(userId)

    return {
      success: true,
      data: permissions,
      total: permissions.length,
      page: 1,
      limit: permissions.length,
    }
  }

  /**
   * 检查用户权限
   */
  async checkPermission(userId, permissionCode) {
    const hasPermission = await permissionModel.hasPermission(userId, permissionCode)

    return {
      success: true,
      data: {
        hasPermission,
        permissionCode,
      },
    }
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async checkAnyPermission(userId, permissionCodes) {
    const hasAny = await permissionModel.hasAnyPermission(userId, permissionCodes)

    return {
      success: true,
      data: {
        hasAny,
        permissionCodes,
      },
    }
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async checkAllPermissions(userId, permissionCodes) {
    const hasAll = await permissionModel.hasAllPermissions(userId, permissionCodes)

    return {
      success: true,
      data: {
        hasAll,
        permissionCodes,
      },
    }
  }

  /**
   * 获取当前用户的菜单树
   */
  async getUserMenuTree(userId) {
    // 获取用户的所有权限
    const permissions = await permissionModel.getUserPermissions(userId)
    
    // 过滤出菜单类型的权限（type='menu'）
    const menuPermissions = permissions.filter(p => p.type === 'menu')
    
    // 构建树形结构
    const menuTree = this.buildPermissionTree(menuPermissions)
    
    return {
      success: true,
      data: menuTree,
    }
  }

  /**
   * 创建权限
   */
  async createPermission(permissionData) {
    // 验证权限编码是否已存在
    const existingPermission = await permissionModel.getByCode(permissionData.code)
    if (existingPermission) {
      throw new Error('权限编码已存在')
    }

    // 如果指定了父权限，验证父权限是否存在
    if (permissionData.parentId) {
      const parentPermission = await permissionModel.getById(permissionData.parentId)
      if (!parentPermission) {
        throw new Error('父权限不存在')
      }
    }

    const permission = await permissionModel.create(permissionData)

    return {
      success: true,
      data: permission,
      message: '权限创建成功',
    }
  }

  /**
   * 更新权限
   */
  async updatePermission(permissionId, updates) {
    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    // 如果更新编码，检查是否重复
    if (updates.code && updates.code !== permission.code) {
      const existingPermission = await permissionModel.getByCode(updates.code)
      if (existingPermission) {
        throw new Error('权限编码已存在')
      }
    }

    const updatedPermission = await permissionModel.update(permissionId, updates)

    return {
      success: true,
      data: updatedPermission,
      message: '权限更新成功',
    }
  }

  /**
   * 删除权限
   */
  async deletePermission(permissionId) {
    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    // 检查是否有子权限
    const allPermissions = await permissionModel.list()
    const hasChildren = allPermissions.some(p => p.parent_id === permissionId)
    if (hasChildren) {
      throw new Error('该权限包含子权限，无法删除')
    }

    // 检查是否有角色使用此权限
    const roles = await permissionModel.getPermissionRoles(permissionId)
    if (roles && roles.length > 0) {
      throw new Error('该权限已被角色使用，无法删除')
    }

    await permissionModel.delete(permissionId)

    return {
      success: true,
      message: '权限删除成功',
    }
  }
}

module.exports = new PermissionService()
