// 说明：初始化 session_groups 表（会话分组表）

const { pool } = require('../db')

async function initSessionGroupsTable() {
  console.log('📊 创建 session_groups 表...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(128) NOT NULL,
      icon VARCHAR(64),
      user_id UUID NOT NULL,
      is_pinned BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 创建索引
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_groups_user_id') THEN
        CREATE INDEX idx_session_groups_user_id ON session_groups(user_id);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_groups_is_pinned') THEN
        CREATE INDEX idx_session_groups_is_pinned ON session_groups(is_pinned);
      END IF;
    END $$;
  `)
  console.log('✅ session_groups 表创建成功')
}

module.exports = initSessionGroupsTable
