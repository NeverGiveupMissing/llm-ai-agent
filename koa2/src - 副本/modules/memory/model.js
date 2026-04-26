const { v4: uuidv4 } = require('uuid')
const { MEMORY_TYPES } = require('../../utils/memory-constants')

class MemoryModel {
  constructor(data = {}) {
    this.id = data.id || uuidv4()
    this.userId = data.userId
    this.sessionId = data.sessionId || null
    this.content = data.content
    this.summary = data.summary || null
    this.embedding = data.embedding || null
    this.memoryType = data.memoryType || MEMORY_TYPES.FACT
    this.tags = data.tags || []
    this.importance = data.importance || 5
    this.source = data.source || 'auto_extract'
    this.metadata = data.metadata || {}
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  validate() {
    if (!this.userId) {
      return { valid: false, error: 'userId 不能为空' }
    }
    if (!this.content || this.content.trim().length === 0) {
      return { valid: false, error: 'content 不能为空' }
    }
    if (this.content.length > 2000) {
      return { valid: false, error: 'content 不能超过 2000 字符' }
    }
    if (this.importance < 1 || this.importance > 10) {
      return { valid: false, error: 'importance 必须在 1-10 之间' }
    }
    return { valid: true }
  }

  toInsertParams() {
    return [
      this.id,
      this.userId,
      this.sessionId,
      this.content,
      this.summary,
      this.embedding ? `[${this.embedding.join(',')}]` : null,
      this.memoryType,
      this.tags,
      this.importance,
      this.source,
      JSON.stringify(this.metadata),
    ]
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      content: this.content,
      summary: this.summary,
      memoryType: this.memoryType,
      tags: this.tags,
      importance: this.importance,
      source: this.source,
      metadata: this.metadata,
      createdAt: this.createdAt,
    }
  }
}

module.exports = { MemoryModel }
