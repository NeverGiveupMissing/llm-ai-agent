// 说明：初始化 chat_memories 表（对话记忆关联表）

const { pool } = require('../db')

async function initChatMemoriesTable() {
  console.log('📊 创建 chat_memories 表...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
}

module.exports = initChatMemoriesTable
