// 说明：数据库初始化脚本 - 自动创建所有必需的表（仅在表不存在时创建）

const { pool } = require('../config/db')

/**
 * 初始化所有数据库表
 * 使用 IF NOT EXISTS 确保只在表不存在时才创建
 */
async function initDatabase() {
  console.log('🚀 开始初始化数据库...')

  try {
    // ============================================
    // 1. 启用 vector 扩展（用于向量搜索）
    // ============================================
    console.log('📦 检查 vector 扩展...')
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✅ vector 扩展已就绪')

    // ============================================
    // 2. 创建 memories 表（记忆表）
    // ============================================
    console.log('📊 创建 memories 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(64) NOT NULL,
        session_id VARCHAR(64),
        content TEXT NOT NULL,
        summary VARCHAR(500),
        embedding VECTOR(1536),
        memory_type VARCHAR(32) DEFAULT 'fact',
        tags TEXT[] DEFAULT '{}',
        importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
        source VARCHAR(64),
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引（使用 IF NOT EXISTS 避免重复创建报错）
      DO $$ BEGIN
        -- 用户ID索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_user_id') THEN
          CREATE INDEX idx_memories_user_id ON memories(user_id);
        END IF;

        -- 记忆类型索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_type') THEN
          CREATE INDEX idx_memories_type ON memories(memory_type);
        END IF;

        -- 激活状态索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_active') THEN
          CREATE INDEX idx_memories_active ON memories(is_active);
        END IF;

        -- 向量索引（用于相似度搜索）
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_embedding') THEN
          CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        END IF;

        -- 标签索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_tags') THEN
          CREATE INDEX idx_memories_tags ON memories USING GIN (tags);
        END IF;
      END $$;
    `)
    console.log('✅ memories 表创建成功')

    // ============================================
    // 3. 创建 chat_sessions 表（会话表）
    // ============================================
    console.log('📊 创建 chat_sessions 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(200),
        message_count INTEGER DEFAULT 0,
        memory_ids UUID[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_user_id') THEN
          CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_created') THEN
          CREATE INDEX idx_sessions_created ON chat_sessions(created_at DESC);
        END IF;
      END $$;
    `)
    console.log('✅ chat_sessions 表创建成功')

    // ============================================
    // 4. 创建 chat_memories 表（对话记忆关联表）
    // ============================================
    console.log('📊 创建 chat_memories 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_memories (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(session_id, memory_id)
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_memories_session_id') THEN
          CREATE INDEX idx_chat_memories_session_id ON chat_memories(session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_memories_memory_id') THEN
          CREATE INDEX idx_chat_memories_memory_id ON chat_memories(memory_id);
        END IF;
      END $$;
    `)
    console.log('✅ chat_memories 表创建成功')

    // ============================================
    // 5. 创建 chat_messages 表（消息表）
    // ============================================
    console.log('📊 创建 chat_messages 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_session
          FOREIGN KEY (session_id)
          REFERENCES chat_sessions(id)
          ON DELETE CASCADE
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_session_id') THEN
          CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_created_at') THEN
          CREATE INDEX idx_messages_created_at ON chat_messages(created_at);
        END IF;
      END $$;
    `)
    console.log('✅ chat_messages 表创建成功')

    // ============================================
    // 6. 检查并添加 chat_sessions.message_count 字段（如果不存在）
    // ============================================
    console.log('🔍 检查 chat_sessions.message_count 字段...')
    const checkColumn = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions' AND column_name = 'message_count'
    `
    const result = await pool.query(checkColumn)
    if (result.rows.length === 0) {
      await pool.query('ALTER TABLE chat_sessions ADD COLUMN message_count INTEGER DEFAULT 0')
      console.log('✅ 已添加 message_count 字段')
    } else {
      console.log('ℹ️  message_count 字段已存在')
    }

    // ============================================
    // 7. 检查并添加 chat_sessions.memory_ids 字段（如果不存在）
    // ============================================
    console.log('🔍 检查 chat_sessions.memory_ids 字段...')
    const checkMemoryIdsColumn = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions' AND column_name = 'memory_ids'
    `
    const memoryIdsResult = await pool.query(checkMemoryIdsColumn)
    if (memoryIdsResult.rows.length === 0) {
      await pool.query("ALTER TABLE chat_sessions ADD COLUMN memory_ids UUID[] DEFAULT '{}'")
      console.log('✅ 已添加 memory_ids 字段')
    } else {
      console.log('ℹ️  memory_ids 字段已存在')
    }

    console.log('🎉 数据库初始化完成！所有表已就绪')
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
    console.error('详细错误:', error)
    throw error
  }
}

module.exports = { initDatabase }
