const { pool } = require('../../config/db')
const { MemoryModel } = require('./model')
const embeddingService = require('../../services/embedding.service')
const memoryDeduplicationService = require('../../services/memory-deduplication.service')
const { MEMORY_TYPES, DEFAULT_MEMORY_CONFIG } = require('../../config/constants')

class MemoryService {
  async createMemory(data, options = {}) {
    const {
      skipDeduplication = false,
      similarityThreshold = DEFAULT_MEMORY_CONFIG.MIN_SIMILARITY_FOR_DEDUP,
    } = options

    const memory = new MemoryModel(data)

    const validation = memory.validate()
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    if (!skipDeduplication && memory.content) {
      const duplicateInfo = await memoryDeduplicationService.checkDuplicate(
        memory.user_id,
        memory.content,
        similarityThreshold,
      )

      if (duplicateInfo.isDuplicate) {
        return {
          isDuplicate: true,
          duplicateInfo: duplicateInfo,
          message: `发现相似记忆（相似度: ${(duplicateInfo.similarity * 100).toFixed(2)}%）`,
        }
      }
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

  async batchCreateMemories(memoriesData, options = {}) {
    const {
      skipDeduplication = false,
      similarityThreshold = DEFAULT_MEMORY_CONFIG.MIN_SIMILARITY_FOR_DEDUP,
    } = options
    const results = []
    const skipped = []

    for (const data of memoriesData) {
      const result = await this.createMemory(data, { skipDeduplication, similarityThreshold })

      if (result.isDuplicate) {
        skipped.push(result)
      } else {
        results.push(result.data)
      }
    }

    return {
      created: results,
      skipped: skipped,
      total: memoriesData.length,
      createdCount: results.length,
      skippedCount: skipped.length,
    }
  }

  async retrieveMemories(user_id, query, limit = DEFAULT_MEMORY_CONFIG.MAX_RETRIEVE_COUNT) {
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

    const result = await pool.query(sql, [embeddingArray, user_id, limit])

    return result.rows.map((row) => ({
      ...row,
      similarity: parseFloat(row.similarity),
    }))
  }

  async searchByTags(user_id, tags, limit = 10) {
    const query = `
      SELECT id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at
      FROM memories
      WHERE user_id = $1
        AND is_active = true
        AND tags && $2::text[]
      ORDER BY importance DESC, created_at DESC
      LIMIT $3
    `

    const result = await pool.query(query, [user_id, tags, limit])
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

  async getUserMemories(user_id = null, limit = 20, offset = 0, type = null, keyword = null) {
    const conditions = ['is_active = true']
    const values = []
    let paramIndex = 1

    if (user_id) {
      conditions.push(`user_id = $${paramIndex}`)
      values.push(user_id)
      paramIndex++
    }

    if (type) {
      conditions.push(`memory_type = $${paramIndex}`)
      values.push(type)
      paramIndex++
    }

    if (keyword) {
      conditions.push(`content ILIKE $${paramIndex}`)
      values.push(`%${keyword}%`)
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
    console.log('[MemoryService] Query values:', values)
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

    console.log('[MemoryService] SQL Query:', query)
    console.log('[MemoryService] SQL Values:', values)

    const result = await pool.query(query, values)
    console.log('[MemoryService] Returned rows:', result.rows.length)

    return {
      list: result.rows,
      total,
      page: Math.floor(offset / (limit || 20)) + 1,
      limit: limit || 20,
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

  async getMemoryStats(user_id) {
    const query = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE memory_type = $2) AS facts,
        COUNT(*) FILTER (WHERE memory_type = $3) AS preferences,
        COUNT(*) FILTER (WHERE memory_type = $4) AS goals,
        COUNT(*) FILTER (WHERE memory_type = $5) AS events,
        AVG(importance) AS avg_importance
      FROM memories
      WHERE user_id = $1::int AND is_active = true
    `

    const result = await pool.query(query, [
      user_id,
      MEMORY_TYPES.FACT,
      MEMORY_TYPES.PREFERENCE,
      MEMORY_TYPES.GOAL,
      MEMORY_TYPES.EVENT,
    ])

    return result.rows[0]
  }

  async clearUserMemories(user_id) {
    const query = `
      DELETE FROM memories WHERE user_id = $1
      RETURNING id
    `

    const result = await pool.query(query, [user_id])
    return result.rows.length
  }
}

module.exports = new MemoryService()
