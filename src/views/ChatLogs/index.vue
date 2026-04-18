<template>
  <div class="chat-logs-container">
    <n-card :bordered="false" size="huge" class="logs-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <n-icon :size="24" :depth="3" style="margin-right: 8px">
              <DocumentTextOutline />
            </n-icon>
            <span class="header-title">对话日志</span>
          </div>
          <div class="header-actions">
            <n-date-picker
              v-model:value="selectedDate"
              type="date"
              placeholder="选择日期"
              clearable
              @update:value="handleFilterChange"
            />
            <n-select
              v-model:value="filterStatus"
              :options="statusOptions"
              placeholder="状态筛选"
              clearable
              @update:value="handleFilterChange"
            />
            <n-input
              v-model:value="keyword"
              placeholder="搜索关键词"
              clearable
              @keyup.enter="handleFilterChange"
            >
              <template #prefix>
                <n-icon><SearchOutline /></n-icon>
              </template>
            </n-input>
            <n-button @click="handleFilterChange" :loading="loading">
              <template #icon>
                <n-icon><SearchOutline /></n-icon>
              </template>
              搜索
            </n-button>
            <n-button @click="refreshLogs">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              重置
            </n-button>
          </div>
        </div>
      </template>

      <div v-if="stats" class="stats-row">
        <n-statistic label="平均耗时" :value="`${(Number(stats.avgDuration) || 0).toFixed(2)}s`">
          <template #suffix>
            <n-icon :size="20" style="vertical-align: middle; margin-left: 4px; color: #2080f0">
              <TimeOutline />
            </n-icon>
          </template>
        </n-statistic>
        <div v-if="stats" class="stats-row" style="width: 100%">
          <n-statistic label="总对话数" :value="stats.total || 0">
            <template #prefix>
              <n-icon :size="20"><ChatbubbleEllipsesOutline /></n-icon>
            </template>
          </n-statistic>

          <div v-if="stats" class="stats-row" style="width: 80%">
            <div class="stat-item" style="width: 100%">
              <div class="stat-num text-blue">{{ stats.total || 0 }}</div>
              <div class="stat-title">总对话数</div>
            </div>
            <div class="stat-divider"></div>

            <div class="stat-item">
              <div class="stat-num text-green">{{ stats.success || 0 }}</div>
              <div class="stat-title">成功数</div>
            </div>
            <div class="stat-divider"></div>

            <div class="stat-item">
              <div class="stat-num text-red">{{ stats.error || 0 }}</div>
              <div class="stat-title">失败数</div>
            </div>
            <div class="stat-divider"></div>

            <div class="stat-item">
              <div class="stat-num text-purple">
                {{ (Number(stats.avgDuration) || 0).toFixed(2) }}s
              </div>
              <div class="stat-title">平均耗时</div>
            </div>
          </div>
        </div>
      </div>

      <div class="logs-content">
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
        <div v-else style="width: 100%; overflow-x: scroll">
          <n-data-table
            :columns="columns"
            :data="logs"
            :bordered="false"
            :pagination="{ pageSize: 15, showSizePicker: true, pageSizes: [15, 30, 50] }"
            :row-key="rowKey"
            striped
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup name="ChatLogs">
import { ref, h } from 'vue'
import {
  NCard,
  NButton,
  NSpin,
  NTag,
  NDataTable,
  NDatePicker,
  NSelect,
  NInput,
  NStatistic,
  NIcon,
  NEmpty,
  NText,
} from 'naive-ui'
import {
  ChatbubbleEllipsesOutline,
  TimeOutline,
  SearchOutline,
  RefreshOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'
import { getLogs, getLogsStats } from '@/api/logs'

const loading = ref(false)
const logs = ref([])
const stats = ref(null)
const selectedDate = ref(null)
const filterStatus = ref(null)
const keyword = ref('')

const statusOptions = [
  { label: '全部', value: null },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'error' },
]

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

const rowKey = (row) => row.trace_id

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      limit: 100,
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
    logs.value = data.logs || []
  } catch (error) {
    console.error('获取日志失败:', error)
    logs.value = []
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
    stats.value = {
      total: data.total || 0,
      success: data.success || 0,
      error: data.failed || 0,
      avgDuration: data.avg_duration || 0,
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    stats.value = null
  }
}

const handleFilterChange = () => {
  fetchLogs()
  fetchStats()
}

const refreshLogs = () => {
  selectedDate.value = null
  filterStatus.value = null
  keyword.value = ''
  fetchLogs()
  fetchStats()
}

fetchLogs()
fetchStats()
</script>

<style scoped>
.chat-logs-container {
  height: 100%;
  padding: 10px;
}

.logs-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions > * {
  width: 160px;
}

.header-actions > .n-button {
  width: auto;
  min-width: 80px;
}
.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 5px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.stat-item {
  flex: 1;
  text-align: center;
  white-space: nowrap; /* 防止文字换行 */
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  height: 20px;
  background-color: #e4e7ed;
}

/* 颜色定义 */
.text-blue {
  color: #409eff;
}
.text-green {
  color: #67c23a;
}
.text-red {
  color: #f56c6c;
}
.text-purple {
  color: #909399;
} /* 耗时通常用中性色或品牌色 */
</style>
