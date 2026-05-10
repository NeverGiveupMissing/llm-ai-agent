<template>
  <BaseModal
    v-model:show="visible"
    :title="`分配权限 - ${roleName}`"
    :loading="saving"
    width="800px"
    @confirm="handleSave"
  >
    <div class="permission-container">
      <!-- Tabs 标签页 -->
      <n-tabs v-model:value="activeTab" type="line" animated>
        <!-- 菜单权限 -->
        <n-tab-pane name="menu" tab="菜单权限">
          <MenuPermissionTab
            :menu-tree-data="menuTreeData"
            :menu-tree-loading="menuTreeLoading"
            :checked-keys="checked_keys_menu"
            @update:checked-keys="checked_keys_menu = $event"
          />
        </n-tab-pane>

        <!-- 按钮权限 -->
        <n-tab-pane name="button" tab="按钮权限">
          <ButtonPermissionTab
            :button-tree-data="buttonTreeData"
            :button-tree-loading="buttonTreeLoading"
            :checked-keys="checked_keys_button"
            @update:checked-keys="checked_keys_button = $event"
          />
        </n-tab-pane>

        <!-- 接口权限 -->
        <n-tab-pane name="api" tab="接口权限">
          <ApiPermissionTab
            :api-tree-data="apiTreeData"
            :api-permission-loading="apiPermissionLoading"
            :checked-keys="checked_keys_api"
            @update:checked-keys="checked_keys_api = $event"
          />
        </n-tab-pane>
      </n-tabs>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { getMenuList } from '@/api/menu'
import { getRolemenu_ids, getRoleApiPaths } from '@/api/role'
import MenuPermissionTab from './MenuPermissionTab.vue'
import ButtonPermissionTab from './ButtonPermissionTab.vue'
import ApiPermissionTab from './ApiPermissionTab.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'save'])

const message = useMessage()
const activeTab = ref('menu')
const saving = ref(false)

// 菜单权限相关
const menuTreeData = ref([])
const menuTreeLoading = ref(false)
const checked_keys_menu = ref([])

// 按钮权限相关
const buttonTreeData = ref([])
const buttonTreeLoading = ref(false)
const checked_keys_button = ref([])

// 接口权限相关
const apiTreeData = ref([])
const apiPermissionLoading = ref(false)
const checked_keys_api = ref([])

// 角色名称（兼容两种命名）
const roleName = computed(() => {
  if (!props.role) return ''
  return props.role.roleName || props.role.role_name || '未知角色'
})

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// 监听弹窗打开，加载权限数据
watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.role) {
      await loadMenuTree()
      await loadButtonTree()
      await loadApiPermissions()
      await loadRolePermissions()
    } else if (!newVal) {
      // 弹窗关闭时清空数据
      menuTreeData.value = []
      checked_keys_menu.value = []
      buttonTreeData.value = []
      checked_keys_button.value = []
      apiTreeData.value = []
      checked_keys_api.value = []
    }
  },
)

// 加载菜单树（M目录和C菜单）
const loadMenuTree = async () => {
  try {
    menuTreeLoading.value = true
    const res = await getMenuList()

    // 后端已经返回树形结构（经过中间件转换为驼峰命名）
    let menuData = []
    if (Array.isArray(res.data)) {
      menuData = res.data
    } else if (res.data && Array.isArray(res.data.list)) {
      menuData = res.data.list
    } else if (res.data && Array.isArray(res.data.data)) {
      menuData = res.data.data
    }

    // 过滤出菜单类型的节点（M目录和C菜单）
    menuTreeData.value = filterMenuType(menuData, ['M', 'C'])
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    message.error(error.message || '获取菜单列表失败')
  } finally {
    menuTreeLoading.value = false
  }
}

// 加载按钮权限树（F按钮）
const loadButtonTree = async () => {
  try {
    buttonTreeLoading.value = true
    const res = await getMenuList()

    console.log('===== 按钮权限原始数据 =====', res.data)

    let menuData = []
    if (Array.isArray(res.data)) {
      menuData = res.data
    } else if (res.data && Array.isArray(res.data.list)) {
      menuData = res.data.list
    } else if (res.data && Array.isArray(res.data.data)) {
      menuData = res.data.data
    }

    console.log('===== 解析后的菜单数据 =====', menuData)

    // 过滤出按钮类型的节点，并保持树形结构
    buttonTreeData.value = filterMenuType(menuData, ['F'])

    console.log('===== 过滤后的按钮树 =====', buttonTreeData.value)
  } catch (error) {
    console.error('获取按钮权限列表失败:', error)
    message.error(error.message || '获取按钮权限列表失败')
  } finally {
    buttonTreeLoading.value = false
  }
}

