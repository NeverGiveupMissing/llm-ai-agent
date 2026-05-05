// 说明：聊天 API - 发送聊天消息（后端自动处理记忆）

import { axios, stream } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 发送聊天消息（流式）
 * @param {Object} params
 * @param {Array} params.messages - 消息历史
 * @param {boolean} params.stream - 是否流式（默认 true）
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.user_id - 用户ID
 */
export const sendChatMessage = (params) => {
  const { messages, stream: isStream = true, sessionId, user_id } = params

  if (isStream) {
    // 流式请求
    return stream.sse({
      url: `${API_PREFIX}/chat`,
      data: { messages, stream: true, sessionId, user_id },
    })
  } else {
    // 普通请求
    return axios.post(`${API_PREFIX}/chat`, {
      messages,
      stream: false,
      sessionId,
      user_id,
    })
  }
}

/**
 * 获取会话的消息历史
 * @param {string} sessionId - 会话ID
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 */
export const getSessionMessages = (sessionId, limit = 100, offset = 0) => {
  return axios.get(`${API_PREFIX}/chat/messages/${sessionId}`, { limit, offset })
}

/**
 * 获取会话的最新消息
 * @param {string} sessionId - 会话ID
 * @param {number} limit - 限制数量
 */
export const getLatestMessages = (sessionId, limit = 10) => {
  return axios.get(`${API_PREFIX}/chat/messages/${sessionId}/latest`, { limit })
}

/**
 * 删除消息
 * @param {string} messageId - 消息ID
 */
export const deleteMessage = (messageId) => {
  return axios.delete(`${API_PREFIX}/chat/messages/${messageId}`)
}
