# 数据库初始化说明

## 概述

数据库初始化已整合到应用启动流程中，使用 `IF NOT EXISTS` 确保只在表不存在时才创建，不会影响现有数据。

## 初始化流程

### 1. 自动初始化（推荐）

启动应用时会自动执行数据库初始化：

```bash
# 开发环境
npm run dev

# 生产环境
npm start
# 或
npm run prod
```

**启动顺序：**
1. ✅ 检查并创建 `vector` 扩展
2. ✅ 检查并创建 `memories` 表（记忆表）
3. ✅ 检查并创建 `chat_sessions` 表（会话表）
4. ✅ 检查并创建 `chat_memories` 表（对话记忆关联表）
5. ✅ 检查并创建 `chat_messages` 表（消息表）
6. ✅ 检查并添加缺失的字段（如 `message_count`、`memory_ids`）
7. ✅ 启动 HTTP 服务器

### 2. 手动初始化

如果需要手动执行数据库初始化：

```bash
# 使用统一的初始化命令
npm run db:init:unified

# 或使用旧的分离命令（不推荐）
npm run db:init        # 初始化记忆表
npm run db:init:chat   # 初始化对话记忆关联表
npm run db:init:all    # 执行以上两个命令
```

## 数据库表结构

### 1. memories（记忆表）

存储用户记忆信息，支持向量搜索。

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,              -- 用户ID
  session_id VARCHAR(64),                    -- 会话ID
  content TEXT NOT NULL,                     -- 记忆内容
  summary VARCHAR(500),                      -- 摘要
  embedding VECTOR(1536),                    -- 向量嵌入（1536维）
  memory_type VARCHAR(32) DEFAULT 'fact',    -- 记忆类型
  tags TEXT[] DEFAULT '{}',                  -- 标签数组
  importance INTEGER DEFAULT 5,              -- 重要性（1-10）
  source VARCHAR(64),                        -- 来源
  metadata JSONB DEFAULT '{}',               -- 元数据
  is_active BOOLEAN DEFAULT true,            -- 是否激活
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
- idx_memories_user_id: 用户ID索引
- idx_memories_type: 记忆类型索引
- idx_memories_active: 激活状态索引
- idx_memories_embedding: 向量索引（用于相似度搜索）
- idx_memories_tags: 标签索引（GIN）
```

### 2. chat_sessions（会话表）

存储聊天会话信息。

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,              -- 用户ID
  title VARCHAR(200),                        -- 会话标题
  message_count INTEGER DEFAULT 0,           -- 消息数量
  memory_ids UUID[] DEFAULT '{}',            -- 关联的记忆ID数组
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
- idx_sessions_user_id: 用户ID索引
- idx_sessions_created: 创建时间索引（倒序）
```

### 3. chat_memories（对话记忆关联表）

关联会话和记忆。

```sql
CREATE TABLE chat_memories (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,          -- 会话ID
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, memory_id)              -- 唯一约束
);

-- 索引
- idx_chat_memories_session_id: 会话ID索引
- idx_chat_memories_memory_id: 记忆ID索引
```

### 4. chat_messages（消息表）

存储聊天消息记录。

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,          -- 会话ID（外键）
  role VARCHAR(50) NOT NULL,                 -- 角色：user/assistant/system
  content TEXT NOT NULL,                     -- 消息内容
  metadata JSONB DEFAULT '{}',               -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_session
    FOREIGN KEY (session_id)
    REFERENCES chat_sessions(id)
    ON DELETE CASCADE
);

-- 索引
- idx_messages_session_id: 会话ID索引
- idx_messages_created_at: 创建时间索引
```

## 核心特性

### ✅ 安全初始化

使用 `IF NOT EXISTS` 和 `DO $$ BEGIN ... END $$;` 语法：

```sql
-- 表不存在时才创建
CREATE TABLE IF NOT EXISTS table_name (...);

-- 索引不存在时才创建
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_name') THEN
    CREATE INDEX idx_name ON table_name(column);
  END IF;
