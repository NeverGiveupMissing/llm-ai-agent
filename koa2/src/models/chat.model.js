/**
 * 聊天请求模型
 * @class ChatRequestModel
 */
class ChatRequestModel {
  /**
   * @param {Object} data - 请求数据
   * @param {Array} data.messages - 消息数组
   * @param {boolean} [data.stream=false] - 是否流式
   */
  constructor(data) {
    this.messages = data.messages || []
    this.stream = data.stream || false
  }

  /**
   * 验证请求数据
   * @returns {boolean} 是否有效
   */
  validate() {
    if (!this.messages || !Array.isArray(this.messages) || this.messages.length === 0) {
      return false
    }

    for (const msg of this.messages) {
      if (!msg.role || !msg.content) {
        return false
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return false
      }
    }

    return true
  }
}

module.exports = { ChatRequestModel }
