const operationLogService = require('../modules/operation-log/service')
const { getUserById } = require('../modules/user/service')

/**
 * 操作日志记录中间件
 * 自动记录所有关键操作到数据库
 */
async function operationLogger(ctx, next) {
  const startTime = Date.now()
  
  // 执行请求
  await next()
  
  const duration = Date.now() - startTime
  
  // 只记录需要认证的路由（跳过登录、注册等公开接口）
  if (!ctx.state.userId) {
    return
  }
  
  // 判断是否需要记录日志
  const shouldLog = shouldRecordLog(ctx)
  if (!shouldLog) {
    return
  }
  
  // 获取用户信息
  let username = 'unknown'
  try {
    const user = await getUserById(ctx.state.userId)
    if (user) {
      username = user.username || user.email || 'unknown'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  
  // 构建日志数据
  const logData = {
    userId: ctx.state.userId,
    username,
    operation: getOperationName(ctx),
    module: getModuleName(ctx),
    action: getActionName(ctx),
    method: ctx.method,
    path: ctx.path,
    ipAddress: ctx.ip || ctx.request.ip,
    userAgent: ctx.get('User-Agent') || '',
    requestParams: sanitizeParams(ctx.request.body || ctx.query || {}),
    responseStatus: ctx.status,
    responseData: sanitizeResponse(ctx.body),
    duration,
    status: ctx.status >= 200 && ctx.status < 400 ? 'success' : 'failed',
    errorMessage: ctx.status >= 400 ? (ctx.body?.message || ctx.message) : null,
  }
  
  // 异步记录日志（不阻塞响应）
  operationLogService.logOperation(logData).catch((error) => {
    console.error('记录操作日志失败:', error)
  })
}

/**
 * 判断是否应该记录日志
 */
function shouldRecordLog(ctx) {
  const path = ctx.path
  
  // 跳过静态资源和文档
  if (path.includes('/docs') || path.includes('/swagger')) {
    return false
  }
  
  // ⭐ 只记录非GET请求
  if (ctx.method === 'GET') {
    return false
  }
  
  // 只记录特定模块的操作
  const logModules = [
    '/users',
    '/roles',
    '/permissions',
    '/chat-sessions',
    '/session-groups',
    '/memories',
    '/operation-logs',
  ]
  
  return logModules.some((module) => path.startsWith(module))
}

/**
 * 获取操作名称
 */
function getOperationName(ctx) {
  const method = ctx.method
  const path = ctx.path
  
  const operations = {
    POST: '创建',
    PUT: '更新',
    PATCH: '修改',
    DELETE: '删除',
    GET: '查看',
  }
  
  return operations[method] || method
}

/**
 * 获取模块名称
 */
function getModuleName(ctx) {
  const path = ctx.path
  const segments = path.split('/').filter(Boolean)
  
  if (segments.length === 0) return 'unknown'
  
  // 提取模块名（第一段路径）
  const moduleName = segments[0]
  
  const moduleNames = {
    users: '用户管理',
    roles: '角色管理',
    permissions: '权限管理',
    'chat-sessions': '会话管理',
    'session-groups': '会话组管理',
    memories: '记忆管理',
    'operation-logs': '操作日志',
  }
  
  return moduleNames[moduleName] || moduleName
}

/**
 * 获取动作名称
 */
function getActionName(ctx) {
  const method = ctx.method
  const path = ctx.path
  
  const actions = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
    GET: 'read',
  }
  
  return actions[method] || 'unknown'
}

/**
 * 清理请求参数（移除敏感信息）
 */
function sanitizeParams(params) {
  if (!params || typeof params !== 'object') {
    return {}
  }
  
  const sanitized = { ...params }
  
  // 移除敏感字段
  const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'access_token']
  
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '***'
    }
  })
  
  return sanitized
}

/**
 * 清理响应数据（移除敏感信息）
 */
function sanitizeResponse(response) {
  if (!response || typeof response !== 'object') {
    return null
  }
  
  // 只保留必要的响应信息
  return {
    code: response.code,
    message: response.message,
  }
}

module.exports = operationLogger