END $$;
```

### ✅ 字段检查与添加

动态检查字段是否存在，不存在才添加：

```javascript
const checkColumn = `
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'table_name' AND column_name = 'column_name'
`
const result = await pool.query(checkColumn)
if (result.rows.length === 0) {
  await pool.query('ALTER TABLE table_name ADD COLUMN column_name TYPE')
}
```

### ✅ 扩展检查

```sql
-- 确保 vector 扩展已安装
CREATE EXTENSION IF NOT EXISTS vector;
```

## 启动日志示例

```bash
🔧 正在检查并初始化数据库表...
🚀 开始初始化数据库...
📦 检查 vector 扩展...
✅ vector 扩展已就绪
📊 创建 memories 表...
✅ memories 表创建成功
📊 创建 chat_sessions 表...
✅ chat_sessions 表创建成功
📊 创建 chat_memories 表...
✅ chat_memories 表创建成功
📊 创建 chat_messages 表...
✅ chat_messages 表创建成功
🔍 检查 chat_sessions.message_count 字段...
ℹ️  message_count 字段已存在
🔍 检查 chat_sessions.memory_ids 字段...
ℹ️  memory_ids 字段已存在
🎉 数据库初始化完成！所有表已就绪
✅ 数据库表初始化完成

🚀 ========================================
🚀 AI Chat API is running on http://0.0.0.0:3000
📌 API 前缀: /api
📚 API Docs: http://0.0.0.0:3000/api-docs
📝 Swagger JSON: http://0.0.0.0:3000/api-docs/swagger.json
🚀 ========================================
```

## 故障排查

### 1. vector 扩展安装失败

**错误信息：**
```
ERROR: could not open extension control file "/usr/share/postgresql/14/extension/vector.control"
```

**解决方案：**
```bash
# PostgreSQL 14+
sudo apt-get install postgresql-14-pgvector

# 或使用源码安装
cd /tmp
git clone --branch v0.5.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### 2. 权限问题

**错误信息：**
```
ERROR: permission denied to create extension "vector"
```

**解决方案：**
```bash
# 使用超级用户连接
psql -U postgres -d your_database
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. 连接失败

**错误信息：**
```
error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案：**
1. 检查 PostgreSQL 服务是否运行
2. 验证 `.env` 中的数据库配置
3. 确认端口和凭据正确

### 4. 索引创建失败

**错误信息：**
```
ERROR: index "idx_name" already exists
```

**解决方案：**
代码已使用 `IF NOT EXISTS` 检查，此错误不应出现。如果出现，检查是否有多个初始化进程同时运行。

## 数据迁移

### 从旧版本升级

如果您之前使用分离的初始化脚本（`init-memory-db.js` 和 `init-chat-memory-db.js`），现在可以：

1. **直接重启应用** - 新的初始化代码会自动检查并创建缺失的表和字段
2. **无需手动迁移** - `IF NOT EXISTS` 确保现有数据不受影响
3. **字段自动添加** - 缺失的字段会自动添加

### 备份建议

在进行任何数据库操作前，建议备份数据：

```bash
# 备份整个数据库
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U your_user -d your_database < backup_20260426.sql
```

## 性能优化建议

### 1. 索引维护

定期执行索引维护：

```sql
-- 重新索引
REINDEX TABLE chat_messages;
REINDEX TABLE memories;

-- 分析表统计信息
ANALYZE chat_messages;
ANALYZE memories;
```

### 2. 向量索引调优

根据数据量调整 `ivfflat` 参数：

```sql
-- 小数据量（< 10000 条）
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 中等数据量（10000 - 100000 条）
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1000);

-- 大数据量（> 100000 条）
-- 考虑使用 HNSW 索引
CREATE INDEX idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);
```

### 3. 定期清理

```sql
-- 删除过期数据
DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '1 year';

-- 删除不活跃的记忆
DELETE FROM memories WHERE is_active = false AND updated_at < NOW() - INTERVAL '6 months';

-- 回收空间
VACUUM FULL chat_messages;
VACUUM FULL memories;
```

## 监控与维护

### 1. 表大小监控

```sql
-- 查看所有表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. 索引使用情况

```sql
-- 查看索引使用统计
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 3. 慢查询监控

```sql
-- 启用慢查询日志（在 postgresql.conf 中）
log_min_duration_statement = 1000  -- 记录超过1秒的查询
```

## 总结

- ✅ 数据库初始化已整合到应用启动流程
- ✅ 使用 `IF NOT EXISTS` 确保安全初始化
- ✅ 自动检查和添加缺失的字段
- ✅ 支持多次执行，不会影响现有数据
- ✅ 启动时自动执行，无需手动操作
- ✅ 提供详细的日志输出，便于排查问题

**推荐做法：** 直接启动应用，数据库会自动初始化！🚀
