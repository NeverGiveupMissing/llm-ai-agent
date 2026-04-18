/**
 * Token 数量估算工具
 * @param {string} text - 要估算的文本
 * @returns {number} 估算的 token 数量
 */
function estimateTokens(text) {
  if (!text) return 0

  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars

  return Math.floor(chineseChars / 1.5 + otherChars / 4)
}

module.exports = { estimateTokens }
