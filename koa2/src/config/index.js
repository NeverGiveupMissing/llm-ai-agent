// ==================== 配置聚合中心 ====================
// 职责：读取环境变量，合并 constants.js 中的默认值，导出最终配置
const path = require('path')
const fs = require('fs')
const constants = require('./constants')

// ==================== 环境变量加载 ====================
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
const envPath = path.join(process.cwd(), envFile)

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

// ==================== 配置对象 ====================
const config = {
  // API 配置
  api: {
    apiKey: process.env.API_KEY || '',
    baseUrl: process.env.BASE_URL || constants.AI_API_CONFIG.DEFAULT_BASE_URL,
    model: process.env.MODEL || constants.AI_API_CONFIG.DEFAULT_MODEL,
    prefix: process.env.API_PREFIX || constants.SERVER_CONFIG.DEFAULT_PREFIX,
  },
  
  // 服务器配置
  server: {
    host: process.env.HOST || constants.SERVER_CONFIG.DEFAULT_HOST,
    port: parseInt(process.env.PORT || String(constants.SERVER_CONFIG.DEFAULT_PORT), 10),
    env: process.env.NODE_ENV || 'development',
  },
  
  // 日志配置
  log: {
    dir: process.env.LOG_DIR || constants.LOG_CONFIG.DEFAULT_DIR,
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || constants.DB_CONFIG.DEFAULT_HOST,
    port: parseInt(process.env.DB_PORT || String(constants.DB_CONFIG.DEFAULT_PORT), 10),
    user: process.env.DB_USER || constants.DB_CONFIG.DEFAULT_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || constants.DB_CONFIG.DEFAULT_NAME,
  },
  
  // 记忆配置
  memory: {
    maxRetrieveCount: parseInt(process.env.MEMORY_MAX_RETRIEVE || String(constants.DEFAULT_MEMORY_CONFIG.MAX_RETRIEVE_COUNT), 10),
    minSimilarity: parseFloat(process.env.MEMORY_MIN_SIMILARITY || String(constants.DEFAULT_MEMORY_CONFIG.MIN_SIMILARITY)),
    maxMemoriesPerUser: parseInt(process.env.MEMORY_MAX_PER_USER || String(constants.DEFAULT_MEMORY_CONFIG.MAX_MEMORIES_PER_USER), 10),
    embeddingModel: process.env.EMBEDDING_MODEL || constants.AI_API_CONFIG.DEFAULT_EMBEDDING_MODEL,
  },
  
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}

// ==================== 配置验证 ====================
if (!config.api.apiKey) {
  console.error('❌ 错误: API_KEY 未配置')
  console.error('当前 NODE_ENV:', process.env.NODE_ENV)
  console.error('尝试加载的文件:', envPath)
  console.error('文件是否存在:', fs.existsSync(envPath))
  process.exit(1)
}

// JWT 密钥安全检查（仅警告）
if (config.jwt.secret === 'your-secret-key-change-in-production') {
  console.warn('⚠️  警告: JWT_SECRET 使用默认值，生产环境请务必修改！')
}

module.exports = config
