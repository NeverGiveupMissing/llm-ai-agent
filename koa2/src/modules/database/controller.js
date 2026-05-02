/**
 * 数据库管理 Controller
 * 路径：koa2/src/modules/database/controller.js
 */

const databaseService = require('./service')
const fs = require('fs')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

/**
 * 执行 SQL 语句
 * POST /api/database/execute
 */
async function executeSQL(ctx) {
  try {
    const { sql } = ctx.request.body

    // 参数验证
    if (!sql || !sql.trim()) {
      ctx.status = 400
      ctx.body = { code: 400, message: 'SQL 语句不能为空', data: null }
      return
    }

    // 获取用户信息
    const userId = ctx.state.user?.id
    const username = ctx.state.user?.username
    const ipAddress = ctx.ip || ctx.request.ip

    // 执行 SQL（包含安全检查和日志记录）
    const result = await databaseService.executeSQL(
      sql.trim(),
      userId,
      username,
      ipAddress
    )

    // 返回结果
    ctx.body = { code: 200, message: 'success', data: result }
  } catch (err) {
    console.error('执行 SQL 失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || 'SQL 执行失败', data: null }
  }
}

/**
 * 导出数据库
 * GET /api/database/export
 */
async function exportDatabase(ctx) {
  try {
    // 获取用户信息
    const userId = ctx.state.user?.id
    const username = ctx.state.user?.username
    const ipAddress = ctx.ip || ctx.request.ip

    // 执行导出
    const result = await databaseService.exportDatabase(userId, username, ipAddress)

    // 设置响应头
    ctx.set('Content-Type', 'application/zip')
    ctx.set('Content-Disposition', `attachment; filename="${result.fileName}"`)

    // 读取文件并流式传输
    const fileStream = fs.createReadStream(result.filePath)
    ctx.body = fileStream

    // 文件传输完成后删除临时文件
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath)
      console.log(`临时文件已删除: ${result.filePath}`)
    })

    fileStream.on('error', (err) => {
      console.error('文件流错误:', err)
      // 如果发生错误，也要删除文件
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath)
      }
    })
  } catch (err) {
    console.error('导出数据库失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '数据库导出失败', data: null }
  }
}

/**
 * 导入数据库（执行 SQL 文件）
 * POST /api/database/import
 */
async function importDatabase(ctx) {
  try {
    const file = ctx.file

    if (!file) {
      ctx.status = 400
      ctx.body = { code: 400, message: '请上传 SQL 文件', data: null }
      return
    }

    // 验证文件类型
    if (!file.originalname.toLowerCase().endsWith('.sql')) {
      ctx.status = 400
      ctx.body = { code: 400, message: '只支持 .sql 格式的文件', data: null }
      return
    }

    // 验证文件大小（50MB）
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      ctx.status = 400
      ctx.body = { code: 400, message: '文件大小不能超过 50MB', data: null }
      return
    }

    // 获取用户信息
    const userId = ctx.state.user?.id
    const username = ctx.state.user?.username
    const ipAddress = ctx.ip || ctx.request.ip

    // 执行导入
    const result = await databaseService.importDatabase(
      file.path,
      file.originalname,
      userId,
      username,
      ipAddress
    )

    ctx.body = { code: 200, message: result.message, data: result }
  } catch (err) {
    console.error('导入数据库失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '数据库导入失败', data: null }
  }
}

/**
 * 获取所有表名列表
 * GET /api/database/tables
 */
async function getTableList(ctx) {
  try {
    const tables = await databaseService.getTableList()
    ctx.body = { code: 200, message: 'success', data: tables }
  } catch (err) {
    console.error('获取表列表失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '获取表列表失败', data: null }
  }
}

/**
 * 获取指定表的结构
 * GET /api/database/tables/:name
 */
async function getTableStructure(ctx) {
  try {
    const { name } = ctx.params
    
    if (!name) {
      ctx.status = 400
      ctx.body = { code: 400, message: '表名不能为空', data: null }
      return
    }

    const structure = await databaseService.getTableStructure(name)
    ctx.body = { code: 200, message: 'success', data: structure }
  } catch (err) {
    console.error('获取表结构失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '获取表结构失败', data: null }
  }
}

/**
 * 获取表数据（分页）
 * GET /api/database/tables/:name/data
 */
async function getTableData(ctx) {
  try {
    const { name } = ctx.params
    const { page = 1, pageSize = 50 } = ctx.query

    if (!name) {
      ctx.status = 400
      ctx.body = { code: 400, message: '表名不能为空', data: null }
      return
    }

    const data = await databaseService.getTableData(name, parseInt(page), parseInt(pageSize))
    ctx.body = { code: 200, message: 'success', data }
  } catch (err) {
    console.error('获取表数据失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '获取表数据失败', data: null }
  }
}

/**
 * 更新单行数据
 * PUT /api/database/tables/:name/row
 */
async function updateTableRow(ctx) {
  try {
    const { name } = ctx.params
    const { primaryKey, primaryValue, updates } = ctx.request.body

    if (!name || !primaryKey || primaryValue === undefined || !updates) {
      ctx.status = 400
      ctx.body = { code: 400, message: '参数不完整', data: null }
      return
    }

    const result = await databaseService.updateRow(name, primaryKey, primaryValue, updates)
    ctx.body = { code: 200, message: result.message, data: result }
  } catch (err) {
    console.error('更新行数据失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '更新行数据失败', data: null }
  }
}

/**
 * 删除单行数据
 * DELETE /api/database/tables/:name/row
 */
async function deleteTableRow(ctx) {
  try {
    const { name } = ctx.params
    const { primaryKey, primaryValue } = ctx.request.body

    if (!name || !primaryKey || primaryValue === undefined || primaryValue === null) {
      ctx.status = 400
      ctx.body = { code: 400, message: '参数不完整', data: null }
      return
    }

    const result = await databaseService.deleteRow(name, primaryKey, primaryValue)
    ctx.body = { code: 200, message: result.message, data: result }
  } catch (err) {
    console.error('删除行数据失败:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '删除行数据失败', data: null }
  }
}

module.exports = {
  executeSQL,
  exportDatabase,
  importDatabase,
  getTableList,
  getTableStructure,
  getTableData,
  updateTableRow,
  deleteTableRow,
}
