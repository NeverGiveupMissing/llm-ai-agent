# AI Agent 平台前端项目文档

📁 项目目录结构
vite-vue3-NaïveUI-pinia-baseai/
├── .vscode/ # VS Code 配置
│ ├── extensions.json # 推荐插件列表
│ └── settings.json # 编辑器设置
├── public/ # 静态资源目录
│ └── favicon.ico # 网站图标
├── src/ # 源代码目录
│ ├── api/ # API 接口层
│ │ └── chat.js # 聊天相关接口（流式/非流式）
│ ├── assets/ # 静态资源
│ │ ├── base.css # 基础样式
│ │ ├── logo.svg # Logo 图标
│ │ └── main.css # 全局样式
│ ├── components/ # 公共组件
│ │ └── Layout/ # 布局组件
│ │ ├── Header/ # 头部组件
│ │ │ ├── UserDropdown.vue # 用户下拉菜单
│ │ │ └── index.vue # 头部主组件
│ │ ├── Sidebar/ # 侧边栏组件
│ │ │ ├── SidebarLogo.vue # Logo 区域
│ │ │ ├── SidebarMenu.vue # 菜单列表
│ │ │ └── index.vue # 侧边栏主组件
│ │ ├── Tabbar/ # 标签页组件（可选）
│ │ │ └── index.vue
│ │ └── index.vue # 布局主组件
│ ├── layouts/ # 页面布局
│ │ └── index.vue # 基础布局入口
│ ├── router/ # 路由配置
│ │ └── index.js # 路由定义
│ ├── stores/modules/ # Pinia 状态管理
│ │ ├── app.js # 应用全局状态（折叠/主题）
│ │ ├── menu.js # 菜单配置
│ │ └── user.js # 用户信息状态
│ ├── utils/ # 工具函数库
│ │ ├── constants.js # 全局常量配置（BASE_URL、CHAT_CONFIG）
│ │ └── sse/ # SSE 流式通信模块
│ │ └── index.js # SSE 核心实现（fetchSSE、打字机效果）
│ ├── views/ # 页面视图
│ │ ├── agent/ # 智能体页面
│ │ │ └── index.vue
│ │ ├── chat/ # AI 对话页面
│ │ │ ├── components/ # 聊天子组件
│ │ │ │ ├── ChatInput.vue # 输入框组件
│ │ │ │ ├── ChatMessage.vue # 单条消息组件
│ │ │ │ └── ChatMessageList.vue # 消息列表组件
│ │ │ └── index.vue # 聊天主页面
│ │ ├── dashboard/ # 工作台页面
│ │ │ └── index.vue
│ │ ├── knowledge/ # 知识库页面
│ │ │ └── index.vue
│ │ ├── login/ # 登录页面
│ │ │ └── index.vue
│ │ ├── settings/ # 系统设置页面
│ │ │ └── index.vue
│ │ └── tools/ # 工具页面
│ │ └── index.vue
│ ├── App.vue # 根组件
│ └── main.js # 应用入口
├── .editorconfig # 编辑器配置
├── .env.development # 开发环境变量
├── .env.production # 生产环境变量
├── .gitignore # Git 忽略配置
├── .oxlintrc.json # Oxlint 配置
├── .prettierrc.json # Prettier 配置
├── eslint.config.js # ESLint 配置
├── index.html # HTML 入口文件
├── jsconfig.json # JavaScript 配置（路径别名）
├── package.json # 项目依赖配置
├── vite.config.js # Vite 构建配置
└── README.md # 项目说明文档
📂 核心模块说明

1. src/api/ - API 接口层
   文件
   说明
   用途
   chat.js
   聊天接口模块
   提供 createChatStream() 创建流式聊天控制器，支持打字机效果
   核心功能：
   ✅ 流式 SSE 通信（支持逐字显示）
   ✅ 空数据过滤（自动过滤 {"content":""}）
   ✅ 错误处理与中断机制

