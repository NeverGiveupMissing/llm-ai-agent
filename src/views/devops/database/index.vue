<template>
  <div class="database-management-container">
    <n-layout has-sider style="height: calc(100vh - 120px)">
      <!-- 左侧：表名列表 -->
      <n-layout-sider
        :width="180"
        bordered
        content-style="padding: 0; display: flex; flex-direction: column; background: #fff;"
      >
        <!-- 标题栏 -->
        <div class="list-header">
          <span>数据表</span>
          <span class="table-count">{{ tables.length }}</span>
        </div>

        <!-- 搜索框 -->
        <div class="search-wrapper">
          <n-input v-model:value="searchText" placeholder="搜索表名..." clearable size="small" />
        </div>

        <!-- 表名列表 -->
        <n-scrollbar style="flex: 1">
          <n-list hoverable clickable size="small" class="table-list">
            <n-list-item
              v-for="table in filteredTables"
              :key="table"
              :class="{ 'active-table': selectedTable === table }"
              @click="handleSelectTable(table)"
            >
              <n-space align="center" :size="6">
                <n-icon :component="GridOutline" size="14" />
                <n-text>{{ table }}</n-text>
              </n-space>
            </n-list-item>
          </n-list>
        </n-scrollbar>
      </n-layout-sider>

      <!-- 右侧：主内容区 -->
      <n-layout-content>
        <!-- 顶部工具栏 -->
        <div class="toolbar">
          <n-space align="center" :size="12">
            <n-radio-group v-model:value="editorMode" size="small">
              <n-radio-button value="manual">手动SQL</n-radio-button>
              <n-radio-button value="visual">SQL 可视化生成器</n-radio-button>
            </n-radio-group>

            <n-divider vertical />

            <n-button
              type="primary"
              size="small"
              @click="handleExecuteSql(sqlEditorRef?.sqlContent)"
              :loading="executing"
              v-permission="'database:execute'"
            >
              <template #icon>
                <n-icon><PlayCircleOutline /></n-icon>
              </template>
              执行
            </n-button>

            <CommonButton
              type="export"
              perms="database:export"
              :loading="exporting"
              @click="handleExportDatabase"
            />

            <CommonButton
              type="import"
              perms="database:import"
              :loading="importing"
              @click="handleImportDatabase"
            />

            <!-- 隐藏的文件输入 -->
            <input
              ref="fileInputRef"
              type="file"
              accept=".sql"
              style="display: none"
              @change="handleFileSelect"
            />
          </n-space>
        </div>

        <!-- 编辑器区域 -->
        <div class="editor-area">
          <SqlEditor
            v-if="editorMode === 'manual'"
            ref="sqlEditorRef"
            @execute="handleExecuteSql"
          />
          <SqlBuilder v-else @execute="handleExecuteSql" @generate="handleGenerateSQL" />
        </div>

        <!-- 结果区域 -->
        <div class="result-area">
          <n-tabs v-model:value="activeTab" type="line" size="small" animated>
            <n-tab-pane name="result" tab="执行结果">
              <SqlResult :result="executionResult" />
            </n-tab-pane>

            <n-tab-pane name="tableData" tab="表数据" v-permission="'database:table'">
              <TableDataPanel :selected-table="selectedTable" />
            </n-tab-pane>

            <n-tab-pane name="tableStructure" tab="表结构">
              <TableStructure :selected-table="selectedTable" />
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, useDialog, NButton, NTabs, NTabPane } from 'naive-ui'
import dayjs from 'dayjs'
import {
  PlayCircleOutline,
  DownloadOutline,
  GridOutline,
  CloudUploadOutline,
} from '@vicons/ionicons5'
import SqlEditor from './components/SqlEditor.vue'
import SqlResult from './components/SqlResult.vue'
import SqlBuilder from './components/SqlBuilder.vue'
import TableDataPanel from './components/TableDataPanel.vue'
import TableStructure from './components/TableStructure.vue'
import { executeSQL, exportDatabase, importDatabase, getTableList } from '@/api/database'

const message = useMessage()
const dialog = useDialog()
const sqlEditorRef = ref(null)
const fileInputRef = ref(null)
const executionResult = ref(null)
const executing = ref(false)
const exporting = ref(false)
const importing = ref(false)
const editorMode = ref('manual') // 'manual' | 'visual'
const searchText = ref('')
const selectedTable = ref('')
const tables = ref([])
const activeTab = ref('result') // 当前激活的 Tab

