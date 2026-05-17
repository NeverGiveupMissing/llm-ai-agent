/**
 * 统一响应格式工具
 * 位置：koa2/src/utils/response.js
 */

// 定义状态码
const CODES = {
  success: 200,
  error: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  tooManyRequests: 429,
  serverError: 500,
}

// 默认消息映射
const DEFAULT_MESSAGES = {
  success: 'success',
  error: '请求错误',
  unauthorized: '请先登录',
  forbidden: '暂无权限',
  notFound: '资源不存在',
  tooManyRequests: '请求过于频繁',
  serverError: '服务器错误',
}

/**
 * 创建响应对象
 */
function createResponse(code, data, message) {
  return {
    code,
    message:
      message || DEFAULT_MESSAGES[Object.keys(CODES).find((k) => CODES[k] === code)] || 'success',
    data,
  }
}

const ResponseUtil = {
  /**
   * 普通成功响应
   * @param {any} data - 数据（默认 null）
   * @param {string} message - 自定义消息
   */
  success(data = null, message) {
    return createResponse(CODES.success, data, message)
  },

  /**
   * 失败响应
   * @param {string} message - 错误描述
   * @param {number} code - 错误码（默认 400）
   */
  fail(message, code = CODES.error) {
    return createResponse(code, null, message)
  },

  /**
   * 分页成功响应
   * @param {Array} list - 数据列表
   * @param {number} total - 总记录数
   * @param {number} page - 当前页码
   * @param {number} page_size - 每页数量
   * @param {string} message - 自定义消息
   */
  pageSuccess(list = [], total = 0, page = 1, page_size = 10, message) {
    return createResponse(
      CODES.success,
      {
        list,
        pagination: {
          total,
          page,
          page_size,
        },
      },
      message,
    )
  },

  /**
   * 404 响应
   * @param {string} message - 自定义消息
   */
  notFound(message) {
    return createResponse(CODES.notFound, null, message || DEFAULT_MESSAGES.notFound)
  },

  /**
   * 401 未授权响应
   * @param {string} message - 自定义消息
   */
  unauthorized(message) {
    return createResponse(CODES.unauthorized, null, message || DEFAULT_MESSAGES.unauthorized)
  },

  /**
   * 403 禁止访问响应
   * @param {string} message - 自定义消息
   */
  forbidden(message) {
    return createResponse(CODES.forbidden, null, message || DEFAULT_MESSAGES.forbidden)
  },

  /**
   * 429 请求过于频繁
   * @param {string} message - 自定义消息
   */
  tooManyRequests(message) {
    return createResponse(CODES.tooManyRequests, null, message || DEFAULT_MESSAGES.tooManyRequests)
  },

  /**
   * 500 服务器错误
   * @param {string} message - 自定义消息
   */
  serverError(message) {
    return createResponse(CODES.serverError, null, message || DEFAULT_MESSAGES.serverError)
  },
}

/**
 * 将响应方法挂载到 ctx 上
 * @param {Object} ctx - Koa context
 */
function mountToContext(ctx) {
  ctx.success = (data, message) => {
    ctx.body = ResponseUtil.success(data, message)
  }

  ctx.fail = (message, code) => {
    ctx.body = ResponseUtil.fail(message, code)
  }

  ctx.pageSuccess = (list, total, page, page_size, message) => {
    ctx.body = ResponseUtil.pageSuccess(list, total, page, page_size, message)
  }

  ctx.notFound = (message) => {
    ctx.body = ResponseUtil.notFound(message)
  }

  ctx.unauthorized = (message) => {
    ctx.body = ResponseUtil.unauthorized(message)
  }

  ctx.forbidden = (message) => {
    ctx.body = ResponseUtil.forbidden(message)
  }

  ctx.tooManyRequests = (message) => {
    ctx.body = ResponseUtil.tooManyRequests(message)
  }

  ctx.serverError = (message) => {
    ctx.body = ResponseUtil.serverError(message)
  }
}

module.exports = {
  ResponseUtil,
  mountToContext,
}
