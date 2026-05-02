# 鉴权中间件文档

## 📋 概述

本文档描述了项目中使用的三个核心鉴权中间件：认证中间件、权限验证中间件和速率限制中间件。

## 🔐 1. 认证中间件 (auth.middleware.js)

### 功能说明

验证请求头中的 `Authorization: Bearer <token>`，确认用户身份。

### 使用方式

```javascript
const { authMiddleware } = require('./middlewares/auth.middleware')

// 在路由中使用
router.get('/protected', authMiddleware(), async (ctx) => {
  // ctx.state.userId - 用户ID
  // ctx.state.username - 用户名
  // ctx.state.user - 完整的用户信息
})
```

### 工作流程

1. 从请求头获取 `Authorization` 字段
2. 提取 Bearer Token
3. 验证 Token 有效性（签名、过期时间）
4. 将用户信息存储到 `ctx.state`
5. 继续执行后续中间件

### 错误响应

#### 缺少认证令牌

```json
{
  "code": 401,
  "message": "缺少认证令牌",
  "data": null
}
```

#### 无效的Token格式

```json
{
  "code": 401,
  "message": "无效的认证令牌格式",
  "data": null
}
```

#### Token已过期

```json
{
  "code": 401,
  "message": "Token 已过期",
  "data": null
}
```

#### 无效的Token

```json
{
  "code": 401,
  "message": "无效的 Token",
  "data": null
}
```

### 配置说明

环境变量：
- `JWT_SECRET` - JWT签名密钥（默认：'your-secret-key-change-in-production'）
- `JWT_EXPIRES_IN` - Token过期时间（默认：'7d'）

### API方法

```javascript
// 生成Token
const token = generateToken({ userId, username }, { expiresIn: '1h' })

// 验证Token
const decoded = verifyToken(token)

// 刷新Token
const newToken = refreshToken(oldToken, { extraData: 'value' })
```

---

## 🛡️ 2. 权限验证中间件 (checkPermission.js)

### 功能说明

根据用户的角色和权限，验证用户是否有权限访问特定资源。

### 使用方式

```javascript
const { requirePermission, requireAnyPermission, requireAllPermissions } = require('./middlewares/checkPermission')

// 单个权限验证
router.post('/users', authMiddleware(), requirePermission('user:create'), controller.create)

// 任一权限验证
router.get('/reports', authMiddleware(), requireAnyPermission(['report:read', 'admin:read']), controller.getReports)

// 所有权限验证
router.delete('/critical', authMiddleware(), requireAllPermissions(['admin:delete', 'security:approve']), controller.deleteCritical)
```

### 工作流程

1. 从 `ctx.state.userId` 获取用户ID（需要先经过认证中间件）
2. 查询用户拥有的所有权限
3. 根据验证类型检查权限
4. 权限不足返回403，通过则继续执行

### 验证类型

#### single - 单个权限验证

```javascript
requirePermission('user:create')
```

用户必须拥有 `user:create` 权限。

#### any - 任一权限验证

```javascript
requireAnyPermission(['user:create', 'user:update'])
```

用户拥有 `user:create` 或 `user:update` 任一权限即可。

#### all - 所有权限验证

```javascript
requireAllPermissions(['user:create', 'user:delete'])
```

用户必须同时拥有 `user:create` 和 `user:delete` 权限。

### 错误响应

#### 未登录

```json
{
  "code": 401,
  "message": "未登录或登录已过期",
  "data": null
}
```

#### 权限不足（单个）

```json
{
  "code": 403,
  "message": "权限不足：需要 user:create 权限",
  "data": null
}
```

#### 权限不足（任一）

```json
{
  "code": 403,
  "message": "权限不足：需要以下任一权限 [user:create, user:update]",
  "data": null
}
```

#### 权限不足（所有）

```json
{
  "code": 403,
  "message": "权限不足：需要所有权限 [user:create, user:delete]",
  "data": null
}
```

#### 服务器错误

```json
{
  "code": 500,
  "message": "权限验证失败",
  "data": null
}
```

### 便捷方法

```javascript
// 单个权限
requirePermission('permission:code')

// 任一权限
requireAnyPermission(['code1', 'code2'])

// 所有权限
requireAllPermissions(['code1', 'code2'])
```

---

## ⏱️ 3. 速率限制中间件 (rateLimit.js)

### 功能说明

防止接口被频繁调用，保护系统免受暴力破解、DDoS等攻击。

### 使用方式

