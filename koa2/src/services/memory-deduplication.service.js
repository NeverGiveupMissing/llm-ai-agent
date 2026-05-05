// 记忆去重服务（多个模块共用）
const embeddingService = require('./embedding.service')
const { pool } = require('../config/db')
const { DEFAULT_MEMORY_CONFIG } = require('../config/constants')

class MemoryDeduplicationService {
  async checkDuplicate(
    user_id,
    content,
    similarityThreshold = DEFAULT_MEMORY_CONFIG.MIN_SIMILARITY_FOR_DEDUP,
  ) {
    const contentEmbedding = await embeddingService.getEmbedding(content)
    const embeddingArray = `[${contentEmbedding.join(',')}]`

    const query = `
      SELECT
        id, user_id, content, summary, memory_type, tags, importance, source, metadata, created_at,
        1 - (embedding <-> $1::vector) AS similarity
      FROM memories
      WHERE user_id = $2
        AND is_active = true
        AND embedding IS NOT NULL
      ORDER BY embedding <-> $1::vector
      LIMIT 1
    `

    const result = await pool.query(query, [embeddingArray, user_id])

    if (result.rows.length === 0) {
      return { isDuplicate: false, similarMemory: null, similarity: 0 }
    }

    const similarMemory = result.rows[0]
    const similarity = parseFloat(similarMemory.similarity)

    if (similarity >= similarityThreshold) {
      return {
        isDuplicate: true,
        similarMemory: {
          id: similarMemory.id,
          content: similarMemory.content,
          similarity: similarity,
          createdAt: similarMemory.created_at,
        },
        similarity: similarity,
      }
    }

    return { isDuplicate: false, similarMemory: null, similarity: similarity }
  }

  async batchCheckDuplicates(
    user_id,
    contents,
    similarityThreshold = DEFAULT_MEMORY_CONFIG.MIN_SIMILARITY_FOR_DEDUP,
  ) {
    const results = []

    for (const content of contents) {
      const duplicateInfo = await this.checkDuplicate(user_id, content, similarityThreshold)
      results.push({
        content,
        ...duplicateInfo,
      })
    }

    return results
  }

  calculateCosineSimilarity(vecA, vecB) {
    return embeddingService.cosineSimilarity(vecA, vecB)
  }
}

module.exports = new MemoryDeduplicationService()
