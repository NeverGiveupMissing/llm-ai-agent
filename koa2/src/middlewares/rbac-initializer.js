// 说明：RBAC 权限系统初始化检查器
// 在应用启动时检查 RBAC 表是否存在，如果不存在则提示用户运行迁移

const { pool } = require('../config/db')

/**
 * 检查 RBAC 系统是否已初始化
 */
async function checkRbacInitialized() {
  try {
    // 检查 sys_role 表是否存在且有数据
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sys_role'
      ) AS table_exists;
    `)
    
    const tableExists = result.rows[0].table_exists
    
    if (!tableExists) {
      console.log('⚠️  RBAC 权限系统表未检测到')
      console.log('💡 请运行以下命令初始化数据库（包含RBAC系统）:')
      console.log('   npm run db:init')
      console.log('')
      return false
    }
    
    // 检查是否已有角色数据（使用 sys_role 表）
    const rolesCount = await pool.query('SELECT COUNT(*) FROM sys_role WHERE del_flag = \'0\'')
    const roleCount = parseInt(rolesCount.rows[0].count)
    
    if (roleCount === 0) {
      console.log('⚠️  RBAC 权限系统表存在但无数据')
      console.log('💡 请运行以下命令初始化数据库（包含RBAC系统）:')
      console.log('   npm run db:init')
      console.log('')
      return false
    }
    
    console.log(`✅ RBAC 权限系统已初始化 (${roleCount} 个角色)`)
    return true
    
  } catch (error) {
    console.error('❌ 检查 RBAC 初始化状态失败:', error.message)
    return false
  }
}

module.exports = { checkRbacInitialized }