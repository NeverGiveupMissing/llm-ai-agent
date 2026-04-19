import { API_PREFIX } from '@/utils/constants'
import { post } from '@/utils/http'

/**
 * 发送聊天消息配置
 * @param {Object} params
 * @param {Array} params.messages - 消息历史
 * @param {boolean} params.stream - 是否流式
 */
export const sendChatMessage = (params) => {
  const { messages, stream = true } = params
  return {
    url: `${API_PREFIX}/chat`,
    data: {
      messages,
      stream,
    },
  }
}
