<template>
  <div class="log-table">
    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(row) => row.id"
      @update:page="handlePageChange"
      @update:page-size="handlepage_sizeChange"
    />
  </div>
</template>

<script setup>
import { h } from 'vue'
import { NTag, NTooltip } from 'naive-ui'

// Props
const props = defineProps({
  tableData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits(['page-change', 'page-size-change'])

// 格式化日期时间
const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化时长
const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 表格列定义
const columns = [
  {
    title: '操作人',
    key: 'username',
    width: 120,
    fixed: 'left',
  },
  {
    title: '操作描述',
    key: 'operation',
    width: 200,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '请求方法',
    key: 'method',
    width: 100,
    render: (row) => {
      const methodColors = {
        GET: 'success',
        POST: 'info',
        PUT: 'warning',
        DELETE: 'error',
        PATCH: 'default',
      }
      const color = methodColors[row.method] || 'default'
      return h(NTag, { type: color, size: 'small' }, { default: () => row.method })
    },
  },
  {
    title: '请求路径',
    key: 'path',
    width: 250,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: 'IP地址',
    key: 'ip_address',
    width: 140,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const statusMap = {
        success: { text: '成功', type: 'success' },
        failed: { text: '失败', type: 'error' },
      }
      const status = statusMap[row.status] || { text: row.status, type: 'default' }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.text })
    },
  },
  {
    title: '响应时间',
    key: 'duration',
    width: 100,
    render: (row) => formatDuration(row.duration),
  },
  {
    title: '操作时间',
    key: 'created_at',
    width: 180,
    render: (row) => formatDateTime(row.created_at),
  },
  {
    title: '错误信息',
    key: 'error_message',
    width: 200,
    ellipsis: {
      tooltip: true,
    },
    render: (row) => {
      if (!row.error_message) return '-'
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.error_message,
          trigger: () => h('span', { style: 'color: #d03050' }, '查看'),
        },
      )
    },
  },
]

// 分页配置
const paginationConfig = {
  page: props.pagination.page,
  page_size: props.pagination.page_size,
  itemCount: props.pagination.itemCount,
  showSizePicker: props.pagination.showSizePicker,
  page_sizes: props.pagination.page_sizes,
}

// 页码变化
const handlePageChange = (page) => {
  emit('page-change', page)
}

// 每页条数变化
const handlepage_sizeChange = (page_size) => {
  emit('page-size-change', page_size)
}
</script>

<style scoped>
.log-table {
  margin-top: 16px;
}
</style>
