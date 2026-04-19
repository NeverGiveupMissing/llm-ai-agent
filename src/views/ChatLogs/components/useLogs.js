import { ref, watch } from 'vue'
import { getLogs, getLogsStats } from '@/api/logs'

/**
 * 日志数据管理 Hook
 */
export const useLogs = () => {
  const loading = ref(false)
  const logs = ref([])
  const stats = ref(null)
  const selectedDate = ref(null)
  const filterStatus = ref(null)
  const keyword = ref('')

  const pagination = ref({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    pageSizes: [5, 10, 30, 50],
    pageSlot: 7,
  })

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const fetchLogs = async () => {
    loading.value = true
    try {
      const params = {
        limit: pagination.value.pageSize,
        offset: (pagination.value.page - 1) * pagination.value.pageSize,
      }
      if (selectedDate.value) {
        params.date = formatDate(selectedDate.value)
      }
      if (filterStatus.value) {
        params.status = filterStatus.value
      }
      if (keyword.value) {
        params.keyword = keyword.value
      }

      const data = await getLogs(params)
      const dataObj = data.data || data
      logs.value = dataObj.logs || []
      pagination.value.itemCount = Number(dataObj.total) || logs.value.length
    } catch (error) {
      console.error('获取日志失败:', error)
      logs.value = []
      pagination.value.itemCount = 0
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const params = {}
      if (selectedDate.value) {
        params.date = formatDate(selectedDate.value)
      }
      const data = await getLogsStats(params)
      const dataObj = data.data || data
      stats.value = {
        total: dataObj.total || 0,
        success: dataObj.success || 0,
        error: dataObj.failed || 0,
        avgDuration: dataObj.avg_duration || 0,
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      stats.value = null
    }
  }

  const refreshData = () => {
    fetchLogs()
    fetchStats()
  }

  const resetFilters = () => {
    selectedDate.value = null
    filterStatus.value = null
    keyword.value = ''
    pagination.value.page = 1
    refreshData()
  }

  const handlePageChange = (page) => {
    pagination.value.page = page
  }

  const handlePageSizeChange = (pageSize) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
  }

  watch(
    () => [pagination.value.page, pagination.value.pageSize],
    ([newPage, newPageSize], [oldPage, oldPageSize]) => {
      if (oldPage !== undefined && (newPage !== oldPage || newPageSize !== oldPageSize)) {
        fetchLogs()
      }
    },
  )

  return {
    loading,
    logs,
    stats,
    selectedDate,
    filterStatus,
    keyword,
    pagination,
    formatDate,
    fetchLogs,
    fetchStats,
    refreshData,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
  }
}
