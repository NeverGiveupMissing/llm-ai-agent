import { defineStore } from 'pinia'
import { h } from 'vue'
import { RouterLink } from 'vue-router'

/**
 * 菜单 Store
 * 管理侧边栏菜单配置
 */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    /**
     * 菜单选项配置
     * 每个菜单项包含：
     * - label: 菜单显示内容（支持函数返回 VNode）
     * - key: 菜单唯一标识（对应路由 name）
     */
    menuOptions: [
      {
        label: () => h(RouterLink, { to: { name: 'Dashboard' } }, { default: () => '📊 工作台' }),
        key: 'Dashboard',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Chat' } }, { default: () => '💬 AI对话' }),
        key: 'Chat',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Agent' } }, { default: () => '🤖 智能体' }),
        key: 'Agent',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Knowledge' } }, { default: () => '📚 知识库' }),
        key: 'Knowledge',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Memory' } }, { default: () => '🧠 记忆管理' }),
        key: 'Memory',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Tools' } }, { default: () => '🔧 工具' }),
        key: 'Tools',
      },
      {
        label: () => h(RouterLink, { to: { name: 'ChatLogs' } }, { default: () => '📝 对话日志' }),
        key: 'ChatLogs',
      },
      {
        label: () => h(RouterLink, { to: { name: 'ApiDocs' } }, { default: () => '📖 API文档' }),
        key: 'ApiDocs',
      },
      {
        label: () => h(RouterLink, { to: { name: 'Settings' } }, { default: () => '⚙️ 系统设置' }),
        key: 'Settings',
      },
    ],
  }),
})
