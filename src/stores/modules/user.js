import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { usePermissionStore } from './permission'
import { useMenuStore } from './menu'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      name: '张三',
      avatar: 'https://via.placeholder.com/32',
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
    },
    /**
     * ⭐ 退出登录：清空所有store状态并跳转登录页
     */
    logout() {
      // 清空 token
      this.token = ''
      localStorage.removeItem('access_token')
      localStorage.removeItem('userId')
      
      // 重置用户信息
      this.userInfo = { name: '张三', avatar: 'https://via.placeholder.com/32' }
      
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
