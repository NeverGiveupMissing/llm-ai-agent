<template>
  <div class="interface-management-container">
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

    <!-- 表格区域 -->
    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :checkable="true"
      toolbar-title="接口列表"
      row-key="api_id"
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
        <!-- 新增按钮 -->
        <CommonButton type="add" perms="interface:create" @click="handleAdd" />

        <!-- 编辑按钮 -->
        <CommonButton
          type="edit"
          :disabled="selectedKeys.length !== 1"
          perms="interface:update"
          @click="handleEdit(selectedRows[0])"
        />

        <!-- 删除按钮（批量） -->
        <CommonButton
          type="delete"
          :disabled="selectedKeys.length === 0"
          perms="interface:delete"
          :confirm-message="`确定要删除选中的 ${selectedKeys.length} 个接口吗？`"
          @confirm="handleBatchDelete"
        />

        <!-- 导出按钮 -->
        <CommonButton type="export" perms="interface:export" text="导出" />
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
import { ref, reactive, h, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useTable } from '@/components/BaseTable/useTable'
import {
  getInterfaceList,
  createInterface,
  updateInterface,
  deleteInterface,
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
  api_name: '',
  api_url: '',
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
    key: 'api_name',
    label: '接口名称',
    type: 'input',
    placeholder: '请输入接口名称',
    width: '200px',
  },
  {
    key: 'api_url',
    label: '接口路径',
    type: 'input',
    placeholder: '请输入接口路径',
    width: '200px',
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
    key: 'apiName',
    label: '接口名称',
    type: 'input',
    required: true,
    placeholder: '请输入接口名称',
    span: 2,
  },
  {
    key: 'apiUrl',
    label: '接口路径',
    type: 'input',
    required: true,
    placeholder: '请输入接口路径，如：/api/users',
    span: 2,
  },
  {
    key: 'apiMethod',
    label: '请求方式',
    type: 'select',
    required: true,
    placeholder: '请选择请求方式',
    options: methodOptions,
  },
  {
    key: 'apiCategory',
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
  handleSearch(searchForm)
}

// 重置点击
const handleResetClick = () => {
  searchForm.api_name = ''
  searchForm.api_url = ''
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
    await Promise.all(selectedKeys.value.map((id) => deleteInterface(id)))
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
      await updateInterface(currentRow.value.api_id, data)
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
    key: 'api_name',
    title: '接口名称',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row) => row.api_name || '-',
  },
  {
    key: 'api_category',
    title: '所属分类',
    width: 120,
    render: (row) => row.api_category || '-',
  },
  {
    key: 'api_url',
    title: '接口路径',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: (row) => row.api_url || '-',
  },
  {
    key: 'api_method',
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
    actionsWidth: 100, // ✅ 明确指定操作列宽度
    type: 'actions',
    // ✅ 不再手动定义 actions，由 BaseTable 根据数据库权限动态生成
  },
]

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  // ✅ 兼容多种权限后缀命名
  if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除接口"${row.api_name}"吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteInterface(row.api_id)
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
</script>

<style scoped>
.interface-management-container {
  padding: 16px;
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
</style>
