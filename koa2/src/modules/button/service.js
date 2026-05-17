/**
 * 按钮服务层 - 处理业务逻辑
 * @description 管理 sys_button 表中的按钮权限数据，包含权限标识唯一性校验
 * @author System
 * @date 2026-05-13
 */

const buttonModel = require('./model')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')

class ButtonService {
  /**
   * 获取按钮列表（分页）
   * @param {Object} params - 查询参数
   * @returns {Promise<{success: boolean, data: Array, total: number, page: number, limit: number}>}
   */
  async getButtonList(params = {}) {
    console.log('🔍 [ButtonService] 获取按钮列表, params:', params)
    const result = await buttonModel.list(params)

    return {
      success: true,
      data: result.list,
      total: result.total,
      page: result.page || 1,
      limit: result.page_size || 10,
    }
  }

  /**
   * 获取按钮详情
   * @param {number} button_id - 按钮ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getButtonDetail(button_id) {
    const button = await buttonModel.getById(button_id)
    if (!button) {
      throw new NotFoundError('按钮不存在')
    }
    
    console.log('[ButtonService] 获取按钮详情:', button)
    
    return {
      success: true,
      data: button,
    }
  }

  /**
   * 创建按钮
   * @param {Object} data - 按钮数据
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async createButton(data) {
    // 检查必填字段
    if (!data.button_name) {
      throw new BadRequestError('按钮名称不能为空')
    }
    if (!data.parent_id) {
      throw new BadRequestError('所属菜单不能为空')
    }
    if (!data.perms) {
      throw new BadRequestError('权限标识不能为空')
    }

    // 检查权限标识是否已存在
    const permsExists = await buttonModel.checkPermsExists(data.perms)
    if (permsExists) {
      throw new BadRequestError(`权限标识 [${data.perms}] 已存在`)
    }

    const button = await buttonModel.create(data)
    return {
      success: true,
      data: button,
      message: '按钮创建成功',
    }
  }

  /**
   * 更新按钮
   * @param {number} button_id - 按钮ID
   * @param {Object} data - 更新数据
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async updateButton(button_id, data) {
    const existButton = await buttonModel.getById(button_id)
    if (!existButton) {
      throw new NotFoundError('按钮不存在')
    }

    // 如果修改了权限标识，检查是否与其他按钮冲突
    if (data.perms && data.perms !== existButton.perms) {
      const permsExists = await buttonModel.checkPermsExists(data.perms, button_id)
      if (permsExists) {
        throw new BadRequestError(`权限标识 [${data.perms}] 已被其他按钮使用`)
      }
    }

    const button = await buttonModel.update(button_id, data)
    return {
      success: true,
      data: button,
      message: '按钮更新成功',
    }
  }

  /**
   * 删除按钮
   * @param {number} button_id - 按钮ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteButton(button_id) {
    const existButton = await buttonModel.getById(button_id)
    if (!existButton) {
      throw new NotFoundError('按钮不存在')
    }

    const deleted = await buttonModel.delete(button_id)
    if (!deleted) {
      throw new NotFoundError('删除失败')
    }

    return {
      success: true,
      message: '按钮删除成功',
    }
  }

  /**
   * 批量删除按钮
   * @param {number[]} ids - 按钮ID数组
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async batchDeleteButtons(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要删除的按钮')
    }

    const count = await buttonModel.batchDelete(ids)
    return {
      success: true,
      message: `成功删除 ${count} 个按钮`,
    }
  }

  /**
   * 根据菜单ID获取所有按钮
   * @param {number} menu_id - 菜单ID
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getButtonsByMenuId(menu_id) {
    const buttons = await buttonModel.getByMenuId(menu_id)
    return {
      success: true,
      data: buttons,
    }
  }
}

module.exports = new ButtonService()