```javascript
const { loginRateLimit, registerRateLimit, apiRateLimit, rateLimit } = require('./middlewares/rateLimit')

// 登录接口（每分钟最多5次）
router.post('/login', loginRateLimit(), controller.login)

// 注册接口（每分钟最多3次）
router.post('/register', registerRateLimit(), controller.register)

// 通用API（每分钟最多60次）
router.get('/api/data', apiRateLimit(), controller.getData)

// 自定义速率限制
router.post('/custom', rateLimit({
  windowMs: 60 * 1000,      // 1分钟
  maxRequests: 10,          // 最多10次
  keyGenerator: (ctx) => ctx.ip,
  message: () => '请求过于频繁'
}), controller.custom)
```

### 工作流程

1. 根据keyGenerator生成唯一键（默认使用IP）
2. 检查该键的请求记录
3. 如果记录不存在或已过期，创建新记录
4. 增加请求计数
5. 如果超过限制，返回429
6. 设置响应头（X-RateLimit-*）
7. 继续执行后续中间件

### 预设中间件

#### loginRateLimit() - 登录速率限制

- **时间窗口**：1分钟
- **最大请求数**：5次
- **键生成器**：`login:${ip}`
- **错误消息**：'登录尝试次数过多，请稍后再试'

#### registerRateLimit() - 注册速率限制

- **时间窗口**：1分钟
- **最大请求数**：3次
- **键生成器**：`register:${ip}`
- **错误消息**：'注册尝试次数过多，请稍后再试'

#### apiRateLimit() - 通用API速率限制

- **时间窗口**：1分钟
- **最大请求数**：60次
- **键生成器**：`api:${ip}`
- **错误消息**：'API 调用过于频繁，请稍后再试'

### 自定义配置

```javascript
rateLimit({
  windowMs: 60 * 1000,        // 时间窗口（毫秒）
  maxRequests: 5,             // 最大请求次数
  keyGenerator: (ctx) => ctx.ip,  // 键生成函数
  message: (remaining, resetTime) => `请求过于频繁，请在 ${Math.ceil((resetTime - Date.now()) / 1000)} 秒后重试`
})
```

### 响应头

速率限制中间件会在响应中添加以下头部：

- `X-RateLimit-Limit` - 最大请求次数
- `X-RateLimit-Remaining` - 剩余请求次数
- `X-RateLimit-Reset` - 重置时间戳（Unix时间）

### 错误响应

#### 请求过于频繁

```json
{
  "code": 429,
  "message": "登录尝试次数过多，请稍后再试",
  "data": null
}
```

### 存储机制

当前使用内存存储（Map），适用于单实例部署。

**生产环境建议**：
- 使用Redis存储速率限制数据
- 支持多实例共享状态
- 持久化存储，重启不丢失

示例（Redis实现）：

```javascript
const Redis = require('ioredis')
const redis = new Redis()

async function getRecord(key) {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

async function setRecord(key, record, ttl) {
  await redis.setex(key, ttl, JSON.stringify(record))
}
```

### 清理机制

每5分钟自动清理过期的速率限制记录，防止内存泄漏。

---

## 📊 统一错误返回格式

所有中间件都遵循统一的错误返回格式：

### 401 - 未授权

```json
{
  "code": 401,
  "message": "错误描述",
  "data": null
}
```

**触发场景**：
- 缺少认证令牌
- Token格式无效
- Token已过期
- Token签名无效
- 未登录

### 403 - 禁止访问

```json
{
  "code": 403,
  "message": "错误描述",
  "data": null
}
```

**触发场景**：
- 权限不足
- 没有所需权限
- 角色无权访问

### 429 - 请求过于频繁

```json
{
  "code": 429,
  "message": "错误描述",
  "data": null
}
```

**触发场景**：
- 登录尝试次数过多
- 注册尝试次数过多
- API调用频率超限

---

## 🔧 在app.js中引入中间件

中间件已经在各个模块的路由中按需引入和使用，无需在app.js中全局注册。

### 使用示例

```javascript
// koa2/src/modules/user/routes.js
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')
const { loginRateLimit, registerRateLimit } = require('../../middlewares/rateLimit')

// 登录接口 - 应用速率限制
router.post('/login', loginRateLimit(), userController.login)

// 注册接口 - 应用速率限制
router.post('/register', registerRateLimit(), userController.register)

// 获取用户列表 - 需要认证和权限
router.get('/', authMiddleware(), requirePermission('user:read'), userController.listUsers)

// 创建用户 - 需要认证和权限
router.post('/', authMiddleware(), requirePermission('user:create'), userController.createUser)
```

