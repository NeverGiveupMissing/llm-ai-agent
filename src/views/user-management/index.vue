<template>
  <div class="user-management-container">
    <n-card title="用户管理" :bordered="false">
      <!-- ⭐ 搜索和筛选区域 -->
      <div class="filter-section">
        <n-space>
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索用户名或昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            style="width: 120px"
            @update:value="handleFilterChange"
          />
          
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
          
          <!-- ⭐ 使用 v-permission 指令控制显隐 -->
          <n-button type="success" @click="showAddModal" v-permission="'user:create'">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            新增用户
          </n-button>
        </n-space>
      </div>

      <!-- ⭐ 用户列表表格组件 -->
      <UserTable
        :user-list="userList"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        @edit="handleEdit"
        @assign-role="handleAssignRole"
        @reset-password="handleShowResetPassword"
        @delete="handleDelete"
      />
    </n-card>

    <!-- ⭐ 新增/编辑用户弹窗组件 -->
    <UserFormModal
      v-model:visible="addEditModalVisible"
      :is-edit-mode="isEditMode"
      :user-data="currentUser"
      @submit="handleSubmit"
    />

    <!-- ⭐ 分配角色弹窗组件 -->
    <AssignRoleModal
      v-model:visible="assignRoleModalVisible"
      :user="currentUser"
      :role-options="roleOptions"
      @submit="handleAssignRoles"
    />

    <!-- ⭐ 重置密码弹窗组件 -->
    <ResetPasswordModal
      v-model:visible="resetPasswordModalVisible"
      :user="currentUser"
      @submit="handleResetPassword"
    />
  </div>
</template>

<script setup name="UserManagement">
import { ref, reactive, onMounted } from 'vue'
import { useMessage, useDialog, NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline, AddOutline } from '@vicons/ionicons5'
import { 
  getUserList, 
  createUser, 
  updateUser, 
  deleteUser, 
  assignRole,
  resetPassword
} from '@/api/user'
import { getRoleList } from '@/api/role'
import UserTable from './components/UserTable.vue'
import UserFormModal from './components/UserFormModal.vue'
import AssignRoleModal from './components/AssignRoleModal.vue'
import ResetPasswordModal from './components/ResetPasswordModal.vue'

const message = useMessage()
const dialog = useDialog()

// 数据状态
const userList = ref([])
const searchKeyword = ref('')
const statusFilter = ref(null)
const addEditModalVisible = ref(false)
const assignRoleModalVisible = ref(false)
const resetPasswordModalVisible = ref(false)
const isEditMode = ref(false)
const currentUser = ref(null)
const roleOptions = ref([])

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
})

// 状态选项
const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '禁用', value: 'banned' },
  { label: '未激活', value: 'inactive' },
]

// 获取用户列表
const fetchUserList = async () => {
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await getUserList(params)
    // ✅ 拦截器已返回 data.data，直接使用
    userList.value = Array.isArray(res.list) ? res.list : []
    pagination.itemCount = res.pagination?.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error(error.message || '获取用户列表失败')
  }
}

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const res = await getRoleList({ limit: 100 })
    // ✅ 拦截器已返回 data.data，直接使用
    const data = Array.isArray(res) ? res : []
    roleOptions.value = data.map(role => ({
      label: role.display_name || role.name,
      value: role.id,
    }))
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 筛选变化处理
const handleFilterChange = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置筛选
const handleReset = () => {
  searchKeyword.value = ''
  statusFilter.value = null
  pagination.page = 1
  fetchUserList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchUserList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchUserList()
}

// 显示新增用户弹窗
const showAddModal = () => {
  isEditMode.value = false
  currentUser.value = null
  addEditModalVisible.value = true
}

// 显示编辑用户弹窗
const handleEdit = (user) => {
  isEditMode.value = true
  currentUser.value = user
  addEditModalVisible.value = true
}

// ⭐ 显示分配角色弹窗
const handleAssignRole = (user) => {
  currentUser.value = user
  assignRoleModalVisible.value = true
}

// ⭐ 显示重置密码弹窗
const handleShowResetPassword = (user) => {
  currentUser.value = user
  resetPasswordModalVisible.value = true
}

// ⭐ 重置密码
const handleResetPassword = async (newPassword) => {
  try {
    const res = await resetPassword(currentUser.value.id, { newPassword })
    message.success(res.message || '密码重置成功')
    resetPasswordModalVisible.value = false
  } catch (error) {
    console.error('密码重置失败:', error)
    message.error(error.message || '密码重置失败')
  }
}

// ⭐ 启用/禁用用户
const handleToggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'banned' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${action}用户「${user.username}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await updateUser(user.id, { status: newStatus })
        message.success(res.message || `${action}成功`)
        fetchUserList()
      } catch (error) {
        console.error(`${action}用户失败:`, error)
        message.error(error.message || `${action}失败`)
      }
    },
  })
}

// 提交表单
const handleSubmit = async (formData) => {
  try {
    if (isEditMode.value) {
      // 更新用户
      const updateData = {
        email: formData.email,
        avatarUrl: formData.avatarUrl,
        status: formData.status,
      }
      const res = await updateUser(currentUser.value.id, updateData)
      message.success(res.message || '用户更新成功')
      addEditModalVisible.value = false
      fetchUserList()
    } else {
      // 创建用户
      const res = await createUser(formData)
      message.success(res.message || '用户创建成功')
      addEditModalVisible.value = false
      fetchUserList()
    }
  } catch (error) {
    console.error('操作失败:', error)
    message.error(error.message || '操作失败')
  }
}

// 分配角色
const handleAssignRoles = async (roleIds) => {
  try {
    // assignRole API 接受单个 roleId，这里需要循环调用或修改 API
    // 暂时使用第一个角色 ID
    if (roleIds.length > 0) {
      const res = await assignRole(currentUser.value.id, { roleId: roleIds[0] })
      message.success(res.message || '角色分配成功')
      assignRoleModalVisible.value = false
      fetchUserList()
    }
  } catch (error) {
    console.error('角色分配失败:', error)
    message.error(error.message || '角色分配失败')
  }
}

// 删除用户
const handleDelete = async (userId) => {
  try {
    const res = await deleteUser(userId)
    message.success(res.message || '用户删除成功')
    fetchUserList()
  } catch (error) {
    console.error('删除用户失败:', error)
    message.error(error.message || '删除用户失败')
  }
}

onMounted(() => {
  fetchUserList()
  fetchRoleList()
})
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}
</style>
