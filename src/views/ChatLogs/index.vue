<template>
  <div class="chat-logs-container">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">对话日志</h1>
        <p class="page-description">
          查看所有 AI 对话的历史记录和系统运行日志。支持按日期、状态和关键词筛选。
        </p>
      </div>
    </div>

    <LogsStats :stats="stats" />

    <div class="content-section">
      <div class="filter-bar">
        <LogsFilter
          :selected-date="selectedDate"
          :filter-status="filterStatus"
          :keyword="keyword"
          :loading="loading"
          @update:selected-date="selectedDate = $event"
          @update:filter-status="filterStatus = $event"
          @update:keyword="keyword = $event"
          @filter="handleFilterChange"
          @reset="handleReset"
        />
      </div>

      <div class="table-wrapper">
        <LogsTable :loading="loading" :logs="logs" />
      </div>

      <div class="pagination-wrapper">
        <n-pagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          :page-slot="pagination.pageSlot"
          show-size-picker
          show-quick-jumper
          :prefix="({ itemCount }) => `共 ${itemCount} 条`"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup name="ChatLogs">
import { onMounted } from 'vue'
import { NPagination } from 'naive-ui'
import { useLogs } from './components/useLogs'
import LogsFilter from './components/LogsFilter.vue'
import LogsStats from './components/LogsStats.vue'
import LogsTable from './components/LogsTable.vue'

const {
  loading,
  logs,
  stats,
  selectedDate,
  filterStatus,
  keyword,
  pagination,
  fetchLogs,
  fetchStats,
  resetFilters,
  handlePageChange,
  handlePageSizeChange,
} = useLogs()

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchLogs()
  fetchStats()
}

const handleReset = () => {
  resetFilters()
}

onMounted(() => {
  fetchLogs()
  fetchStats()
})
</script>

<style scoped>
.chat-logs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d0d0d;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  line-height: 1.6;
  color: #6e6e80;
  margin: 0;
}

.content-section {
  margin-top: 24px;
}

.filter-bar {
  margin-bottom: 20px;
}

.table-wrapper {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
