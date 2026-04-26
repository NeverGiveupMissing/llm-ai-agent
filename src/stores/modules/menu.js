import { defineStore } from 'pinia'
import { h } from 'vue'

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
     * - icon: 菜单图标（折叠时显示）
     */
    menuOptions: [
      {
        label: '工作台',
        key: 'Dashboard',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            `,
          }),
      },
      {
        label: '💬 AI对话',
        key: 'Chat',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            `,
          }),
      },
      {
        label: '🤖 智能体',
        key: 'Agent',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"></path>
              <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"></path>
              <circle cx="12" cy="6" r="1"></circle>
            `,
          }),
      },
      {
        label: '📚 知识库',
        key: 'Knowledge',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            `,
          }),
      },
      {
        label: '🧠 记忆管理',
        key: 'Memory',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"></path>
              <circle cx="12" cy="9" r="2"></circle>
            `,
          }),
      },
      {
        label: '🔧 工具',
        key: 'Tools',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            `,
          }),
      },
      {
        label: '📝 对话日志',
        key: 'ChatLogs',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            `,
          }),
      },
      {
        label: '📖 API文档',
        key: 'ApiDocs',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            `,
          }),
      },
      {
        label: '⚙️ 系统设置',
        key: 'Settings',
        icon: () =>
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '18',
            height: '18',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            innerHTML: `
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            `,
          }),
      },
    ],
  }),
})