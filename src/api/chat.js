// 说明：聊天 API - 发送聊天消息（后端自动处理记忆）

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
