/**
 * 数据库管理 Service
 * 路径：koa2/src/modules/database/service.js
 */

const { pool } = require('../../config/db')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const archiver = require('archiver')
const util = require('util')
const execPromise = util.promisify(exec)

/**
 * 检查表中是否存在指定字段
 * @param {string} tableName - 表名
 * @param {string} columnName - 字段名
 * @returns {boolean} 是否存在
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = $1 
        AND table_schema = 'public'
        AND column_name = $2
    `
    const result = await pool.query(query, [tableName, columnName])
    return parseInt(result.rows[0].count) > 0
  } catch (err) {
    console.error('检查字段存在性失败:', err)
    return false
  }
}

/**
 * 执行 SQL 语句（包含安全检查）
 * @param {string} sql - SQL 语句
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 执行结果
 */
async function executeSQL(sql, userId, username, ipAddress) {
  // 1. 安全检查
  validateSQL(sql)

  const startTime = Date.now()

  try {
    // 2. 执行 SQL
    const result = await pool.query(sql)

    const executionTime = Date.now() - startTime

    // 5. 返回结果
    if (isSelectStatement(sql)) {
      // SELECT 语句：返回查询结果
      let rows = result.rows || []
      
      // 限制返回行数
      if (rows.length > 500) {
        rows = rows.slice(0, 500)
      }

      return {
        type: 'SELECT',
        columns: result.fields ? result.fields.map(f => f.name) : [],
        rows: rows,
        total: result.rowCount || 0,
        executionTime,
        message: `查询成功，返回 ${rows.length} 条记录`,
      }
    } else {
      // 非 SELECT 语句：返回影响行数
      return {
        type: 'NON_SELECT',
        affectedRows: result.rowCount || 0,
        executionTime,
        message: `执行成功，影响 ${result.rowCount || 0} 行`,
      }
    }
  } catch (err) {
    throw new Error(`SQL 执行失败: ${err.message}`)
  }
}

/**
 * SQL 安全验证
 * @param {string} sql - SQL 语句
 */
function validateSQL(sql) {
  const upperSQL = sql.toUpperCase().trim()

  // 1. 禁止执行多条语句（检测多个分号）
  const semicolonCount = (sql.match(/;/g) || []).length
  if (semicolonCount > 1) {
    throw new Error('安全限制：禁止执行多条 SQL 语句')
  }

  // 2. 生产环境安全限制
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // 禁止 DROP
    if (upperSQL.startsWith('DROP')) {
      throw new Error('安全限制：生产环境禁止执行 DROP 语句')
    }

    // 禁止 TRUNCATE
    if (upperSQL.startsWith('TRUNCATE')) {
      throw new Error('安全限制：生产环境禁止执行 TRUNCATE 语句')
    }

    // 禁止 DELETE 无 WHERE 条件
    if (upperSQL.startsWith('DELETE') && !upperSQL.includes('WHERE')) {
      throw new Error('安全限制：DELETE 语句必须包含 WHERE 条件')
    }

    // 禁止 ALTER
    if (upperSQL.startsWith('ALTER')) {
      throw new Error('安全限制：生产环境禁止执行 ALTER 语句')
    }

    // 禁止 CREATE USER
    if (upperSQL.includes('CREATE USER')) {
      throw new Error('安全限制：禁止执行 CREATE USER 语句')
    }

    // 禁止 GRANT
    if (upperSQL.includes('GRANT')) {
      throw new Error('安全限制：禁止执行 GRANT 语句')
    }

    // 禁止 REVOKE
    if (upperSQL.includes('REVOKE')) {
      throw new Error('安全限制：禁止执行 REVOKE 语句')
    }
  }

  // 3. 基本 SQL 注入检测（简单检测）
  const dangerousPatterns = [
    /;\s*DROP\s/i,
    /;\s*DELETE\s/i,
    /;\s*UPDATE\s/i,
    /;\s*INSERT\s/i,
    /;\s*ALTER\s/i,
    /;\s*TRUNCATE\s/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error('安全限制：检测到可疑的 SQL 注入模式')
    }
  }

  return true
}

/**
 * 判断是否为 SELECT 语句
 * @param {string} sql - SQL 语句
 * @returns {boolean}
 */
function isSelectStatement(sql) {
  const upperSQL = sql.toUpperCase().trim()
  return upperSQL.startsWith('SELECT') || upperSQL.startsWith('WITH')
}

/**
 * 导入数据库（执行 SQL 文件）
 * @param {string} filePath - SQL 文件路径
 * @param {string} fileName - 文件名
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 导入结果
 */
