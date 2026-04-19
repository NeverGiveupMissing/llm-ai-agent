// 说明：会话管理 API

import { get, post, del, put } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取会话列表
 */
export const getSessionList = (userId) => {
  return get(`${API_PREFIX}/sessions`, { userId })
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
export const updateSession = (sessionId, data) => {
  return put(`${API_PREFIX}/sessions/${sessionId}`, data)
}

/**
 * 删除会话
 */
export const deleteSession = (sessionId) => {
  return del(`${API_PREFIX}/sessions/${sessionId}`)
}
