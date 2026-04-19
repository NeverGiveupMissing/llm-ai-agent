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
          <div class="header-right">
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
        </div>
      </template>

      <LogsStats :stats="stats" />

      <div class="logs-content">
        <LogsTable :loading="loading" :logs="logs" />

        <div style="display: flex; justify-content: flex-end; margin-top: 16px">
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
    </n-card>
  </div>
</template>

<script setup name="ChatLogs">
import { onMounted } from 'vue'
import { NCard, NIcon, NPagination } from 'naive-ui'
import { DocumentTextOutline } from '@vicons/ionicons5'
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

.header-right {
  display: flex;
  align-items: center;
}
</style>
