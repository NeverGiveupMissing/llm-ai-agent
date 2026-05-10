import { ref, watch } from 'vue'
import { getLogs, getLogsStats } from '@/api/logs'

/**
 * 日志数据管理 Hook
 */
export const useLogs = () => {
  const logs = ref([])
  const stats = ref(null)
  const selectedDate = ref(null)
  const filterStatus = ref(null)
  const keyword = ref('')

  const pagination = ref({
    page: 1,
    page_size: 10,
    itemCount: 0,
    page_sizes: [5, 10, 30, 50],
    pageSlot: 7,
  })

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const fetchLogs = async () => {
    try {
      const params = {
        limit: pagination.value.page_size,
        offset: (pagination.value.page - 1) * pagination.value.page_size,
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

      const res = await getLogs(params)
      logs.value = Array.isArray(res.data.list) ? res.data.list : []
      pagination.value.itemCount = Number(res.data.pagination?.total) || logs.value.length
    } catch (error) {
      console.error('获取日志失败:', error)
      logs.value = []
      pagination.value.itemCount = 0
    }
  }

  const fetchStats = async () => {
    try {
      const params = {}
      if (selectedDate.value) {
        params.date = formatDate(selectedDate.value)
      }
      const res = await getLogsStats(params)
      stats.value = res.data
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

  const handlepage_sizeChange = (page_size) => {
    pagination.value.page_size = page_size
    pagination.value.page = 1
  }

  watch(
    () => [pagination.value.page, pagination.value.page_size],
    ([newPage, newpage_size], [oldPage, oldpage_size]) => {
      if (oldPage !== undefined && (newPage !== oldPage || newpage_size !== oldpage_size)) {
        fetchLogs()
      }
    },
  )

  return {
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
    handlepage_sizeChange,
  }
}
