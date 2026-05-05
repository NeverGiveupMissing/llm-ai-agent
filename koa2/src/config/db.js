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
  
  // 如果是连接被拒绝的错误，提供更明确的提示
  if (err.code === 'ECONNREFUSED') {
    console.error('⚠️  请检查：')
    console.error('   1. PostgreSQL 服务是否正在运行')
    console.error(`   2. 数据库地址是否正确: ${config.database.host}:${config.database.port}`)
    console.error('   3. 防火墙设置是否允许连接')
  }
})

/**
 * 优雅关闭连接池
 */
process.on('SIGINT', async () => {
  await pool.end()
  console.log('✅ PostgreSQL 连接池已关闭')
  process.exit(0)
})

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
async function testConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ 数据库连接测试成功')
    return true
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message)
    
    // 提供更详细的错误信息
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  数据库连接被拒绝，请检查：')
      console.error(`   - 主机: ${config.database.host}`)
      console.error(`   - 端口: ${config.database.port}`)
      console.error(`   - 数据库: ${config.database.database}`)
      console.error('   - PostgreSQL 服务是否正在运行？')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  数据库连接超时，请检查网络连接')
    } else if (error.code === 'ENOTFOUND') {
      console.error('⚠️  数据库主机名无法解析，请检查主机地址')
    }
    
    return false
  }
}

module.exports = { pool, testConnection }
