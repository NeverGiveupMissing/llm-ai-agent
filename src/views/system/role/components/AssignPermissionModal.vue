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
      <!-- display-directive='show': 保持组件不销毁，只隐藏 -->
      <n-tabs
        v-model:value="activeTab"
        type="line"
        animated
        display-directive="show"
        @update:value="handleTabChange"
      >
        <!-- 菜单权限 -->
        <n-tab-pane name="menu" :tab="`菜单权限(${menuCheckedKeys.length})`">
          <MenuPermissionTab
            ref="menuTabRef"
            :checked-keys="menuCheckedKeys"
            @update:checked-keys="menuCheckedKeys = $event"
          />
        </n-tab-pane>

        <!-- 按钮权限 -->
        <n-tab-pane name="button" :tab="`按钮权限(${buttonCheckedKeys.length})`">
          <ButtonPermissionTab
            ref="buttonTabRef"
            :checked-keys="buttonCheckedKeys"
            @update:checked-keys="buttonCheckedKeys = $event"
          />
        </n-tab-pane>

        <!-- 接口权限 -->
        <n-tab-pane name="api" :tab="`接口权限(${apiCheckedKeys.length})`">
          <ApiPermissionTab
            ref="apiTabRef"
            :checked-keys="apiCheckedKeys"
            @update:checked-keys="apiCheckedKeys = $event"
          />
        </n-tab-pane>
      </n-tabs>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import MenuPermissionTab from './MenuPermissionTab.vue'
import ButtonPermissionTab from './ButtonPermissionTab.vue'
import ApiPermissionTab from './ApiPermissionTab.vue'
import { getRoleAllPermissions, saveRoleMenus, saveRoleButtons, saveRoleApis } from '@/api/role'

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

// 子组件引用
const menuTabRef = ref(null)
const buttonTabRef = ref(null)
const apiTabRef = ref(null)

// ✅ 三个独立的勾选状态数组（数据解耦）
const menuCheckedKeys = ref([]) // 菜单权限 ID 列表
const buttonCheckedKeys = ref([]) // 按钮权限 ID 列表
const apiCheckedKeys = ref([]) // 接口权限 ID 列表

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
      console.log('[AssignPermissionModal] 🟢 弹窗打开，开始加载权限数据...')

      // 等待 DOM 更新，确保子组件 ref 已经挂载
      await nextTick()

      // ✅ 关键修复：确保 role_id 是数字类型
      const role_id = parseInt(props.role?.role_id, 10)
      if (isNaN(role_id)) {
        console.error('[AssignPermissionModal] ❌ 角色 ID 无效:', props.role?.role_id)
        message.error('角色信息异常')
        return
      }

      try {
        console.log('[AssignPermissionModal] 📡 步骤 1/2: 并行加载所有 Tab 的树数据...')

        // 1. 并行加载所有树数据（菜单树、按钮树、接口列表）
        await Promise.all([
          menuTabRef.value?.loadMenuTree(),
          buttonTabRef.value?.loadButtonTree(),
          apiTabRef.value?.loadApiPermissions(),
        ])
        console.log('[AssignPermissionModal] ✅ 步骤 1/2 完成：所有树数据加载完成')

        // 2. 调用聚合查询接口，一次性获取所有权限 ID 数组
        console.log('[AssignPermissionModal] 📡 步骤 2/2: 调用聚合查询接口获取角色权限...')
        const permRes = await getRoleAllPermissions(role_id)
        const permissions = permRes?.data || {}

        console.log('[AssignPermissionModal] 📦 聚合权限数据:', permissions)
        console.log('[AssignPermissionModal]   - menus:', permissions.menus?.length || 0, '个')
        console.log('[AssignPermissionModal]   - buttons:', permissions.buttons?.length || 0, '个')
        console.log('[AssignPermissionModal]   - apis:', permissions.apis?.length || 0, '个')

        // 3. 分别填充到三个独立的 checkedKeys 数组中（独立状态回显）
        // ✅ 类型转换：菜单ID和按钮ID需要转换为数字类型，与树节点的 key 匹配
        menuCheckedKeys.value = (permissions.menus || []).map((id) => Number(id)).filter((id) => !isNaN(id))
        buttonCheckedKeys.value = (permissions.buttons || []).map((id) => Number(id)).filter((id) => !isNaN(id))
        apiCheckedKeys.value = permissions.apis || []  // 接口权限保持原样

        console.log('[AssignPermissionModal] ✅ 步骤 2/2 完成：独立状态回显完成')
        console.log('[AssignPermissionModal] 🎉 权限数据加载流程全部完成')
      } catch (error) {
        console.error('[AssignPermissionModal] ❌ 加载权限数据失败:', error)
        // 403 错误已经在拦截器中处理过了
        if (!error._403Handled) {
          message.error(error.message || '加载权限数据失败')
        }
      }
    } else if (!newVal) {
      // 弹窗关闭时清空数据
      console.log('[AssignPermissionModal] 🧹 弹窗关闭，清空所有数据')
      menuTabRef.value?.clearData()
      buttonTabRef.value?.clearData()
      apiTabRef.value?.clearData()
      menuCheckedKeys.value = []
      buttonCheckedKeys.value = []
      apiCheckedKeys.value = []
      activeTab.value = 'menu' // 重置为菜单权限tab
    }
  },
)

