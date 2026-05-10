<template>
  <div class="user-management-container">
    <!-- 搜索区域 -->
    <n-card :bordered="false" class="search-card" v-show="showSearch">
      <BaseForm
        ref="searchFormRef"
        v-model="searchForm"
        :fields="searchFields"
        inline
        :show-feedback="false"
        label-width="auto"
      >
        <template #actions>
          <CommonButton type="query" @click="handleSearchClick">搜索</CommonButton>
          <CommonButton type="reset" @click="handleResetClick">重置</CommonButton>
        </template>
      </BaseForm>
    </n-card>

    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :checkable="true"
      toolbar-title="用户列表"
      row-key="user_id"
      show-search-toggle
      v-model:show-search="showSearch"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @selection-change="handleSelectionChange"
      @refresh="fetchData"
      @action-click="handleActionClick"
    >
      <!-- 工具栏左侧按钮 -->
      <template #toolbar-left>
        <CommonButton type="add" perms="user:create" @click="handleAdd" />
        <CommonButton
          type="edit"
          :disabled="selectedKeys.length !== 1"
          perms="user:update"
          @click="handleEdit(selectedRows[0])"
        />
        <CommonButton
          type="delete"
          :disabled="selectedKeys.length === 0"
          perms="user:delete"
          :confirm-message="`确定要删除选中的 ${selectedKeys.length} 个用户吗？`"
          @confirm="handleBatchDelete"
        />
        <CommonButton type="export" perms="user:export" text="导出" />
      </template>
    </BaseTable>

    <!-- 弹窗组件 -->
    <UserFormModal
      v-model:show="showFormModal"
      :row="currentRow"
      :fields="formFields"
      @success="handleFormSuccess"
    />
    <AssignRoleModal
      v-model:show="showRoleModal"
      :user="currentRow"
      :role-options="roleOptions"
      @submit="handleAssignRoles"
    />
    <ResetPasswordModal
      v-model:show="showResetPasswordModal"
      :user="currentRow"
      @submit="handleResetPassword"
    />
  </div>
</template>

<script setup name="UserManagement">
import { ref, reactive, h, computed } from 'vue'
import { useMessage, useDialog, useLoadingBar } from 'naive-ui'
import { useTable } from '@/components/BaseTable/useTable'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  assignRole,
  resetPassword,
  updateUserStatus,
} from '@/api/user'
import { getRoleList } from '@/api/role'
import UserFormModal from './components/UserFormModal.vue'
import AssignRoleModal from './components/AssignRoleModal.vue'
import ResetPasswordModal from './components/ResetPasswordModal.vue'

const message = useMessage()
const dialog = useDialog()
const loadingBar = useLoadingBar()

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  user_name: '',
  phonenumber: '',
  status: null,
  begin_time: null,
  end_time: null,
})

const statusOptions = [
  { label: '正常', value: '1' }, // ✅ 自定义：1=正常
  { label: '停用', value: '0' }, // ✅ 自定义：0=停用
]

// 搜索字段配置
const searchFields = [
  {
    key: 'user_name',
    label: '用户名称',
    type: 'input',
    placeholder: '请输入用户名称',
    width: '200px',
  },
  {
    key: 'phonenumber',
    label: '手机号码',
    type: 'input',
    placeholder: '请输入手机号码',
    width: '180px',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '用户状态',
    width: '120px',
    options: statusOptions,
  },
  {
    key: 'begin_time',
    label: '创建时间',
    type: 'date',
    placeholder: '开始时间',
    width: '160px',
  },
  {
    key: 'end_time',
    label: '',
    type: 'date',
    placeholder: '结束时间',
    width: '160px',
  },
]

// 使用 useTable 组合式函数
const {
  tableData,
  loading,
  pagination,
  selectedKeys,
  selectedRows,
  fetchData,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange,
} = useTable(getUserList)

