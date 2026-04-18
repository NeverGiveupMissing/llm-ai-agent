require('dotenv').config()
const path = require('path')

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
require('dotenv').config({ path: path.join(process.cwd(), envFile) })

/**
 * @type {Object} Config
 * @property {Object} api - AI API 配置
 * @property {string} api.apiKey - API 密钥
 * @property {string} api.baseUrl - API 基础 URL
 * @property {string} api.model - 模型名称
 * @property {Object} server - 服务器配置
 * @property {string} server.host - 主机地址
 * @property {number} server.port - 端口
 * @property {string} server.env - 环境
 * @property {Object} log - 日志配置
 * @property {string} log.dir - 日志目录
 */
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
}

if (!config.api.apiKey) {
  console.error('错误: API_KEY 未配置')
  process.exit(1)
}

module.exports = config
