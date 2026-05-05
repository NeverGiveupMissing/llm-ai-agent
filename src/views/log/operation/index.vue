<template>
  <div class="operation-log-container">
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
          <n-button type="primary" @click="handleSearchClick">
            <template #icon>
              <n-icon><SearchOutline /></n-icon>
            </template>
            搜索
          </n-button>
          <n-button @click="handleResetClick">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重置
          </n-button>
        </template>
      </BaseForm>
    </n-card>

    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      toolbar-title="操作日志"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @refresh="fetchData"
    />
  </div>
</template>

<script setup name="OperationLog">
import { ref, reactive, h } from 'vue'
import { NTooltip, NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { useTable } from '@/components/BaseTable/useTable'
import { getOperationLogs } from '@/api/operation-log'

// 使用 useTable 组合式函数
const {
  tableData,
  loading,
  pagination,
  fetchData,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
} = useTable(getOperationLogs)

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  username: '',
  startDate: null,
  endDate: null,
})

// 格式化时长
const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 搜索字段配置
const searchFields = [
  {
    key: 'username',
    label: '操作人',
    type: 'input',
    placeholder: '请输入操作人',
    width: '160px',
  },
  {
    key: 'startDate',
    label: '开始日期',
    type: 'date',
    width: '160px',
  },
  {
    key: 'endDate',
    label: '结束日期',
    type: 'date',
    width: '160px',
  },
]

// 搜索点击
const handleSearchClick = () => {
  handleSearch(searchForm)
}

// 重置点击
const handleResetClick = () => {
  searchForm.username = ''
  searchForm.startDate = null
  searchForm.endDate = null
  handleReset()
}

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
    key: 'username',
    title: '操作人',
    width: 120,
    fixed: 'left',
  },
  {
    key: 'operation',
    title: '操作描述',
    minWidth: 200,
    ellipsis: { tooltip: true },
  },
  {
    key: 'method',
    title: '请求方法',
    type: 'tag',
    width: 100,
    align: 'center',
    tagMap: {
      GET: { text: 'GET', type: 'success' },
      POST: { text: 'POST', type: 'info' },
      PUT: { text: 'PUT', type: 'warning' },
      DELETE: { text: 'DELETE', type: 'error' },
      PATCH: { text: 'PATCH', type: 'default' },
    },
  },
  {
    key: 'path',
    title: '请求路径',
    minWidth: 250,
    ellipsis: { tooltip: true },
  },
  {
    key: 'ip_address',
    title: 'IP地址',
    width: 140,
  },
  {
    key: 'status',
    title: '状态',
    type: 'tag',
    width: 80,
    align: 'center',
    tagMap: {
      success: { text: '成功', type: 'success' },
      failed: { text: '失败', type: 'error' },
    },
  },
  {
    key: 'duration',
    title: '响应时间',
    width: 100,
    render: (row) => formatDuration(row.duration),
  },
  {
    key: 'created_at',
    title: '操作时间',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    key: 'error_message',
    title: '错误信息',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.error_message) return '-'
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.error_message,
          trigger: () => h('span', { style: 'color: #d03050; cursor: pointer;' }, '查看'),
        }
      )
    },
  },
]
</script>

<style scoped>
.operation-log-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 16px;
}
</style>
