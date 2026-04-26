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

// 默认消息映射
const DEFAULT_MESSAGES = {
  success: '操作成功',
  error: '请求错误',
  unauthorized: '未授权',
  forbidden: '禁止访问',
  notFound: '资源不存在',
  serverError: '服务器错误',
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
    // 如果没有传 message，则使用默认中文消息
    return {
      code,
      message: message || DEFAULT_MESSAGES[type] || type,
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
