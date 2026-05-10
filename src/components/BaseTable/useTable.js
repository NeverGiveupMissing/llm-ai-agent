import { ref, reactive, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { formatDate } from '@/utils'

/**
 * BaseTable 组合式函数
 * @param {Function} apiMethod - API 请求方法
 * @param {Object} options - 配置选项
 * @returns {Object} - 表格相关状态和方法
 */
export function useTable(apiMethod, options = {}) {
  const message = useMessage()

  const { defaultPageSize = 10, page_sizes = [10, 20, 30, 50], immediate = true } = options

  // 表格数据
  const tableData = ref([])
  const loading = ref(false)

  // 分页配置（全链路统一下划线命名）
  const pagination = reactive({
    page_num: 1,
    page_size: defaultPageSize,
    total: 0,
    page_sizes: page_sizes,
  })

  // 多选相关
  const selectedKeys = ref([])
  const selectedRows = ref([])

  // 搜索表单
  const searchForm = ref({})

  /**
   * 获取表格数据
   */
  const fetchData = async (params = {}) => {
    try {
      loading.value = true

      const requestParams = {
        page_num: pagination.page_num,
        page_size: pagination.page_size,
        ...searchForm.value,
        ...params,
      }

      // ✅ 处理日期范围（前端 dateRange 转换为后端 start_time/end_time）
      if (requestParams.dateRange && Array.isArray(requestParams.dateRange)) {
        const [start, end] = requestParams.dateRange
        if (start) {
          requestParams.start_time = formatDate(start)
        }
        if (end) {
          requestParams.end_time = formatDate(end)
        }
        delete requestParams.dateRange
      }

      const res = await apiMethod(requestParams)

      if (res && res.code === 200 && res.data) {
        const { data } = res

        // 统一返回格式：{ data: { list: [], pagination: { total, page_num, page_size } } }
        if (data.list && Array.isArray(data.list)) {
          tableData.value = data.list
          pagination.total = data.pagination?.total || 0
        } else {
          console.error('❌ [useTable] Invalid response format:', res)
          tableData.value = []
          pagination.total = 0
        }
      } else {
        tableData.value = []
        pagination.total = 0
      }

      return res
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error(error.message || '获取数据失败')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理搜索
   */
  const handleSearch = (form) => {
    if (form) {
      searchForm.value = { ...form }
    }
    pagination.page_num = 1
    fetchData()
  }

  /**
   * 处理重置
   */
  const handleReset = () => {
    searchForm.value = {}
    pagination.page_num = 1
    fetchData()
  }

  /**
   * 处理页码变化
   */
  const handlePageChange = (page) => {
    pagination.page_num = page
    fetchData()
  }

  /**
   * 处理每页条数变化
   */
  const handlePageSizeChange = (pageSize) => {
    pagination.page_size = pageSize
    pagination.page_num = 1
    fetchData()
  }

  /**
   * 处理选择变化
   */
  const handleSelectionChange = (keys, rows) => {
    selectedKeys.value = keys
    selectedRows.value = rows
  }

  /**
   * 刷新数据（保持当前页）
   */
  const refresh = () => {
    fetchData()
  }

  // 组件挂载时自动加载数据
  if (immediate) {
    onMounted(() => {
      fetchData()
    })
  }

  return {
    tableData,
    loading,
    pagination,
    selectedKeys,
    selectedRows,
    searchForm,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange,
    refresh,
  }
}
