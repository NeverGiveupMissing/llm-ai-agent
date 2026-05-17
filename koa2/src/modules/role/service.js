// 说明：角色业务逻辑 - 处理角色的创建、权限分配

const roleModel = require('./model')
const permissionModel = require('../permission/model')

class RoleService {
  /**
   * 清除角色的所有关联数据（菜单、按钮、接口、用户）
   * @param {Object} client - 数据库客户端
   * @param {number} role_id - 角色ID
   */
  async clearRoleAssociations(client, role_id) {
    // 清除用户角色关联
    await client.query(`DELETE FROM sys_user_role WHERE role_id = $1`, [role_id])
    // 清除角色菜单关联
    await client.query(`DELETE FROM sys_role_menu WHERE role_id = $1`, [role_id])
    // 清除角色按钮关联
    await client.query(`DELETE FROM sys_role_button WHERE role_id = $1`, [role_id])
    // 清除角色接口关联
    await client.query(`DELETE FROM sys_role_interface WHERE role_id = $1`, [role_id])
  }

  /**
  /**
   * 创建新角色
   * @param {Object} roleData - 角色数据（驼峰格式）
   * @param {string} roleData.roleName - 角色名称
   * @param {string} roleData.roleKey - 角色标识
   * @param {number} roleData.roleSort - 显示排序
   * @param {string} roleData.dataScope - 数据权限范围
   * @param {string} roleData.status - 状态
   * @param {string} roleData.createBy - 创建者
   * @param {string} roleData.remark - 备注
   */
  async createRole(roleData) {
    // 验证角色名称是否已存在
    const existingRole = await roleModel.getByRoleName(roleData.roleName)
    if (existingRole) {
      throw new Error('角色名称已存在')
    }

    // 验证角色标识是否已存在
    const existingKey = await roleModel.getByRoleKey(roleData.roleKey)
    if (existingKey) {
      throw new Error('角色标识已存在')
    }

    const role = await roleModel.create({
      roleName: roleData.roleName,
      roleKey: roleData.roleKey,
      roleSort: roleData.roleSort,
      dataScope: roleData.dataScope,
      status: roleData.status,
      createBy: roleData.createBy,
      remark: roleData.remark,
    })

    return {
      success: true,
      data: role,
      message: '角色创建成功',
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleDetail(role_id) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    const permissions = await roleModel.getRolePermissions(role_id)

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
      page_num: params.page_num || 1,
      page_size: params.page_size || 20,
    }
  }

  /**
   * 更新角色信息
   */
  async updateRole(role_id, updates) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    const updatedRole = await roleModel.update(role_id, updates)

