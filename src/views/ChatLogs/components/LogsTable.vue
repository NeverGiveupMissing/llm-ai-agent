<template>
  <div>
    <div v-if="loading" class="loading-wrapper">
      <n-spin size="large" />
      <n-text depth="3" style="margin-top: 16px">加载日志中...</n-text>
    </div>

    <n-empty
      v-else-if="logs.length === 0"
      description="暂无日志记录"
      size="huge"
      style="padding: 60px 0"
    />
    <div v-else style="width: 100%">
      <n-data-table
        :columns="columns"
        :data="logs"
        :bordered="false"
        :pagination="false"
        :row-key="rowKey"
        striped
      />
    </div>
  </div>
</template>

<script setup name="LogsTable">
import { h } from 'vue'
import { NDataTable, NEmpty, NSpin, NTag, NText } from 'naive-ui'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  logs: {
    type: Array,
    default: () => [],
  },
})

const rowKey = (row) => row.trace_id

const columns = [
  {
    title: 'Trace ID',
    key: 'trace_id',
    minWidth: 160,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: 'Session ID',
    key: 'session_id',
    minWidth: 140,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '时间',
    key: 'time',
    minWidth: 160,
    render: (row) => {
      return row.time ? new Date(row.time).toLocaleString() : '-'
    },
  },
  {
    title: '模型',
    key: 'model',
    width: 120,
  },
  {
    title: 'Token (入)',
    key: 'tokens',
    minWidth: 90,
    align: 'center',
    render: (row) => row.tokens?.input || 0,
  },
  {
    title: 'Token (出)',
    key: 'tokens',
    minWidth: 90,
    align: 'center',
    render: (row) => row.tokens?.output || 0,
  },
  {
    title: '耗时 (s)',
    key: 'duration',
    minWidth: 100,
    align: 'center',
    render: (row) => {
      return h(
        'span',
        { style: { color: row.duration > 5 ? '#d03050' : '#18a058' } },
        `${(row.duration || 0).toFixed(2)}`,
      )
    },
  },
  {
    title: '流式',
    key: 'stream',
    minWidth: 80,
    align: 'center',
    render: (row) => {
      return h(
        NTag,
        { type: row.stream ? 'info' : 'default', size: 'small', round: true },
        { default: () => (row.stream ? '是' : '否') },
      )
    },
  },
  {
    title: '用户消息',
    key: 'input_preview',
    minWidth: 150,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: 'AI 回复',
    key: 'output_preview',
    minWidth: 150,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '状态',
    key: 'status',
    minWidth: 90,
    align: 'center',
    render: (row) => {
      const type = row.status === 'success' ? 'success' : 'error'
      const text = row.status === 'success' ? '成功' : '失败'
      return h(NTag, { type, size: 'small', round: true }, { default: () => text })
    },
  },
  {
    title: '错误信息',
    key: 'error',
    minWidth: 150,
    ellipsis: {
      tooltip: true,
    },
    render: (row) => row.error || '-',
  },
]

defineExpose({
  columns,
  rowKey,
})
</script>
