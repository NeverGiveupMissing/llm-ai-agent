-- ============================================
-- 数据库迁移脚本：创建消息表
-- 执行时间：2026-04-26
-- 说明：为聊天会话添加消息存储功能
-- ============================================

-- 创建消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON chat_messages(created_at);

-- 检查并添加会话表的 message_count 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'message_count'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN message_count INTEGER DEFAULT 0;
    RAISE NOTICE '已添加 message_count 字段';
  END IF;
END $$;

-- 验证表结构
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 查询示例：获取某个会话的所有消息
-- SELECT * FROM chat_messages WHERE session_id = 'your-session-id' ORDER BY created_at ASC;
