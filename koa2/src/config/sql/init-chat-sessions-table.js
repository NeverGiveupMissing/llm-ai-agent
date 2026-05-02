// 说明：初始化 chat_sessions 表（会话表）

const { pool } = require('../db')

async function initChatSessionsTable() {
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
  // 检查并添加 chat_sessions.is_pinned 字段（如果不存在）
  // ============================================
  console.log('🔍 检查 chat_sessions.is_pinned 字段...')
  const checkIsPinnedColumn = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'is_pinned'
  `
  const isPinnedResult = await pool.query(checkIsPinnedColumn)
  if (isPinnedResult.rows.length === 0) {
    await pool.query("ALTER TABLE chat_sessions ADD COLUMN is_pinned BOOLEAN DEFAULT false")
    console.log('✅ 已添加 is_pinned 字段')
  } else {
    console.log('ℹ️  is_pinned 字段已存在')
  }

  // ============================================
  // 检查并添加 chat_sessions.share_token 字段（如果不存在）
  // ============================================
  console.log('🔍 检查 chat_sessions.share_token 字段...')
  const checkShareTokenColumn = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'share_token'
  `
  const shareTokenResult = await pool.query(checkShareTokenColumn)
  if (shareTokenResult.rows.length === 0) {
    await pool.query('ALTER TABLE chat_sessions ADD COLUMN share_token VARCHAR(128)')
    console.log('✅ 已添加 share_token 字段')
  } else {
    console.log('ℹ️  share_token 字段已存在')
  }

  // ============================================
  // 检查并添加 chat_sessions.group_id 字段（如果不存在）
  // ============================================
  console.log('🔍 检查 chat_sessions.group_id 字段...')
  const checkGroupIdColumn = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'group_id'
  `
  const groupIdResult = await pool.query(checkGroupIdColumn)
  if (groupIdResult.rows.length === 0) {
    await pool.query('ALTER TABLE chat_sessions ADD COLUMN group_id UUID REFERENCES session_groups(id) ON DELETE SET NULL')
    console.log('✅ 已添加 group_id 字段')
  } else {
    console.log('ℹ️  group_id 字段已存在')
  }

  // ============================================
  // 检查并添加 chat_sessions.message_count 字段（如果不存在）
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
  // 检查并添加 chat_sessions.memory_ids 字段（如果不存在）
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
}

module.exports = initChatSessionsTable
