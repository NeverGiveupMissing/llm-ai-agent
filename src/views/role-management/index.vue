<template>
  <div class="role-management-container">
    <n-card title="角色管理" :bordered="false">
      <!-- 搜索和新增区域 -->
      <div class="filter-section">
        <n-space>
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索角色名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          
          <n-button type="primary" @click="handleSearch">
            <template #icon>
              <n-icon><SearchOutline /></n-icon>
            </template>
            搜索
          </n-button>
          
          <n-button @click="handleReset">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重置
          </n-button>
          
          <n-button type="success" @click="showAddModal" v-permission="'role:create'">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            新增角色
          </n-button>
        </n-space>
      </div>

      <!-- 角色列表表格组件 -->
      <RoleTable
        :role-list="roleList"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        @edit="handleEdit"
        @assign-permissions="handleAssignPermissions"
        @toggle-status="handleToggleStatus"
        @delete="handleDelete"
      />
    </n-card>

    <!-- 新增/编辑角色弹窗组件 -->
    <RoleFormModal
      v-model:visible="addEditModalVisible"
      :is-edit-mode="isEditMode"
      :role-data="currentRole"
      @submit="handleSubmit"
    />

    <!-- 权限分配弹窗组件 -->
    <AssignPermissionModal
      v-model:visible="permissionModalVisible"
      :role="currentRole"
      :permission-tree-data="permissionTreeData"
      :checked-permission-keys="checkedPermissionKeys"
      @save="handleSavePermissions"
    />
  </div>
</template>

<script setup name="RoleManagement">
import { ref, reactive, onMounted } from 'vue'
import { useMessage, useDialog, NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline, AddOutline } from '@vicons/ionicons5'
import { 
  getRoleList, 
  createRole, 
  updateRole, 
  deleteRole,
  assignPermissions,
  getRoleDetail
} from '@/api/role'
import { getPermissionTree } from '@/api/permission'
import RoleTable from './components/RoleTable.vue'
import RoleFormModal from './components/RoleFormModal.vue'
import AssignPermissionModal from './components/AssignPermissionModal.vue'

const message = useMessage()
const dialog = useDialog()

// 数据状态
const roleList = ref([])
const searchKeyword = ref('')
const addEditModalVisible = ref(false)
const permissionModalVisible = ref(false)
const isEditMode = ref(false)
const currentRole = ref(null)
const permissionTreeData = ref([])
const checkedPermissionKeys = ref([])

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
})

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const res = await getRoleList(params)
    // ✅ 拦截器已返回 data.data，直接使用
    roleList.value = Array.isArray(res.list) ? res.list : []
    pagination.itemCount = res.pagination?.total || 0
  } catch (error) {
    console.error('获取角色列表失败:', error)
    message.error(error.message || '获取角色列表失败')
  }
}

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const res = await getPermissionTree()
    // ✅ 拦截器已返回 data.data，直接使用
    const data = Array.isArray(res) ? res : []
    permissionTreeData.value = transformPermissionTree(data)
  } catch (error) {
    console.error('获取权限树失败:', error)
    message.error(error.message || '获取权限树失败')
  }
}

// 转换权限树格式为Naive UI Tree格式
const transformPermissionTree = (permissions) => {
  return permissions.map((perm) => ({
    key: perm.id,
    label: `${perm.name} (${perm.code})`,
    children: perm.children && perm.children.length > 0 
      ? transformPermissionTree(perm.children) 
      : undefined,
  }))
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchRoleList()
}

// 重置筛选
const handleReset = () => {
  searchKeyword.value = ''
  pagination.page = 1
  fetchRoleList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchRoleList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchRoleList()
}

// 显示新增角色弹窗
const showAddModal = () => {
  isEditMode.value = false
  currentRole.value = null
  addEditModalVisible.value = true
}

// 显示编辑角色弹窗
const handleEdit = (role) => {
  isEditMode.value = true
  currentRole.value = role
  addEditModalVisible.value = true
}

// 提交表单
const handleSubmit = async (formData) => {
  try {
    if (isEditMode.value) {
      // 更新角色
      const updateData = {
        displayName: formData.displayName,
        description: formData.description,
        isSystem: formData.isSystem,
      }
      const res = await updateRole(currentRole.value.id, updateData)
      message.success(res.message || '角色更新成功')
      addEditModalVisible.value = false
      fetchRoleList()
    } else {
      // 创建角色
      const res = await createRole(formData)
      message.success(res.message || '角色创建成功')
      addEditModalVisible.value = false
      fetchRoleList()
    }
  } catch (error) {
    console.error('操作失败:', error)
    message.error(error.message || '操作失败')
  }
}

// ⭐ 显示权限分配弹窗
const handleAssignPermissions = async (role) => {
  currentRole.value = role
  permissionModalVisible.value = true
  
  // 获取角色当前的权限
  try {
    const res = await getRoleDetail(role.id)
    // ✅ 拦截器已返回 data.data，直接使用
    const permissions = res.permissions || []
    checkedPermissionKeys.value = permissions.map(p => p.id)
  } catch (error) {
    console.error('获取角色权限失败:', error)
    message.error(error.message || '获取角色权限失败')
  }
}

// ⭐ 启用/禁用角色
const handleToggleStatus = async (role) => {
  const newStatus = role.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${action}角色「${role.display_name}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await updateRole(role.id, { status: newStatus })
        message.success(res.message || `${action}成功`)
        fetchRoleList()
      } catch (error) {
        console.error(`${action}角色失败:`, error)
        message.error(error.message || `${action}失败`)
      }
    },
  })
}

// 保存权限分配
const handleSavePermissions = async (permissionIds) => {
  try {
    const res = await assignPermissions(currentRole.value.id, {
      permissionIds,
    })
    message.success(res.message || '权限分配成功')
    permissionModalVisible.value = false
  } catch (error) {
    console.error('权限分配失败:', error)
    message.error(error.message || '权限分配失败')
  }
}

// 删除角色
const handleDelete = async (roleId) => {
  try {
    const res = await deleteRole(roleId)
    message.success(res.message || '角色删除成功')
    fetchRoleList()
  } catch (error) {
    console.error('删除角色失败:', error)
    message.error(error.message || '删除角色失败')
  }
}

onMounted(() => {
  fetchRoleList()
  fetchPermissionTree()
})
</script>

<style scoped>
.role-management-container {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}
</style>
