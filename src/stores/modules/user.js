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
      permissions: [], // 菜单权限列表（用于路由控制）
      buttonPermissions: [], // 按钮权限列表（用于按钮级权限控制）
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
    // 获取权限列表（菜单权限）
    permissions: (state) => state.userInfo.permissions || [],
    // 获取按钮权限列表
    buttonPermissions: (state) => state.userInfo.buttonPermissions || [],
    // 检查是否已登录
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('access_token', token)
    },
    setUserInfo(info) {
      // ✅ 关键修复：确保 roles 中的 role_id 统一为数字类型
      if (info.roles && Array.isArray(info.roles)) {
        info.roles = info.roles.map(role => {
          if (role && typeof role === 'object') {
            // 如果存在 role_id，强制转换为数字
            if (role.role_id !== undefined && role.role_id !== null) {
              const numId = parseInt(role.role_id, 10)
              if (!isNaN(numId)) {
                return { ...role, role_id: numId }
              }
            }
          }
          return role
        })
      }

      // ✅ 确保 role_ids 是数字数组
      if (info.role_ids && Array.isArray(info.role_ids)) {
        info.role_ids = info.role_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      }

      // ✅ 确保 permissions 是数组（后端聚合的权限标识）
      if (info.permissions && !Array.isArray(info.permissions)) {
        info.permissions = []
      }

      this.userInfo = { ...this.userInfo, ...info }
      // ✅ 确保 roles、permissions、buttonPermissions 和 role_ids 是数组
      if (!Array.isArray(this.userInfo.roles)) {
        this.userInfo.roles = []
      }
      if (!Array.isArray(this.userInfo.permissions)) {
        this.userInfo.permissions = []
      }
      if (!Array.isArray(this.userInfo.buttonPermissions)) {
        this.userInfo.buttonPermissions = []
      }
      if (!Array.isArray(this.userInfo.role_ids)) {
        this.userInfo.role_ids = []
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
        buttonPermissions: [],
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
