-- ============================================
-- 数据库迁移脚本 - 修复 session_id 字段类型
-- 执行时间: 2026-04-26
-- 说明: 将 chat_memories 和 chat_messages 表的 session_id 从 VARCHAR 改为 UUID
-- ============================================

BEGIN;

-- 1. 删除现有的外键约束(如果存在)
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS fk_session;

-- 2. 修改 chat_messages 表的 session_id 字段类型为 UUID
-- 注意: 如果表中已有数据,需要确保所有 session_id 都是有效的 UUID 格式
ALTER TABLE chat_messages 
  ALTER COLUMN session_id TYPE UUID 
  USING session_id::uuid;

-- 3. 重新添加外键约束
ALTER TABLE chat_messages
  ADD CONSTRAINT fk_session
  FOREIGN KEY (session_id)
  REFERENCES chat_sessions(id)
  ON DELETE CASCADE;

-- 4. 修改 chat_memories 表的 session_id 字段类型为 UUID
ALTER TABLE chat_memories 
  ALTER COLUMN session_id TYPE UUID 
  USING session_id::uuid;

COMMIT;

-- 验证修改结果
SELECT 
  table_name, 
  column_name, 
  data_type, 
  udt_name
FROM information_schema.columns 
WHERE table_name IN ('chat_messages', 'chat_memories', 'chat_sessions')
  AND column_name = 'session_id' OR column_name = 'id';