// 处理 tab 切换
const handleTabChange = async (tabName) => {
  console.log('[AssignPermissionModal] 切换到 tab:', tabName)

  const role_id = props.role?.role_id
  if (!role_id) return

  // 等待 DOM 更新
  await nextTick()

  try {
    // 注意：切换 tab 时只加载树数据，不重新加载角色权限
    // 这样可以保留用户之前的选择
    if (tabName === 'menu' && menuTabRef.value) {
      console.log('[AssignPermissionModal] 确保菜单树数据已加载...')
      if (menuTabRef.value.menuTreeData?.length === 0) {
        await menuTabRef.value.loadMenuTree()
      }
      console.log('[AssignPermissionModal] ✅ 菜单tab就绪')
    } else if (tabName === 'button' && buttonTabRef.value) {
      console.log('[AssignPermissionModal] 确保按钮树数据已加载...')
      if (buttonTabRef.value.buttonTreeData?.length === 0) {
        await buttonTabRef.value.loadButtonTree()
      }
      console.log('[AssignPermissionModal] ✅ 按钮tab就绪')
    } else if (tabName === 'api' && apiTabRef.value) {
      console.log('[AssignPermissionModal] 确保接口树数据已加载...')
      if (apiTabRef.value.apiTreeData?.length === 0) {
        await apiTabRef.value.loadApiPermissions()
      }
      console.log('[AssignPermissionModal] ✅ 接口tab就绪')
    }
  } catch (error) {
    console.error('[AssignPermissionModal] ❌ 加载树数据失败:', error)
  }
}

// 保存权限分配（数据解耦，根据当前 Tab 调用对应接口）
const handleSave = async () => {
  try {
    saving.value = true

    console.log('[AssignPermissionModal] 开始保存权限...')
    console.log('[AssignPermissionModal] 当前激活的tab:', activeTab.value)

    const role_id = props.role?.role_id
    if (!role_id) {
      message.error('角色信息缺失')
      return
    }

    // ✅ 根据当前激活的 Tab，调用对应的后端接口
    if (activeTab.value === 'menu') {
      // 保存菜单权限
      console.log('[AssignPermissionModal] 💾 原始菜单权限 keys:', menuCheckedKeys.value)
      
      // ✅ 过滤掉非数字的 key（如 "group-其他"），只保留合法的 menu_id
      const validMenuIds = menuCheckedKeys.value
        .filter(key => !isNaN(Number(key)) && Number(key) > 0)
        .map(key => Number(key))
      
      console.log('[AssignPermissionModal] ✅ 过滤后的合法 menu_id:', validMenuIds)
      await saveRoleMenus(role_id, validMenuIds)
      message.success('菜单权限保存成功')
    } else if (activeTab.value === 'button') {
      // 保存按钮权限
      console.log('[AssignPermissionModal] 💾 原始按钮权限 keys:', buttonCheckedKeys.value)
      
      // ✅ 过滤掉非数字的 key
      const validButtonIds = buttonCheckedKeys.value
        .filter(key => !isNaN(Number(key)) && Number(key) > 0)
        .map(key => Number(key))
      
      console.log('[AssignPermissionModal] ✅ 过滤后的合法 button_id:', validButtonIds)
      await saveRoleButtons(role_id, validButtonIds)
      message.success('按钮权限保存成功')
    } else if (activeTab.value === 'api') {
      // 保存接口权限
      console.log('[AssignPermissionModal]  原始接口权限 keys:', apiCheckedKeys.value)
      
      // ✅ 过滤掉非数字的 key
      const validApiIds = apiCheckedKeys.value
        .filter(key => !isNaN(Number(key)) && Number(key) > 0)
        .map(key => Number(key))
      
      console.log('[AssignPermissionModal] ✅ 过滤后的合法 interface_id:', validApiIds)
      await saveRoleApis(role_id, validApiIds)
      message.success('接口权限保存成功')
    }

    // 通知父组件刷新
    emit('save', { success: true })
    visible.value = false
  } catch (error) {
    console.error('[AssignPermissionModal] ❌ 保存失败:', error)
    message.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.permission-container {
  min-height: 600px;
}
:deep(.n-tabs-pane-wrapper) {
  height: 570px;
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