2. src/components/Layout/ - 布局组件
   组件
   说明
   Layout/index.vue
   主布局容器（侧边栏 + 头部 + 内容区）
   Sidebar/
   侧边栏（Logo + 菜单）
   Header/
   顶部栏（折叠按钮 + 面包屑 + 通知 + 用户菜单）
   Tabbar/
   标签页导航（可选功能）

3. src/utils/ - 工具库
   文件/目录
   说明
   constants.js
   全局配置（BASE_URL、CHAT_CONFIG）
   sse/index.js
   SSE 流式通信核心实现
   SSE 模块功能：
   🔹 fetchSSE() - 发起 SSE 请求
   🔹 typewriterEffect() - 打字机逐字显示效果
   🔹 generateId() - 生成唯一消息 ID
   🔹 scrollToBottom() - 自动滚动到底部
   🔹 createSSEController() - 创建 SSE 控制器（支持中断）

4. src/views/chat/ - AI 对话模块
   组件
   说明
   index.vue
   聊天主页面（消息列表 + 输入框）
   ChatMessageList.vue
   消息列表容器（支持自动滚动、空状态提示）
   ChatMessage.vue
   单条消息组件（用户/AI 样式区分）
   ChatInput.vue
   输入框组件（支持 Enter 发送、停止生成）
   聊天流程：
   用户输入消息 → 添加到消息列表
   创建 AI 占位消息（isStreaming: true）
   调用 createChatStream() 发起流式请求
   接收数据块 → 逐字追加到 AI 消息
   完成后标记 isStreaming: false

5. src/stores/modules/ - 状态管理
   Store
   说明
   app.js
   应用状态（侧边栏折叠状态、主题）
   menu.js
   菜单配置（路由名称、图标、标题）
   user.js
   用户信息（用户名、头像、Token）

🔧 技术栈
分类
技术
版本
核心框架
Vue 3
3.5+
构建工具
Vite
8.0+
UI 组件库
Naive UI
2.44+
状态管理
Pinia
3.0+
路由管理
Vue Router
5.0+
代码规范
ESLint + Prettier + Oxlint
最新版
组件自动引入
unplugin-vue-components
32.0+

📝 开发规范
代码风格
✅ 使用 <script setup> 语法
✅ 组件命名使用 PascalCase（如 ChatMessageList）
✅ 工具函数使用 camelCase（如 generateId）
✅ 常量使用 UPPER_SNAKE_CASE（如 BASE_URL）
文件组织
📁 页面相关组件放在对应页面的 components/ 目录下
📁 全局公共组件放在 src/components/ 下
📁 API 接口按模块拆分在 src/api/ 下
提交规范
feat: 新增功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
🚀 快速开始

# 安装依赖

npm install

# 开发模式

npm run dev

# 代码检查

npm run lint

# 构建生产版本

npm run build

# 预览生产构建

npm run preview
📖 API 接口说明
聊天接口
流式聊天
import { createChatStream } from '@/api/chat'

const chatStream = createChatStream()

await chatStream.send(messageHistory, {
useTypewriter: true, // 启用打字机效果
typewriterDelay: 50, // 每个字符延迟 50ms
onChunk: (chunk) => {
// 接收数据块
aiMessage.content += chunk
},
onDone: () => {
// 完成回调
aiMessage.isStreaming = false
},
onError: (error) => {
// 错误处理
console.error(error)
}
})
⚙️ 配置说明
环境变量
变量 说明 默认值
VITE_API_BASE_URL API 基础地址 http://localhost:8000
聊天配置（src/utils/constants.js）
🐛 常见问题
Q: 如何修改打字机速度？
A: 修改 src/utils/constants.js 中的 TYPEWRITER_DELAY 值即可全局生效。
Q: 如何关闭打字机效果？
A: 将 CHAT_CONFIG.TYPEWRITER_ENABLED 设置为 false。
Q: 侧边栏图标不显示？
A: 检查是否使用了内联 SVG，确保 stroke="currentColor" 属性存在。
