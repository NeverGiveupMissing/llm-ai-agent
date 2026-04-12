import { defineStore } from 'pinia'

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
    logout() {
      this.token = ''
      localStorage.removeItem('access_token')
      this.userInfo = { name: '张三', avatar: 'https://via.placeholder.com/32' }
    },
  },
})