// 加载接口权限列表（按模块分类）
const loadApiPermissions = async () => {
  try {
    apiPermissionLoading.value = true

    // ✅ 从后端 sys_interface 表获取接口权限
    const { getInterfaceList } = await import('@/api/interface')
    const res = await getInterfaceList({ page: 1, page_size: 1000 })

    let interfaceData = []
    if (res.data && Array.isArray(res.data.list)) {
      interfaceData = res.data.list
    } else if (res.data && Array.isArray(res.data)) {
      interfaceData = res.data
    }

    console.log('✅ 后端返回的接口数据:', interfaceData)

    // 转换为接口权限树格式
    apiTreeData.value = transformInterfaceToTree(interfaceData)

    console.log('✅ 接口权限树数据:', apiTreeData.value)
  } catch (error) {
    console.error('获取接口权限列表失败:', error)
    message.error(error.message || '获取接口权限列表失败')
  } finally {
    apiPermissionLoading.value = false
  }
}

// 将接口数据转换为树形结构（按 api_category 分组）
const transformInterfaceToTree = (interfaces) => {
  const modules = {}

  interfaces.forEach((item) => {
    // ✅ 使用 api_category 作为模块名（中文）
    const category = item.api_category || '其他'

    if (!modules[category]) {
      modules[category] = {
        api_id: `category-${category}`,
        api_name: category,
        isModule: true,
        children: [],
      }
    }

    // ✅ 添加接口节点
    modules[category].children.push({
      api_id: item.api_id,
      api_name: item.api_name,
      api_path: item.api_url,
      api_method: item.api_method,
      status: item.status,
      remark: item.remark,
    })
  })

  return Object.values(modules)
}

