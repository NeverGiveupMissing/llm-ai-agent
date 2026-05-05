<template>
  <div class="pm2-logs-container">
    <!-- 日志列表 -->
    <n-card title="📋 PM2 日志列表" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="handleRefresh">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            刷新
          </n-button>
        </n-space>
      </template>

      <n-data-table
        :columns="columns"
        :data="logFiles"
        :pagination="pagination"
        :loading="loading"
        striped
      />
    </n-card>

    <!-- 日志详情弹窗 -->
    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      :title="`📄 ${currentLogFile} 日志详情`"
      style="width: 90%; max-width: 1200px"
      :bordered="false"
      size="huge"
    >
      <template #header-extra>
        <n-space>
          <n-select
            v-model:value="detailConfig.type"
            :options="typeOptions"
            style="width: 150px"
            @update:value="fetchLogDetail"
          />
          <n-input-number
            v-model:value="detailConfig.lines"
            :min="10"
            :max="1000"
            placeholder="行数"
            style="width: 120px"
            @update:value="fetchLogDetail"
          />
          <n-button size="small" @click="fetchLogDetail">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
          <n-button size="small" type="primary" @click="copyToClipboard">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            复制
          </n-button>
          <n-button size="small" type="error" @click="handleClearLogs">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            清空
          </n-button>
        </n-space>
      </template>

      <div class="log-content">
        <pre>{{ logContent }}</pre>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button type="primary" @click="copyToClipboard">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            复制
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, useDialog, NTag, NButton } from 'naive-ui'
import {
  RefreshOutline,
  TrashOutline,
  CopyOutline,
} from '@vicons/ionicons5'
import { getPm2Logs, getPm2LogFiles, clearPm2Logs } from '@/api/pm2'

const message = useMessage()
const dialog = useDialog()

// 日志文件列表
const logFiles = ref([])
const loading = ref(false)

// 详情弹窗
const showDetailModal = ref(false)
const currentLogFile = ref('')
const logContent = ref('')
const detailConfig = reactive({
  type: 'out',
  lines: 100,
})

// 日志类型选项
const typeOptions = [
  { label: '输出日志', value: 'out' },
  { label: '错误日志', value: 'error' },
]

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [5, 10, 20, 50],
})

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    render: (row, index) => index + 1,
  },
  {
    title: '进程名称',
    key: 'process',
    minWidth: 120,
  },
  {
    title: '日志类型',
    key: 'type',
    minWidth: 120,
    render: (row) => {
      const type = row.type || ''
      const isOut = type.includes('out')
      const isError = type.includes('error')

      let label = type
      let tagType = 'default'

      if (isOut) {
        label = '输出日志'
        tagType = 'success'
      } else if (isError) {
        label = '错误日志'
        tagType = 'error'
      }

      return h(NTag, { type: tagType }, { default: () => label })
    },
  },
  {
    title: '文件大小',
    key: 'size',
    minWidth: 100,
    render: (row) => formatFileSize(row.size),
  },
  {
    title: '最后修改时间',
    key: 'modifiedTime',
    minWidth: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => handleViewDetail(row),
        },
        { default: () => '查看详情' },
      )
    },
  },
]

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 获取日志文件列表
async function loadLogFiles() {
  loading.value = true
  try {
    const res = await getPm2LogFiles()
    if (res.code === 200) {
      logFiles.value = res.data?.files || []
      if (logFiles.value.length > 0) {
        message.success(`已加载 ${logFiles.value.length} 个日志文件`)
      } else {
        message.info('暂无日志文件')
      }
    } else {
      logFiles.value = []
      message.warning(res.message || '获取日志文件失败')
    }
  } catch (error) {
    logFiles.value = []
    message.error(`获取失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 刷新日志列表
function handleRefresh() {
  loadLogFiles()
}

// 查看日志详情
async function handleViewDetail(row) {
  currentLogFile.value = `${row.process}-${row.type}`
  showDetailModal.value = true
  detailConfig.type = row.type
  await fetchLogDetail()
}

// 获取日志详情
async function fetchLogDetail() {
  try {
    const res = await getPm2Logs({
      type: detailConfig.type,
      lines: detailConfig.lines,
      process: currentLogFile.value.split('-')[0],
    })

    if (res.code === 200) {
      logContent.value = res.data?.logs || '暂无日志内容'
    } else {
      logContent.value = `获取日志失败: ${res.message || '未知错误'}`
    }
  } catch (error) {
    logContent.value = `请求失败: ${error.message}`
  }
}

// 清空日志
function handleClearLogs() {
  dialog.warning({
    title: '确认清空',
    content: '确定要清空所有 PM2 日志吗？此操作不可恢复！',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await clearPm2Logs()
        if (res.code === 200) {
          message.success(res.message || '清空成功')
          fetchLogDetail() // 刷新当前日志
        } else {
          message.error(res.message || '清空失败')
        }
      } catch (error) {
        message.error(`清空失败: ${error.message}`)
      }
    },
  })
}

// 复制到剪贴板
function copyToClipboard() {
  navigator.clipboard
    .writeText(logContent.value)
    .then(() => {
      message.success('已复制到剪贴板')
    })
    .catch(() => {
      message.error('复制失败')
    })
}

// 初始化
onMounted(() => {
  loadLogFiles()
})
</script>

<style scoped>
.pm2-logs-container {
  padding: 20px;
}

.log-content {
  max-height: 600px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.log-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
