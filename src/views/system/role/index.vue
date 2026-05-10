<template>
  <div class="role-management-container">
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
      toolbar-title="角色列表"
      row-key="role_id"
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
        <CommonButton type="add" perms="role:create" @click="handleAdd" />
        <CommonButton
          type="edit"
          :disabled="selectedKeys.length !== 1"
          perms="role:update"
          @click="handleEdit(selectedRows[0])"
        />
        <CommonButton
          type="delete"
          :disabled="selectedKeys.length === 0"
          perms="role:delete"
          :confirm-message="`确定要删除选中的 ${selectedKeys.length} 个角色吗？`"
          @confirm="handleBatchDelete"
        />
        <CommonButton type="export" perms="role:export" text="导出" />
      </template>
    </BaseTable>

    <!-- 新增/编辑角色弹窗组件 -->
    <RoleFormModal
      v-model:show="addEditModalVisible"
      :row="currentRole"
      @success="handleFormSuccess"
    />

    <!-- 权限分配弹窗组件 -->
    <AssignPermissionModal
      v-model:show="permissionModalVisible"
      :role="currentRole"
      @save="handleSavePermissions"
    />
  </div>
</template>

<script setup name="RoleManagement">
import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useTable } from '@/components/BaseTable/useTable'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  batchDeleteRole,
  saveRoleMenus,
  saveRoleApis,
} from '@/api/role'
import RoleFormModal from './components/RoleFormModal.vue'
import AssignPermissionModal from './components/AssignPermissionModal.vue'

const message = useMessage()
const dialog = useDialog()

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = ref({
  role_name: '',
  role_key: '',
  status: null,
})

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

// 搜索字段配置
const searchFields = [
  {
    key: 'role_name',
    label: '角色名称',
    type: 'input',
    placeholder: '请输入角色名称',
    width: '180px',
  },
  {
    key: 'role_key',
    label: '角色标识',
    type: 'input',
    placeholder: '请输入角色标识',
    width: '180px',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '角色状态',
    width: '120px',
    options: statusOptions,
  },
]

// 搜索点击
const handleSearchClick = () => {
  // ✅ 直接使用下划线命名的搜索参数
  const searchParams = { ...searchForm.value }

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
  searchForm.value.role_name = ''
  searchForm.value.role_key = ''
  searchForm.value.status = null
  handleReset()
}

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
} = useTable(getRoleList)

// 列配置
const columns = [
  {
    key: 'index',
    title: '序号',
    type: 'index',
    width: 60,
    align: 'center',
    fixed: 'left',
  },
  {
    key: 'role_name',
    title: '角色名',
    minWidth: 120,
  },
  {
    key: 'role_key',
    title: '角色编码',
    minWidth: 120,
  },
  {
    key: 'remark',
    title: '描述',
    minWidth: 200,
    ellipsis: { tooltip: true },
  },
  {
    key: 'status',
    title: '状态',
    type: 'tag',
    width: 80,
    align: 'center',
    tagMap: {
      0: { text: '正常', type: 'success' },
      1: { text: '停用', type: 'error' },
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
    type: 'actions',
    fixed: 'right',
    actionsWidth: 180, // ✅ 操作列宽度
    // ✅ 不再手动定义 actions，由 BaseTable 根据数据库权限动态生成
  },
]

// 数据状态
const addEditModalVisible = ref(false)
const permissionModalVisible = ref(false)
const currentRole = ref(null)

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (
    perms.endsWith(':assign_role') ||
    perms.endsWith(':assign_permission') // ✅ 下划线命名
  ) {
    handleAssignPermissions(row)
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除角色「${row.role_name}」吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const res = await deleteRole(row.role_id)
          message.success(res.message || '删除成功')
          fetchData()
        } catch (error) {
          console.error('删除角色失败:', error)
          message.error(error.message || '删除失败')
        }
      },
    })
  }
}

// 显示新增角色弹窗
const handleAdd = () => {
  currentRole.value = null
  addEditModalVisible.value = true
}

// 显示编辑角色弹窗
const handleEdit = (role) => {
  currentRole.value = role
  addEditModalVisible.value = true
}

// 表单提交成功
const handleFormSuccess = async (formData) => {
  try {
    const role_id = currentRole.value?.role_id

    // ✅ 直接使用 formData，字段名与后端一致（下划线格式）
    const submitData = {
      role_key: formData.role_key,
      role_name: formData.role_name,
      role_sort: formData.role_sort || 0,
      status: formData.status || '0',
      remark: formData.remark || '',
    }

    if (role_id) {
      // 编辑模式
      const res = await updateRole(role_id, submitData)
      message.success(res.message || '角色更新成功')
    } else {
      // 新增模式
      const res = await createRole(submitData)
      message.success(res.message || '角色创建成功')
    }

    addEditModalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('操作失败:', error)
    message.error(error.message || '操作失败')
  }
}

// ⭐ 显示菜单权限分配弹窗
const handleAssignPermissions = (role) => {
  currentRole.value = role
  permissionModalVisible.value = true
}

// 保存权限分配
const handleSavePermissions = async (permissionData) => {
  try {
    const role_id = currentRole.value?.role_id
    const { menu_ids, api_paths } = permissionData

    // 保存菜单权限（包括按钮）
    if (menu_ids && menu_ids.length > 0) {
      const res = await saveRoleMenus(role_id, { menu_ids })
      message.success(res.message || '菜单权限分配成功')
    }

    // 保存接口权限
    // api_paths 格式: ['/api/xxx', '/api/yyy']，需要转换为 [{ path: '/api/xxx', method: 'GET' }, ...]
    if (api_paths && api_paths.length > 0) {
      const formattedApiPaths = api_paths.map((path) => ({
        path,
        method: 'GET', // 默认使用 GET 方法，后续可根据实际需求调整
      }))
      const res = await saveRoleApis(role_id, { api_paths: formattedApiPaths })
      message.success(res.message || '接口权限分配成功')
    }

    permissionModalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('权限分配失败:', error)
    message.error(error.message || '权限分配失败')
  }
}

// 删除角色（CommonButton 已内置二次确认）
const handleDelete = async (row) => {
  try {
    const res = await deleteRole(row.role_id)
    message.success(res.message || '删除成功')
    fetchData()
  } catch (error) {
    console.error('删除角色失败:', error)
    message.error(error.message || '删除失败')
  }
}

// 批量删除（CommonButton 已内置二次确认）
const handleBatchDelete = async () => {
  try {
    const res = await batchDeleteRole(selectedKeys.value)
    message.success(res.message || '批量删除成功')
    fetchData()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error(error.message || '批量删除失败')
  }
}
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}
</style>
