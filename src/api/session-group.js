/**
 * 会话分组相关 API
 */
import { rest } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

// 获取用户的所有分组
export function getGroupList(userId) {
  return rest.get(`${API_PREFIX}/session-groups`, { userId })
}

// 创建分组
export function createGroup(data) {
  return rest.post(`${API_PREFIX}/session-groups`, data)
}

// 更新分组
export function updateGroup(id, data) {
  return rest.put(`${API_PREFIX}/session-groups/${id}`, data)
}

// 删除分组
export function deleteGroup(id) {
  return rest.delete(`${API_PREFIX}/session-groups/${id}`)
}

// 置顶/取消置顶分组
export function pinGroup(id) {
  return rest.post(`${API_PREFIX}/session-groups/${id}/pin`)
}

// 移动会话到分组
export function moveSessionToGroup(sessionId, groupId) {
  return rest.post(`${API_PREFIX}/session-groups/sessions/${sessionId}/move`, {
    group_id: groupId || null,
  })
}