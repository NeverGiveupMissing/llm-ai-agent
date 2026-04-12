// AI 对话相关接口

import http from '@/utils/http'

/**
 * 发送普通消息（非流式）
 * @param {Object} data - 请求参数
 * @param {string} data.message - 用户消息
 * @returns {Promise}
 */
export const sendMessage = (data) => {
  return http.post('/app/completion', data)
}

/**
 * 流式对话（AI 打字机效果）
 * @param {Object} data - 请求参数
 * @param {string} data.message - 用户消息
 * @param {boolean} data.stream - 是否流式
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.onChunk - 接收数据块
 * @param {Function} callbacks.onDone - 完成回调
 * @param {Function} callbacks.onError - 错误回调
 * @param {AbortSignal} signal - 中止信号
 */
export const streamChat = (data, callbacks, signal) => {
  return http.stream(
    '/app/completion',
    {
      ...data,
      stream: true,
    },
    callbacks,
    signal,
  )
}

/**
 * 获取对话历史
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 */
export const getChatHistory = (params) => {
  return http.get('/app/history', params)
}

/**
 * 清空对话历史
 */
export const clearHistory = () => {
  return http.delete('/app/history')
}
