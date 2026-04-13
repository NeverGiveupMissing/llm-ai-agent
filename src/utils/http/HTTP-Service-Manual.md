# http.js文档说明

## 环境配置

```js
# .env.development
VITE_API_BASE_URL=http://localhost:8000

# .env.production
VITE_API_BASE_URL=https://your-python-backend.com
```

## API 使用示例

GET 请求

```js
import http from '@/services/http'

// 基础 GET
const users = await http.get('/api/users')

// 带查询参数
const users = await http.get('/api/users', { page: 1, size: 10 })
// 实际请求: /api/users?page=1&size=10

// 带自定义 headers
const users = await http.get(
  '/api/users',
  {},
  {
    headers: { 'X-Custom-Header': 'value' },
  },
)
```

POST 请求

```js
const newUser = await http.post('/api/users', {
  name: '张三',
  email: 'zhangsan@example.com',
})

// 带超时配置
const result = await http.post('/api/chat', { message: '你好' }, { timeout: 60000 })
```

PUT 请求

```js
const updated = await http.put('/api/users/1', {
  name: '李四',
  email: 'lisi@example.com',
})
```

DELETE 请求

```js
await http.delete('/api/users/1')
```

## 文件上传

```js
// 单文件上传
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('type', 'avatar')

const result = await http.upload('/api/upload', formData)

// 多文件上传
const formData = new FormData()
const files = fileInput.files
for (let i = 0; i < files.length; i++) {
  formData.append('files', files[i])
}
const result = await http.upload('/api/uploads', formData)
```

## AI 流式对话

```js
import { ref } from 'vue'
import http from '@/services/http'

const response = ref('')
const loading = ref(false)
let abortController = null

const sendMessage = async () => {
  loading.value = true
  response.value = ''

  abortController = new AbortController()

  await http.stream(
    '/api/chat',
    {
      messages: [{ role: 'user', content: '你好' }],
      stream: true,
    },
    {
      onChunk: (chunk) => {
        response.value += chunk
      },
      onDone: () => {
        loading.value = false
        console.log('对话完成')
      },
      onError: (err) => {
        console.error('流式请求错误:', err)
        loading.value = false
      },
    },
    abortController.signal,
  )
}

// 中止生成
const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
    loading.value = false
  }
}
```

## 自动处理的错误类型

```js
错误类型	触发条件	自动处理
401 未授权	后端返回 401	清除 token，跳转登录页
超时错误	超过 30 秒	抛出 请求超时 (30000ms): /api/xxx
网络错误	无法连接后端	抛出 网络连接失败，请检查网络或后端服务是否启动
HTTP 错误	4xx / 5xx	抛出包含状态码和错误信息的 Error
```

## 手动捕获错误

```js
try {
  const data = await http.get('/api/users')
} catch (error) {
  console.error(error.message)

  if (error.message.includes('401')) {
    // 已自动跳转，无需额外处理
  } else if (error.message.includes('超时')) {
    alert('请求超时，请重试')
  } else if (error.message.includes('网络连接失败')) {
    alert('请检查网络连接')
  } else {
    alert('请求失败：' + error.message)
  }
}
```

## API 方法速查表

```js
| 方法 | 说明 | 参数 | 返回值 |
|:---|:---|:---|:---|
| `http.get(url, params, options)` | GET 请求 | **url**: 请求路径<br>**params**: URL 查询参数对象<br>**options**: 额外 fetch 配置 | `Promise<any>` |
| `http.post(url, data, options)` | POST 请求 | **url**: 请求路径<br>**data**: 请求体对象<br>**options**: 额外 fetch 配置 | `Promise<any>` |
| `http.put(url, data, options)` | PUT 请求 | **url**: 请求路径<br>**data**: 请求体对象<br>**options**: 额外 fetch 配置 | `Promise<any>` |
| `http.delete(url, options)` | DELETE 请求 | **url**: 请求路径<br>**options**: 额外 fetch 配置 | `Promise<any>` |
| `http.upload(url, formData, options)` | 文件上传 | **url**: 上传接口地址<br>**formData**: FormData 对象<br>**options**: 额外 fetch 配置 | `Promise<any>` |
| `http.stream(url, data, callbacks, signal)` | AI 流式对话 | **url**: 请求路径<br>**data**: 请求体对象<br>**callbacks**: `{ onChunk, onDone, onError }`<br>**signal**: AbortSignal | `Promise<void>` |

// ## 示例
// GET 请求
http.get('/users', { page: 1 })

// POST 请求
http.post('/users', { name: '张三' })

// PUT 请求
http.put('/users/1', { name: '李四' })

// DELETE 请求
http.delete('/users/1')

// 文件上传
http.upload('/upload', formData)

// AI 流式对话（见上方示例）
```

## callbacks 回调说明

```js
回调	类型	参数	触发时机
onChunk	(chunk: string) => void	接收到的数据块	每次收到数据块时
onDone	() => void	无	流式传输完成时
onError	(error: Error) => void	错误对象	发生错误时
```

## 配置项速查表

```js
BASE_URL	http.js 顶部	http://localhost:8000	API 基础地址，可通过环境变量覆盖
DEFAULT_TIMEOUT	http.js 顶部	30000 (30秒)	默认超时时间（毫秒）
credentials	defaultOptions	'include'	是否携带 cookie
Content-Type	defaultOptions.headers	'application/json'	默认请求头
```

## 常见问题

