import { defineStore } from 'pinia'
import { h } from 'vue'

/**
 * 菜单 Store
 * 管理侧边栏菜单配置 - 支持动态生成
 */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuOptions: [],
  }),

  actions: {
    /**
     * 从后端菜单树生成菜单配置
     */
    setMenuFromTree(menuTree) {
      // console.log('🌲 [MenuStore] setMenuFromTree 被调用')
      // console.log('🌲 [MenuStore] 原始菜单树:', menuTree)
      // console.log('🌲 [MenuStore] 菜单树长度:', menuTree?.length)

      const options = this.buildMenuOptions(menuTree)

      // console.log('✅ [MenuStore] 构建后的菜单选项:', options)
      // console.log('✅ [MenuStore] 菜单选项数量:', options?.length)

      this.menuOptions = options
    },

    /**
     * 递归构建菜单选项（下划线字段，与后端保持一致）
     */
    buildMenuOptions(menus) {
      if (!menus || menus.length === 0) return []

      return menus
        .map((menu) => {
          // ✅ 统一使用下划线命名（与后端数据库保持一致）
          const { menu_id, menu_name, menu_type, path, visible, status, icon, perms, children } = menu

          // 跳过按钮类型（F）
          if (menu_type === 'F') {
            return null
          }

          // 跳过隐藏菜单（visible !== '0'）
          if (String(visible) !== '0') {
            return null
          }

          // 跳过停用菜单（status !== '0'）
          if (String(status) !== '0') {
            return null
          }

          const menuPath = path ? (path.startsWith('/') ? path : `/${path}`) : null

          const option = {
            label: menu_name, // ✅ 使用下划线
            key: menuPath || perms || menu_name, // ✅ 使用下划线
            icon: this.getIconComponent(icon), // ✅ 使用下划线
          }

          // ✅ 只有目录（M）才能折叠，菜单（C）即使有子节点也不显示为可折叠
          if (menu_type === 'M' && children && children.length > 0) {
            const childOptions = this.buildMenuOptions(children)
            const validChildren = childOptions.filter((child) => child !== null)
            if (validChildren.length > 0) {
              option.children = validChildren
            }
          }

          return option
        })
        .filter((item) => item !== null)
    },

    /**
     * 获取图标组件
     */
    getIconComponent(iconType) {
      // ✅ 图标键名映射（数据库中的 icon 字段值）
      const iconMap = {
        home: this.createSvgIcon(
          `<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>`,
        ),
        dashboard: this.createSvgIcon(
          `<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>`,
        ),
        chat: this.createSvgIcon(
          `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
        ),
        agent: this.createSvgIcon(
          `<path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"></path><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"></path><circle cx="12" cy="6" r="1"></circle>`,
        ),
        knowledge: this.createSvgIcon(
          `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`,
        ),
        memory: this.createSvgIcon(
          `<path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"></path><circle cx="12" cy="9" r="2"></circle>`,
        ),
        tools: this.createSvgIcon(
          `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`,
        ),
        logs: this.createSvgIcon(
          `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>`,
        ),
        docs: this.createSvgIcon(
          `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>`,
        ),
        settings: this.createSvgIcon(
          `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
        ),
        'shield-checkmark': this.createSvgIcon(
          `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path>`,
        ),
        database: this.createSvgIcon(
          `<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>`,
        ),
        server: this.createSvgIcon(
          `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>`,
        ),
      }

      return iconMap[iconType] || iconMap.dashboard
    },

    /**
     * 创建 SVG 图标组件
     */
    createSvgIcon(svgContent) {
      return () =>
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
          innerHTML: svgContent.trim(),
        })
    },

    /**
     * 重置菜单
     */
    resetMenu() {
      this.menuOptions = []
    },
  },
})
