<template>
  <div class="operation-log-container">
    <n-card title="操作日志" :bordered="false">
      <!-- 筛选区域 -->
      <LogFilter
        :filter-data="filterData"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 数据表格 -->
      <LogTable
        :table-data="tableData"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </n-card>
  </div>
</template>

<script setup name="OperationLog">
import { ref, reactive, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getLogs } from '@/api/logs'
import LogFilter from './components/LogFilter.vue'
import LogTable from './components/LogTable.vue'

const message = useMessage()

// 筛选数据
const filterData = reactive({
  username: '',
  startDate: null,
  endDate: null,
})

// 表格数据
const tableData = ref([])

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

// 获取日志列表
const fetchLogs = async () => {
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      username: filterData.username || undefined,
      startDate: filterData.startDate || undefined,
      endDate: filterData.endDate || undefined,
    }

    const res = await getLogs(params)

    // ✅ 拦截器已返回 data.data，直接使用
    const list = res?.list
    tableData.value = Array.isArray(list) ? list : []
    pagination.itemCount = res.pagination?.total || 0
  } catch (error) {
    console.error('获取日志列表失败:', error)
    message.error(error.message || '获取日志列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

// 重置
const handleReset = () => {
  filterData.username = ''
  filterData.startDate = null
  filterData.endDate = null
  pagination.page = 1
  fetchLogs()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchLogs()
}

// 每页条数变化
const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchLogs()
}

// 初始化
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.operation-log-container {
  padding: 20px;
}
</style>