async function importDatabase(filePath, fileName, userId, username, ipAddress) {
  const startTime = Date.now()
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    dbname: process.env.DB_NAME || 'ai_agent_platform',
  }

  try {
    // 构建 psql 命令
    const psqlCommand = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.dbname} -f "${filePath}"`

    // 执行 SQL 文件
    const { stdout, stderr } = await execPromise(psqlCommand)

    const executionTime = Date.now() - startTime

    // 记录操作日志
    try {
      const operationLogger = require('../../middlewares/operation-logger')
      await operationLogger.logOperation({
        userId,
        username,
        module: 'database',
        action: 'import',
        description: `导入 SQL 文件: ${fileName}`,
        ipAddress,
        duration: executionTime,
      })
    } catch (logErr) {
      console.error('记录操作日志失败:', logErr)
    }

    // 删除临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return {
      success: true,
      fileName,
      executionTime,
      message: `导入成功，执行时间 ${executionTime}ms`,
    }
  } catch (err) {
    // 删除临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    throw new Error(`SQL 文件执行失败: ${err.message}`)
  }
}

/**
 * 导出数据库为 zip 文件
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 包含 zip 文件路径和文件名
 */
async function exportDatabase(userId, username, ipAddress) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const tempDir = path.join(__dirname, '../../../temp')
  const sqlFileName = `db_backup_${timestamp}.sql`
  const zipFileName = `db_backup_${timestamp}.zip`
  const sqlFilePath = path.join(tempDir, sqlFileName)
  const zipFilePath = path.join(tempDir, zipFileName)

  try {
    // 1. 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 3. 使用 pg_dump 导出数据库
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      dbname: process.env.DB_NAME || 'ai_agent_platform',
    }

    const dumpCommand = `PGPASSWORD=${dbConfig.password} pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.dbname} -f ${sqlFilePath}`

    console.log('执行 pg_dump 命令:', dumpCommand.replace(dbConfig.password, '***'))

    await execPromise(dumpCommand)

    // 4. 验证 SQL 文件是否生成
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('数据库导出失败：SQL文件未生成')
    }

    // 5. 将 SQL 文件压缩为 zip
    await compressToZip(sqlFilePath, zipFilePath)

    // 6. 删除临时 SQL 文件
    fs.unlinkSync(sqlFilePath)

    const exportTime = Date.now() - startTime

    return {
      filePath: zipFilePath,
      fileName: zipFileName,
      exportTime,
      message: '数据库导出成功',
    }
  } catch (err) {
    // 清理临时文件
    if (fs.existsSync(sqlFilePath)) {
      fs.unlinkSync(sqlFilePath)
    }
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath)
    }

    throw new Error(`数据库导出失败: ${err.message}`)
  }
}

/**
 * 将文件压缩为 zip
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出 zip 文件路径
 * @returns {Promise}
 */
function compressToZip(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 最大压缩级别
    })

    output.on('close', () => {
      console.log(`压缩完成: ${archive.pointer()} total bytes`)
      resolve()
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)
    archive.file(inputPath, { name: path.basename(inputPath) })
    archive.finalize()
  })
}

/**
 * 获取文件大小
 * @param {string} filePath - 文件路径
 * @returns {string} 格式化的文件大小
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath)
  const bytes = stats.size
  
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 获取所有用户表名列表
 * @returns {Array} 表名数组
 */
async function getTableList() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    const result = await pool.query(query)
    return result.rows.map(row => row.table_name)
  } catch (err) {
    console.error('获取表列表失败:', err)
    throw new Error(`获取表列表失败: ${err.message}`)
  }
}

/**
 * 获取指定表的字段结构
 * @param {string} tableName - 表名
 * @returns {Array} 字段结构数组
 */
async function getTableStructure(tableName) {
  if (!tableName) {
    throw new Error('表名不能为空')
  }

  try {
    // 防止 SQL 注入：验证表名只包含字母、数字、下划线
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('无效的表名')
    }

    const query = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = $1
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    const result = await pool.query(query, [tableName])
    
    // 格式化返回数据
    return result.rows.map(row => ({
      column_name: row.column_name,
      data_type: row.data_type,
      character_maximum_length: row.character_maximum_length,
      is_nullable: row.is_nullable === 'YES' ? '是' : '否',
      column_default: row.column_default || '-',
      ordinal_position: row.ordinal_position,
    }))
  } catch (err) {
    console.error('获取表结构失败:', err)
    throw new Error(`获取表结构失败: ${err.message}`)
  }
}

/**
 * 获取表数据（分页）
 * @param {string} tableName - 表名
 * @param {number} page - 页码（从1开始）
 * @param {number} pageSize - 每页条数
 * @returns {Object} { columns, rows, pagination, primaryKey }
 */
async function getTableData(tableName, page = 1, pageSize = 50) {
  if (!tableName) {
    throw new Error('表名不能为空')
  }

  // 防止 SQL 注入
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('无效的表名')
  }

  try {
    // 1. 查询表主键
    const pkQuery = `
      SELECT kcu.column_name 
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
      WHERE kcu.table_name = $1 
        AND kcu.table_schema = 'public'
        AND tc.constraint_type = 'PRIMARY KEY'
      LIMIT 1
    `
    const pkResult = await pool.query(pkQuery, [tableName])
    const primaryKey = pkResult.rows[0]?.column_name || null

    // 2. 查询总行数
    const countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`
    const countResult = await pool.query(countQuery)
    const total = parseInt(countResult.rows[0].total)

    // 3. 查询数据
    const offset = (page - 1) * pageSize
    const dataQuery = `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`
    const dataResult = await pool.query(dataQuery, [pageSize, offset])

    // 4. 获取列名
    const columns = dataResult.fields.map(f => f.name)

    return {
      columns,
      rows: dataResult.rows,
      primaryKey,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (err) {
    console.error('获取表数据失败:', err)
    throw new Error(`获取表数据失败: ${err.message}`)
  }
}

