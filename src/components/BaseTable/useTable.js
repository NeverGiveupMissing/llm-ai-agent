import { ref, reactive, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'

/**
 * BaseTable 组合式函数
 * @param {Function} apiMethod - API 请求方法
 * @param {Object} options - 配置选项
 * @returns {Object} - 表格相关状态和方法
 */
export function useTable(apiMethod, options = {}) {
  const message = useMessage()

  const { defaultPageSize = 10, pageSizeOptions = [10, 20, 50, 100], immediate = true } = options

  // 表格数据
  const tableData = ref([])
  const loading = ref(false)

  // 分页配置
  const pagination = reactive({
    page: 1,
    pageSize: defaultPageSize,
    itemCount: 0,
    pageCount: 1,
    pageSizes: pageSizeOptions,
    showSizePicker: true,
    showQuickJumper: true,
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
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchForm.value,
        ...params,
      }

      // 处理日期范围
      if (requestParams.dateRange && Array.isArray(requestParams.dateRange)) {
        requestParams.beginTime = requestParams.dateRange[0]
        requestParams.endTime = requestParams.dateRange[1]
        delete requestParams.dateRange
      }

      const res = await apiMethod(requestParams)

      if (res && res.code === 200 && res.data) {
        const { data } = res

        // 统一返回格式：{ data: { list: [], pagination: { total, page, pageSize } } }
        if (data.list && Array.isArray(data.list)) {
          tableData.value = data.list
          pagination.itemCount = data.pagination?.total || 0
        } else {
          console.error('❌ [useTable] Invalid response format:', res)
          tableData.value = []
          pagination.itemCount = 0
        }
      } else {
        tableData.value = []
        pagination.itemCount = 0
      }

      // 同时更新 pageCount
      pagination.pageCount = Math.ceil(pagination.itemCount / pagination.pageSize) || 1

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
    pagination.page = 1
    fetchData()
  }

  /**
   * 处理重置
   */
  const handleReset = () => {
    searchForm.value = {}
    pagination.page = 1
    fetchData()
  }

  /**
   * 处理页码变化
   */
  const handlePageChange = (page) => {
    pagination.page = page
    fetchData()
  }

  /**
   * 处理每页条数变化
   */
  const handlePageSizeChange = (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
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