// 过滤表名
const filteredTables = computed(() => {
  if (!searchText.value) return tables.value
  return tables.value.filter((table) =>
    table.toLowerCase().includes(searchText.value.toLowerCase()),
  )
})

// 加载表列表
onMounted(async () => {
  await loadTables()
})

async function loadTables() {
  try {
    const res = await getTableList()
    if (res.code === 200) {
      tables.value = res.data || []
    }
  } catch (error) {
    message.error('加载表列表失败: ' + error.message)
  }
}

// 选择表
function handleSelectTable(tableName) {
  selectedTable.value = tableName

  // 自动填入 SQL
  if (sqlEditorRef.value) {
    sqlEditorRef.value.setSql(`SELECT * FROM ${tableName} LIMIT 100`)
  }

  // 根据当前Tab决定行为
  if (activeTab.value === 'tableStructure') {
    // 如果当前在表结构Tab，不切换，TableStructure会自动加载
  } else {
    // 其他情况切换到表数据Tab
    activeTab.value = 'tableData'
  }
}

// 执行 SQL
async function handleExecuteSql(sql) {
  if (!sql || !sql.trim()) {
    message.warning('请输入 SQL 语句')
    return
  }

  // 判断 SQL 类型，决定是否显示确认弹窗
  const sqlType = getSQLType(sql.trim())

  // 只有危险操作才需要确认
  if (sqlType === 'dangerous') {
    dialog.warning({
      title: '⚠️ 高风险操作确认',
      content: '此操作将修改数据库结构或数据，请确认操作无误后继续。此操作将被记录到操作日志中。',
      positiveText: '确认执行',
      negativeText: '取消',
      onPositiveClick: async () => {
        await executeSQLWithLoading(sql)
      },
    })
  } else {
    // 查询和常规操作直接执行
    await executeSQLWithLoading(sql)
  }
}

// 判断 SQL 类型
function getSQLType(sql) {
  const upperSQL = sql.toUpperCase().trim()

  // 危险操作：DROP、TRUNCATE、ALTER
  if (/^(DROP|TRUNCATE|ALTER)\s+/i.test(upperSQL)) {
    return 'dangerous'
  }

  // 常规操作：INSERT、UPDATE、DELETE
  if (/^(INSERT|UPDATE|DELETE)\s+/i.test(upperSQL)) {
    return 'normal'
  }

  // 查询操作：SELECT、WITH
  if (/^(SELECT|WITH)\s+/i.test(upperSQL)) {
    return 'query'
  }

  // 其他操作（CREATE、GRANT 等）视为危险操作
  return 'dangerous'
}

// 执行 SQL（带 loading）
async function executeSQLWithLoading(sql) {
  executing.value = true
  try {
    const res = await executeSQL(sql)

    if (res.code === 200) {
      executionResult.value = {
        success: true,
        message: res.data.message,
        type: res.data.type,
        data: res.data.rows || [],
        columns: res.data.columns || [],
        total: res.data.total || 0,
        affectedRows: res.data.affectedRows || 0,
        executionTime: res.data.executionTime,
      }
      message.success(res.data.message)

      // 执行成功后自动切换到执行结果 Tab
      activeTab.value = 'result'
    } else {
      executionResult.value = {
        success: false,
        message: res.message || 'SQL 执行失败',
        data: [],
      }
      message.error(res.message || 'SQL 执行失败')

      // 执行失败也切换到执行结果 Tab 显示错误信息
      activeTab.value = 'result'
    }
  } catch (error) {
    executionResult.value = {
      success: false,
      message: error.message || 'SQL 执行失败',
      data: [],
    }
    message.error(`执行失败: ${error.message}`)

    // 执行失败也切换到执行结果 Tab 显示错误信息
    activeTab.value = 'result'
  } finally {
    executing.value = false
  }
}

// 导出数据库
async function handleExportDatabase() {
  // 显示确认弹窗
  dialog.warning({
    title: '⚠️ 导出确认',
    content: '确认导出整个数据库？文件可能较大，导出过程可能需要一些时间。',
    positiveText: '确认导出',
    negativeText: '取消',
    onPositiveClick: async () => {
      await exportDatabaseWithLoading()
    },
  })
}

