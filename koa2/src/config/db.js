const path = require('path')
// 显式指定 .env 文件的绝对路径，确保 100% 能读取到
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const { Pool } = require('pg')

// 打印一下读取到的环境变量，方便调试
console.log(' 尝试连接数据库...')
console.log('   主机:', process.env.DB_HOST)
console.log('   密码长度:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : '未读取到(空)')

const pool = new Pool({
  host: process.env.DB_HOST || '8.153.193.2',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
})

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()')
    console.log('✅ 成功连接 PostgreSQL!', res.rows[0])

    const vectorCheck = await pool.query(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'",
    )
    if (vectorCheck.rows.length > 0) {
      console.log('✅ pgvector 扩展已启用')
    } else {
      console.log('⚠️ pgvector 扩展未启用')
    }

    return true
  } catch (err) {
    console.error('❌ 连接数据库失败:', err.message)
    console.error('错误代码:', err.code)
    return false
  }
}

module.exports = { pool, testConnection }

if (require.main === module) {
  testConnection()
}
