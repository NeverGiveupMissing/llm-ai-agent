// 说明：会话管理 API

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取会话列表
 * @param {string} user_id - 用户ID
 */
export const getSessionList = (user_id) => {
  return axios.get(`${API_PREFIX}/sessions`, { params: { user_id } }, { skipLoading: true })
}

/**
 * 创建新会话
 * @param {string} user_id - 用户ID
 * @param {string} title - 会话标题（可选）
 */
export const createSession = (user_id, title) => {
  return axios.post(`${API_PREFIX}/sessions`, { user_id, title })
}

/**
 * 更新会话
 * @param {string} sessionId - 会话ID
 * @param {Object} data - 更新数据
 * @param {Object} options - 请求选项
 */
export const updateSession = (sessionId, data, options = {}) => {
  return axios.put(`${API_PREFIX}/sessions/${sessionId}`, data, options)
}

/**
 * 删除会话
 * @param {string} sessionId - 会话ID
 */
export const deleteSession = (sessionId) => {
  return axios.delete(`${API_PREFIX}/sessions/${sessionId}`)
}

/**
 * 置顶/取消置顶会话
 * @param {string} sessionId - 会话ID
 */
export const pinSession = (sessionId) => {
  return axios.post(`${API_PREFIX}/sessions/${sessionId}/pin`)
}

/**
 * 获取会话分享信息
 * @param {string} sessionId - 会话ID
 */
export const getShareInfo = (sessionId) => {
  return axios.get(`${API_PREFIX}/sessions/${sessionId}/share`)
}

/**
 * 获取会话详情（包含消息列表）
 * @param {string} sessionId - 会话ID
 */
export const getSessionDetail = (sessionId) => {
  return axios.get(`${API_PREFIX}/sessions/${sessionId}/detail`)
}
