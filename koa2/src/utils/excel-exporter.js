/**
 * Excel 导出工具类
 * 文件路径：src/utils/excel-exporter.js
 * 用途：提供通用的 Excel 生成和下载功能
 */

const ExcelJS = require('exceljs')

/**
 * 创建 Excel 工作簿
 * @returns {ExcelJS.Workbook} Excel 工作簿实例
 */
function createWorkbook() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AI Agent System'
  workbook.created = new Date()
  return workbook
}

/**
 * 添加工作表并设置样式
 * @param {ExcelJS.Workbook} workbook - 工作簿实例
 * @param {string} sheetName - 工作表名称
 * @param {Array} headers - 表头数组 [{ header, key, width }]
 * @returns {ExcelJS.Worksheet} 工作表实例
 */
function addWorksheet(workbook, sheetName, headers) {
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: {
      defaultRowHeight: 25,
    },
  })

  // 设置表头
  worksheet.columns = headers.map((h) => ({
    header: h.header,
    key: h.key,
    width: h.width || 15,
  }))

  // 设置表头样式
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 30

  // 冻结首行
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  return worksheet
}

/**
 * 填充数据到工作表
 * @param {ExcelJS.Worksheet} worksheet - 工作表实例
 * @param {Array} data - 数据数组
 * @param {Object} options - 选项配置
 * @param {Function} options.rowStyle - 行样式函数 (row, data) => {}
 * @param {Function} options.cellFormat - 单元格格式化函数 (value, key, row) => formattedValue
 */
function fillData(worksheet, data, options = {}) {
  const { rowStyle, cellFormat } = options

  data.forEach((item, index) => {
    const row = worksheet.addRow(item)

    // 应用单元格格式化
    if (cellFormat) {
      worksheet.columns.forEach((col) => {
        const cell = row.getCell(col.key)
        cell.value = cellFormat(cell.value, col.key, item)
      })
    }

    // 应用行样式
    if (rowStyle) {
      rowStyle(row, item)
    }

    // 设置行高和对齐
    row.height = 25
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    })

    // 交替行颜色
    if ((index + 2) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' },
      }
    }
  })
}

/**
 * 生成 Excel 缓冲区
 * @param {ExcelJS.Workbook} workbook - 工作簿实例
 * @returns {Promise<Buffer>} Excel 文件的 Buffer
 */
async function generateBuffer(workbook) {
  return await workbook.xlsx.writeBuffer()
}

/**
 * 设置下载响应头
 * @param {Object} ctx - Koa 上下文
 * @param {string} filename - 文件名（不含扩展名）
 */
function setDownloadHeaders(ctx, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const fullFilename = `${filename}_${timestamp}.xlsx`

  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fullFilename)}`)
  ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  ctx.set('Pragma', 'no-cache')
  ctx.set('Expires', '0')
}

/**
 * 通用导出函数
 * @param {Object} ctx - Koa 上下文
 * @param {Object} config - 导出配置
 * @param {string} config.filename - 文件名（不含扩展名）
 * @param {string} config.sheetName - 工作表名称
 * @param {Array} config.headers - 表头配置 [{ header, key, width }]
 * @param {Array} config.data - 数据数组
 * @param {Object} config.options - 可选配置 { rowStyle, cellFormat }
 */
async function exportToExcel(ctx, config) {
  const { filename, sheetName, headers, data, options = {} } = config

  // 创建工作簿
  const workbook = createWorkbook()

  // 添加工作表
  const worksheet = addWorksheet(workbook, sheetName, headers)

  // 填充数据
  fillData(worksheet, data, options)

  // 生成 Buffer
  const buffer = await generateBuffer(workbook)

  // 设置响应头
  setDownloadHeaders(ctx, filename)

  // 发送响应
  ctx.body = buffer
}

/**
 * 多工作表导出
 * @param {Object} ctx - Koa 上下文
 * @param {string} filename - 文件名
 * @param {Array} sheets - 工作表配置数组 [{ sheetName, headers, data, options }]
 */
async function exportMultiSheet(ctx, filename, sheets) {
  const workbook = createWorkbook()

  sheets.forEach(({ sheetName, headers, data, options = {} }) => {
    const worksheet = addWorksheet(workbook, sheetName, headers)
    fillData(worksheet, data, options)
  })

  const buffer = await generateBuffer(workbook)
  setDownloadHeaders(ctx, filename)
  ctx.body = buffer
}

module.exports = {
  createWorkbook,
  addWorksheet,
  fillData,
  generateBuffer,
  setDownloadHeaders,
  exportToExcel,
  exportMultiSheet,
}
