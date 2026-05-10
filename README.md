# 🤖 AI Agent 平台

基于 Vue 3 + Vite + Naive UI + Pinia 构建的现代化 AI 对话平台前端项目。

---

## ✨ 核心功能

- 🗨️ **AI 智能对话** - 支持流式 SSE 通信，逐字打字机效果
- 📝 **消息管理** - 实时消息列表，自动滚动，空状态提示
- 🎨 **响应式布局** - 侧边栏折叠/展开，适配不同屏幕
- 🔐 **用户管理** - 登录认证，用户信息状态管理
- ⚡ **高性能构建** - Vite 极速开发体验，按需加载

---

## 📁 项目目录结构

---

## 📦 核心模块

### 1. API 接口层 (`src/api/`)

| 文件      | 说明         | 用途                                                         |
| --------- | ------------ | ------------------------------------------------------------ |
| `chat.js` | 聊天接口模块 | 提供 `createChatStream()` 创建流式聊天控制器，支持打字机效果 |

**核心功能：**

- ✅ 流式 SSE 通信（支持逐字显示）
- ✅ 空数据过滤（自动过滤 `{"content":""}`）
- ✅ 错误处理与中断机制

---

### 2. 布局组件 (`src/components/Layout/`)

| 组件               | 说明                                          |
| ------------------ | --------------------------------------------- |
| `Layout/index.vue` | 主布局容器（侧边栏 + 头部 + 内容区）          |
| `Sidebar/`         | 侧边栏（Logo + 菜单）                         |
| `Header/`          | 顶部栏（折叠按钮 + 面包屑 + 通知 + 用户菜单） |

---

### 3. 工具库 (`src/utils/`)

| 文件/目录      | 说明                                  |
| -------------- | ------------------------------------- |
| `constants.js` | 全局配置（`BASE_URL`、`CHAT_CONFIG`） |
| `sse/index.js` | SSE 流式通信核心实现                  |

**SSE 模块功能：**

- 🔹 `fetchSSE()` - 发起 SSE 请求
- 🔹 `typewriterEffect()` - 打字机逐字显示效果
- 🔹 `generateId()` - 生成唯一消息 ID
- 🔹 `scrollToBottom()` - 自动滚动到底部
- 🔹 `createSSEController()` - 创建 SSE 控制器（支持中断）

---

### 4. AI 对话模块 (`src/views/chat/`)

| 组件                  | 说明                                     |
| --------------------- | ---------------------------------------- |
| `index.vue`           | 聊天主页面（消息列表 + 输入框）          |
| `ChatMessageList.vue` | 消息列表容器（支持自动滚动、空状态提示） |
| `ChatMessage.vue`     | 单条消息组件（用户/AI 样式区分）         |
| `ChatInput.vue`       | 输入框组件（支持 Enter 发送、停止生成）  |

**聊天流程：**

```js
用户输入消息 → 添加到消息列表
↓ 创建 AI 占位消息（isStreaming: true）
↓ 调用 createChatStream() 发起流式请求
↓ 接收数据块 → 逐字追加到 AI 消息
↓ 完成后标记 isStreaming: false
```

---

### 5. 状态管理 (`src/stores/modules/`)

| Store     | 说明                             |
| --------- | -------------------------------- |
| `app.js`  | 应用状态（侧边栏折叠状态、主题） |
| `menu.js` | 菜单配置（路由名称、图标、标题） |
| `user.js` | 用户信息（用户名、头像、Token）  |

---

## 🔧 技术栈

| 分类             | 技术                       | 版本   |
| ---------------- | -------------------------- | ------ |
| **核心框架**     | Vue 3                      | 3.5+   |
| **构建工具**     | Vite                       | 8.0+   |
| **UI 组件库**    | Naive UI                   | 2.44+  |
| **状态管理**     | Pinia                      | 3.0+   |
| **路由管理**     | Vue Router                 | 5.0+   |
| **代码规范**     | ESLint + Prettier + Oxlint | 最新版 |
| **组件自动引入** | unplugin-vue-components    | 32.0+  |

---

## 📝 开发规范

### 代码风格

- ✅ 使用 `<script setup>` 语法
- ✅ 组件命名使用 `PascalCase`（如 `ChatMessageList`）
- ✅ 工具函数使用 `camelCase`（如 `generateId`）
- ✅ 数据库字段使用 `snake_case`（如 `menu_name`）
- ✅ 前后端统一使用 `snake_case` 命名，无需中间件转换
- ✅ 常量使用 `UPPER_SNAKE_CASE`（如 `BASE_URL`）

### 文件组织

- 📁 页面相关组件放在对应页面的 `components/` 目录下
- 📁 全局公共组件放在 `src/components/` 下
- 📁 API 接口按模块拆分在 `src/api/` 下

### Git 提交规范

## bash feat: 新增功能 fix: 修复 bug docs: 文档更新 style: 代码格式调整 refactor: 代码重构 test: 测试相关 chore: 构建/工具链相关

## ⚙️ 配置说明

### 环境变量

| 变量                | 说明         | 默认值                  |
| ------------------- | ------------ | ----------------------- |
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:8000` |

### 聊天配置 (`src/utils/constants.js`)

---

## ❓ 常见问题

**Q: 如何修改打字机速度？**

> A: 修改 `src/utils/constants.js` 中的 `TYPEWRITER_DELAY` 值即可全局生效。

**Q: 如何关闭打字机效果？**

> A: 将 `CHAT_CONFIG.TYPEWRITER_ENABLED` 设置为 `false`。

**Q: 侧边栏图标不显示？**

> A: 检查是否使用了内联 SVG，确保 `stroke="currentColor"` 属性存在。

---

## 📄 许可证

MIT License

---

> 💡 **提示**：如有问题请提 Issue 或联系项目维护者。
