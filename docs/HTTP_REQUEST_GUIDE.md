# HTTP 请求方式使用指南

## 概述

项目现在支持三种 HTTP 请求方式：

- **基础请求 (base)**: 企业标准，基于 axios，支持拦截器、取消请求等
- **Fetch 请求 (fetch)**: 轻量级，适合特殊场景
- **流式请求 (stream)**: 专门处理实时数据流

**重要变更**: 从 v2.0 开始，基础的 `get`, `post`, `put`, `delete` 等方法默认使用 axios，提供企业级功能支持。

## 语义化分组导入

### 推荐的导入方式

```javascript
import http from '@/utils/http'

// 按功能分组使用
const { base, fetch, stream, utils, advanced } = http
```

### 场景化使用

#### 1. 企业标准请求（推荐 base）

```javascript
import { base } from '@/utils/http'

// 用户管理（自动享有拦截器、错误处理等企业级功能）
const users = await base.get('/api/users')
const newUser = await base.post('/api/users', { name: 'John' })
const updatedUser = await base.put('/api/users/123', { name: 'Jane' })
await base.delete('/api/users/123')

// 文件上传
const formData = new FormData()
formData.append('file', file)
const result = await base.upload('/api/upload', formData)
```

#### 2. 轻量级请求（推荐 fetch）

```javascript
import { fetch } from '@/utils/http'

// 纯 fetch 请求，适合特殊场景
const config = await fetch.get('/api/config')
const result = await fetch.post('/api/log', { action: 'click' })
```

#### 3. 流式数据接收（推荐 stream）

```javascript
import { stream } from '@/utils/http'

// Server-Sent Events
const eventSource = stream.sse({
  url: '/api/chat/stream',
  data: { sessionId },
  callbacks: {
    onMessage: (data) => console.log('收到消息:', data),
    onComplete: () => console.log('流结束'),
    onError: (error) => console.error('错误:', error),
  },
})

// 控制器管理
const controller = stream.controller()
controller.abort() // 中断流
```

#### 4. 高级功能

```javascript
import { advanced } from '@/utils/http'

// 智能选择请求方式
const { methods } = advanced.selectRequestMethod('api')
await methods.post('/api/users', data)

// 便捷场景请求
await advanced.smartRequest.api.post('/api/users', data)
await advanced.smartRequest.upload('/api/files', formData)
```

## API 层设计

### 统一接口设计

所有 API 函数现在直接返回 Promise，无需额外处理：

```javascript
// 新的 API 设计（推荐）
import { login, getCurrentUser } from '@/api/auth'
const result = await login({ username, password })
const user = await getCurrentUser()

// 旧的 API 设计（已废弃）
// const config = sendChatMessage(params)
// const result = await post(config.url, config.data)
```

### API 文件结构

```
src/api/
├── auth.js          # 用户认证
├── chat.js          # 聊天功能
├── session.js       # 会话管理
├── memory.js        # 记忆管理
├── permission.js    # 权限管理
└── user.js          # 用户管理
```

## 场景推荐

| 场景     | 推荐分组 | 原因                   |
| -------- | -------- | ---------------------- |
| 用户认证 | base     | 企业标准，支持拦截器   |
| 数据查询 | base     | 企业标准，支持取消请求 |
| 文件上传 | base     | 支持 FormData 和进度   |
| 实时聊天 | stream   | SSE 流式传输           |
| 轻量日志 | fetch    | 无额外开销             |
| 复杂业务 | base     | 完整企业级功能         |

## 向后兼容

## 现有代码迁移

**重要变更**: 从 v2.0 开始，原有的 `get`, `post`, `put`, `delete` 方法现在默认基于 axios，提供企业级功能。

### 原有单个方法导入（不推荐）

```javascript
// 仍然可用，但现在基于 axios（企业级功能）
import { get, post } from '@/utils/http'
const users = await get('/api/users') // 现在支持拦截器、取消请求等
```

### 推荐的分组方式（新标准）

```javascript
// 企业标准方式
import { base } from '@/utils/http'
const users = await base.get('/api/users')
const newUser = await base.post('/api/users', data)

// 轻量级方式（特殊场景）
import { fetch } from '@/utils/http'
const config = await fetch.get('/api/config')
```

## 最佳实践

1. **企业标准**: 大多数业务场景使用 `base`，享受完整的 axios 功能
2. **特殊场景**: 只有在明确需要轻量级请求时才使用 `fetch`
3. **统一导入**: 使用分组导入而不是单独方法导入
4. **错误处理**: 利用 axios 的拦截器统一处理错误
5. **类型安全**: 为 API 参数和返回值添加 TypeScript 类型定义

## 性能优化

- **base**: 企业标准，适合大多数业务场景
- **fetch**: 最轻量，适合高频简单请求或特殊需求
- **stream**: 专门优化流式数据，减少内存占用

## 手动选择请求方式

如果需要手动控制，可以使用请求选择器：

```javascript
import { advanced } from '@/utils/http'

// 智能选择请求方式
const { methods } = advanced.selectRequestMethod('api')
await methods.post('/api/users', data)

// 便捷场景请求
await advanced.smartRequest.api.post('/api/users', data)
await advanced.smartRequest.upload('/api/files', formData)
```

## 现有代码迁移

### 原有代码自动升级

```javascript
// 原来（基于 fetch）
import { get, post } from '@/utils/http'
const result = await get('/api/users')

// 现在（自动基于 axios，企业级功能）
const result = await get('/api/users') // 现在支持拦截器、取消请求等
```

### 需要轻量级请求的代码迁移

```javascript
// 如果确实需要纯 fetch
import { fetchGet, fetchPost } from '@/utils/http'
const result = await fetchGet('/api/config')

// 或者使用分组方式
import { fetch } from '@/utils/http'
const result = await fetch.get('/api/config')
```

### 智能选择器使用

```javascript
import { advanced } from '@/utils/http'
const result = await advanced.smartRequest.api.post('/api/users', data)
```

## 注意事项

1. **企业标准**: 基础请求现在默认使用 axios，提供完整的拦截器和错误处理
2. **向后兼容**: 原有代码无需修改，自动享有 axios 功能
3. **性能考虑**: 只有在明确需要轻量级请求时才使用 `fetch`
4. **流式请求**: SSE 仅用于实时数据流，如聊天、实时日志等
