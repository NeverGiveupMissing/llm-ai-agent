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
 * @param {string} user_id - 用户ID
 * @param {string} user_name - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 执行结果
 */
async function executeSQL(sql, user_id, user_name, ipAddress) {
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
        columns: result.fields ? result.fields.map((f) => f.name) : [],
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

  // 1. 检测是否为数据库管理工具的批量 DDL 操作（安全的结构定义语句）
  // 允许：COMMENT ON, CREATE TABLE/INDEX/VIEW, ALTER TABLE, GRANT/REVOKE 等
  const safeDDLPatterns = [
    /^\s*COMMENT\s+ON\s+/i,
    /^\s*CREATE\s+(TABLE|INDEX|VIEW|SEQUENCE|FUNCTION|TRIGGER)/i,
    /^\s*ALTER\s+(TABLE|INDEX|VIEW|SEQUENCE|FUNCTION)/i,
    /^\s*DROP\s+(INDEX|VIEW|SEQUENCE|FUNCTION|TRIGGER)/i, // 允许删除非表对象
    /^\s*GRANT\s+/i,
    /^\s*REVOKE\s+/i,
    /^\s*INSERT\s+INTO\s+pg_catalog/i, // 系统表操作
  ]

  const isSafeBatchDDL = safeDDLPatterns.some((pattern) => pattern.test(upperSQL))

  // 2. 生产环境高危操作限制
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // 禁止删除数据库和Schema（最高危）
    if (/DROP\s+(DATABASE|SCHEMA)/i.test(sql)) {
      throw new Error('安全限制：禁止删除数据库或Schema')
    }

    // 禁止删除表（高危，保留DROP INDEX/VIEW等）
    if (/DROP\s+TABLE/i.test(sql)) {
      throw new Error('安全限制：生产环境禁止删除表')
    }

    // 禁止TRUNCATE（清空表）
    if (/^\s*TRUNCATE/i.test(sql)) {
      throw new Error('安全限制：生产环境禁止执行 TRUNCATE')
    }

    // 禁止无WHERE条件的DELETE
    if (/^\s*DELETE/i.test(sql) && !/WHERE/i.test(sql)) {
      throw new Error('安全限制：DELETE 语句必须包含 WHERE 条件')
    }

    // 禁止无WHERE条件的UPDATE
    if (/^\s*UPDATE/i.test(sql) && !/WHERE/i.test(sql)) {
      throw new Error('安全限制：UPDATE 语句必须包含 WHERE 条件')
    }

    // 禁止危险的WHERE条件（1=1 全表匹配）
    if (/(DELETE|UPDATE)[\s\S]+WHERE\s+1\s*=\s*1/i.test(sql)) {
      throw new Error('安全限制：禁止使用 WHERE 1=1 的危险操作')
    }
  }

  // 以下限制无论环境都生效
  // 禁止用户权限操作
  if (/CREATE\s+USER|DROP\s+USER|ALTER\s+USER/i.test(sql)) {
    throw new Error('安全限制：禁止执行用户权限管理语句')
  }

  if (/\bGRANT\b|\bREVOKE\b/i.test(sql)) {
    throw new Error('安全限制：禁止执行权限分配语句')
  }

  // 禁止多条语句（优化：排除字符串中的分号）
  if (!isSafeBatchDDL) {
    const semicolonCount = sql
      .replace(/'[^']*'/g, '')
      .split(';')
      .filter((s) => s.trim()).length
    if (semicolonCount > 1) {
      throw new Error('安全限制：每次只能执行一条 SQL 语句')
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
 * @param {string} user_id - 用户ID
 * @param {string} user_name - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 导入结果
 */
async function importDatabase(filePath, fileName, user_id, user_name, ipAddress) {
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
 * @param {string} user_id - 用户ID
 * @param {string} user_name - 用户名
 * @param {string} ipAddress - IP地址
 * @returns {Object} 包含 zip 文件路径和文件名
 */
async function exportDatabase(user_id, user_name, ipAddress) {
  const startTime = Date.now()
  // 生成时间戳：YYYY-MM-DD_HH-mm-ss
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`

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

    // 2. 使用 Node.js 方式导出数据库（无需 pg_dump）
    console.log('📦 开始导出数据库...')
    await exportDatabaseByNode(sqlFilePath)
    console.log('✅ 数据库导出完成')

    // 3. 验证 SQL 文件是否生成
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('数据库导出失败：SQL文件未生成')
    }

    // 4. 将 SQL 文件压缩为 zip
    await compressToZip(sqlFilePath, zipFilePath)

    // 5. 删除临时 SQL 文件
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

    console.error('数据库导出失败:', err)
    throw new Error(`数据库导出失败: ${err.message}`)
  }
}

/**
 * 使用 Node.js 方式导出数据库（生成标准 PostgreSQL SQL 格式）
 * @param {string} outputPath - 输出文件路径
 */
async function exportDatabaseByNode(outputPath) {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ai_agent_platform',
  }

  // 创建一个新的连接池用于导出
  const { Pool } = require('pg')
  const exportPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
  })

  try {
    let sqlContent = ''

    // 文件头
    sqlContent += '--\n'
    sqlContent += '-- PostgreSQL database dump\n'
    sqlContent += '--\n\n'
    sqlContent += `-- Dumped from database version ${await getPostgresVersion(exportPool)}\n`
    sqlContent += `-- Dumped at ${new Date().toISOString()}\n\n`
    sqlContent += 'SET statement_timeout = 0;\n'
    sqlContent += 'SET lock_timeout = 0;\n'
    sqlContent += "SET client_encoding = 'UTF8';\n"
    sqlContent += 'SET standard_conforming_strings = on;\n'
    sqlContent += 'SET check_function_bodies = false;\n'
    sqlContent += 'SET client_min_messages = warning;\n\n'

    // 1. 导出扩展
    console.log('  📦 导出扩展...')
    sqlContent += await exportExtensions(exportPool)

    // 2. 导出表结构
    console.log('  📋 导出表结构...')
    sqlContent += await exportTableStructuresStandard(exportPool)

    // 3. 导出数据
    console.log('  💾 导出数据...')
    sqlContent += await exportTableDataStandard(exportPool)

    // 4. 导出序列
    console.log('  🔢 导出序列...')
    sqlContent += await exportSequences(exportPool)

    // 5. 导出索引
    console.log('  📑 导出索引...')
    sqlContent += await exportIndexesStandard(exportPool)

    // 6. 导出外键约束
    console.log('  🔗 导出外键约束...')
    sqlContent += await exportConstraintsStandard(exportPool)

    // 7. 导出触发器
    console.log('  ⚡ 导出触发器...')
    sqlContent += await exportTriggersStandard(exportPool)

    // 8. 导出视图
    console.log('  👁️ 导出视图...')
    sqlContent += await exportViewsStandard(exportPool)

    sqlContent += '\n--\n-- PostgreSQL database dump complete\n--\n'

    // 写入文件
    fs.writeFileSync(outputPath, sqlContent, 'utf8')
    console.log('✅ Node.js 方式导出完成')
  } finally {
    await exportPool.end()
  }
}

/**
 * 获取 PostgreSQL 版本
 */
async function getPostgresVersion(pool) {
  try {
    const result = await pool.query('SELECT version()')
    return result.rows[0].version.split(',')[0]
  } catch (err) {
    return 'unknown'
  }
}

/**
 * 导出扩展
 */
async function exportExtensions(pool) {
  let sql = '--\n-- Extensions\n--\n\n'

  const result = await pool.query(`
    SELECT extname FROM pg_extension WHERE extname != 'plpgsql'
  `)

  for (const row of result.rows) {
    sql += `CREATE EXTENSION IF NOT EXISTS "${row.extname}";\n\n`
  }

  return sql
}

/**
 * 导出表结构（标准格式）
 */
async function exportTableStructuresStandard(pool) {
  let sql = '\n--\n-- Name: TABLE; Type: TABLE; Schema: public; Owner: -\n--\n\n'

  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  for (const table of tables.rows) {
    const tableName = table.table_name

    // 获取列信息
    const columns = await pool.query(
      `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `,
      [tableName],
    )

    sql += `CREATE TABLE "${tableName}" (\n`

    const columnDefs = []
    for (const col of columns.rows) {
      let colDef = `    "${col.column_name}" `

      // 数据类型
      if (col.udt_name === 'uuid') {
        colDef += 'uuid'
      } else if (col.udt_name === 'timestamp with time zone') {
        colDef += 'timestamp with time zone'
      } else if (col.udt_name === 'timestamp without time zone') {
        colDef += 'timestamp without time zone'
      } else if (col.data_type === 'character varying') {
        colDef += `character varying(${col.character_maximum_length})`
      } else if (col.data_type === 'text') {
        colDef += 'text'
      } else if (col.data_type === 'integer') {
        colDef += 'integer'
      } else if (col.data_type === 'bigint') {
        colDef += 'bigint'
      } else if (col.data_type === 'boolean') {
        colDef += 'boolean'
      } else if (col.data_type === 'json' || col.data_type === 'jsonb') {
        colDef += col.udt_name
      } else {
        colDef += col.udt_name
      }

      // 默认值
      if (col.column_default) {
        colDef += ` DEFAULT ${col.column_default}`
      }

      // 非空约束
      if (col.is_nullable === 'NO') {
        colDef += ' NOT NULL'
      }

      columnDefs.push(colDef)
    }

    sql += columnDefs.join(',\n')
    sql += '\n);\n\n'
  }

  return sql
}

/**
 * 导出数据（标准 COPY 格式）
 */
async function exportTableDataStandard(pool) {
  let sql =
    '\n--\n-- Data for Name: various tables; Type: TABLE DATA; Schema: public; Owner: -\n--\n\n'

  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  for (const table of tables.rows) {
    const tableName = table.table_name

    try {
      const result = await pool.query(`SELECT * FROM "${tableName}"`)

      console.log(`    📋 ${tableName}: ${result.rows.length} 条记录`)

      if (result.rows.length === 0) {
        continue
      }

      sql += `COPY "${tableName}" (${result.fields.map((f) => `"${f.name}"`).join(', ')}) FROM stdin;\n`

      for (const row of result.rows) {
        const values = result.fields.map((field) => {
          const value = row[field.name]
          if (value === null) return '\\N'
          if (typeof value === 'boolean') return value ? 't' : 'f'
          if (value instanceof Date) {
            // 格式化日期为 PostgreSQL 标准格式
            return value
              .toISOString()
              .replace('T', ' ')
              .replace(/\.\d{3}Z$/, '')
          }
          if (typeof value === 'object') {
            // JSON/JSONB 类型
            return JSON.stringify(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          }
          // 字符串转义
          return String(value)
            .replace(/\\/g, '\\\\')
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
        })
        sql += values.join('\t') + '\n'
      }

      sql += '\\.\n\n'
    } catch (err) {
      console.error(`❌ 导出表 ${tableName} 数据失败:`, err.message)
      console.error('   详细错误:', err)
    }
  }

  return sql
}

/**
 * 导出序列
 */
async function exportSequences(pool) {
  let sql = '\n--\n-- Name: SEQUENCE; Type: SEQUENCE; Schema: public; Owner: -\n--\n\n'

  try {
    const sequences = await pool.query(`
      SELECT 
        sequence_name,
        start_value,
        increment,
        minimum_value AS min_value,
        maximum_value AS max_value
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `)

    for (const seq of sequences.rows) {
      sql += `CREATE SEQUENCE "${seq.sequence_name}"\n`
      sql += `    START WITH ${seq.start_value}\n`
      sql += `    INCREMENT BY ${seq.increment}\n`
      sql += `    MINVALUE ${seq.min_value}\n`
      sql += `    MAXVALUE ${seq.max_value}\n`
      sql += `    CACHE 1;\n\n`
    }
  } catch (err) {
    console.warn('⚠️ 导出序列失败:', err.message)
  }

  return sql
}

/**
 * 导出索引（标准格式）
 */
async function exportIndexesStandard(pool) {
  let sql = '\n--\n-- Name: INDEX; Type: INDEX; Schema: public; Owner: -\n--\n\n'

  const indexes = await pool.query(`
    SELECT
      i.relname AS index_name,
      t.relname AS table_name,
      ix.indisprimary AS is_primary,
      ix.indisunique AS is_unique,
      pg_get_indexdef(ix.indexrelid) AS index_def
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    WHERE t.relnamespace = 'public'::regnamespace
    ORDER BY t.relname, i.relname
  `)

  for (const idx of indexes.rows) {
    if (idx.is_primary) {
      // 主键在建表时已经定义，这里跳过
      continue
    }
    sql += `${idx.index_def};\n\n`
  }

  return sql
}

/**
 * 导出约束（标准格式）
 */
async function exportConstraintsStandard(pool) {
  let sql = '\n--\n-- Name: CONSTRAINT; Type: CONSTRAINT; Schema: public; Owner: -\n--\n\n'

  // 主键约束
  const pks = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  `)

  for (const pk of pks.rows) {
    sql += `ALTER TABLE ONLY "${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY ("${pk.column_name}");\n\n`
  }

  // 唯一约束
  const uniques = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
  `)

  for (const uq of uniques.rows) {
    sql += `ALTER TABLE ONLY "${uq.table_name}" ADD CONSTRAINT "${uq.constraint_name}" UNIQUE ("${uq.column_name}");\n\n`
  }

  // 外键约束
  const fks = await pool.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `)

  for (const fk of fks.rows) {
    sql += `ALTER TABLE ONLY "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}");\n\n`
  }

  return sql
}

/**
 * 导出触发器（标准格式）
 */
async function exportTriggersStandard(pool) {
  let sql = '\n--\n-- Name: TRIGGER; Type: TRIGGER; Schema: public; Owner: -\n--\n\n'

  const triggers = await pool.query(`
    SELECT
      trigger_name,
      event_manipulation,
      event_object_table,
      action_statement,
      action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  `)

  for (const trigger of triggers.rows) {
    sql += `${trigger.action_statement};\n\n`
  }

  return sql
}

/**
 * 导出视图（标准格式）
 */
async function exportViewsStandard(pool) {
  let sql = '\n--\n-- Name: VIEW; Type: VIEW; Schema: public; Owner: -\n--\n\n'

  const views = await pool.query(`
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
  `)

  for (const view of views.rows) {
    sql += `CREATE VIEW "${view.table_name}" AS\n${view.view_definition};\n\n`
  }

  return sql
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
    return result.rows.map((row) => row.table_name)
  } catch (err) {
    console.error('获取表列表失败:', err)
    throw new Error(`获取表列表失败: ${err.message}`)
  }
}

/**
 * 获取指定表的字段结构（不含注释和索引）
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
    return result.rows.map((row) => ({
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
 * 获取表详细信息（字段 + 注释 + 索引）
 * @param {string} tableName - 表名
 * @returns {Object} { tableName, columns, indexes }
 */
async function getTableDetail(tableName) {
  if (!tableName) {
    throw new Error('表名不能为空')
  }

  try {
    // 防止 SQL 注入
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('无效的表名')
    }

    // 1. 查询字段 + 注释
    const columnsQuery = `
      SELECT
        c.ordinal_position,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        COALESCE(pg_catalog.obj_description(pc.oid, 'pg_class'), '') AS table_comment,
        COALESCE(pg_catalog.col_description(pc.oid, c.ordinal_position::integer), '') AS comment
      FROM information_schema.columns c
      JOIN pg_catalog.pg_class pc ON pc.relname = c.table_name
      JOIN pg_catalog.pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = c.table_schema
      WHERE c.table_name = $1
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `

    const columnsResult = await pool.query(columnsQuery, [tableName])

    const columns = columnsResult.rows.map((row) => ({
      ordinal_position: row.ordinal_position,
      column_name: row.column_name,
      data_type: row.data_type,
      maxLength: row.character_maximum_length,
      isNullable: row.is_nullable === 'YES' ? '是' : '否',
      defaultValue: row.column_default || null,
      comment: row.comment || null,
    }))

    // 获取表注释（从第一行数据中取）
    const tableComment = columnsResult.rows[0]?.table_comment || null

    // 2. 查询索引
    const indexesQuery = `
      SELECT
        i.relname AS index_name,
        ix.indisprimary AS is_primary,
        ix.indisunique AS is_unique,
        array_agg(a.attname ORDER BY k.n) AS columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid
      JOIN generate_subscripts(ix.indkey, 1) AS k(n)
        ON a.attnum = ix.indkey[k.n]
      WHERE t.relname = $1
        AND t.relnamespace = 'public'::regnamespace
      GROUP BY i.relname, ix.indisprimary, ix.indisunique
      ORDER BY ix.indisprimary DESC, ix.indisunique DESC, i.relname
    `

    const indexesResult = await pool.query(indexesQuery, [tableName])

    const indexes = indexesResult.rows.map((row) => ({
      indexName: row.index_name,
      isPrimary: row.is_primary,
      isUnique: row.is_unique,
      columns: row.columns ? row.columns : [],
    }))

    return {
      tableName,
      tableComment,
      columns,
      indexes,
    }
  } catch (err) {
    console.error('获取表详细信息失败:', err)
    throw new Error(`获取表详细信息失败: ${err.message}`)
  }
}

/**
 * 获取表数据（分页）
 * @param {string} tableName - 表名
 * @param {number} page - 页码（从1开始）
 * @param {number} page_size - 每页条数
 * @returns {Object} { columns, rows, pagination, primaryKey }
 */
async function getTableData(tableName, page = 1, page_size = 50) {
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
    const offset = (page - 1) * page_size
    const dataQuery = `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`
    const dataResult = await pool.query(dataQuery, [page_size, offset])

    // 4. 获取列名
    const columns = dataResult.fields.map((f) => f.name)

    return {
      columns,
      rows: dataResult.rows,
      primaryKey,
      pagination: {
        page,
        page_size,
        total,
        totalPages: Math.ceil(total / page_size),
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
    const values = [...setFields.map((f) => updates[f]), primaryValue]

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
  getTableDetail,
  getTableData,
  updateRow,
  deleteRow,
}
