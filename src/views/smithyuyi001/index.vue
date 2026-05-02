<template>
  <div class="smithyuyi001-container">
    <!-- 密码验证界面 -->
    <div v-if="!isAuthenticated" class="auth-card">
      <n-card title="🔐 PM2 日志管理系统" :bordered="false" class="card">
        <n-form ref="formRef" :model="formData" :rules="rules">
          <n-form-item label="访问密码" path="password">
            <n-input
              v-model:value="formData.password"
              type="password"
              placeholder="请输入访问密码"
              show-password-on="click"
              @keyup.enter="handleVerify"
            >
              <template #prefix>
                <n-icon><LockClosedOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>

          <n-form-item>
            <n-button type="primary" block :loading="verifying" @click="handleVerify">
              验证
            </n-button>
          </n-form-item>
        </n-form>

        <n-alert type="info" :show-icon="false" style="margin-top: 16px">
          💡 提示：此页面用于查看服务器 PM2 进程日志
        </n-alert>
      </n-card>
    </div>

    <!-- 日志列表界面 -->
    <div v-else class="logs-container">
      <n-card title="📋 PM2 日志列表" :bordered="false" class="card">
        <template #header-extra>
          <n-space>
            <n-button size="small" @click="handleRefresh">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              刷新
            </n-button>
            <n-button size="small" type="error" @click="handleLogout">
              <template #icon>
                <n-icon><LogOutOutline /></n-icon>
              </template>
              退出
            </n-button>
          </n-space>
        </template>

        <n-data-table :columns="columns" :data="logFiles" :pagination="pagination" striped />
      </n-card>

      <div class="copyright">
        <p>© 2026 AI Agent Platform. All rights reserved.</p>
        <p><a href="https://beian.miit.gov.cn/" target="_blank">皖ICP备2026011051号-1</a></p>
      </div>
    </div>

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
            @change="fetchLogDetail"
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
import { ref, reactive, computed, h } from 'vue'
import { useMessage, useDialog, NTag, NButton } from 'naive-ui'
import {
  LockClosedOutline,
  RefreshOutline,
  LogOutOutline,
  TrashOutline,
  CopyOutline,
  DocumentTextOutline,
  AlertCircleOutline,
} from '@vicons/ionicons5'
import { getPm2Logs, getPm2LogFiles, clearPm2Logs } from '@/api/pm2'

const message = useMessage()
const dialog = useDialog()

// 认证状态
const isAuthenticated = ref(false)
const verifying = ref(false)
const formData = reactive({ password: '' })
const formRef = ref(null)

// 验证规则
const rules = {
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 日志文件列表
const logFiles = ref([])

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
      // 处理 api-out、api-error、out、error 等不同格式
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
  try {
    const res = await getPm2LogFiles()

    // 从控制台输出看，res 的结构是 {code, data: {count, files}, message}
    if (res.code === 200) {
      console.log('res', res)
      logFiles.value = res.data?.files || []
      console.log('logFiles.value:', logFiles.value)
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
  }
}

// 密码验证
async function handleVerify() {
  try {
    await formRef.value?.validate()

    verifying.value = true

    // 验证密码
    if (formData.password === 'admin888') {
      isAuthenticated.value = true
      message.success('验证成功')
      loadLogFiles()
    } else {
      message.error('密码错误')
    }
  } catch (error) {
    // 验证失败
  } finally {
    verifying.value = false
  }
}

// 刷新日志列表
function handleRefresh() {
  loadLogFiles()
  message.success('刷新成功')
}

// 退出登录
function handleLogout() {
  isAuthenticated.value = false
  formData.password = ''
  message.info('已退出')
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
</script>

<style scoped>
.smithyuyi001-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.auth-card {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
}

.card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.logs-container {
  max-width: 1200px;
  margin: 0 auto;
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

.copyright {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.copyright a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

.copyright a:hover {
  color: #fff;
}
</style>
