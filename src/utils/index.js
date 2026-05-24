/**
 * 通用工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期字符串，格式：YYYY-MM-DD HH:mm:ss
 * @returns {string} 如果日期无效，返回空字符串
 * 
 * @example
 * formatDate(new Date()) // '2026-05-10 15:30:45'
 * formatDate(1715337045000) // '2026-05-10 15:30:45'
 * formatDate('2026-05-10') // '2026-05-10 00:00:00'
 */
export function formatDate(date) {
  if (!date) return ''
  
  // 转换为 Date 对象（使用 instanceof 优先判断，避免误判普通对象）
  const dateObj = date instanceof Date ? date : new Date(date)
  
  // 验证日期是否有效
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date)
    return ''
  }
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式（不含时分秒）
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期字符串，格式：YYYY-MM-DD
 * 
 * @example
 * formatDateOnly(new Date()) // '2026-05-10'
 */
export function formatDateOnly(date) {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date)
    return ''
  }
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 HH:mm:ss 格式（仅时分秒）
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的时间字符串，格式：HH:mm:ss
 * 
 * @example
 * formatTimeOnly(new Date()) // '15:30:45'
 */
export function formatTimeOnly(date) {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date)
    return ''
  }
  
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 通用文件下载函数
 * @param {string|Blob} content - 文件内容（字符串或 Blob 对象）
 * @param {string} filename - 文件名（包含扩展名）
 * @param {string} mimeType - MIME 类型，例如 'text/markdown', 'text/plain', 'application/json'
 * 
 * @example
 * downloadFile('Hello World', 'hello.txt', 'text/plain')
 * downloadFile(jsonString, 'data.json', 'application/json')
 */
export function downloadFile(content, filename, mimeType) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type: mimeType }))
  link.download = filename
  link.click()
  //  释放 URL 对象，避免内存泄漏
  URL.revokeObjectURL(link.href)
}

export default {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  downloadFile,
}
