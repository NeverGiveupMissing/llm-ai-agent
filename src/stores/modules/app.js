import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    collapsed: false,
    theme: 'light',
  }),

  actions: {
    setCollapsed(collapsed) {
      this.collapsed = collapsed
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed
    },
    setTheme(theme) {
      this.theme = theme
    },
  },
})
