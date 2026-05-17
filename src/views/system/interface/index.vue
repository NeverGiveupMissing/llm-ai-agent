<template>
  <div class="interface-management-container">
    <!-- ✅ 完全由 BaseTable 控制搜索区域和工具栏按钮 -->
    <BaseTable
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :checkable="true"
      toolbar-title="接口列表"
      row-key="interface_id"
      show-search-toggle
      v-model:show-search="showSearch"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @selection-change="handleSelectionChange"
      @refresh="fetchData"
      @action-click="handleActionClick"
      @search="handleSearchClick"
      @reset="handleResetClick"
    >
      <!-- ✅ 搜索表单（由 BaseTable 内部的 BaseForm 渲染） -->
      <template #search>
        <BaseForm
          ref="searchFormRef"
          v-model="searchForm"
          :fields="searchFields"
          inline
          :show-feedback="false"
          label-width="auto"
          @search="handleSearchClick"
          @reset="handleResetClick"
        />
      </template>
    </BaseTable>

    <!-- 弹窗组件 -->
    <InterfaceFormModal
      v-model:show="showFormModal"
      :row="currentRow"
      :fields="formFields"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup name="InterfaceManagement">
import { ref, reactive, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useTable } from '@/components/BaseTable/useTable'
import {
  getInterfaceList,
  createInterface,
  updateInterface,
  deleteInterface,
  exportInterfaces,
} from '@/api/interface'
import InterfaceFormModal from './components/InterfaceFormModal.vue'

const message = useMessage()
const dialog = useDialog()

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  interface_name: '',
  interface_url: '',
  interface_method: null,
  status: null,
})

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

// 搜索字段配置
const searchFields = [
  {
    key: 'interface_name',
    label: '接口名称',
    type: 'input',
    placeholder: '请输入接口名称',
    width: '180px',
  },
  {
    key: 'interface_url',
    label: '接口路径',
    type: 'input',
    placeholder: '请输入接口路径',
    width: '200px',
  },
  {
    key: 'interface_method',
    label: '请求方式',
    type: 'select',
    placeholder: '请求方式',
    width: '120px',
    options: methodOptions,
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '接口状态',
    width: '120px',
    options: statusOptions,
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
} = useTable(getInterfaceList)

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'interface_name',
    label: '接口名称',
    type: 'input',
    required: true,
    placeholder: '请输入接口名称',
    span: 2,
  },
  {
    key: 'interface_url',
    label: '接口路径',
    type: 'input',
    required: true,
    placeholder: '请输入接口路径，如：/api/users',
    span: 2,
  },
  {
    key: 'interface_method',
    label: '请求方式',
    type: 'select',
    required: true,
    placeholder: '请选择请求方式',
    options: methodOptions,
  },
  {
    key: 'interface_category',
    label: '所属模块',
    type: 'input',
    required: true,
    placeholder: '请输入所属模块，如：用户管理',
  },
  {
    key: 'status',
    label: '状态',
    type: 'radio',
    defaultValue: '0',
    options: statusOptions,
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    span: 2,
    rows: 3,
    placeholder: '请输入备注',
  },
])

// 搜索点击
const handleSearchClick = () => {
  // 统一使用下划线命名（与数据库字段保持一致）
  const searchParams = {
    interface_name: searchForm.interface_name || '',
    interface_url: searchForm.interface_url || '',
    interface_method: searchForm.interface_method || '',
    status: searchForm.status || '',
  }
  // 保留所有字段，空值由后端统一处理
  handleSearch(searchParams)
}

// 重置点击
const handleResetClick = () => {
  searchForm.interface_name = ''
  searchForm.interface_url = ''
  searchForm.interface_method = null // ✅ 重置为 null，确保 placeholder 正常显示
  searchForm.status = null
  handleReset()
}

// 弹窗状态
const showFormModal = ref(false)
const currentRow = ref(null)

// 新增
const handleAdd = () => {
  currentRow.value = null
  showFormModal.value = true
}

// 编辑
const handleEdit = (row) => {
  currentRow.value = row
  showFormModal.value = true
}

// 批量删除（CommonButton 已内置二次确认）
const handleBatchDelete = async () => {
  try {
    // 将字符串ID转换为数字类型
    const numericIds = selectedKeys.value.map(id => Number(id))
    await Promise.all(numericIds.map((id) => deleteInterface(id)))
    message.success('批量删除成功')
    fetchData()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

// 表单提交成功
const handleFormSuccess = async ({ isEdit, data }) => {
  try {
    if (isEdit) {
      // ✅ 使用下划线字段名的 interface_id
      const interfaceId = currentRow.value?.interface_id || currentRow.value?.interfaceId
      await updateInterface(interfaceId, data)
      message.success('修改成功')
    } else {
      await createInterface(data)
      message.success('新增成功')
    }
    showFormModal.value = false
    fetchData()
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

// 列配置
const columns = [
  {
    key: 'interface_name',
    title: '接口名称',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row) => row.interface_name || '-',
  },
  {
    key: 'interface_category',
    title: '所属分类',
    width: 120,
    render: (row) => row.interface_category || '-',
  },
  {
    key: 'interface_url',
    title: '接口路径',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: (row) => row.interface_url || '-',
  },
  {
    key: 'interface_method',
    title: '请求方式',
    width: 100,
    align: 'center',
    type: 'tag',
    tagMap: {
      GET: { text: 'GET', type: 'info' },
      POST: { text: 'POST', type: 'success' },
      PUT: { text: 'PUT', type: 'warning' },
      DELETE: { text: 'DELETE', type: 'error' },
      PATCH: { text: 'PATCH', type: 'info' },
      OPTIONS: { text: 'OPTIONS', type: 'default' },
    },
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    align: 'center',
    type: 'tag',
    tagMap: {
      0: { text: '正常', type: 'success' },
      1: { text: '停用', type: 'error' },
    },
  },
  {
    key: 'remark',
    title: '备注',
    minWidth: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.remark || '-',
  },
  {
    key: 'create_by',
    title: '创建人',
    width: 100,
    render: (row) => row.create_by || '-',
  },
  {
    key: 'create_time',
    title: '创建时间',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    key: 'update_by',
    title: '更新人',
    width: 100,
    render: (row) => row.update_by || '-',
  },
  {
    key: 'update_time',
    title: '更新时间',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    key: 'actions',
    title: '操作',
    align: 'center',
    fixed: 'right',
    actionsWidth: 100, // ✅ 明确指定操作列宽度
    type: 'actions',
    // ✅ 不再手动定义 actions，由 BaseTable 根据数据库权限动态生成
  },
]

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  // ✅ 兼容多种权限后缀命名
  if (perms.endsWith(':add') || perms.endsWith(':create')) {
    handleAdd()
  } else if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (perms.endsWith(':export')) {
    handleExport()
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除接口“${row.interface_name}”吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteInterface(row.interface_id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }
}

// 不需要手动调用 fetchData()，useTable 的 onMounted 会自动调用

// 导出功能
const handleExport = async () => {
  try {
    // 构建导出参数（与搜索条件相同）
    const params = { ...searchForm }
    await exportInterfaces(params)
    // 成功提示已在 download.js 中处理
  } catch (error) {
    console.error('导出失败:', error)
    // 错误提示已在 download.js 中处理
  }
}
</script>

<style scoped>
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
</style>
