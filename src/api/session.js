// 说明：会话管理 API

import { get, post, put, del } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取会话列表
 */
export const getSessionList = (userId) => {
  return get(`${API_PREFIX}/sessions`, { userId }, { skipLoading: true })
}

/**
 * 创建新会话
 */
export const createSession = (userId, title) => {
  return post(`${API_PREFIX}/sessions`, { userId, title })
}

/**
 * 更新会话
 */
export const updateSession = (sessionId, data, options = {}) => {
  return put(`${API_PREFIX}/sessions/${sessionId}`, data, options)
}

/**
 * 删除会话
 */
export const deleteSession = (sessionId) => {
  return del(`${API_PREFIX}/sessions/${sessionId}`)
}

/**
 * 置顶/取消置顶会话
 */
export const pinSession = (sessionId) => {
  return post(`${API_PREFIX}/sessions/${sessionId}/pin`)
}

/**
 * 获取会话分享信息
 */
export const getShareInfo = (sessionId) => {
  return get(`${API_PREFIX}/sessions/${sessionId}/share`)
}

/**
 * 获取会话详情（包含消息列表）
 */
export const getSessionDetail = (sessionId) => {
  return get(`${API_PREFIX}/sessions/${sessionId}/detail`)
}
