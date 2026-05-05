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
        <div class="error-content">
          <div class="error-friendly-message">{{ friendlyErrorMessage }}</div>
          <n-divider style="margin: 8px 0" />
          <pre class="error-message">{{ resultMessage }}</pre>
        </div>
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

// 智能错误提示
const friendlyErrorMessage = computed(() => {
  if (resultType.value !== 'error' || !resultMessage.value) {
    return ''
  }
  
  const message = resultMessage.value
  
  // 多条 SQL 语句错误
  if (message.includes('多条 SQL') || message.includes('multiple SQL')) {
    return '⚠️ 每次只能执行一条 SQL 语句，请删除多余的分号'
  }
  
  // 禁止执行错误
  if (message.includes('禁止执行') || message.includes('forbidden')) {
    return '⚠️ 该操作在生产环境中被禁止'
  }
  
  // 字段值超长错误
  if (message.includes('value too long') || message.includes('too long')) {
    return '⚠️ 字段值超出长度限制，请检查数据长度'
  }
  
  // 语法错误
  if (message.includes('syntax error') || message.includes('语法错误')) {
    return '⚠️ SQL 语法错误，请检查语句是否正确'
  }
  
  // 表不存在
  if (message.includes('does not exist') || message.includes('不存在')) {
    return '⚠️ 表或字段不存在，请检查名称是否正确'
  }
  
  // 权限错误
  if (message.includes('permission') || message.includes('权限')) {
    return '⚠️ 没有足够的权限执行此操作'
  }
  
  // 默认提示
  return '❌ 执行失败，请检查 SQL 语句'
})

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

.error-content {
  padding: 4px 0;
}

.error-friendly-message {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
  line-height: 1.6;
}

.error-message {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #999;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