// 提取接口权限（从菜单树中提取有 perms 的节点）
const extractApiPermissions = (menus) => {
  const apis = []
  const traverse = (items) => {
    items.forEach((item) => {
      // ✅ 严格使用下划线命名
      const perms = item.perms
      const path = item.path
      const menu_id = Number(item.menu_id)
      const menu_name = item.menu_name
      const menu_type = item.menu_type

      // 只要有 perms 且不是按钮类型，就作为接口权限
      if (perms && menu_type !== 'F') {
        apis.push({
          api_id: menu_id,
          api_path: path || '',
          api_name: menu_name || '',
          perms: perms,
          method: 'GET', // 默认GET
        })
      }

      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(menus)
  return apis
}

// 按模块分组（使用菜单中文名称作为模块名）
const groupByModule = (apis) => {
  const modules = {}
  apis.forEach((api) => {
    // 优先使用 api_name（中文名称）作为模块名
    let module_name = '其他'
    let module_label = '其他'

    if (api.api_name && api.api_name.includes('（')) {
      // 如果 api_name 包含括号，提取括号前的中文名称
      const parts = api.api_name.split('（')
      module_label = parts[0]
      // 从 perms 提取英文模块名
      if (api.perms && api.perms.includes(':')) {
        module_name = api.perms.split(':')[0]
      }
    } else if (api.perms && api.perms.includes(':')) {
      // 从 perms 提取模块名
      module_name = api.perms.split(':')[0]
      module_label = module_name
    } else if (api.api_path) {
      // 如果 perms 不可用，尝试从 api_path 提取
      const parts = api.api_path.split('/').filter((p) => p)
      if (parts.length > 1) {
        module_name = parts[1]
        module_label = module_name
      }
    }

    if (!modules[module_name]) {
      modules[module_name] = {
        module: module_name,
        module_label: module_label,
        apis: [],
      }
    }
    modules[module_name].apis.push(api)
  })

  return Object.values(modules).map((module) => ({
    api_id: `module-${module.module}`,
    api_name: module.module_label,
    isModule: true,
    children: module.apis.map((api) => ({
      ...api,
      api_name: `${api.api_name} (${api.api_path})`,
    })),
  }))
}

// 切换接口权限选中状态
const toggleApiCheck = (path) => {
  const index = checkedApiKeys.value.indexOf(path)
  if (index > -1) {
    checkedApiKeys.value.splice(index, 1)
  } else {
    checkedApiKeys.value.push(path)
  }
}

// 全选接口
const handleSelectAllApis = () => {
  const allKeys = getAllApiPaths(apiTreeData.value)
  checkedApiKeys.value = allKeys
}

// 取消全选接口
const handleUnselectAllApis = () => {
  checkedApiKeys.value = []
}

// 递归获取所有接口路径
const getAllApiPaths = (apis) => {
  const paths = []
  const traverse = (items) => {
    items.forEach((item) => {
      if (!item.isModule && item.api_path) {
        paths.push(item.api_path)
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(apis)
  return paths
}

// 接口权限勾选变化
const handleApiCheckedChange = (keys) => {
  checkedApiKeys.value = keys
}

// 获取 HTTP 方法对应的标签类型
const getMethodType = (method) => {
  const typeMap = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
  }
  return typeMap[method?.toUpperCase()] || 'default'
}

// 过滤指定类型的菜单（展平为一层结构，按父级菜单名称分组）
const filterMenuType = (menus, types) => {
  const result = []
  const groupMap = new Map()

  // 递归收集所有按钮节点及其父级路径
  const collectButtons = (items, parentPath = []) => {
    for (const menu of items) {
      const menu_type = menu.menu_type
      const menu_name = menu.menu_name
      const perms = menu.perms
      const menu_id = Number(menu.menu_id)

      if (types.includes(menu_type)) {
        // 是目标类型节点
        // 使用父级路径作为分组键（排除根节点）
        const groupKey = parentPath.length > 0 ? parentPath.join(' / ') : '其他'

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            menu_id: `group-${groupKey}`,
            menu_name: parentPath.length > 0 ? parentPath[parentPath.length - 1] : groupKey,
            menu_type: 'M', // 虚拟目录节点
            is_group: true,
            children: [],
          })
        }

        groupMap.get(groupKey).children.push({
          ...menu,
          menu_id: menu_id,
        })
      }

      // 递归处理子节点
      if (menu.children && menu.children.length > 0) {
        const newParentPath =
          menu_type === 'M' || menu_type === 'C' ? [...parentPath, menu_name] : parentPath
        collectButtons(menu.children, newParentPath)
      }
    }
  }

  collectButtons(menus)

  return Array.from(groupMap.values())
}

// 加载角色已有权限
const loadRolePermissions = async () => {
  try {
    const role_id = props.role?.role_id

    if (!role_id) {
      console.warn('角色 ID 不存在')
      return
    }

    console.log('===== 开始加载角色权限 =====')
    console.log('角色 ID:', role_id)

    const res = await getRolemenu_ids(role_id)
    const allmenu_ids = res.data || []

    console.log('后端返回的菜单 ID 列表:', allmenu_ids)
    console.log('菜单树数据:', menuTreeData.value)
    console.log('按钮树数据:', buttonTreeData.value)

    // ✅ 强制类型转换：确保所有勾选的 ID 都是数字类型
    const menuIds = allmenu_ids.map((id) => Number(id))

    // 根据权限 ID 分配给不同的 checked_keys
    checked_keys_menu.value = menuIds.filter((id) => {
      return menuTreeData.value.some((menu) => matchMenuId(menu, id))
    })

    checked_keys_button.value = menuIds.filter((id) => {
      return buttonTreeData.value.some((menu) => matchMenuId(menu, id))
    })

    console.log('匹配后的菜单勾选:', checked_keys_menu.value)
    console.log('匹配后的按钮勾选:', checked_keys_button.value)

    // ✅ 加载接口权限回显
    await loadRoleApiPermissions(role_id)
  } catch (error) {
    console.error('获取角色权限失败:', error)
    message.error(error.message || '获取角色权限失败')
  }
}

// 递归查找菜单 ID 是否匹配
const matchMenuId = (menu, targetId) => {
  // ✅ 严格使用下划线命名
  const menu_id = Number(menu.menu_id)
  if (menu_id === targetId) return true
  if (menu.children && menu.children.length > 0) {
    return menu.children.some((child) => matchMenuId(child, targetId))
  }
  return false
}

// 加载角色接口权限回显
const loadRoleApiPermissions = async (role_id) => {
  try {
    console.log('===== 开始加载接口权限 =====')
    console.log('角色 ID:', role_id)

    const res = await getRoleApiPaths(role_id)
    const apiList = res.data || []

    console.log('后端返回的接口权限列表:', apiList)
    console.log('接口树数据:', apiTreeData.value)

    // apiList 格式: [{ api_id: 1, api_path: '/auth/login', method: 'POST' }, ...]
    // checked_keys_api 存储的是 api_id，用于树形组件的勾选
    checked_keys_api.value = apiList.map((api) => Number(api.api_id || api.api_path || ''))

    console.log('匹配后的接口勾选:', checked_keys_api.value)
  } catch (error) {
    console.error('加载角色接口权限失败:', error)
  }
}

// 保存权限分配
const handleSave = async () => {
  try {
    saving.value = true

    // 合并所有权限ID（菜单 + 按钮）
    const all_menu_ids = [...checked_keys_menu.value, ...checked_keys_button.value]

    emit('save', {
      menu_ids: all_menu_ids,
      api_paths: checked_keys_api.value.filter((key) => !key.startsWith('module-')), // 只保存接口路径，过滤掉模块ID
    })
  } catch (error) {
    console.error('保存权限失败:', error)
    message.error(error.message || '保存权限失败')
  } finally {
    saving.value = false
  }
}

// 递归获取所有菜单ID
const getAllmenu_ids = (menus) => {
  const ids = []
  menus.forEach((menu) => {
    ids.push(menu.menu_id)
    if (menu.children && menu.children.length > 0) {
      ids.push(...getAllmenu_ids(menu.children))
    }
  })
  return ids
}

// 全选菜单
const handleSelectAllMenus = () => {
  const allKeys = getAllmenu_ids(menuTreeData.value)
  checked_keys_menu.value = allKeys
}

// 取消全选菜单
const handleUnselectAllMenus = () => {
  checked_keys_menu.value = []
}

// 全选按钮
const handleSelectAllButtons = () => {
  const allKeys = getAllmenu_ids(buttonTreeData.value)
  checked_keys_button.value = allKeys
}

// 取消全选按钮
const handleUnselectAllButtons = () => {
  checked_keys_button.value = []
}
</script>

<style scoped>
.permission-container {
  max-height: 630px;
}
:deep(.n-tabs-pane-wrapper) {
  height: 600px;
  overflow-y: scroll;
}
.tree-wrapper {
  max-height: 450px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}

.button-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button-item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-item:hover {
  background-color: #f5f5f5;
}

.button-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.button-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.button-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.perms-tag {
  font-family: monospace;
  font-size: 11px;
}

.button-remark {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

:deep(.button-tree-node) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

:deep(.button-tree-node .button-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.button-tree-node .perms-wrapper) {
  flex-shrink: 0;
  margin-left: 0;
}

:deep(.button-tree-node .perms-tag) {
  font-family: monospace;
  font-size: 11px;
}

:deep(.menu-tree-node) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

:deep(.menu-tree-node .menu-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.menu-tree-node .path-wrapper) {
  flex-shrink: 0;
}

:deep(.menu-tree-node .path-tag) {
  font-family: monospace;
  font-size: 11px;
}

.button-perms {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: transparent;
}

.api-item:hover {
  background-color: #f5f5f5;
}

:deep(.api-item .n-checkbox) {
  width: 100%;
}

:deep(.api-item .n-checkbox__label) {
  width: 100%;
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
}

.api-module-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

:deep(.api-tree-node) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

:deep(.api-tree-node .api-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.api-tree-node .method-tag) {
  font-family: monospace;
  font-weight: bold;
  flex-shrink: 0;
}

:deep(.api-tree-node .path-tag) {
  font-family: monospace;
  font-size: 11px;
  flex-shrink: 0;
}

.api-info {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.api-info .api-description {
  flex: 0 0 auto;
  font-size: 14px;
  color: #333;
}

.api-info .method-tag {
  font-family: monospace;
  font-weight: bold;
  flex-shrink: 0;
}

.api-info .path-tag {
  font-family: monospace;
  font-size: 11px;
  flex-shrink: 0;
}

.tree-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.api-permission-list {
  max-height: 450px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-item {
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.api-item:hover {
  background-color: #f5f5f5;
}

.api-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.api-perms {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.api-name {
  font-size: 14px;
  color: #333;
}
</style>
