# JWT 认证中间件 - 完整实现指南

## 📦 已完成的文件

### 1. JWT 认证中间件
**文件：** `middlewares/auth.middleware.js` ✅

**功能：**
- `generateToken(payload, options)` - 生成 JWT Token
- `verifyToken(token)` - 验证 JWT Token
- `authMiddleware()` - JWT 认证中间件（必需认证）
- `optionalAuth()` - 可选认证中间件
- `refreshToken(oldToken, extraPayload)` - 刷新 Token

### 2. 配置文件更新
**文件：** `config/index.js` ✅

**新增配置：**
```javascript
jwt: {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}
```

### 3. User Service 集成
**文件：** `services/userService.js` ✅

**更新内容：**
- 登录成功后自动生成 JWT Token
- Token 包含 `userId` 和 `username`
- Token 随登录响应返回给前端

### 4. User Controller 更新
**文件：** `modules/user/controller.js` ✅

**新增接口：**
- `GET /koa2api/users/me` - 获取当前用户信息（需要认证）

### 5. Routes 更新
**文件：** 
- `modules/user/routes.js` ✅
- `modules/role/routes.js` ✅
- `modules/permission/routes.js` ✅

**更新内容：**
- 所有管理接口添加 `authMiddleware()` 保护
- 保留公开接口：`/register` 和 `/login`

### 6. 依赖更新
**文件：** `package.json` ✅

**新增依赖：**
```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2"
}
```

## 🔧 安装依赖

```bash
cd koa2
npm install
```

## ⚙️ 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# JWT 配置（生产环境务必修改！）
JWT_SECRET=your-super-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d
```

**安全建议：**
- 生产环境使用至少 32 位随机字符串作为 `JWT_SECRET`
- 可以使用在线工具生成：`openssl rand -hex 32`
- 不要将密钥提交到版本控制系统

## 📋 API 接口说明

### 公开接口（无需认证）

#### 1. 用户注册
```http
POST /koa2api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "用户创建成功",
  "data": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

#### 2. 用户登录
```http
POST /koa2api/users/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "roles": ["user"],
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 受保护接口（需要认证）

#### 3. 获取当前用户信息
```http
GET /koa2api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "status": "active",
    "last_login_at": "2026-04-29T10:00:00.000Z",
    "created_at": "2026-04-29T09:00:00.000Z",
    "updated_at": "2026-04-29T10:00:00.000Z",
    "roles": [
      {
        "id": "uuid",
        "name": "user",
        "display_name": "普通用户",
        "description": "基本使用权限"
      }
    ]
  }
}
```

#### 4. 获取用户列表
```http
GET /koa2api/users?page=1&limit=20&keyword=test
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**权限要求：** `user:read`

#### 5. 其他 RBAC 接口
所有角色管理和权限管理接口都需要认证 + 相应权限。

## 🔐 认证流程

### 前端调用示例

```javascript
// 1. 用户登录
const loginResponse = await fetch('/koa2api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123',
  }),
})

const { data } = await loginResponse.json()
const token = data.token

// 2. 存储 Token（localStorage 或 Pinia）
localStorage.setItem('token', token)

// 3. 后续请求携带 Token
const userResponse = await fetch('/koa2api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})

const userData = await userResponse.json()
```

### Vue 3 + Axios 拦截器示例

```javascript
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'

const apiClient = axios.create({
  baseURL: '/koa2api',
})

// 请求拦截器：自动添加 Token
apiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// 响应拦截器：处理 Token 过期
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，跳转到登录页
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

## 🛡️ 安全最佳实践

### 1. Token 存储
- **推荐：** HttpOnly Cookie（防止 XSS 攻击）
- **备选：** localStorage（需注意 XSS 防护）
- **避免：** sessionStorage（页面关闭后丢失）

### 2. Token 刷新策略
```javascript
// 方案 1：滑动过期（每次请求刷新 Token）
// 方案 2：双 Token 机制（Access Token + Refresh Token）
// 方案 3：定期刷新（Token 过期前 5 分钟主动刷新）
```

### 3. 密码安全
- ✅ 使用 bcrypt 加密（已实现）
- ✅ 盐值轮数：10（默认）
- ❌ 禁止明文存储
- ❌ 禁止使用 MD5/SHA1

### 4. HTTPS
- 生产环境必须使用 HTTPS
- 防止 Token 被中间人窃取

### 5. CORS 配置
确保后端正确配置 CORS：
```javascript
const cors = require('@koa/cors')
app.use(cors({
  origin: ['https://your-frontend.com'],
  credentials: true,
}))
```

## 🔍 调试技巧

### 1. 查看 Token 内容
访问 https://jwt.io 粘贴 Token 查看 payload

### 2. 测试认证
```bash
# 登录获取 Token
curl -X POST http://localhost:8000/koa2api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 Token 访问受保护接口
curl http://localhost:8000/koa2api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. 日志输出
中间件会自动记录认证失败原因：
```
⚠️ 可选认证失败: Token 已过期
❌ 认证失败: 无效的 Token
```

## ⚠️ 常见问题

### Q1: Token 过期怎么办？
**A:** 前端捕获 401 错误，引导用户重新登录或刷新 Token。

### Q2: 如何注销用户？
**A:** 前端删除本地 Token，后端无需额外操作（Token 无状态）。

### Q3: 如何强制用户下线？
**A:** 
- 方案 1：维护黑名单（Redis）
- 方案 2：修改用户状态为 `inactive`
- 方案 3：更改 JWT_SECRET（影响所有用户）

### Q4: 如何实现记住我功能？
**A:** 设置不同的过期时间：
```javascript
const expiresIn = rememberMe ? '30d' : '1d'
const token = generateToken(payload, { expiresIn })
```

### Q5: 多设备登录如何处理？
**A:** JWT 是无状态的，天然支持多设备登录。如需限制，需额外实现会话管理。

## 📊 性能优化建议

### 1. Token 缓存
```javascript
// 前端：缓存 Token 验证结果
const cache = new Map()

async function verifyTokenWithCache(token) {
  if (cache.has(token)) {
    return cache.get(token)
  }
  
  const result = await verifyToken(token)
  cache.set(token, result)
  
  // 5 分钟后清除缓存
  setTimeout(() => cache.delete(token), 5 * 60 * 1000)
  
  return result
}
```

### 2. Redis 黑名单
```javascript
// 注销时将 Token 加入黑名单
await redis.setex(`blacklist:${token}`, remainingTime, '1')

// 验证时检查黑名单
const isBlacklisted = await redis.exists(`blacklist:${token}`)
if (isBlacklisted) throw new Error('Token 已失效')
```

### 3. 数据库索引
确保 `users` 表的 `id` 字段有索引（PostgreSQL 主键自动索引）。

## 🚀 下一步工作

1. **前端集成**
   - 在 Pinia Store 中管理 Token
   - 实现路由守卫
   - 添加 Token 刷新逻辑

2. **增强功能**
   - 实现 Refresh Token 机制
   - 添加 Token 黑名单（Redis）
   - 实现单点登录（SSO）

3. **安全加固**
   - 启用 HTTPS
   - 配置 CSP 头
   - 实施速率限制

4. **监控与日志**
   - 记录登录/登出事件
   - 监控异常登录行为
   - 审计敏感操作

## 📝 总结

JWT 认证中间件已完整实现，包括：
- ✅ Token 生成和验证
- ✅ 认证中间件（必需/可选）
- ✅ 与 User Service 集成
- ✅ 所有 RBAC 接口保护
- ✅ 完整的文档和示例

现在可以启动服务进行测试！
