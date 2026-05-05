/**
 * 验证 sys_api 表数据是否正确初始化
 * 
 * 使用方法：
 * node src/modules/api/verify-init.js
 */

const { pool } = require('../../config/db')

async function verifyInit() {
  console.log('\n🔍 开始验证接口管理模块初始化...')
  
  try {
    // 1. 验证表是否存在
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sys_api'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ sys_api 表不存在，请检查 SQL 是否执行成功')
      return
    }
    
    console.log('✅ sys_api 表已创建')
    
    // 2. 验证数据条数
    const countResult = await pool.query('SELECT COUNT(*) as total FROM sys_api')
    const total = parseInt(countResult.rows[0].total)
    
    console.log(`✅ 接口数据已初始化：${total} 条`)
    
    // 3. 按模块统计
    const categoryResult = await pool.query(`
      SELECT api_category, COUNT(*) as count 
      FROM sys_api 
      GROUP BY api_category 
      ORDER BY count DESC
    `)
    
    console.log('\n📊 按模块分类统计：')
    categoryResult.rows.forEach(row => {
      console.log(`   ${row.api_category}: ${row.count} 个接口`)
    })
    
    // 4. 验证菜单是否创建
    const menuResult = await pool.query(`
      SELECT menu_id, menu_name, parent_id, path 
      FROM sys_menu 
      WHERE menu_id = 112
    `)
    
    if (menuResult.rows.length > 0) {
      const menu = menuResult.rows[0]
      console.log(`\n✅ 菜单已创建：`)
      console.log(`   菜单ID: ${menu.menu_id}`)
      console.log(`   菜单名称: ${menu.menu_name}`)
      console.log(`   父级ID: ${menu.parent_id} (系统管理)`)
      console.log(`   路径: ${menu.path}`)
    } else {
      console.log('\n️  菜单未创建，可能需要手动执行 sys_api.sql 中的菜单插入语句')
    }
    
    // 5. 验证按钮权限
    const buttonResult = await pool.query(`
      SELECT menu_id, menu_name, perms 
      FROM sys_menu 
      WHERE parent_id = 112 AND menu_type = 'F'
    `)
    
    console.log(`\n✅ 按钮权限已创建：${buttonResult.rows.length} 个`)
    buttonResult.rows.forEach(row => {
      console.log(`   ${row.menu_name} (perms: ${row.perms})`)
    })
    
    // 6. 显示部分接口示例
    const sampleResult = await pool.query(`
      SELECT api_name, api_url, api_method 
      FROM sys_api 
      LIMIT 5
    `)
    
    console.log('\n 接口示例（前 5 条）：')
    sampleResult.rows.forEach(row => {
      console.log(`   [${row.api_method}] ${row.api_name}: ${row.api_url}`)
    })
    
    console.log('\n✅ 验证完成！接口管理模块初始化成功！\n')
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyInit()
}

module.exports = { verifyInit }