### 中间件执行顺序

```
请求 → 速率限制 → 认证 → 权限验证 → 控制器
```

**示例**：

```javascript
router.post('/users', 
  loginRateLimit(),           // 1. 速率限制
  authMiddleware(),           // 2. 认证
  requirePermission('user:create'),  // 3. 权限验证
  userController.createUser   // 4. 控制器
)
```

---

## 🎯 最佳实践

### 1. 登录接口防护

```javascript
//  always apply rate limit to login endpoint
router.post('/login', loginRateLimit(), userController.login)
```

### 2. 敏感操作权限控制

```javascript
// 删除操作需要更高权限
router.delete('/users/:id', 
  authMiddleware(), 
  requirePermission('user:delete'), 
  userController.deleteUser
)
```

### 3. 公开接口不需要认证

```javascript
// 注册接口不需要认证，但需要速率限制
router.post('/register', registerRateLimit(), userController.register)
```

### 4. 组合使用中间件

```javascript
// 管理接口：认证 + 权限 + 速率限制
router.get('/admin/users',
  apiRateLimit(),              // 防止滥用
  authMiddleware(),            // 验证身份
  requirePermission('user:read'),  // 验证权限
  adminController.listUsers
)
```

### 5. 前端处理429错误

```javascript
// Vue 3 示例
async function handleLogin(username, password) {
  try {
    const response = await fetch('/nodeapi/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    if (response.status === 429) {
      const data = await response.json()
      message.error(data.message)
      
      // 显示倒计时
      const resetTime = response.headers.get('X-RateLimit-Reset')
      const remaining = Math.ceil(resetTime - Date.now() / 1000)
      startCountdown(remaining)
      return
    }
    
    // 处理其他响应...
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

### 6. 生产环境配置

```javascript
// .env.production
JWT_SECRET=your-super-secret-key-here-change-this
JWT_EXPIRES_IN=7d

// 使用Redis存储速率限制
REDIS_URL=redis://localhost:6379
```

---

## 🧪 测试示例

### cURL测试

#### 1. 测试认证中间件

```bash
# 无Token
curl -X GET "http://localhost:3000/nodeapi/users/me"

# 预期响应：
# {"code":401,"message":"缺少认证令牌","data":null}

# 无效Token
curl -X GET "http://localhost:3000/nodeapi/users/me" \
  -H "Authorization: Bearer invalid_token"

# 预期响应：
# {"code":401,"message":"无效的 Token","data":null}

# 有效Token
curl -X GET "http://localhost:3000/nodeapi/users/me" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
```

#### 2. 测试权限中间件

```bash
# 权限不足
curl -X DELETE "http://localhost:3000/nodeapi/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 预期响应（如果没有user:delete权限）：
# {"code":403,"message":"权限不足：需要 user:delete 权限","data":null}
```

#### 3. 测试速率限制

```bash
# 快速连续发送5次以上登录请求
for i in {1..6}; do
  curl -X POST "http://localhost:3000/nodeapi/users/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done

# 第6次请求预期响应：
# {"code":429,"message":"登录尝试次数过多，请稍后再试","data":null}
```

---

## 📚 相关文档

- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [用户管理API](./USER_MANAGEMENT_API.md)
- [角色管理API](./ROLE_MANAGEMENT_API.md)
- [权限菜单管理API](./PERMISSION_MENU_API.md)

---

## 🎉 总结

鉴权中间件提供了完整的安全防护体系：

✅ **认证中间件**：验证用户身份，保护私有接口  
✅ **权限中间件**：细粒度权限控制，支持多种验证策略  
✅ **速率限制**：防止暴力破解、DDoS攻击  
✅ **统一格式**：所有错误返回格式一致  
✅ **易于使用**：简洁的API，灵活的配置  

**关键特性**：
- ✅ 401/403/429错误码规范
- ✅ 统一的JSON响应格式
- ✅ 灵活的权限验证策略
- ✅ 可配置的速率限制
- ✅ 响应头支持（X-RateLimit-*）
- ✅ 自动清理过期记录

**下一步**：
1. 确保所有敏感接口都应用了认证中间件
2. 为管理接口添加权限验证
3. 为登录/注册接口添加速率限制
4. 生产环境使用Redis存储速率限制数据
5. 定期监控和分析速率限制日志

所有中间件已经完成，可以直接使用！🚀
