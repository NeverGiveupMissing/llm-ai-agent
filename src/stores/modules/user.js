import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { usePermissionStore } from './permission'
import { useMenuStore } from './menu'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      user_id: '',
      user_name: '',
      nick_name: '',
      avatar: '',
      email: '',
      phonenumber: '',
      roles: [],
      permissions: [], // ✅ 添加权限列表
    },
    token: localStorage.getItem('access_token') || '',
  }),

  getters: {
    // 获取用户 ID
    user_id: (state) => state.userInfo.user_id,
    // 获取用户名
    user_name: (state) => state.userInfo.user_name,
    // 获取角色列表
    roles: (state) => state.userInfo.roles || [],
    // 获取权限列表
    permissions: (state) => state.userInfo.permissions || [],
    // 检查是否已登录
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('access_token', token)
    },
    setUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
      // ✅ 确保 roles 和 permissions 是数组
      if (!Array.isArray(this.userInfo.roles)) {
        this.userInfo.roles = []
      }
      if (!Array.isArray(this.userInfo.permissions)) {
        this.userInfo.permissions = []
      }

      // ✅ 持久化用户信息到 localStorage（可选）
      localStorage.setItem('user_info', JSON.stringify(this.userInfo))
    },
    /**
     * 从 localStorage 恢复用户信息
     */
    restoreUserInfo() {
      const userInfoStr = localStorage.getItem('user_info')
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr)
          this.userInfo = { ...this.userInfo, ...userInfo }
        } catch (error) {
          console.error('恢复用户信息失败:', error)
        }
      }
    },
    /**
     * ⭐ 退出登录：清空所有 store 状态并跳转登录页
     */
    logout() {
      // 清空 token
      this.token = ''
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_info') // ✅ 清除用户信息

      // 重置用户信息
      this.userInfo = {
        user_id: '',
        user_name: '',
        nick_name: '',
        avatar: '',
        email: '',
        phonenumber: '',
        roles: [],
        permissions: [],
      }

      // ⭐ 清空权限相关状态
      const permissionStore = usePermissionStore()
      permissionStore.resetPermission()

      // ⭐ 清空菜单状态
      const menuStore = useMenuStore()
      menuStore.resetMenu()

      console.log('✅ 所有 store 状态已清空')
    },
  },
})
