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
    setMenuFromTree(menuTree) {
      console.log('🌲 [MenuStore] setMenuFromTree 被调用')
      console.log(' [MenuStore] menuTree 类型:', typeof menuTree, Array.isArray(menuTree))
      console.log(' [MenuStore] menuTree 长度:', menuTree?.length)
      if (menuTree?.length > 0) {
        console.log(' [MenuStore] 第一个菜单项完整数据:', JSON.stringify(menuTree[0], null, 2))
        console.log(' [MenuStore] visible 值:', menuTree[0].visible, '类型:', typeof menuTree[0].visible)
        console.log(' [MenuStore] status 值:', menuTree[0].status, '类型:', typeof menuTree[0].status)
      }

      const options = this.buildMenuOptions(menuTree)

      console.log('✅ [MenuStore] 构建后的菜单选项:', options)
      console.log('✅ [MenuStore] 菜单选项数量:', options?.length)

      this.menuOptions = options
    },

    buildMenuOptions(menus, parentPath = '') {
      if (!menus || menus.length === 0) {
        console.warn(' [MenuStore] buildMenuOptions: 菜单数据为空')
        return []
      }

      console.log(` [MenuStore] buildMenuOptions 处理 ${menus.length} 个菜单项`)
      console.log(' [MenuStore] 第一个菜单示例:', menus[0])

      let filteredCount = 0
      let keptCount = 0

      const result = menus
        .map((menu) => {
          const { menu_id, menu_name, menu_type, path, visible, status, icon, perms, children } =
            menu

          console.log(`   [调试] 菜单 ${menu_name}: menu_type=${menu_type}, visible=${visible}(${typeof visible}), status=${status}(${typeof status})`)

          if (menu_type === 'F') {
            console.log(`   [调试] 跳过按钮: ${menu_name}`)
            filteredCount++
            return null
          }

          if (String(visible) !== '0') {
            console.log(`   [调试] 跳过隐藏: ${menu_name} (visible=${visible})`)
            filteredCount++
            return null
          }

          if (String(status) !== '0') {
            console.log(`   [调试] 跳过停用: ${menu_name} (status=${status})`)
            filteredCount++
            return null
          }

          keptCount++
          console.log(`   [调试] 保留菜单: ${menu_name}`)

          let fullPath = ''
          if (path && path !== '') {
            const cleanPath = path.startsWith('/') ? path.slice(1) : path

            if (parentPath && parentPath !== '') {
              fullPath = `${parentPath}/${cleanPath}`
            } else {
              fullPath = `/${cleanPath}`
            }
          }

          const option = {
            label: menu_name,
            key: fullPath || perms || menu_name,
            icon: this.getIconComponent(icon),
          }

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

      console.log(` [调试] buildMenuOptions: 保留 ${keptCount} 个菜单项，过滤掉 ${filteredCount} 个菜单项`)

      return result
    },

    getIconComponent(iconType) {
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
      return () => h(NIcon, null, { default: () => h(IconComponent) })
    },

    resetMenu() {
      this.menuOptions = []
    },
  },
})
