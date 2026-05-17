/**
 * 接口管理服务层
 */

const interfaceModel = require('./model')

class InterfaceService {
  /**
   * 获取接口列表（分页）
   * @param {Object} params - 查询参数
   * @returns {Promise<{success: boolean, data: Array, total: number, page: number, limit: number}>}
   */
  async getInterfaceList(params = {}) {
    const result = await interfaceModel.list(params)

    return {
      success: true,
      data: result.list,
      total: result.total,
      page: result.page || 1,
      limit: result.page_size || 10,
    }
  }

  /**
   * 获取接口详情
   * @param {number} interface_id - 接口ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getInterfaceDetail(interface_id) {
    const interfaceItem = await interfaceModel.getById(interface_id)

    if (!interfaceItem) {
      throw new Error('接口不存在')
    }

    return {
      success: true,
      data: interfaceItem,
    }
  }

  /**
   * 创建接口
   * @param {Object} interfaceData - 接口数据
   * @param {string} createBy - 创建者
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async createInterface(interfaceData, createBy = 'admin') {
    // 验证必填字段
    if (!interfaceData.interface_name || !interfaceData.interface_url || !interfaceData.interface_category) {
      throw new Error('接口名称、接口路径和所属模块为必填项')
    }

    // 验证请求方式
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    if (!validMethods.includes(interfaceData.interface_method?.toUpperCase())) {
      throw new Error('无效的请求方式')
    }

    const interfaceItem = await interfaceModel.create(interfaceData, createBy)

    return {
      success: true,
      data: interfaceItem,
      message: '接口创建成功',
    }
  }

  /**
   * 更新接口
   * @param {number} interface_id - 接口ID
   * @param {Object} updates - 更新数据
   * @param {string} updateBy - 更新者
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async updateInterface(interface_id, updates, updateBy = 'admin') {
    const interfaceItem = await interfaceModel.getById(interface_id)

    if (!interfaceItem) {
      throw new Error('接口不存在')
    }

    // 如果修改了请求方式，验证其有效性
    if (updates.interface_method) {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
      if (!validMethods.includes(updates.interface_method.toUpperCase())) {
        throw new Error('无效的请求方式')
      }
    }

    const updatedInterface = await interfaceModel.update(interface_id, updates, updateBy)

    return {
      success: true,
      data: updatedInterface,
      message: '接口更新成功',
    }
  }

  /**
   * 删除接口
   * @param {number} interface_id - 接口ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteInterface(interface_id) {
    const interfaceItem = await interfaceModel.getById(interface_id)

    if (!interfaceItem) {
      throw new Error('接口不存在')
    }

    await interfaceModel.delete(interface_id)

    return {
      success: true,
      message: '接口删除成功',
    }
  }

  /**
   * 获取所有接口
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getAllInterfaces() {
    const interfaces = await interfaceModel.all()

    return {
      success: true,
      data: interfaces,
    }
  }
}

module.exports = new InterfaceService()
