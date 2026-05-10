import { defineStore } from 'pinia'
import { h } from 'vue'
import { NIcon } from 'naive-ui'
import {
  HomeOutline,
  GridOutline,
  ChatbubbleEllipsesOutline,
  ConstructOutline,
  BookOutline,
  ArchiveOutline,
  SettingsOutline,
  PersonOutline,
  PeopleOutline,
  MenuOutline,
  FileTrayFullOutline,
  HammerOutline,
  ServerOutline,
  CodeSlashOutline,
  DocumentTextOutline,
  FolderOutline,
  DownloadOutline,
  CloudUploadOutline,
  AddCircleOutline,
  PencilOutline,
  TrashOutline,
  RefreshOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  InformationCircleOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'

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
      // console.log(' [MenuStore] 原始菜单树:', JSON.stringify(menuTree, null, 2))
      // console.log('🌲 [MenuStore] 菜单树长度:', menuTree?.length)

      const options = this.buildMenuOptions(menuTree)

      // console.log('✅ [MenuStore] 构建后的菜单选项:', options)
      // console.log('✅ [MenuStore] 菜单选项数量:', options?.length)

      this.menuOptions = options
    },

    /**
     * 递归构建菜单选项（下划线字段，与后端保持一致）
     */
    buildMenuOptions(menus, parentPath = '') {
      if (!menus || menus.length === 0) {
        console.warn('⚠️ [MenuStore] buildMenuOptions: 菜单数据为空')
        return []
      }

      console.log(`🔍 [MenuStore] buildMenuOptions 处理 ${menus.length} 个菜单项`)

      return menus
        .map((menu) => {
          // ✅ 统一使用下划线命名（与后端数据库保持一致）
          const { menu_id, menu_name, menu_type, path, visible, status, icon, perms, children } =
            menu

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

          // ✅ 拼接完整路径
          let fullPath = ''
          if (path && path !== '') {
            const cleanPath = path.startsWith('/') ? path.slice(1) : path

            if (parentPath && parentPath !== '') {
              // 非顶级菜单，拼接父路径
              fullPath = `${parentPath}/${cleanPath}`
            } else {
              // 顶级菜单，直接使用 path
              fullPath = `/${cleanPath}`
            }
          }

          const option = {
            label: menu_name, // ✅ 使用下划线
            key: fullPath || perms || menu_name, // ✅ 使用完整路径作为 key
            icon: this.getIconComponent(icon), // ✅ 使用下划线
          }

          // ✅ 只有目录（M）才能折叠，菜单（C）即使有子节点也不显示为可折叠
          if (menu_type === 'M' && children && children.length > 0) {
            const childOptions = this.buildMenuOptions(children, fullPath)
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
     * 获取图标组件（支持 @vicons/ionicons5 图标）
     * Naive UI 的 n-menu 的 icon 属性需要一个渲染函数
     */
    getIconComponent(iconType) {
      // ✅ 图标映射（与 IconPicker 组件中的图标名保持一致）
      const iconMap = {
        home: HomeOutline,
        dashboard: GridOutline,
        chat: ChatbubbleEllipsesOutline,
        agent: ConstructOutline,
        knowledge: BookOutline,
        memory: ArchiveOutline,
        settings: SettingsOutline,
        user: PersonOutline,
        role: PeopleOutline,
        menu: MenuOutline,
        log: FileTrayFullOutline,
        tool: HammerOutline,
        database: ServerOutline,
        code: CodeSlashOutline,
        document: DocumentTextOutline,
        folder: FolderOutline,
        download: DownloadOutline,
        upload: CloudUploadOutline,
        add: AddCircleOutline,
        edit: PencilOutline,
        delete: TrashOutline,
        search: RefreshOutline,
        refresh: RefreshOutline,
        checkmark: CheckmarkCircleOutline,
        warning: WarningOutline,
        information: InformationCircleOutline,
        'shield-checkmark': ShieldCheckmarkOutline,
        server: ServerOutline,
      }

      const IconComponent = iconMap[iconType] || GridOutline
      // 返回渲染函数，而不是直接返回组件对象
      return () => h(NIcon, null, { default: () => h(IconComponent) })
    },

    /**
     * 重置菜单
     */
    resetMenu() {
      this.menuOptions = []
    },
  },
})
