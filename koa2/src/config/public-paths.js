// 说明：全局白名单配置 - 统一管理不需要认证和权限校验的路径
// ✅ DRY 原则：避免在 authMiddleware 和 globalApiPermissionInterceptor 中重复定义

/**
 * 公开路径白名单（不需要 Token 验证 + 不需要接口权限校验）
 * 包括：登录、注册、健康检查、验证码、静态资源、Swagger 文档等
 *
 * ⚠️ 注意：使用相对路径（不带 /koa2api 前缀），匹配时会同时检查带前缀和不带前缀的路径
 */
const PUBLIC_PATHS = [
  '/users/login',
  '/users/register',
  '/health',
  '/captcha/image',
  '/koa2api-docs',
  '/uploads/',
]

/**
 * 检查路径是否在白名单中
 * @param {string} path - 请求路径（可能带 /koa2api 前缀）
 * @returns {boolean} 是否为公开路径
 */
function isPublicPath(path) {
  return PUBLIC_PATHS.some((publicPath) => {
    // 直接匹配（如 /koa2api-docs）
    if (path.startsWith(publicPath)) return true

    // 匹配带 /koa2api 前缀的路径（如 /koa2api/users/login 匹配 /users/login）
    const API_PREFIX = '/koa2api'
    if (path.startsWith(API_PREFIX)) {
      const pathWithoutPrefix = path.slice(API_PREFIX.length)
      if (pathWithoutPrefix.startsWith(publicPath)) return true
    }

    return false
  })
}

module.exports = {
  PUBLIC_PATHS,
  isPublicPath,
}