    return {
      success: true,
      data: updatedRole,
      message: '角色更新成功',
    }
  }

  /**
   * 删除角色（软删除）
   */
  async deleteRole(role_id) {
    const { pool } = require('../../config/db')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. 软删除角色
      await client.query(
        `UPDATE sys_role SET del_flag = '2', update_time = NOW() WHERE role_id = $1 AND del_flag = '0'`,
        [role_id],
      )

      // 2. 清除所有关联数据
      await this.clearRoleAssociations(client, role_id)

      await client.query('COMMIT')

      return {
        success: true,
        message: '角色删除成功',
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('删除角色失败:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 批量删除角色（软删除）
   */
  async batchDeleteRoles(role_ids) {
    const { pool } = require('../../config/db')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let successCount = 0
      let failCount = 0
      const errors = []

      for (const role_id of role_ids) {
        try {
          // 1. 软删除角色
          await client.query(
            `UPDATE sys_role SET del_flag = '2', update_time = NOW() WHERE role_id = $1 AND del_flag = '0'`,
            [role_id],
          )

          // 2. 清除所有关联数据
          await this.clearRoleAssociations(client, role_id)

          successCount++
        } catch (error) {
          failCount++
          errors.push({ role_id, error: error.message })
        }
      }

      await client.query('COMMIT')

      if (failCount > 0) {
        return {
          success: successCount > 0,
          message: `批量删除完成：成功 ${successCount} 个，失败 ${failCount} 个`,
          errors,
        }
      }

      return {
        success: true,
        message: `批量删除成功，共删除 ${successCount} 个角色`,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('批量删除角色失败:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 更新角色状态（启用/禁用）
   */
  async updateRoleStatus(role_id, status) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 检查是否已删除
    if (role.deleted_at) {
      throw new Error('角色已被删除，无法修改状态')
    }

    // 不允许禁用系统角色
    if (role.is_system && status === 'inactive') {
      throw new Error('系统角色不允许禁用')
    }

    const updatedRole = await roleModel.updateStatus(role_id, status)
    if (!updatedRole) {
      throw new Error('状态更新失败')
    }

    const statusText = {
      active: '启用',
      inactive: '禁用',
    }

    return {
      success: true,
      message: `角色已${statusText[status]}`,
      data: updatedRole,
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermission(role_id, permissionId) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    await roleModel.assignPermission(role_id, permissionId)

    return {
      success: true,
      message: '权限分配成功',
    }
  }

  /**
   * 移除角色权限
   */
  async removePermission(role_id, permissionId) {
    const removed = await roleModel.removePermission(role_id, permissionId)
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
  async assignPermissions(role_id, permissionIds) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    await roleModel.assignPermissions(role_id, permissionIds)

    return {
      success: true,
      message: '权限批量分配成功',
    }
  }

  /**
   * 获取角色的所有用户
   */
  async getRoleUsers(role_id, params) {
    const users = await roleModel.getRoleUsers(role_id, params)
    const total = users.length

    return {
      success: true,
      data: users,
      total,
      page_num: params.page_num || 1,
      page_size: params.page_size || 20,
    }
  }

  /**
   * 获取角色的菜单权限 ID 列表
   */
  async getRolemenu_ids(role_id) {
    const menu_ids = await roleModel.getRolemenu_ids(role_id)
    return {
      success: true,
      data: menu_ids,
    }
  }

  /**
   * 保存角色的菜单权限（覆盖更新，使用事务）
   */
  async saveRoleMenus(role_id, menu_ids) {
    // 验证角色是否存在
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 使用 model 层的事务方法
    await roleModel.assignMenus(role_id, menu_ids)

    return {
      success: true,
      message: '菜单权限分配成功',
    }
  }

  /**
   * 获取角色的接口权限ID列表
   */
  async getRoleApiPaths(role_id) {
    const apiPaths = await roleModel.getRoleApiPaths(role_id)
    return {
      success: true,
      data: apiPaths,
    }
  }

  /**
   * 保存角色的接口权限（覆盖更新，使用事务）
   */
  async saveRoleApis(role_id, interface_ids) {
    // 验证角色是否存在
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 使用 model 层的事务方法
    await roleModel.assignApis(role_id, interface_ids)

    return {
      success: true,
      message: '接口权限分配成功',
    }
  }

  /**
   * 获取角色的按钮权限 ID 列表
   */
  async getRoleButtonIds(role_id) {
    const button_ids = await roleModel.getRoleButtonIds(role_id)
    return {
      success: true,
      data: button_ids,
    }
  }

  /**
   * 保存角色的按钮权限（覆盖更新，使用事务）
   */
  async saveRoleButtons(role_id, button_ids) {
    // 验证角色是否存在
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 使用 model 层的事务方法
    await roleModel.assignButtons(role_id, button_ids)

    return {
      success: true,
      message: '按钮权限分配成功',
    }
  }

  /**
   * 获取角色的所有权限（聚合查询）
   */
  async getRoleAllPermissions(role_id) {
    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    const permissions = await roleModel.getRoleAllPermissions(role_id)

    return {
      success: true,
      data: permissions,
    }
  }
}

module.exports = new RoleService()
