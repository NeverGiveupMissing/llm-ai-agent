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
        @search="handleSearchClick"
        @reset="handleResetClick"
      />
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
      @action-click="handleActionClick"
    />

    <!-- ✅ 查看详情弹窗 -->
    <BaseModal
      v-model:show="detailVisible"
      title="操作日志详情"
      width="800px"
      @close="detailVisible = false"
    >
      <n-descriptions label-placement="left" bordered :column="2">
        <n-descriptions-item label="操作人">
          {{ detailData.username }}
        </n-descriptions-item>
        <n-descriptions-item label="操作类型">
          <n-tag :type="actionTagMap[detailData.action]?.type || 'default'" size="small">
            {{ actionTagMap[detailData.action]?.text || detailData.action }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="操作描述" :span="2">
          {{ detailData.operation }}
        </n-descriptions-item>
        <n-descriptions-item label="所属模块">
          {{ detailData.module }}
        </n-descriptions-item>
        <n-descriptions-item label="请求方法">
          <n-tag :type="methodTagMap[detailData.method]?.type || 'default'" size="small">
            {{ detailData.method }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="请求路径" :span="2">
          {{ detailData.path }}
        </n-descriptions-item>
        <n-descriptions-item label="IP地址">
          {{ detailData.ip_address }}
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="detailData.status === 'success' ? 'success' : 'error'" size="small">
            {{ detailData.status === 'success' ? '成功' : '失败' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="执行耗时">
          {{ formatDuration(detailData.duration) }}
        </n-descriptions-item>
        <n-descriptions-item label="操作时间" :span="2">
          {{ formatDate(detailData.created_at) }}
        </n-descriptions-item>
        <n-descriptions-item label="请求参数" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ formatJSON(detailData.request_params) }}</pre>
        </n-descriptions-item>
        <n-descriptions-item label="响应数据" :span="2" v-if="detailData.response_data">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ formatJSON(detailData.response_data) }}</pre>
        </n-descriptions-item>
        <n-descriptions-item label="错误信息" :span="2" v-if="detailData.error_message">
          <n-alert type="error" :show-icon="false">
            {{ detailData.error_message }}
          </n-alert>
        </n-descriptions-item>
      </n-descriptions>
    </BaseModal>
  </div>
</template>

<script setup name="OperationLog">
import { ref, reactive, h } from 'vue'
import { NTooltip, NIcon, NTag, NDescriptions, NDescriptionsItem, NAlert } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { useTable } from '@/components/BaseTable/useTable'
import { formatDate } from '@/utils'
import { getOperationLogs, exportOperationLogs } from '@/api/operation-log'
import BaseModal from '@/components/BaseModal/index.vue'
import { useMessage } from 'naive-ui'

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
const message = useMessage()

// 显示/隐藏搜索区域
const showSearch = ref(true)

// ✅ 详情弹窗
const detailVisible = ref(false)
const detailData = ref({})

// 搜索表单
const searchForm = reactive({
  username: '',
  action: null, // ✅ 操作类型默认值为 null
  dateRange: null, // ✅ 使用时间段选择器
})

// 格式化 JSON
const formatJSON = (data) => {
  if (!data) return '-'
  try {
    // 如果是字符串，尝试解析
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return data
  }
}

// 操作类型标签映射
const actionTagMap = {
  create: { text: '创建', type: 'success' },
  update: { text: '更新', type: 'info' },
  delete: { text: '删除', type: 'error' },
  patch: { text: '修改', type: 'warning' },
}

// 请求方法标签映射
const methodTagMap = {
  GET: { text: 'GET', type: 'success' },
  POST: { text: 'POST', type: 'info' },
  PUT: { text: 'PUT', type: 'warning' },
  DELETE: { text: 'DELETE', type: 'error' },
  PATCH: { text: 'PATCH', type: 'default' },
}

// ✅ 查看详情
const handleViewDetail = (row) => {
  detailData.value = row
  detailVisible.value = true
}
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
    key: 'action',
    label: '操作类型',
    type: 'select',
    placeholder: '请选择操作类型',
    width: '140px',
    options: [
      { label: '创建', value: 'create' },
      { label: '更新', value: 'update' },
      { label: '删除', value: 'delete' },
      { label: '修改', value: 'patch' },
    ],
  },
  {
    key: 'dateRange',
    label: '操作时间',
    type: 'date-range',
    width: '240px',
  },
]

// 搜索点击
const handleSearchClick = () => {
  const searchParams = { ...searchForm }
  
  // 处理 dateRange 转换为 start_time/end_time
  if (searchParams.dateRange && Array.isArray(searchParams.dateRange)) {
    const [start, end] = searchParams.dateRange
    if (start) {
      searchParams.start_time = formatDate(start)
    }
    if (end) {
      searchParams.end_time = formatDate(end)
    }
    delete searchParams.dateRange
  }
  
  handleSearch(searchParams)
}

// 重置点击
const handleResetClick = () => {
  searchForm.username = ''
  searchForm.action = null
  searchForm.dateRange = null
  handleReset()
}

// ✅ 处理动态按钮点击事件
const handleActionClick = async ({ perms, row }) => {
  // 导出按钮
  if (perms.includes('export')) {
    await handleExport()
  }
}

// ✅ 导出操作日志
const handleExport = async () => {
  try {
    // 构建导出参数（使用当前搜索条件）
    const exportParams = { ...searchForm }
    
    // 处理 dateRange 转换为 start_time/end_time
    if (exportParams.dateRange && Array.isArray(exportParams.dateRange)) {
      const [start, end] = exportParams.dateRange
      if (start) {
        exportParams.start_time = formatDate(start)
      }
      if (end) {
        exportParams.end_time = formatDate(end)
      }
      delete exportParams.dateRange
    }
    
    await exportOperationLogs(exportParams)
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  }
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
    key: 'action',
    title: '操作类型',
    type: 'tag',
    width: 100,
    align: 'center',
    tagMap: actionTagMap,
  },
  {
    key: 'method',
    title: '请求方法',
    type: 'tag',
    width: 100,
    align: 'center',
    tagMap: methodTagMap,
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
    key: 'view_detail',  // ✅ 避免使用 'actions'，BaseTable 有特殊处理逻辑
    title: '操作',
    width: 150,
    align: 'center',
    fixed: 'right',
    render: (row) => h(
      NTag,
      { 
        type: 'info', 
        size: 'small',
        style: 'cursor: pointer;',
        onClick: () => handleViewDetail(row)
      },
      { default: () => '查看详情' },
    ),
  },
]
</script>
