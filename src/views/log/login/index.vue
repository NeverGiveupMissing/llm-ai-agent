<template>
  <div class="login-log-container">
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
      toolbar-title="登录日志"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @refresh="fetchData"
    />
  </div>
</template>

<script setup name="LoginLog">
import { ref, reactive } from 'vue'
import { NTag } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { useTable } from '@/components/BaseTable/useTable'
import { formatDate } from '@/utils'
import { getAllLoginLogs } from '@/api/login-log'

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
} = useTable(getAllLoginLogs)

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  username: '',
  status: null,
  dateRange: null, // ✅ 使用时间段选择器
})

// 搜索字段配置
const searchFields = [
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    placeholder: '请输入用户名',
    width: '160px',
  },
  {
    key: 'status',
    label: '登录状态',
    type: 'select',
    placeholder: '请选择状态',
    width: '140px',
    options: [
      { label: '成功', value: '0' },
      { label: '失败', value: '1' },
    ],
  },
  {
    key: 'dateRange',
    label: '登录时间',
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
  // 重置本地表单
  searchForm.username = ''
  searchForm.status = null
  searchForm.dateRange = null
  // 调用 useTable 的重置方法（会清空内部 searchForm 并重新请求）
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
    title: '用户名',
    width: 120,
    fixed: 'left',
  },
  {
    key: 'login_ip',
    title: '登录IP',
    width: 140,
  },
  {
    key: 'login_location',
    title: '登录地点',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    key: 'browser',
    title: '浏览器',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    key: 'os',
    title: '操作系统',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    key: 'status',
    title: '登录状态',
    type: 'tag',
    width: 100,
    align: 'center',
    tagMap: {
      '0': { text: '成功', type: 'success' },
      '1': { text: '失败', type: 'error' },
    },
  },
  {
    key: 'msg',
    title: '提示信息',
    minWidth: 200,
    ellipsis: { tooltip: true },
  },
  {
    key: 'login_time',
    title: '登录时间',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
]
</script>

<style scoped>
.login-log-container {
  padding: 16px;
}

.search-card {
  margin-bottom: 16px;
}
</style>