/**
 * 更新单行数据
 * @param {string} tableName - 表名
 * @param {string} primaryKey - 主键字段名
 * @param {*} primaryValue - 主键值
 * @param {Object} updates - 更新的字段和值 { field: value }
 * @returns {Object} 更新结果
 */
async function updateRow(tableName, primaryKey, primaryValue, updates) {
  if (!tableName || !primaryKey || !updates || Object.keys(updates).length === 0) {
    throw new Error('参数不完整')
  }

  // 防止 SQL 注入
  if (!/^[a-zA-Z0-9_]+$/.test(tableName) || !/^[a-zA-Z0-9_]+$/.test(primaryKey)) {
    throw new Error('无效的表名或字段名')
  }

  // 安全检查：不允许更新主键字段
  if (updates[primaryKey] !== undefined) {
    throw new Error('不允许更新主键字段')
  }

  try {
    // 构建 SET 语句
    const setFields = Object.keys(updates)
    
    // 检查表中是否有 updated_at 字段，如果有则自动更新
    const hasUpdatedAt = await checkColumnExists(tableName, 'updated_at')
    
    let setClauseParts = setFields.map((field, index) => `"${field}" = $${index + 1}`)
    
    // 如果有 updated_at 字段且未在 updates 中，自动添加
    if (hasUpdatedAt && !setFields.includes('updated_at')) {
      setClauseParts.push(`"updated_at" = NOW()`)
    }
    
    const setClause = setClauseParts.join(', ')

    // WHERE 条件 - 参数索引始终是 setFields.length + 1
    const whereClause = `"${primaryKey}" = $${setFields.length + 1}`

    // 准备参数值（NOW()是SQL函数，不需要传参）
    const values = [...setFields.map(f => updates[f]), primaryValue]

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause} RETURNING *`
    
    console.log('📝 执行 SQL:', query, values)
    const result = await pool.query(query, values)
    console.log('✅ 更新结果:', result.rowCount, '行受影响')
    if (result.rows && result.rows.length > 0) {
      console.log('📊 更新后的数据:', result.rows[0])
    }

    return {
      affectedRows: result.rowCount,
      message: `更新成功，影响 ${result.rowCount} 行`,
      updatedRow: result.rows[0] || null, // 返回更新后的数据
    }
  } catch (err) {
    console.error('更新行数据失败:', err)
    throw new Error(`更新行数据失败: ${err.message}`)
  }
}

/**
 * 删除单行数据
 * @param {string} tableName - 表名
 * @param {string} primaryKey - 主键字段名
 * @param {*} primaryValue - 主键值
 * @returns {Object} 删除结果
 */
async function deleteRow(tableName, primaryKey, primaryValue) {
  if (!tableName || !primaryKey || primaryValue === undefined || primaryValue === null) {
    throw new Error('参数不完整')
  }

  // 防止 SQL 注入
  if (!/^[a-zA-Z0-9_]+$/.test(tableName) || !/^[a-zA-Z0-9_]+$/.test(primaryKey)) {
    throw new Error('无效的表名或字段名')
  }

  try {
    const query = `DELETE FROM "${tableName}" WHERE "${primaryKey}" = $1`
    const result = await pool.query(query, [primaryValue])

    return {
      affectedRows: result.rowCount,
      message: `删除成功，影响 ${result.rowCount} 行`,
    }
  } catch (err) {
    console.error('删除行数据失败:', err)
    throw new Error(`删除行数据失败: ${err.message}`)
  }
}

module.exports = {
  executeSQL,
  validateSQL,
  isSelectStatement,
  exportDatabase,
  importDatabase,
  getTableList,
  getTableStructure,
  getTableData,
  updateRow,
  deleteRow,
}
