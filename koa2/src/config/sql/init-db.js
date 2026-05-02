// 说明：数据库初始化脚本 - 自动创建所有必需的表（仅在表不存在时创建）

const { pool } = require('../db')
const constants = require('../constants')

// 导入各个 SQL 执行模块
const initMemoriesTable = require('./init-memories-table')
const initChatSessionsTable = require('./init-chat-sessions-table')
const initChatMemoriesTable = require('./init-chat-memories-table')
const initChatMessagesTable = require('./init-chat-messages-table')
const initSessionGroupsTable = require('./init-session-groups-table')
const initRbacTables = require('./init-rbac-tables')
const initDefaultData = require('./init-default-data')
const initDatabaseManagement = require('./init-database-management')

/**
 * 初始化所有数据库表
 * 使用 IF NOT EXISTS 确保只在表不存在时才创建
 */
async function initDatabase() {
  console.log('🚀 开始初始化数据库...')

  try {
    // ============================================
    // 1. 启用 vector 扩展（用于向量搜索）
    // ============================================
    console.log('📦 检查 vector 扩展...')
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✅ vector 扩展已就绪')

    // ============================================
    // 2-7. 创建聊天相关表
    // ============================================
    await initMemoriesTable()
    await initChatSessionsTable()
    await initChatMemoriesTable()
    await initChatMessagesTable()
    await initSessionGroupsTable()

    // ============================================
    // 8-13. 创建 RBAC 权限系统表
    // ============================================
    await initRbacTables()

    // ============================================
    // 14. 插入默认数据
    // ============================================
    await initDefaultData()

    // ============================================
    // 15. 初始化数据库管理模块权限
    // ============================================
    await initDatabaseManagement()

    console.log('🎉 数据库初始化完成！所有表和初始数据已就绪')
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
    console.error('详细错误:', error)
    throw error
  }
}

module.exports = { initDatabase }

// 如果直接运行此脚本（如 npm run db:init），则执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ 初始化完成，进程退出')
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ 初始化失败:', err)
      process.exit(1)
    })
}
