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
            :checked-menu-keys="checkedMenuKeys"
            @update:checked-menu-keys="checkedMenuKeys = $event"
          />
        </n-tab-pane>

        <!-- 按钮权限 -->
        <n-tab-pane name="button" tab="按钮权限">
          <ButtonPermissionTab
            :button-tree-data="buttonTreeData"
            :button-tree-loading="buttonTreeLoading"
            :checked-button-keys="checkedButtonKeys"
            @update:checked-button-keys="checkedButtonKeys = $event"
          />
        </n-tab-pane>

        <!-- 接口权限 -->
        <n-tab-pane name="api" tab="接口权限">
          <ApiPermissionTab
            :api-tree-data="apiTreeData"
            :api-permission-loading="apiPermissionLoading"
            :checked-api-keys="checkedApiKeys"
            @update:checked-api-keys="checkedApiKeys = $event"
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
import { getRoleMenuIds } from '@/api/role'
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
const checkedMenuKeys = ref([])

// 按钮权限相关
const buttonTreeData = ref([])
const buttonTreeLoading = ref(false)
const checkedButtonKeys = ref([])

// 接口权限相关
const apiTreeData = ref([])
const apiPermissionLoading = ref(false)
const checkedApiKeys = ref([])

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
      checkedMenuKeys.value = []
      buttonTreeData.value = []
      checkedButtonKeys.value = []
      apiTreeData.value = []
      checkedApiKeys.value = []
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

    // 模拟数据，按模块分类
    const apiData = [
      // 菜单管理接口
      {
        module: '菜单管理',
        apis: [
          { path: '/api/menu/list', method: 'GET', description: '获取菜单列表' },
          { path: '/api/menu/create', method: 'POST', description: '创建菜单' },
          { path: '/api/menu/update', method: 'PUT', description: '更新菜单' },
          { path: '/api/menu/delete', method: 'DELETE', description: '删除菜单' },
        ],
      },
      // 角色管理接口
      {
        module: '角色管理',
        apis: [
          { path: '/api/role/list', method: 'GET', description: '获取角色列表' },
          { path: '/api/role/create', method: 'POST', description: '创建角色' },
          { path: '/api/role/update', method: 'PUT', description: '更新角色' },
          { path: '/api/role/delete', method: 'DELETE', description: '删除角色' },
          { path: '/api/role/assign-permission', method: 'POST', description: '分配权限' },
        ],
      },
      // 用户管理接口
      {
        module: '用户管理',
        apis: [
          { path: '/api/user/list', method: 'GET', description: '获取用户列表' },
          { path: '/api/user/create', method: 'POST', description: '创建用户' },
          { path: '/api/user/update', method: 'PUT', description: '更新用户' },
          { path: '/api/user/delete', method: 'DELETE', description: '删除用户' },
          { path: '/api/user/reset-password', method: 'POST', description: '重置密码' },
        ],
      },
    ]

    // 构建树形结构
    apiTreeData.value = apiData.map((module) => ({
      path: `module-${module.module}`,
      name: module.module,
      isModule: true,
      children: module.apis.map((api) => ({
        ...api,
        name: api.description,
      })),
    }))
  } catch (error) {
    console.error('获取接口权限列表失败:', error)
    message.error(error.message || '获取接口权限列表失败')
  } finally {
    apiPermissionLoading.value = false
  }
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
      if (!item.isModule && item.path) {
        paths.push(item.path)
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

// 过滤指定类型的菜单（保留树形结构）
const filterMenuType = (menus, types) => {
  const filtered = []
  for (const menu of menus) {
    // 递归处理子节点
    const filteredChildren = menu.children ? filterMenuType(menu.children, types) : []

    // 如果当前节点是指定类型，或者子节点中有匹配项，保留它
    if (types.includes(menu.menuType) || filteredChildren.length > 0) {
      filtered.push({
        ...menu,
        children: filteredChildren,
      })

      // 调试：输出被保留的节点
      if (menu.menuType === 'F') {
        console.log('保留按钮节点:', menu.menuName, 'perms:', menu.perms)
      }
    }
  }
  return filtered
}

// 加载角色已有权限
const loadRolePermissions = async () => {
  try {
    const roleId = props.role?.role_id

    if (!roleId) {
      console.warn('角色ID不存在')
      return
    }

    const res = await getRoleMenuIds(roleId)
    const allMenuIds = res.data || []

    // 根据权限ID分配给不同的checkedKeys
    checkedMenuKeys.value = allMenuIds.filter((id) => {
      return menuTreeData.value.some((menu) => matchMenuId(menu, id))
    })

    checkedButtonKeys.value = allMenuIds.filter((id) => {
      return buttonTreeData.value.some((menu) => matchMenuId(menu, id))
    })
  } catch (error) {
    console.error('获取角色权限失败:', error)
    message.error(error.message || '获取角色权限失败')
  }
}

// 递归查找菜单ID是否匹配
const matchMenuId = (menu, targetId) => {
  if (String(menu.menuId) === String(targetId)) return true
  if (menu.children && menu.children.length > 0) {
    return menu.children.some((child) => matchMenuId(child, targetId))
  }
  return false
}

// 保存权限分配
const handleSave = async () => {
  try {
    saving.value = true

    // 合并所有权限ID（菜单 + 按钮）
    const allMenuIds = [...checkedMenuKeys.value, ...checkedButtonKeys.value]

    emit('save', {
      menuIds: allMenuIds,
      apiPaths: checkedApiKeys.value.filter((key) => !key.startsWith('module-')), // 只保存接口路径，过滤掉模块ID
    })
  } catch (error) {
    console.error('保存权限失败:', error)
    message.error(error.message || '保存权限失败')
  } finally {
    saving.value = false
  }
}

// 递归获取所有菜单ID
const getAllMenuIds = (menus) => {
  const ids = []
  menus.forEach((menu) => {
    ids.push(menu.menuId)
    if (menu.children && menu.children.length > 0) {
      ids.push(...getAllMenuIds(menu.children))
    }
  })
  return ids
}
</script>

<style scoped>
.permission-container {
  max-height: 600px;
  overflow: hidden;
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
