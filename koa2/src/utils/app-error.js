/**
 * 自定义应用错误类
 * 用于在业务代码中抛出带状态码的错误，会被全局错误处理中间件捕获
 */
class AppError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {number} status - HTTP 状态码（默认 500）
   */
  constructor(message, status = 500) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.statusCode = status
  }
}

/**
 * 快捷创建 400 错误（请求参数错误）
 */
class BadRequestError extends AppError {
  constructor(message = '请求参数错误') {
    super(message, 400)
    this.name = 'BadRequestError'
  }
}

/**
 * 快捷创建 401 错误（未授权）
 */
class UnauthorizedError extends AppError {
  constructor(message = '未授权，请先登录') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

/**
 * 快捷创建 403 错误（禁止访问）
 */
class ForbiddenError extends AppError {
  constructor(message = '没有权限执行此操作') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * 快捷创建 404 错误（资源不存在）
 */
class NotFoundError extends AppError {
  constructor(message = '请求的资源不存在') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * 快捷创建 500 错误（服务器内部错误）
 */
class InternalServerError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500)
    this.name = 'InternalServerError'
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
}
