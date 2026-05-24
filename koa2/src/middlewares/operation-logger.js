const operationLogService = require('../modules/operation-log/service')
const userModel = require('../modules/user/model')
const { getRealIP } = require('../utils/ip-location')

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
  if (!ctx.state.user_id) {
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
    // ✅ 修复：直接从 model 获取用户信息
    const user = await userModel.selectUserById(ctx.state.user_id)
    if (user) {
      // ✅ 修复：使用 user_name（数据库字段名）而不是 username
      username = user.user_name || user.nick_name || user.email || 'unknown'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  
  // ✅ 使用 getRealIP 获取真实 IP（支持反向代理）
  const realIP = getRealIP(ctx)
  
  // 构建日志数据
  const logData = {
    user_id: ctx.state.user_id,
    username,
    operation: getOperationName(ctx),
    module: getModuleName(ctx),
    action: getActionName(ctx),
    method: ctx.method,
    path: ctx.path,
    ipAddress: realIP,  // ✅ 使用真实 IP
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
  
  // 只记录特定模块的操作（系统管理相关）
  // ✅ 注意：ctx.path 包含 API 前缀（如 /koa2api/menus/5）
  // 所以只需要匹配模块名即可，不需要完整路径
  const logModules = [
    '/users',           // 用户管理
    '/roles',           // 角色管理
    '/permissions',     // 权限管理
    '/menus',           // 菜单管理
    '/buttons',         // 按钮管理
    '/interfaces',      // 接口管理
    '/sessions',        // 会话管理
    '/session-groups',  // 会话组管理
    '/memory',          // 记忆管理
    '/login-logs',      // 登录日志
    '/operation-logs',  // 操作日志
  ]
  
  // ✅ 使用 includes 而不是 startsWith，因为路径包含 API 前缀
  // 例如：/koa2api/menus/5 包含 /menus
  return logModules.some((module) => path.includes(module))
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
  
  // ✅ 修复：提取正确的模块名
  // 路径格式：/koa2api/menus/1 或 /api/menus/1
  // 需要匹配 logModules 中的模块名（如 /menus）
  const logModules = [
    'users', 'roles', 'permissions', 'menus', 'buttons', 'interfaces',
    'sessions', 'session-groups', 'memory', 'login-logs', 'operation-logs'
  ]
  
  // 找到匹配的模块名
  for (const module of logModules) {
    if (path.includes(module)) {
      const moduleNames = {
        users: '用户管理',
        roles: '角色管理',
        permissions: '权限管理',
        menus: '菜单管理',
        buttons: '按钮管理',
        interfaces: '接口管理',
        sessions: '会话管理',
        'session-groups': '会话组管理',
        memory: '记忆管理',
        'login-logs': '登录日志',
        'operation-logs': '操作日志',
      }
      return moduleNames[module] || module
    }
  }
  
  return 'unknown'
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
