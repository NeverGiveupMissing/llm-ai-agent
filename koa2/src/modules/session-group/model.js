/**
 * 会话分组模型
 * 提供分组的数据库操作方法
 */

const { pool } = require('../../config/db')

class SessionGroupModel {
  /**
   * 创建分组
   */
  async create(groupData) {
    const { name, icon, user_id } = groupData
    const query = `
      INSERT INTO session_groups (name, icon, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const values = [name, icon, user_id]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 获取用户的所有分组（按置顶和时间排序）
   */
  async list(user_id) {
    // 先检查 is_pinned 字段是否存在
    try {
      const query = `
        SELECT id, name, icon, user_id, 
               COALESCE(is_pinned, false) as is_pinned, 
               created_at, updated_at
        FROM session_groups
        WHERE user_id = $1
        ORDER BY 
          COALESCE(is_pinned, false) DESC,
          updated_at DESC
      `
      const result = await pool.query(query, [user_id])
      return result.rows
    } catch (error) {
      // 如果 is_pinned 字段不存在，使用降级查询
      if (error.message.includes('is_pinned')) {
        console.warn('⚠️  is_pinned 字段不存在，使用降级查询')
        const fallbackQuery = `
          SELECT id, name, icon, user_id, 
                 false as is_pinned, 
                 created_at, updated_at
          FROM session_groups
          WHERE user_id = $1
          ORDER BY updated_at DESC
        `
        const result = await pool.query(fallbackQuery, [user_id])
        return result.rows
      }
      throw error
    }
  }

  /**
   * 获取单个分组
   */
  async findById(id) {
    const query = 'SELECT * FROM session_groups WHERE id = $1'
    const result = await pool.query(query, [id])
    return result.rows[0]
  }

  /**
   * 更新分组
   */
  async update(id, updateData) {
    const { name, icon } = updateData
    const query = `
      UPDATE session_groups
      SET name = COALESCE($1, name),
          icon = COALESCE($2, icon),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `
    const values = [name, icon, id]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 删除分组
   */
  async delete(id) {
    const query = 'DELETE FROM session_groups WHERE id = $1 RETURNING *'
    const result = await pool.query(query, [id])
    return result.rows[0]
  }

  /**
   * 统计分组下的会话数量
   */
  async countSessions(groupId) {
    const query = 'SELECT COUNT(*) FROM chat_sessions WHERE group_id = $1'
    const result = await pool.query(query, [groupId])
    return parseInt(result.rows[0].count)
  }

  /**
   * 置顶/取消置顶分组
   */
  async pin(groupId) {
    try {
      const query = `
        UPDATE session_groups
        SET is_pinned = NOT COALESCE(is_pinned, false),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `
      const result = await pool.query(query, [groupId])
      return result.rows[0] || null
    } catch (error) {
      // 如果 is_pinned 字段不存在，提示用户执行数据库迁移
      if (error.message.includes('is_pinned')) {
        console.error('❌ 置顶功能需要执行数据库迁移！')
        console.error('请执行: psql -f database/migrations/add_group_features.sql')
        throw new Error('数据库缺少 is_pinned 字段，请执行数据库迁移')
      }
      throw error
    }
  }
}

module.exports = new SessionGroupModel()
