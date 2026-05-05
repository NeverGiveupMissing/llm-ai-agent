/**
 * 数据库管理 API
 * 路径：src/api/database.js
 */

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 执行 SQL 语句
 * @param {string} sql - SQL 语句
 * @returns {Promise} 执行结果
 */
export function executeSQL(sql) {
  return axios.post(`${API_PREFIX}/database/execute`, { sql })
}

/**
 * 获取所有表名列表
 * @returns {Promise} 表名数组
 */
export function getTableList() {
  return axios.get(`${API_PREFIX}/database/tables`)
}

/**
 * 获取指定表的字段结构（旧接口，保留兼容）
 * @param {string} tableName - 表名
 * @returns {Promise} 字段结构数组
 */
export function getTableStructure(tableName) {
  return axios.get(`${API_PREFIX}/database/tables/${tableName}`)
}

/**
 * 获取表详细信息（字段 + 注释 + 索引）
 * @param {string} tableName - 表名
 * @returns {Promise} 表详细信息 { tableName, columns, indexes }
 */
export function getTableDetail(tableName) {
  return axios.get(`${API_PREFIX}/database/tables/${tableName}/detail`)
}

/**
 * 导出数据库
 * @returns {Promise} 数据库备份文件（Blob）
 */
export function exportDatabase() {
  return axios.download.get(`${API_PREFIX}/database/export`)
}

/**
 * 导入数据库（执行 SQL 文件）
 * @param {File} file - SQL 文件
 * @returns {Promise} 导入结果
 */
export function importDatabase(file) {
  const formData = new FormData()
  formData.append('file', file)
  return axios.upload(`${API_PREFIX}/database/import`, formData)
}

/**
 * 获取表数据（分页）
 * @param {string} tableName - 表名
 * @param {Object} params - 查询参数 { page, pageSize }
 * @returns {Promise} 表数据
 */
export function getTableData(tableName, params = {}) {
  return axios.get(`${API_PREFIX}/database/tables/${tableName}/data`, {
    params,
  })
}

/**
 * 更新单行数据
 * @param {string} tableName - 表名
 * @param {Object} data - { primaryKey, primaryValue, updates }
 * @returns {Promise} 更新结果
 */
export function updateTableRow(tableName, data) {
  return axios.put(`${API_PREFIX}/database/tables/${tableName}/row`, data)
}

/**
 * 删除单行数据
 * @param {string} tableName - 表名
 * @param {Object} data - { primaryKey, primaryValue }
 * @returns {Promise} 删除结果
 */
export function deleteTableRow(tableName, data) {
  return axios.delete(`${API_PREFIX}/database/tables/${tableName}/row`, { data })
}
