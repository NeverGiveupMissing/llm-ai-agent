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

async function initDatabase() {
  try {
    console.log('🔧 初始化记忆数据库表...')

    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
    `)

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

      CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
      CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(is_active);
      CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
      CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN (tags);
    `)

    console.log('✅ memories 表创建成功')

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

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON chat_sessions(created_at DESC);
    `)

    console.log('✅ chat_sessions 表创建成功')

    await pool.end()
    console.log('🎉 数据库初始化完成')
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
    process.exit(1)
  }
}

initDatabase()
