# 消息持久化存储功能说明

## 概述

已实现聊天消息的持久化存储功能，消息现在会保存到 PostgreSQL 数据库中，页面刷新后不会丢失。

## 实现内容

### 1. 数据库变更

#### 新增表：`chat_messages`

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,           -- 会话ID（外键）
  role VARCHAR(50) NOT NULL,                  -- 角色：user/assistant/system
  content TEXT NOT NULL,                      -- 消息内容
  metadata JSONB DEFAULT '{}',                -- 元数据（JSON格式）
  created_at TIMESTAMP DEFAULT NOW(),         -- 创建时间
  updated_at TIMESTAMP DEFAULT NOW(),         -- 更新时间
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

**索引：**
- `idx_messages_session_id`: 按会话ID查询
- `idx_messages_created_at`: 按时间排序

### 2. 后端实现（Koa2）

#### 新增文件

1. **message-model.js** - 数据访问层
   - `create()` - 创建消息
   - `getBySessionId()` - 获取会话消息
   - `getLatest()` - 获取最新消息
   - `deleteBySessionId()` - 删除会话消息
   - `update()` - 更新消息
   - `batchCreate()` - 批量插入

2. **message-service.js** - 业务逻辑层
   - `saveUserMessage()` - 保存用户消息
   - `saveAssistantMessage()` - 保存AI回复
   - `getSessionMessages()` - 获取消息历史
   - `getLatestMessages()` - 获取最新消息
   - `deleteSessionMessages()` - 删除会话消息
   - `updateMessageCount()` - 更新消息计数

3. **init-db.js** - 数据库初始化
   - 自动创建 `chat_messages` 表
   - 自动添加 `message_count` 字段

#### 修改文件

1. **chat/controller.js**
   - 导入 `ChatMessageService`
   - 流式聊天：保存用户消息和AI回复
   - 非流式聊天：保存用户消息和AI回复

2. **chat/routes.js**
   - `GET /chat/messages/:sessionId` - 获取会话消息历史
   - `GET /chat/messages/:sessionId/latest` - 获取最新消息

3. **session/service.js**
   - 导入 `ChatMessageService`
   - 删除会话时同步删除关联消息

4. **app.js**
   - 启动时自动执行数据库初始化

### 3. 前端实现（Vue3）

#### 修改文件

1. **src/api/chat.js**
   - 新增 `getSessionMessages()` - 获取消息历史
   - 新增 `getLatestMessages()` - 获取最新消息

2. **src/views/chat/index.vue**
   - 导入 `getSessionMessages`
   - 修改 `handleSelectSession()` - 切换会话时从数据库加载消息
   - 支持分页加载（limit, offset）

## 使用方法

### 1. 初始化数据库

**方式一：自动初始化**

启动后端服务时会自动执行数据库初始化：

```bash
cd vite-vue3-NaïveUI-pinia/koa2
npm run dev
```

**方式二：手动执行SQL**

如果需要手动执行，可以运行 SQL 文件：

```bash
# 连接数据库
psql -U your_username -d your_database

# 执行迁移脚本
\i src/config/migration-add-messages.sql
```

### 2. 测试功能

1. **发送消息**
   - 在聊天界面发送消息
   - 消息会自动保存到数据库

2. **切换会话**
   - 点击左侧会话列表
   - 消息历史会从数据库加载

3. **刷新页面**
   - 页面刷新后，当前会话的消息不会丢失
   - 选择其他会话会加载对应的历史消息

4. **删除会话**
   - 删除会话时，关联的消息也会级联删除

### 3. API 接口

#### 获取会话消息历史

```javascript
GET /api/chat/messages/:sessionId?limit=100&offset=0
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_id": "xxx",
      "role": "user",
      "content": "你好",
      "metadata": {},
      "created_at": "2026-04-26T10:00:00.000Z"
    },
    {
      "id": 2,
      "session_id": "xxx",
      "role": "assistant",
      "content": "你好！有什么可以帮你的吗？",
      "metadata": {},
      "created_at": "2026-04-26T10:00:01.000Z"
    }
  ],
  "message": "获取消息历史成功"
}
```

#### 获取最新消息

```javascript
GET /api/chat/messages/:sessionId/latest?limit=10
```

## 技术细节

### 消息保存时机

1. **流式聊天**
   - 用户消息：发送前保存
   - AI回复：流式传输完成后保存

2. **非流式聊天**
   - 用户消息：发送前保存
   - AI回复：收到完整回复后保存

### 级联删除

- 删除会话时，会自动删除该会话的所有消息
- 外键约束：`ON DELETE CASCADE`

### 消息计数

- 每次保存消息后，自动更新会话的 `message_count`
- 用于会话列表显示消息数量

## 注意事项

1. **数据库连接**
   - 确保 PostgreSQL 服务正常运行
   - 检查 `.env` 或 `.env.production` 中的数据库配置

2. **重启后端服务**
   - 修改后端代码后必须重启服务
   - 使用 `npm run dev` 或 `pm2 restart`

3. **消息加载性能**
   - 默认加载 100 条消息
   - 可以通过 `limit` 参数调整
   - 对于超长对话，建议实现虚拟滚动或分页加载

4. **数据迁移**
   - 现有会话的消息不会自动导入
   - 新的对话会自动保存
   - 如需导入历史消息，需要编写数据迁移脚本

## 故障排查

### 消息未保存

1. 检查后端日志是否有错误
2. 确认数据库连接正常
3. 验证 `chat_messages` 表是否创建成功
4. 检查会话ID是否正确传递

### 消息未加载

1. 打开浏览器开发者工具，查看网络请求
2. 检查 `GET /api/chat/messages/:sessionId` 请求是否成功
3. 确认前端控制台无报错
4. 验证消息数据格式是否正确

### 数据库初始化失败

1. 检查 PostgreSQL 服务是否运行
2. 验证数据库配置（host, port, user, password, database）
3. 查看后端启动日志中的错误信息
4. 尝试手动执行 SQL 迁移脚本

## 后续优化建议

1. **分页加载**
   - 实现滚动加载更多消息
   - 避免一次性加载大量数据

2. **消息搜索**
   - 添加全文搜索功能
   - 支持按关键词查找历史消息

3. **消息导出**
   - 支持导出聊天记录为 JSON/Markdown
   - 支持导入历史消息

4. **消息编辑**
   - 支持编辑已发送的消息
   - 保存编辑历史

5. **性能优化**
   - 为超长对话实现虚拟滚动
   - 添加消息缓存机制
