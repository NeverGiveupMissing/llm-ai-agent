// 说明：用户认证 API

import { post, get } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 用户登录
 */
export const login = (data) => {
  return post(`${API_PREFIX}/users/login`, data)
}

/**
 * 用户注册
 */
export const register = (data) => {
  return post(`${API_PREFIX}/users/register`, data)
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return get(`${API_PREFIX}/users/me`)
}
