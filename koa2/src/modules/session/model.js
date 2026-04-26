// 说明：会话数据模型 - 管理聊天会话的创建、查询、删除

const { pool } = require('../../config/db')

class SessionModel {
  /**
   * 创建新会话
   */
  async create(userId, title = '新对话') {
    const query = `
      INSERT INTO chat_sessions (user_id, title, message_count)
      VALUES ($1, $2, 0)
      RETURNING *
    `
    const result = await pool.query(query, [userId, title])
    return result.rows[0]
  }

  /**
   * 获取用户的会话列表（按时间倒序）
   */
  async list(userId, limit = 20) {
    const query = `
      SELECT id, user_id, title, message_count, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2
    `
    const result = await pool.query(query, [userId, limit])
    return result.rows
  }

  /**
   * 根据 ID 获取会话
   */
  async getById(sessionId) {
    const query = `
      SELECT * FROM chat_sessions WHERE id = $1
    `
    const result = await pool.query(query, [sessionId])
    return result.rows[0] || null
  }

  /**
   * 更新会话标题和消息计数
   */
  async update(sessionId, updates) {
    console.log('📊 更新会话参数:', { sessionId, updates })

    const fields = []
    const values = []
    let idx = 1

    if (updates.title !== undefined && updates.title !== null) {
      fields.push(`title = $${idx++}`)
      values.push(updates.title)
    }
    if (updates.message_count !== undefined && updates.message_count !== null) {
      fields.push(`message_count = $${idx++}`)
      values.push(Number(updates.message_count))
    }

    // 如果没有要更新的字段，直接返回当前会话
    if (fields.length === 0) {
      console.log('ℹ️ 没有需要更新的字段，返回当前会话')
      return await this.getById(sessionId)
    }

    fields.push(`updated_at = NOW()`)
    values.push(sessionId)

    const query = `
      UPDATE chat_sessions
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `

    console.log('📝 执行 SQL:', query.trim(), values)

    // ✅ 添加连接重试机制
    const maxRetries = 3
    const retryDelay = 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 尝试执行 SQL (第 ${attempt} 次)...`)
        const startTime = Date.now()

        const result = await pool.query(query, values)
        const duration = Date.now() - startTime

        // 如果没有匹配到记录，返回 null 而不是报错
        if (result.rows.length === 0) {
          console.warn(`⚠️ 会话不存在: ${sessionId}，跳过更新`)
          return null
        }

        console.log(`✅ SQL 执行完成，耗时: ${duration}ms`, result.rows[0])
        return result.rows[0]
      } catch (error) {
        console.error(`❌ SQL 执行失败 (尝试 ${attempt}/${maxRetries}):`, error.message)

        // 如果是连接超时错误，等待后重试
        if (attempt < maxRetries && error.message.includes('timeout')) {
          console.log(`⏳ ${retryDelay}ms 后重试...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          continue
        }

        // 其他错误或重试次数用尽，抛出错误
        console.error('❌ SQL:', query)
        console.error('❌ 参数:', values)
        throw error
      }
    }
  }

  /**
   * 删除会话
   */
  async delete(sessionId) {
    const query = `
      DELETE FROM chat_sessions WHERE id = $1 RETURNING id
    `
    const result = await pool.query(query, [sessionId])
    return result.rows.length > 0
  }

  /**
   * 获取会话的第一条用户消息（用于生成标题）
   */
  async getFirstUserMessage(sessionId) {
    // 从日志文件中查询（简化版：直接返回 null，由前端或控制器处理）
    return null
  }
}

module.exports = new SessionModel()
