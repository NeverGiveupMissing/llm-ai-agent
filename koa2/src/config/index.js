const path = require('path')
const fs = require('fs')

// 根据 NODE_ENV 选择正确的配置文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
const envPath = path.join(process.cwd(), envFile)

// 检查文件是否存在
if (fs.existsSync(envPath)) {
  const dotenv = require('dotenv')
  const result = dotenv.config({ path: envPath, override: true })
  if (result.error) {
    console.error(`⚠️  加载 ${envFile} 失败:`, result.error.message)
  } else {
    console.log(`✅ 已加载配置文件: ${envFile}`)
  }
} else {
  console.warn(`⚠️  配置文件 ${envPath} 不存在，使用系统环境变量`)
}

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
  console.error('当前 NODE_ENV:', process.env.NODE_ENV)
  console.error('尝试加载的文件:', envPath)
  console.error('文件是否存在:', fs.existsSync(envPath))
  process.exit(1)
}

module.exports = config