// 导出数据库（带 loading）
async function exportDatabaseWithLoading() {
  exporting.value = true
  try {
    const response = await exportDatabase()

    console.log('导出响应:', response)
    console.log('响应类型:', typeof response.data)
    console.log('响应大小:', response.data?.size || response.data?.length)

    // base.get 返回的是完整的 axios response 对象
    const blob = response.data

    // 验证是否为有效的 Blob
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('无效的响应数据，不是 Blob 类型')
    }

    // 触发下载
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `db_backup_${dayjs().format('YYYY-MM-DD')}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success('数据库导出成功')
  } catch (error) {
    console.error('导出失败详细信息:', error)
    console.error('错误响应:', error.response)
    message.error(`导出失败: ${error.message}`)
  } finally {
    exporting.value = false
  }
}

// 导入数据库
function handleImportDatabase() {
  // 显示确认弹窗
  dialog.warning({
    title: '⚠️ 导入确认',
    content:
      '导入 SQL 文件将执行其中的所有 SQL 语句，请确认文件来源可靠。此操作将记录到操作日志中。',
    positiveText: '选择文件',
    negativeText: '取消',
    onPositiveClick: () => {
      fileInputRef.value?.click()
    },
  })
}

// 文件选择
async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.name.endsWith('.sql')) {
    message.error('请选择 .sql 格式的文件')
    event.target.value = '' // 清空文件选择
    return
  }

  // 验证文件大小（限制为 50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    message.error('文件大小不能超过 50MB')
    event.target.value = ''
    return
  }

  await executeImportWithLoading(file)

  // 清空文件选择，允许重复选择同一文件
  event.target.value = ''
}

// 执行导入（带 loading）
async function executeImportWithLoading(file) {
  importing.value = true
  try {
    const res = await importDatabase(file)

    if (res.code === 200) {
      message.success(res.message || '导入成功')
      // 重新加载表列表
      await loadTables()
    } else {
      message.error(res.message || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    message.error(`导入失败: ${error.message}`)
  } finally {
    importing.value = false
  }
}

// 处理生成 SQL（可视化模式下）
function handleGenerateSQL(sql) {
  if (sqlEditorRef.value) {
    sqlEditorRef.value.setSql(sql)
  }
}
</script>

<style scoped>
/* 左侧表名列表 */
:deep(.n-layout-sider) {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8e8e8;
}

/* 右侧主内容区 */
:deep(.n-layout-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  height: 48px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 统一工具栏按钮样式 */
.toolbar :deep(.n-button) {
  height: 32px;
  font-size: 13px;
}

.toolbar :deep(.n-radio-group) {
  height: 32px;
}

/* SQL编辑器固定高度 */
.editor-area {
  flex-shrink: 0;
  height: 190px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

/* 底部结果区域自适应剩余高度 */
.result-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 重要：flex子元素需要设置min-height:0才能收缩 */
}

/* Tab内容区允许滚动 */
:deep(.n-tabs .n-tab-pane) {
  height: 100%;
  overflow-y: auto; /* 只有这里允许滚动 */
  overflow-x: auto;
  min-height: 0;
}

.active-table {
  background-color: #e8f4ff !important;
  color: #18a058 !important;
  font-weight: 500;
  border-left: 2px solid #18a058 !important;
  padding-left: 10px !important;
}

/* 列表头部 */
.list-header {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  flex-shrink: 0;
}

.table-count {
  background: #e8e8e8;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 11px;
  color: #666;
}

/* 搜索框容器 */
.search-wrapper {
  padding: 8px 12px;
  background: #fff;
  flex-shrink: 0;
}

.search-wrapper :deep(.n-input) {
  background: #fff;
  border-radius: 4px;
}

/* 表名列表 */
.table-list {
  background: #fff;
}

.table-list :deep(.n-list-item) {
  color: #333;
  font-size: 13px;
  padding: 8px 12px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.table-list :deep(.n-list-item:hover) {
  background: #efefef !important;
}

/* 紧凑型 Tab */
:deep(.n-tabs .n-tabs-tab) {
  padding: 8px 16px !important;
  font-size: 13px;
}

/* Tabs 容器样式 */
:deep(.n-tabs.n-tabs--line-type) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs .n-tabs-nav) {
  flex-shrink: 0;
  padding: 0 12px;
}

:deep(.n-tabs .n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

:deep(.n-tabs .n-tab-pane) {
  height: 100%;
  overflow-y: auto; /* 只有这里允许滚动 */
  overflow-x: auto;
  min-height: 0;
  padding: 0;
}
</style>