// 开关 loading 状态映射
const switchLoadingMap = ref({})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'user_name',
    label: '用户名',
    type: 'input',
    required: true,
    maxlength: 30,
    disabled: !!currentRow.value?.user_id,
  },
  {
    key: 'nick_name',
    label: '昵称',
    type: 'input',
    maxlength: 30,
  },
  {
    key: 'phonenumber',
    label: '手机号',
    type: 'input',
    maxlength: 11,
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'input',
  },
  {
    key: 'password',
    label: '密码',
    type: 'password',
    required: !currentRow.value?.user_id,
    hidden: !!currentRow.value?.user_id,
  },
  {
    key: 'sex',
    label: '性别',
    type: 'radio',
    defaultValue: '0',
    options: [
      { label: '男', value: '0' },
      { label: '女', value: '1' },
      { label: '保密', value: '2' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    defaultValue: '1', // ✅ 自定义：默认正常状态
    checkedValue: '1', // ✅ 自定义：1=正常（开启）
    uncheckedValue: '0', // ✅ 自定义：0=停用（关闭）
    checkedText: '正常',
    uncheckedText: '停用',
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    span: 2,
    rows: 3,
    maxlength: 200,
    showCount: true,
  },
])

// 状态变更
const handleStatusChange = async (row) => {
  if (row.user_id === 1) return

  const newStatus = row.status === '1' ? '0' : '1'
  switchLoadingMap.value[row.user_id] = true

  try {
    await updateUserStatus(row.user_id, { status: newStatus })
    row.status = newStatus
    message.success('状态更新成功')
  } catch (error) {
    message.error(error.message || '状态更新失败')
  } finally {
    switchLoadingMap.value[row.user_id] = false
  }
}

// 搜索点击
const handleSearchClick = () => {
  // ✅ 直接使用下划线命名的搜索参数
  const searchParams = { ...searchForm }

  // 移除空值
  Object.keys(searchParams).forEach((key) => {
    if (searchParams[key] === '' || searchParams[key] === null || searchParams[key] === undefined) {
      delete searchParams[key]
    }
  })

  handleSearch(searchParams)
}

// 重置点击
const handleResetClick = () => {
  searchForm.user_name = ''
  searchForm.phonenumber = ''
  searchForm.status = null
  searchForm.begin_time = null
  searchForm.end_time = null
  handleReset()
}

// 列配置
const columns = [
  {
    key: 'user_id',
    title: '用户ID',
    type: 'index',
    width: 80,
    align: 'center',
    fixed: 'left',
  },
  {
    key: 'user_name',
    title: '用户名称',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row) => row.user_name || '-',
  },
  {
    key: 'nick_name',
    title: '用户昵称',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row) => row.nick_name || '-',
  },
  {
    key: 'phonenumber',
    title: '手机号码',
    minWidth: 120,
    render: (row) => row.phonenumber || '-',
  },
  {
    key: 'roles',
    title: '角色',
    minWidth: 150,
    render: (row) => {
      if (!row.roles || !Array.isArray(row.roles) || row.roles.length === 0) return '-'
      const roleNames = row.roles
        .filter((r) => r && (r.role_name || r.roleName))
        .map((r) => r.role_name || r.roleName)
      return roleNames.length > 0 ? roleNames.join('、') : '-'
    },
  },
  {
    key: 'status',
    title: '状态',
    type: 'tag',
    width: 80,
    align: 'center',
    tagMap: {
      1: { text: '正常', type: 'success' }, // ✅ 自定义：1=正常
      0: { text: '停用', type: 'error' }, // ✅ 自定义：0=停用
    },
  },
  {
    key: 'create_time',
    title: '创建时间',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    key: 'actions',
    title: '操作',
    align: 'center',
    fixed: 'right',
    type: 'actions',
    // ✅ 不再手动定义 actions，由 BaseTable 根据数据库权限动态生成
  },
]

