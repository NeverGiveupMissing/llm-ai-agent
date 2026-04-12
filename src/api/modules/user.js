// 用户相关接口

import http from '@/utils/http'

/**
 * 用户登录
 * @param {Object} data
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 */
export const login = (data) => {
  return http.post('/auth/login', data)
}

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return http.get('/auth/userinfo')
}

/**
 * 退出登录
 */
export const logout = () => {
  return http.post('/auth/logout')
}
