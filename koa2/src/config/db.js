const { Pool } = require('pg')
const config = require('./index')
const constants = require('./constants')

/**
 * PostgreSQL 数据库连接池
 */
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: constants.DB_CONFIG.MAX_CONNECTIONS,
  idleTimeoutMillis: constants.DB_CONFIG.IDLE_TIMEOUT,
  connectionTimeoutMillis: constants.DB_CONFIG.CONNECTION_TIMEOUT,
})

/**
 * 测试数据库连接
 */
pool.on('connect', () => {
  console.log('✅ PostgreSQL 连接成功')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 连接错误:', err.message)
})

/**
 * 优雅关闭连接池
 */
process.on('SIGINT', async () => {
  await pool.end()
  console.log('✅ PostgreSQL 连接池已关闭')
  process.exit(0)
})

module.exports = { pool }
