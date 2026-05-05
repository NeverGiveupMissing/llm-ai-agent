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
      roles: [],
    },
    token: localStorage.getItem('access_token') || '',
  }),

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('access_token', token)
    },
    setUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
      // ✅ 确保 roles 是数组
      if (!Array.isArray(this.userInfo.roles)) {
        this.userInfo.roles = []
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

      // 重置用户信息
      this.userInfo = { user_id: '', user_name: '', nick_name: '', avatar: '', roles: [] }

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
