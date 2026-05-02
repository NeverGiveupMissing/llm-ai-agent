// 说明：会话管理 API

import { base, rest } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取会话列表
 * @param {string} userId - 用户ID
 */
export const getSessionList = (userId) => {
  return rest.get(`${API_PREFIX}/sessions`, { params: { userId } }, { skipLoading: true })
}

/**
 * 创建新会话
 * @param {string} userId - 用户ID
 * @param {string} title - 会话标题（可选）
 */
export const createSession = (userId, title) => {
  return rest.post(`${API_PREFIX}/sessions`, { userId, title })
}

/**
 * 更新会话
 * @param {string} sessionId - 会话ID
 * @param {Object} data - 更新数据
 * @param {Object} options - 请求选项
 */
export const updateSession = (sessionId, data, options = {}) => {
  return rest.put(`${API_PREFIX}/sessions/${sessionId}`, data, options)
}

/**
 * 删除会话
 * @param {string} sessionId - 会话ID
 */
export const deleteSession = (sessionId) => {
  return rest.delete(`${API_PREFIX}/sessions/${sessionId}`)
}

/**
 * 置顶/取消置顶会话
 * @param {string} sessionId - 会话ID
 */
export const pinSession = (sessionId) => {
  return rest.post(`${API_PREFIX}/sessions/${sessionId}/pin`)
}

/**
 * 获取会话分享信息
 * @param {string} sessionId - 会话ID
 */
export const getShareInfo = (sessionId) => {
  return rest.get(`${API_PREFIX}/sessions/${sessionId}/share`)
}

/**
 * 获取会话详情（包含消息列表）
 * @param {string} sessionId - 会话ID
 */
export const getSessionDetail = (sessionId) => {
  return rest.get(`${API_PREFIX}/sessions/${sessionId}/detail`)
}