```js
## 常见问题

### Q1: 如何修改基础 URL？

在项目根目录的 `.env` 文件中修改 `VITE_API_BASE_URL` 环境变量。

---

### Q2: 如何添加全局 Loading？

可以在 `requestInterceptor` 中添加全局计数器，或在组件中单独控制（参考第八章扩展配置）。

---

### Q3: 流式响应后端返回的不是 SSE 格式怎么办？

`stream` 方法已做兼容：

| 格式 | 处理方式 |
|:---|:---|
| `data: xxx\n\n` | 按 SSE 解析 |
| 普通文本 | 直接输出 |

---

### Q4: 如何携带 cookie？

默认已开启 `credentials: 'include'`，如不需要可修改 `defaultOptions` 中的配置。

---

### Q5: 文件上传进度如何监听？

原生 fetch 不支持上传进度，如需进度条建议使用 axios。

---

### Q6: 如何处理 Token 刷新？
if (response.status === 401) {
  try {
    await refreshToken()
    // 重新发起原请求
    return request(url, options)
  } catch (e) {
    // 刷新失败，跳转登录
    window.location.href = '/login'
  }
}
### @7: 如何取消正在进行的请求？
    可以在 `responseInterceptor` 中捕获 401，然后调用刷新 token 接口，重新发起原请求。

```

### Fetch 核心字段详解 request.defaultOptions

```js
### 一、这三个字段是做什么的？

| 字段 | 可选值 | 作用 |
|:---|:---|:---|
| `redirect` | `'follow'`（默认）、`'error'`、`'manual'` | 控制重定向行为。`follow` 自动跟随重定向，`error` 遇到重定向时报错，`manual` 手动处理 |
| `mode` | `'cors'`（默认）、`'no-cors'`、`'same-origin'` | 控制跨域请求策略。`cors` 允许跨域（需后端配合），`no-cors` 限制响应类型，`same-origin` 仅允许同源 |
| `credentials` | `'same-origin'`（默认）、`'include'`、`'omit'` | 控制是否携带 cookie。`include` 跨域也携带，`same-origin` 仅同源携带，`omit` 不携带 |

---

### 二、为什么我的封装没有显式设置它们？

#### 1. `redirect` - 默认值 `'follow'` 已经满足绝大多数需求

- 大多数 API 请求不需要特殊处理重定向
- 如果你需要拦截 302 并手动处理（如 OAuth 登录跳转），才需要设置 `redirect: 'manual'`

&gt; **建议**：保持默认，不写就是 `follow`，够用了。

#### 2. `mode` - 默认值 `'cors'` 就是最常用的

- 现代 Web 应用基本都是跨域请求（前端 `localhost:5173`，后端 `localhost:8000`），需要 CORS
- `'cors'` 是默认值，不写就是它。除非你遇到特殊场景（如请求不支持的 `no-cors`），否则不需要改

&gt; **建议**：保持默认，不写。

#### 3. `credentials` - 我显式写了 `'include'`，这是关键

- 默认值是 `'same-origin'`，意味着不同域不会携带 cookie
- 对于前后端分离的项目（前端 `localhost:5173`，后端 `localhost:8000`），如果你需要携带 cookie 做 session 认证，必须设置 `credentials: 'include'`

&gt; 所以我显式写出来了，因为这是唯一一个**默认值不满足常见需求**的字段。

---

### 三、什么情况下需要显式设置这些字段？

| 场景 | 需要的配置 |
|:---|:---|
| 跨域请求需要携带 cookie（最常见） | `credentials: 'include'`（已写） |
| 需要手动处理 302 重定向（如 OAuth 登录） | `redirect: 'manual'` |
| 请求一个不支持 CORS 的旧接口，只需要发请求不关心响应 | `mode: 'no-cors'` |
| 安全性要求高，禁止跨域请求 | `mode: 'same-origin'` |
| 明确不希望携带 cookie（如公共 API） | `credentials: 'omit'` |
```

### 完整 AI 对话组件示例

<template>
  <div class="chat-container">
    <!-- 消息列表 -->
    <div class="messages">
      <div 
        v-for="(msg, idx) in messages" 
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="content">{{ msg.content }}</div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="message assistant">
        <div class="thinking">🤔 正在思考...</div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <textarea 
        v-model="inputText"
        placeholder="输入你的问题... (Ctrl+Enter 发送)"
        @keyup.ctrl.enter="sendMessage"
      ></textarea>
      
      <div class="actions">
        <button @click="sendMessage" :disabled="loading">
          {{ loading ? '发送中...' : '发送' }}
        </button>
        <button v-if="loading" @click="stopMessage">停止</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import http from '@/services/http'

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
let abortController = null

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: inputText.value
  })
  
  const userMessage = inputText.value
  inputText.value = ''
  loading.value = true
  
  // 创建 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })
  
  abortController = new AbortController()
  
  await http.stream('/api/chat',
    {
      messages: [
        ...messages.value.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ],
      stream: true
    },
    {
      onChunk: (chunk) => {
        messages.value[aiMessageIndex].content += chunk
      },
      onDone: () => {
        loading.value = false
        abortController = null
      },
      onError: (err) => {
        console.error(err)
        messages.value[aiMessageIndex].content = '错误：' + err.message
        loading.value = false
      }
    },
    abortController.signal
  )
}

const stopMessage = () => {
  if (abortController) {
    abortController.abort()
    loading.value = false
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 80%;
}

.message.user {
  background-color: #1890ff;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background-color: #f5f5f5;
  color: #333;
  margin-right: auto;
}

.thinking {
  color: #999;
  font-style: italic;
}

.input-area {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.input-area textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.actions button:first-child {
  background-color: #1890ff;
  color: white;
}

.actions button:first-child:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.actions button:last-child {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}
</style>

### HTTP 服务
