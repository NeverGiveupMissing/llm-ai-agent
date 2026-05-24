/**
 * UUID 格式校验中间件
 * 防止非法 UUID 格式传入数据库导致崩溃
 */

const { BadRequestError } = require('../utils/app-error')

/**
 * UUID v4 格式正则表达式
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * 校验单个 UUID 值
 */
function validateUUID(value, fieldName = 'id') {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value !== 'string') {
    throw new BadRequestError(`字段 ${fieldName} 必须是字符串类型`)
  }

  if (value.trim() === '') {
    throw new BadRequestError(`字段 ${fieldName} 不能为空`)
  }

  if (!UUID_REGEX.test(value)) {
    throw new BadRequestError(`字段 ${fieldName} 格式错误：期望 UUID 格式，收到 "${value}"`)
  }

  return true
}

/**
 * Koa 中间件：校验请求体中的 UUID 字段
 * @param {Array} fields - 需要校验的字段名数组，例如 ['session_id', 'group_id']
 */
function validateUUIDFields(fields) {
  return async (ctx, next) => {
    try {
      // 校验请求体中的字段
      if (ctx.request.body) {
        for (const field of fields) {
          const value = ctx.request.body[field]
          if (value !== undefined && value !== null) {
            validateUUID(value, field)
          }
        }
      }

      // 校验路径参数中的字段
      if (ctx.params) {
        for (const field of fields) {
          const value = ctx.params[field]
          if (value !== undefined && value !== null) {
            validateUUID(value, field)
          }
        }
      }

      // 校验查询参数中的字段
      if (ctx.request.query) {
        for (const field of fields) {
          const value = ctx.request.query[field]
          if (value !== undefined && value !== null) {
            validateUUID(value, field)
          }
        }
      }

      await next()
    } catch (error) {
      // 如果是自定义错误，直接抛出
      if (error instanceof BadRequestError) {
        throw error
      }
      // 其他错误继续抛出
      throw error
    }
  }
}

/**
 * 快捷方法：校验 session_id
 */
function validateSessionId(ctx, next) {
  return validateUUIDFields(['session_id', 'id'])(ctx, next)
}

/**
 * 快捷方法：校验 group_id
 */
function validateGroupId(ctx, next) {
  return validateUUIDFields(['group_id'])(ctx, next)
}

/**
 * 快捷方法：校验 memory_id
 */
function validateMemoryId(ctx, next) {
  return validateUUIDFields(['memory_id'])(ctx, next)
}

module.exports = {
  UUID_REGEX,
  validateUUID,
  validateUUIDFields,
  validateSessionId,
  validateGroupId,
  validateMemoryId,
}
