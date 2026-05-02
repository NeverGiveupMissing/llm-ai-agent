<template>
  <div class="sql-result-container">
    <n-empty v-if="!hasResult" description="暂无执行结果" :icon-size="48" />
    
    <template v-else>
      <!-- 成功结果 -->
      <div class="result-info-bar">
        {{ resultMessage }}
        <span v-if="executionTime" class="execution-time">
          执行时间: {{ executionTime }}ms
        </span>
      </div>
      
      <!-- SELECT 查询结果 -->
      <div v-if="queryType === 'SELECT' && tableData && tableData.length > 0" class="table-wrapper">
        <n-data-table
          :columns="tableColumns"
          :data="paginatedData"
          :scroll-x="scrollX"
          striped
          size="small"
        />
        <div class="table-footer" v-if="total > pageSize">
          <div class="table-footer-content">
            <n-text type="info" style="font-size: 12px;">共 {{ total }} 条记录</n-text>
            <n-pagination
              v-model:page="currentPage"
              :page-count="pageCount"
              :page-size="pageSize"
              show-size-picker
              :page-sizes="[10, 20, 50, 100]"
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </div>
        </div>
      </div>
      
      <!-- 非 SELECT 结果 -->
      <div v-else-if="resultType === 'success' && affectedRows !== null" class="info-message">
        <n-statistic label="受影响行数" :value="affectedRows" />
      </div>
      
      <!-- 错误信息 -->
      <n-alert v-if="resultType === 'error'" type="error" :show-icon="false" size="small">
        <pre class="error-message">{{ resultMessage }}</pre>
      </n-alert>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    default: null,
  },
})

const hasResult = computed(() => props.result !== null)
const resultType = computed(() => props.result?.success ? 'success' : 'error')
const resultMessage = computed(() => props.result?.message || '')
const tableData = computed(() => props.result?.data || [])
const columns = computed(() => props.result?.columns || [])
const total = computed(() => props.result?.total || 0)
const affectedRows = computed(() => props.result?.affectedRows ?? null)
const executionTime = computed(() => props.result?.executionTime || 0)
const queryType = computed(() => props.result?.type || '')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const pageCount = computed(() => Math.ceil(total.value / pageSize.value))

// 分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 动态生成表格列
const tableColumns = computed(() => {
  if (!columns.value || columns.value.length === 0) return []
  
  return columns.value.map(key => ({
    title: key,
    key: key,
    minWidth: key === 'id' ? 280 : 120,
    ellipsis: {
      tooltip: true,
    },
  }))
})

const scrollX = computed(() => {
  return columns.value.length * 150
})

// 分页事件处理
function handlePageChange(page) {
  currentPage.value = page
  // 注意：这里只是前端分页显示，实际数据已经是全部数据
  // 如果需要服务端分页，需要重新请求数据
}

function handlePageSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}
</script>

<style scoped>
.sql-result-container {
  height: 100%;
  padding: 12px;
  overflow: hidden;  /* 禁止内部滚动，由父容器控制 */
}

/* 结果信息栏样式 */
.result-info-bar {
  background: #f0faf5;
  border-left: 3px solid #18a058;
  padding: 8px 12px;
  font-size: 13px;
  color: #333;
  margin-bottom: 12px;
  border-radius: 4px;
}

.execution-time {
  margin-left: 12px;
  color: #666;
  font-size: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.table-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.table-footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-message {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.error-message {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #ff4d4f;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
