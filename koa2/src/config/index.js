require('dotenv').config()
const path = require('path')

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
require('dotenv').config({ path: path.join(process.cwd(), envFile) })

const config = {
  api: {
    apiKey: process.env.API_KEY || '',
    baseUrl: process.env.BASE_URL || 'https://api.moonshot.cn/v1',
    model: process.env.MODEL || 'moonshot-v1-8k',
    prefix: process.env.API_PREFIX || '/koa2api',
  },
  server: {
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT || '8000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  log: {
    dir: process.env.LOG_DIR || 'logs/chat_history',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
  },
  memory: {
    maxRetrieveCount: parseInt(process.env.MEMORY_MAX_RETRIEVE || '5', 10),
    minSimilarity: parseFloat(process.env.MEMORY_MIN_SIMILARITY || '0.7', 10),
    maxMemoriesPerUser: parseInt(process.env.MEMORY_MAX_PER_USER || '100', 10),
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
  },
}

if (!config.api.apiKey) {
  console.error('错误: API_KEY 未配置')
  process.exit(1)
}

module.exports = config
