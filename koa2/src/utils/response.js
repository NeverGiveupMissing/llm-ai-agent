/**
 * 统一响应格式工具 (精简版)
 */

// 定义状态码和默认文案的映射
const CODES = {
  success: 200,
  error: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  serverError: 500,
}

const ResponseUtil = {
  /**
   * 通用发送方法
   * @param {string} type - 对应 CODES 中的键名
   * @param {any} data - 数据
   * @param {string} msg - 自定义消息
   */
  send(type, data = null, msg) {
    const code = CODES[type]
    // 如果没有传 msg，则使用 type 作为默认值（例如 'success', 'error'）
    return {
      code,
      msg: msg || type,
      data,
    }
  },

  // 动态生成各个方法，保持调用方式不变
  success(data, msg) {
    return this.send('success', data, msg)
  },
  error(data, msg) {
    return this.send('error', data, msg)
  },
  unauthorized(msg) {
    return this.send('unauthorized', null, msg)
  },
  forbidden(msg) {
    return this.send('forbidden', null, msg)
  },
  notFound(msg) {
    return this.send('notFound', null, msg)
  },
  serverError(msg) {
    return this.send('serverError', null, msg)
  },
}

module.exports = ResponseUtil

