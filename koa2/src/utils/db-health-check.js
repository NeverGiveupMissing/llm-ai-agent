/**
 * 数据库健康检查工具
 * 用于检测数据库连接状态并提供友好的错误提示
 */

const { pool } = require('../config/db')
const config = require('../config')

/**
 * 检查数据库连接状态
 * @returns {Promise<Object>} 连接状态信息
 */
async function checkDatabaseHealth() {
  const healthStatus = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    details: {},
  }

  try {
    // 尝试获取客户端并执行简单查询
    const client = await pool.connect()
    
    // 测试查询
    const queryStart = Date.now()
    await client.query('SELECT 1 as test')
    const queryDuration = Date.now() - queryStart
    
    client.release()
    
    healthStatus.status = 'healthy'
    healthStatus.details = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      responseTime: `${queryDuration}ms`,
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    }
  } catch (error) {
    healthStatus.status = 'unhealthy'
    healthStatus.details = {
      error: error.message,
      code: error.code,
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
    }
    
    // 根据错误类型提供更具体的建议
    if (error.code === 'ECONNREFUSED') {
      healthStatus.details.suggestion = 'PostgreSQL 服务未运行或端口不正确'
    } else if (error.code === 'ETIMEDOUT') {
      healthStatus.details.suggestion = '网络连接超时，请检查防火墙设置'
    } else if (error.code === 'ENOTFOUND') {
      healthStatus.details.suggestion = '数据库主机名无法解析'
    } else if (error.code === 'ECONNRESET') {
      healthStatus.details.suggestion = '连接被重置，可能是网络问题或服务器重启'
    }
  }

  return healthStatus
}

/**
 * 格式化健康检查结果为可读字符串
 * @param {Object} healthStatus - 健康检查结果
 * @returns {string} 格式化的状态信息
 */
function formatHealthStatus(healthStatus) {
  const lines = [
    `📊 数据库健康状态: ${healthStatus.status === 'healthy' ? '✅ 正常' : '❌ 异常'}`,
    `⏰ 检查时间: ${new Date(healthStatus.timestamp).toLocaleString('zh-CN')}`,
  ]

  if (healthStatus.status === 'healthy') {
    lines.push(`🌐 主机: ${healthStatus.details.host}:${healthStatus.details.port}`)
    lines.push(`💾 数据库: ${healthStatus.details.database}`)
    lines.push(`⚡ 响应时间: ${healthStatus.details.responseTime}`)
    lines.push(`🔗 连接池: 总数=${healthStatus.details.connections.total}, 空闲=${healthStatus.details.connections.idle}, 等待=${healthStatus.details.connections.waiting}`)
  } else {
    lines.push(`🌐 主机: ${healthStatus.details.host}:${healthStatus.details.port}`)
    lines.push(`💾 数据库: ${healthStatus.details.database}`)
    lines.push(`❌ 错误代码: ${healthStatus.details.code || 'N/A'}`)
    lines.push(`❌ 错误信息: ${healthStatus.details.error}`)
    if (healthStatus.details.suggestion) {
      lines.push(`💡 建议: ${healthStatus.details.suggestion}`)
    }
  }

  return lines.join('\n')
}

module.exports = {
  checkDatabaseHealth,
  formatHealthStatus,
}
