<template>
  <div class="login-log-table-wrapper">
    <BaseTable
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @refresh="fetchData"
    />
    <n-empty
      v-if="tableData.length === 0"
      description="暂无登录日志记录"
      class="mt-5"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import dayjs from 'dayjs'
import { getMyLoginLogs } from '@/api/login-log'

const message = useMessage()

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

// 表格列配置
const columns = [
  {
    title: '登录时间',
    key: 'login_time',
    width: 180,
    render: (row) => {
      if (!row.login_time) return '-'
      return dayjs(row.login_time).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: 'IP地址',
    key: 'login_ip',
    width: 150,
  },
  {
    title: '登录状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const tagMap = {
        0: { text: '成功', type: 'success' },
        1: { text: '失败', type: 'error' },
      }
      const config = tagMap[row.status] || { text: '未知', type: 'default' }
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.text })
    },
  },
  {
    title: '浏览器',
    key: 'browser',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '操作系统',
    key: 'os',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '登录地点',
    key: 'login_location',
    minWidth: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '提示信息',
    key: 'msg',
    minWidth: 200,
    ellipsis: { tooltip: true },
  },
]

// 获取登录日志数据
const fetchData = async () => {
  try {
    const res = await getMyLoginLogs({
      page: pagination.page,
      limit: pagination.pageSize,
    })

    // ✅ 拦截器返回完整响应 { code, message, data }，分页数据在 res.data 中
    tableData.value = res.data.list || []
    pagination.itemCount = res.data.pagination.total || 0
  } catch (error) {
    console.error('获取登录日志失败:', error)
    message.error(error.message || '获取登录日志失败')
  } finally {
  }
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

// 每页条数变化
const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchData()
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.login-log-table-wrapper {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
