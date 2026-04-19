const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const { Pool } = require('pg')
const { database } = require('../config')

const pool = new Pool({
  host: database.host,
  port: database.port,
  user: database.user,
  password: database.password,
  database: database.database,
})

const SQL = `
-- 对话记忆关联表
CREATE TABLE IF NOT EXISTS chat_memories (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, memory_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_memories_session_id ON chat_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_memory_id ON chat_memories(memory_id);
`

async function initChatMemoryDB() {
  try {
    console.log('🔧 初始化对话记忆关联表...')
    await pool.query(SQL)
    console.log('✅ chat_memories 表初始化成功')
  } catch (error) {
    console.error('❌ chat_memories 表初始化失败:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('🎉 数据库初始化完成')
    process.exit(0)
  }
}

initChatMemoryDB()
