import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuOptions: [
      {
        label: '工作台',
        key: 'Dashboard',
        icon: () => '🏠',
      },
      {
        label: 'AI对话',
        key: 'Chat',
        icon: () => '💬',
      },
      {
        label: '智能体',
        key: 'Agent',
        icon: () => '🤖',
      },
      {
        label: '知识库',
        key: 'Knowledge',
        icon: () => '📚',
      },
      {
        label: '工具',
        key: 'Tools',
        icon: () => '🔧',
      },
      {
        label: 'API文档',
        key: 'ApiDocs',
        icon: () => '📖',
      },
      {
        label: '对话日志',
        key: 'ChatLogs',
        icon: () => '📋',
      },
      {
        label: '系统设置',
        key: 'Settings',
        icon: () => '⚙️',
      },
    ],
  }),
})
