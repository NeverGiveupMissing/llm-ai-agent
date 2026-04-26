// 说明：聊天 API - 发送聊天消息（后端自动处理记忆）

import { get, post, put, del } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 发送聊天消息配置
 * @param {Object} params
 * @param {Array} params.messages - 消息历史
 * @param {boolean} params.stream - 是否流式
 * @param {string} params.sessionId - 会话ID（后端用于记忆管理）
 * @param {string} params.userId - 用户ID（后端用于记忆管理）
 */
export const sendChatMessage = (params) => {
  const { messages, stream = true, sessionId, userId } = params
  return {
    url: `${API_PREFIX}/chat`,
    data: {
      messages,
      stream,
      sessionId,
      userId,
    },
  }
}

/**
 * 获取会话的消息历史
 * @param {string} sessionId - 会话ID
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 */
export const getSessionMessages = (sessionId, limit = 100, offset = 0) => {
  return get(`${API_PREFIX}/chat/messages/${sessionId}`, { limit, offset })
}

/**
 * 获取会话的最新消息
 * @param {string} sessionId - 会话ID
 * @param {number} limit - 限制数量
 */
export const getLatestMessages = (sessionId, limit = 10) => {
  return get(`${API_PREFIX}/chat/messages/${sessionId}/latest`, { limit })
}

/**
 * 删除消息
 * @param {string} messageId - 消息ID
 */
export const deleteMessage = (messageId) => {
  return del(`${API_PREFIX}/chat/messages/${messageId}`)
}
