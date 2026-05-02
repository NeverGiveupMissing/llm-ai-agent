// 说明：初始化 chat_messages 表（消息表）

const { pool } = require('../db')

async function initChatMessagesTable() {
  console.log('📊 创建 chat_messages 表...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
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
}

module.exports = initChatMessagesTable
