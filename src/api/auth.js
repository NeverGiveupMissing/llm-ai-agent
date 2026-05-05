// 说明：用户认证 API

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 */
export const login = (data) => {
  return axios.post(`${API_PREFIX}/users/login`, data)
}

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 */
export const register = (data) => {
  return axios.post(`${API_PREFIX}/users/register`, data)
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return axios.get(`${API_PREFIX}/users/me`)
}

/**
 * 修改当前用户密码
 * @param {Object} data - 密码数据
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 */
export const changePassword = (data) => {
  return axios.post(`${API_PREFIX}/users/me/change-password`, data)
}

/**
 * 更新当前用户信息
 * @param {Object} data - 用户信息
 */
export const updateUserInfo = (data) => {
  return axios.put(`${API_PREFIX}/users/me`, data)
}
