// 说明：角色业务逻辑 - 处理角色的创建、权限分配

const roleModel = require('../models/roleModel')
const permissionModel = require('../models/permissionModel')

class RoleService {
  /**
   * 创建新角色
   */
  async createRole(roleData) {
    // 验证角色名称是否已存在
    const existingRole = await roleModel.getByName(roleData.name)
    if (existingRole) {
      throw new Error('角色名称已存在')
    }

    const role = await roleModel.create(roleData)

    return {
      success: true,
      data: role,
      message: '角色创建成功',
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleDetail(roleId) {
    const role = await roleModel.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    const permissions = await roleModel.getRolePermissions(roleId)

    return {
      success: true,
      data: {
        ...role,
        permissions,
      },
    }
  }

  /**
   * 获取角色列表
   */
  async listRoles(params) {
    const roles = await roleModel.list(params)
    const total = await roleModel.count(params)

    return {
      success: true,
      data: roles,
      total,
      page: params.page || 1,
      limit: params.limit || 20,
    }
  }

  /**
   * 更新角色信息
   */
  async updateRole(roleId, updates) {
    const role = await roleModel.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    const updatedRole = await roleModel.update(roleId, updates)

    return {
      success: true,
      data: updatedRole,
      message: '角色更新成功',
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId) {
    try {
      await roleModel.delete(roleId)
      return {
        success: true,
        message: '角色删除成功',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermission(roleId, permissionId) {
    const role = await roleModel.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    await roleModel.assignPermission(roleId, permissionId)

    return {
      success: true,
      message: '权限分配成功',
    }
  }

  /**
   * 移除角色权限
   */
  async removePermission(roleId, permissionId) {
    const removed = await roleModel.removePermission(roleId, permissionId)
    if (!removed) {
      throw new Error('权限移除失败')
    }

    return {
      success: true,
      message: '权限移除成功',
    }
  }

  /**
   * 批量为角色分配权限
   */
  async assignPermissions(roleId, permissionIds) {
    const role = await roleModel.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    await roleModel.assignPermissions(roleId, permissionIds)

    return {
      success: true,
      message: '权限批量分配成功',
    }
  }

  /**
   * 获取角色的所有用户
   */
  async getRoleUsers(roleId, params) {
    const users = await roleModel.getRoleUsers(roleId, params)

    return {
      success: true,
      data: users,
    }
  }
}

module.exports = new RoleService()
