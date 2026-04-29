// ==================== 系统常量定义 ====================

// AI API 配置常量
const AI_API_CONFIG = {
  DEFAULT_BASE_URL: 'https://api.moonshot.cn/v1',
  DEFAULT_MODEL: 'moonshot-v1-8k',
  DEFAULT_EMBEDDING_MODEL: 'text-embedding-ada-002',
}

// 服务器配置常量
const SERVER_CONFIG = {
  DEFAULT_HOST: '127.0.0.1',
  DEFAULT_PORT: 8000,
  DEFAULT_PREFIX: '/koa2api',
}

// 日志配置常量
const LOG_CONFIG = {
  DEFAULT_DIR: 'logs/chat_history',
}

// 数据库配置常量
const DB_CONFIG = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: 5432,
  DEFAULT_USER: 'postgres',
  DEFAULT_NAME: 'postgres',
}

// 记忆模块配置常量
const DEFAULT_MEMORY_CONFIG = {
  MAX_RETRIEVE_COUNT: 5,
  MIN_SIMILARITY: 0.7,
  MAX_MEMORIES_PER_USER: 100,
}

module.exports = {
  AI_API_CONFIG,
  SERVER_CONFIG,
  LOG_CONFIG,
  DB_CONFIG,
  DEFAULT_MEMORY_CONFIG,
}
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
}

// ==================== 配置验证 ====================
if (!config.api.apiKey) {
  console.error('❌ 错误: API_KEY 未配置')
  console.error('当前 NODE_ENV:', process.env.NODE_ENV)
  console.error('尝试加载的文件:', envPath)
  console.error('文件是否存在:', fs.existsSync(envPath))
  process.exit(1)
}

module.exports = config