// 弹窗状态
const showFormModal = ref(false)
const showRoleModal = ref(false)
const showResetPasswordModal = ref(false)
const isEditMode = ref(false)
const currentRow = ref(null)
const roleOptions = ref([])

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const res = await getRoleList({ page_size: 100 })

    const list = res?.data?.list || []

    // ✅ 确保 value 统一为数字类型，避免子组件类型不匹配
    roleOptions.value = list.map((role) => ({
      label: role.role_name,
      value: Number(role.role_id),
    }))
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 更多操作菜单
const getMoreActions = (row) => {
  const actions = []
  if (row.user_id !== 1) {
    actions.push({
      label: '重置密码',
      key: 'reset_pwd',
      type: 'reset', // ✅ 设置 type 用于 BaseTable 过滤
      permission: 'user:reset_pwd',
      props: { onClick: () => handleShowResetPassword(row) },
    })
  }
  // 只有拥有用户管理菜单权限的用户才能分配角色
  actions.push({
    label: '分配角色',
    key: 'assign_role',
    type: 'assign_role', // ✅ 设置 type 用于 BaseTable 过滤
    permission: 'user:assign_role', // ✅ 使用下划线命名（与后端数据库保持一致）
    props: { onClick: () => handleAssignRole(row) },
  })
  return actions
}

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  // ✅ 兼容多种权限后缀命名（下划线风格）
  if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    handleDelete(row)
  } else if (perms.endsWith(':reset_pwd') || perms.endsWith(':reset')) {
    handleShowResetPassword(row)
  } else if (perms.endsWith(':assign_role') || perms.endsWith(':assign')) {
    handleAssignRole(row)
  }
}

// 操作方法
const handleAdd = () => {
  isEditMode.value = false
  currentRow.value = null
  showFormModal.value = true
}

const handleEdit = (row) => {
  if (!row) return
  isEditMode.value = true
  currentRow.value = { ...row }
  showFormModal.value = true
}

const handleAssignRole = (row) => {
  currentRow.value = row
  showRoleModal.value = true
}

const handleShowResetPassword = (row) => {
  currentRow.value = row
  showResetPasswordModal.value = true
}

const handleResetPassword = async (newPassword) => {
  try {
    const res = await resetPassword(currentRow.value.user_id, { new_password: newPassword })
    message.success(res.message || '密码重置成功')
    showResetPasswordModal.value = false
    fetchData()
  } catch (error) {
    message.error(error.message || '密码重置失败')
  }
}

const handleDelete = async (row) => {
  try {
    const res = await deleteUser(row.user_id)
    message.success(res.message || '删除成功')
    fetchData()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

// 批量删除（CommonButton 已内置二次确认）
const handleBatchDelete = async () => {
  try {
    const res = await batchDeleteUser(selectedKeys.value)
    message.success(res.message || '批量删除成功')
    fetchData()
  } catch (error) {
    message.error(error.message || '批量删除失败')
  }
}

// 表单提交成功回调
const handleFormSuccess = () => {
  showFormModal.value = false
  fetchData()
}

// 分配角色
const handleAssignRoles = async (role_ids) => {
  try {
    if (role_ids && role_ids.length > 0) {
      const res = await assignRole(currentRow.value.user_id, { role_id: role_ids[0] })
      message.success(res.message || '角色分配成功')
      showRoleModal.value = false
      fetchData()
    }
  } catch (error) {
    message.error(error.message || '角色分配失败')
  }
}

// 初始化
fetchRoleList()
</script>

<style scoped>
.user-management-container {
  background: #f0f2f5;
}

.search-card {
  margin-bottom: 16px;
  border: 1px solid #ebeef5 !important;
  flex-shrink: 0;
}

/* BaseTable 占据剩余空间 */
:deep(.base-table-wrapper) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 表格紧凑样式 */
:deep(.n-data-table-td) {
  padding: 8px 12px !important;
}

/* 操作链接样式（若依风格） */
.action-link {
  transition: all 0.2s;
  font-size: 14px;
}

.action-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
