<template>
  <div class="chat-logs-container">
    <!-- 顶部操作栏 -->
    <n-card :bordered="false" class="search-card">
      <n-space align="center" justify="space-between">
        <n-space align="center">
          <span style="font-size: 16px; font-weight: 600">📋 对话日志</span>
          <n-tag type="info" size="small">AI 对话历史记录</n-tag>
        </n-space>
        <n-space>
          <CommonButton type="default" @click="handleRefresh" text="刷新" />
        </n-space>
      </n-space>
    </n-card>

    <!-- 内容区域 -->
    <n-card :bordered="false" class="content-card">
      <LogsStats :stats="stats" />

      <div class="filter-bar" style="margin-top: 16px">
        <LogsFilter
          :selected-date="selectedDate"
          :filter-status="filterStatus"
          :keyword="keyword"
          @update:selected-date="selectedDate = $event"
          @update:filter-status="filterStatus = $event"
          @update:keyword="keyword = $event"
          @filter="handleFilterChange"
          @reset="handleReset"
        />
      </div>

      <div class="table-wrapper" style="margin-top: 16px">
        <LogsTable :logs="logs" />
      </div>

      <div class="pagination-wrapper">
        <n-pagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.page_size"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.page_sizes"
          :page-slot="pagination.pageSlot"
          show-size-picker
          show-quick-jumper
          :prefix="({ itemCount }) => `共 ${itemCount} 条`"
          @update:page="handlePageChange"
          @update:page-size="handlepage_sizeChange"
        />
      </div>
    </n-card>
  </div>
</template>

<script setup name="ChatLogs">
import { onMounted } from 'vue'
import { NPagination } from 'naive-ui'
import CommonButton from '@/components/CommonButton.vue'
import { useLogs } from './components/useLogs'
import LogsFilter from './components/LogsFilter.vue'
import LogsStats from './components/LogsStats.vue'
import LogsTable from './components/LogsTable.vue'

const {
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
  handlepage_sizeChange,
} = useLogs()

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchLogs()
  fetchStats()
}

const handleReset = () => {
  resetFilters()
}

const handleRefresh = () => {
  fetchLogs()
  fetchStats()
}

onMounted(() => {
  fetchLogs()
  fetchStats()
})
</script>

<style scoped>
.content-card {
  min-height: calc(100vh - 200px);
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
