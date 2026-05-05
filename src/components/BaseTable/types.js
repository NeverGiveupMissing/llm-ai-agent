/**
 * BaseTable 类型定义
 */

/**
 * 列配置接口
 */
export const ColumnTypes = {
  /** 序号列 */
  INDEX: 'index',
  /** 标签列 */
  TAG: 'tag',
  /** 日期时间列 */
  DATETIME: 'datetime',
  /** 操作列 */
  ACTIONS: 'actions',
}

/**
 * 标签映射配置
 */
export const TagMapType = {
  text: String,
  type: String, // 'default' | 'success' | 'warning' | 'error' | 'info'
}

/**
 * 操作按钮配置
 */
export const ActionConfig = {
  label: String,
  type: String, // 'primary' | 'info' | 'success' | 'warning' | 'error' | 'default'
  permission: String,
  show: Function, // (row) => boolean
  onClick: Function, // (row) => void
}
