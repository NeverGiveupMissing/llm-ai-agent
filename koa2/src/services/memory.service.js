const { pool } = require('../config/db')
const { MemoryModel } = require('../models/memory.model')
const embeddingService = require('../services/embedding.service')
const { MEMORY_TYPES, DEFAULT_MEMORY_CONFIG } = require('../utils/memory-constants')

class MemoryService {
  async createMemory(data) {
    const memory = new MemoryModel(data)

    const validation = memory.validate()
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    if (!memory.embedding && memory.content) {
      memory.embedding = await embeddingService.getEmbedding(memory.content)
    }

    const query = `
      INSERT INTO memories (
        id, user_id, session_id, content, summary, embedding,
        memory_type, tags, importance, source, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const result = await pool.query(query, memory.toInsertParams())
    return result.rows[0]
  }

  async batchCreateMemories(memoriesData) {
    const results = []
    for (const data of memoriesData) {
      const memory = await this.createMemory(data)
      results.push(memory)
    }
    return results
  }

  async retrieveMemories(userId, query, limit = DEFAULT_MEMORY_CONFIG.MAX_RETRIEVE_COUNT) {
    const queryEmbedding = await embeddingService.getEmbedding(query)
    const embeddingArray = `[${queryEmbedding.join(',')}]`

    const sql = `
      SELECT
        id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at,
        1 - (embedding <-> $1::vector) AS similarity
      FROM memories
      WHERE user_id = $2
        AND is_active = true
        AND embedding IS NOT NULL
      ORDER BY embedding <-> $1::vector
      LIMIT $3
    `

    const result = await pool.query(sql, [embeddingArray, userId, limit])

    return result.rows.map((row) => ({
      ...row,
      similarity: parseFloat(row.similarity),
    }))
  }

  async searchByTags(userId, tags, limit = 10) {
    const query = `
      SELECT id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at
      FROM memories
      WHERE user_id = $1
        AND is_active = true
        AND tags && $2::text[]
      ORDER BY importance DESC, created_at DESC
      LIMIT $3
    `

    const result = await pool.query(query, [userId, tags, limit])
    return result.rows
  }

  async getMemoryById(memoryId) {
    const query = `
      SELECT id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at
      FROM memories
      WHERE id = $1 AND is_active = true
    `

    const result = await pool.query(query, [memoryId])
    return result.rows[0] || null
  }

  async getUserMemories(userId = null, limit = 20, offset = 0, type = null) {
    const conditions = ['is_active = true']
    const values = []
    let paramIndex = 1

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`)
      values.push(userId)
      paramIndex++
    }

    if (type) {
      conditions.push(`memory_type = $${paramIndex}`)
      values.push(type)
      paramIndex++
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM memories
      WHERE ${conditions.join(' AND ')}
    `
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].total, 10)

    console.log('[MemoryService] Query conditions:', conditions.join(' AND '))
    console.log('[MemoryService] Total count:', total)

    let query
    if (limit === null || limit === undefined) {
      query = `
        SELECT id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at
        FROM memories
        WHERE ${conditions.join(' AND ')}
        ORDER BY importance DESC, created_at DESC
      `
    } else {
      values.push(limit, offset)
      query = `
        SELECT id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at
        FROM memories
        WHERE ${conditions.join(' AND ')}
        ORDER BY importance DESC, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
    }

    const result = await pool.query(query, values)
    console.log('[MemoryService] Returned rows:', result.rows.length)

    return {
      list: result.rows,
      total,
    }
  }

  async updateMemory(memoryId, updates) {
    const allowedFields = ['content', 'summary', 'importance', 'tags', 'metadata', 'is_active']
    const updateFields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        if (key === 'tags' || key === 'metadata') {
          values.push(Array.isArray(value) ? value : JSON.stringify(value))
        } else {
          values.push(value)
        }
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有可更新的字段')
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(memoryId)

    const query = `
      UPDATE memories
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0]
  }

  async deleteMemory(memoryId) {
    const query = `
      UPDATE memories
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `

    const result = await pool.query(query, [memoryId])
    return result.rows.length > 0
  }

  async batchDeleteMemories(memoryIds) {
    const query = `
      UPDATE memories
      SET is_active = false, updated_at = NOW()
      WHERE id = ANY($1::uuid[])
      RETURNING id
    `

    const result = await pool.query(query, [memoryIds])
    return result.rows.map((row) => row.id)
  }

  async getMemoryStats(userId) {
    const query = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE memory_type = $2) AS facts,
        COUNT(*) FILTER (WHERE memory_type = $3) AS preferences,
        COUNT(*) FILTER (WHERE memory_type = $4) AS goals,
        COUNT(*) FILTER (WHERE memory_type = $5) AS events,
        AVG(importance) AS avg_importance
      FROM memories
      WHERE user_id = $1 AND is_active = true
    `

    const result = await pool.query(query, [
      userId,
      MEMORY_TYPES.FACT,
      MEMORY_TYPES.PREFERENCE,
      MEMORY_TYPES.GOAL,
      MEMORY_TYPES.EVENT,
    ])

    return result.rows[0]
  }

  async clearUserMemories(userId) {
    const query = `
      DELETE FROM memories WHERE user_id = $1
      RETURNING id
    `

    const result = await pool.query(query, [userId])
    return result.rows.length
  }
}

module.exports = new MemoryService()
