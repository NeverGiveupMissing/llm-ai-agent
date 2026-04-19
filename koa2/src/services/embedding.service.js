const axios = require('axios')
const config = require('../config')

const { apiKey: API_KEY, baseUrl: BASE_URL } = config.api
const { embeddingModel } = config.memory

class EmbeddingService {
  async getEmbedding(text) {
    const url = `${BASE_URL}/embeddings`

    try {
      const response = await axios.post(
        url,
        {
          model: embeddingModel,
          input: text.replace(/\n/g, ' ').trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      )

      return response.data.data[0].embedding
    } catch (error) {
      console.error('Embedding 生成失败:', error.message)
      throw new Error(`Embedding 生成失败: ${error.message}`)
    }
  }

  async batchGetEmbeddings(texts) {
    const embeddings = []
    for (const text of texts) {
      const embedding = await this.getEmbedding(text)
      embeddings.push(embedding)
    }
    return embeddings
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

module.exports = new EmbeddingService()
