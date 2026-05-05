/**
 * 接口管理模块数据库初始化脚本
 * 
 * 使用方法：
 * node src/modules/api/init-db.js
 */

const fs = require('fs')
const path = require('path')
const { pool } = require('../../config/db')

async function initDatabase() {
  console.log('开始初始化接口管理数据库...')
  
  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../../../database/sql/sys_interface.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // 执行 SQL
    await pool.query(sql)
    
    console.log('✅ 接口管理数据库初始化完成！')
    console.log('   - 已创建 sys_interface 表')
    console.log('   - 已初始化 30+ 条接口数据')
    console.log('   - 已创建接口管理菜单')
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
}

module.exports = { initDatabase }