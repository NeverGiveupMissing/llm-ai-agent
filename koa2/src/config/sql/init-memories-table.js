// 说明：初始化 memories 表（记忆表）

const { pool } = require('../db')
const constants = require('../constants')

async function initMemoriesTable() {
  console.log('📊 创建 memories 表...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64),
      content TEXT NOT NULL,
      summary VARCHAR(500),
      embedding VECTOR(${constants.DB_CONFIG.VECTOR_DIMENSION}),
      memory_type VARCHAR(32) DEFAULT '${constants.MEMORY_TYPES.FACT}',
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
        CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = ${constants.DB_CONFIG.IVFFLAT_LISTS});
      END IF;

      -- 标签索引
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_tags') THEN
        CREATE INDEX idx_memories_tags ON memories USING GIN (tags);
      END IF;
    END $$;
  `)
  console.log('✅ memories 表创建成功')
}

module.exports = initMemoriesTable
