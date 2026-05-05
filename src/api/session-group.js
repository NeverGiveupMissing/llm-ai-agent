/**
 * 会话分组相关 API
 */
import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

// 获取用户的所有分组
export function getGroupList(user_id) {
  return axios.get(`${API_PREFIX}/session-groups`, { user_id })
}

// 创建分组
export function createGroup(data) {
  return axios.post(`${API_PREFIX}/session-groups`, data)
}

// 更新分组
export function updateGroup(id, data) {
  return axios.put(`${API_PREFIX}/session-groups/${id}`, data)
}

// 删除分组
export function deleteGroup(id) {
  return axios.delete(`${API_PREFIX}/session-groups/${id}`)
}

// 置顶/取消置顶分组
export function pinGroup(id) {
  return axios.post(`${API_PREFIX}/session-groups/${id}/pin`)
}

// 移动会话到分组
export function moveSessionToGroup(sessionId, groupId) {
  return axios.post(`${API_PREFIX}/session-groups/sessions/${sessionId}/move`, {
    group_id: groupId || null,
  })
}
