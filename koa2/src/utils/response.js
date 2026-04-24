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
   * @param {string} message - 自定义消息
   */
  send(type, data = null, message) {
    const code = CODES[type]
    // 如果没有传 message，则使用 type 作为默认值（例如 'success', 'error'）
    return {
      code,
      message: message || type,
      data,
    }
  },

  // 动态生成各个方法，保持调用方式不变
  success(data, message) {
    return this.send('success', data, message)
  },
  error(data, message) {
    return this.send('error', data, message)
  },
  unauthorized(message) {
    return this.send('unauthorized', null, message)
  },
  forbidden(message) {
    return this.send('forbidden', null, message)
  },
  notFound(message) {
    return this.send('notFound', null, message)
  },
  serverError(message) {
    return this.send('serverError', null, message)
  },
}

module.exports = ResponseUtil
