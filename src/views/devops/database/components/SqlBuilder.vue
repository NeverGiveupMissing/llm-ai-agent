<template>
  <div class="sql-builder-container">
    <!-- Tab 切换 -->
    <n-tabs v-model:value="activeTab" type="line" size="small" animated pane-style="padding: 12px;">
      <!-- 查询 Tab -->
      <n-tab-pane name="select" tab="SELECT">
        <SelectBuilder
          :tables="tables"
          :loading="tableLoading"
          :get-structure="handleGetStructure"
          @generate="handleGenerateSQL"
        />
      </n-tab-pane>

      <!-- 插入 Tab -->
      <n-tab-pane name="insert" tab="INSERT">
        <InsertBuilder
          :tables="tables"
          :loading="tableLoading"
          :get-structure="handleGetStructure"
          @generate="handleGenerateSQL"
        />
      </n-tab-pane>

      <!-- 更新 Tab -->
      <n-tab-pane name="update" tab="UPDATE">
        <UpdateBuilder
          :tables="tables"
          :loading="tableLoading"
          :get-structure="handleGetStructure"
          @generate="handleGenerateSQL"
        />
      </n-tab-pane>

      <!-- 删除 Tab -->
      <n-tab-pane name="delete" tab="DELETE">
        <DeleteBuilder
          :tables="tables"
          :loading="tableLoading"
          :get-structure="handleGetStructure"
          @generate="handleGenerateSQL"
        />
      </n-tab-pane>
    </n-tabs>

    <!-- 底部操作按钮 -->
    <div class="action-buttons">
      <n-space>
        <n-button type="primary" size="small" @click="handleGenerateAndExecute">
          <template #icon>
            <n-icon><PlayCircleOutline /></n-icon>
          </template>
          生成并执行
        </n-button>
        <n-button size="small" @click="handleGenerateOnly">
          <template #icon>
            <n-icon><CodeSlashOutline /></n-icon>
          </template>
          仅生成
        </n-button>
      </n-space>
    </div>

    <!-- SQL 预览区域 -->
    <div class="sql-preview" v-if="generatedSQL">
      <n-alert type="info" :show-icon="false" size="small">
        <pre class="sql-code">{{ generatedSQL }}</pre>
      </n-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { PlayCircleOutline, CodeSlashOutline } from '@vicons/ionicons5'
import { getTableList, getTableStructure } from '@/api/database'
import SelectBuilder from './sql-builders/SelectBuilder.vue'
import InsertBuilder from './sql-builders/InsertBuilder.vue'
import UpdateBuilder from './sql-builders/UpdateBuilder.vue'
import DeleteBuilder from './sql-builders/DeleteBuilder.vue'

const message = useMessage()
const dialog = useDialog()

const emit = defineEmits(['execute', 'generate'])

// 状态
const activeTab = ref('select')
const tables = ref([])
const tableLoading = ref(false)
const generatedSQL = ref('')
const currentSQL = ref('')

// 加载表列表
onMounted(async () => {
  await loadTables()
})

async function loadTables() {
  tableLoading.value = true
  try {
    const res = await getTableList()
    if (res.code === 200) {
      tables.value = res.data || []
    }
  } catch (error) {
    message.error('加载表列表失败: ' + error.message)
  } finally {
    tableLoading.value = false
  }
}

// 获取表结构
async function handleGetStructure(tableName) {
  try {
    const res = await getTableStructure(tableName)
    if (res.code === 200) {
      return res.data || []
    }
    return []
  } catch (error) {
    message.error('获取表结构失败: ' + error.message)
    return []
  }
}

// 生成 SQL
function handleGenerateSQL(sql) {
  currentSQL.value = sql
  generatedSQL.value = sql
}

// 生成并执行
function handleGenerateAndExecute() {
  if (!currentSQL.value || !currentSQL.value.trim()) {
    message.warning('请先生成 SQL 语句')
    return
  }

  // 根据操作类型显示不同的警告
  const tabName = {
    select: '查询',
    insert: '插入',
    update: '更新',
    delete: '删除'
  }[activeTab.value]

  const warningMessages = {
    delete: '删除操作不可恢复，请确认 WHERE 条件正确！',
    update: '更新操作将修改数据，请确认 WHERE 条件正确！',
    insert: '将插入新数据，请确认字段值正确！',
    select: '将执行查询操作'
  }

  dialog.warning({
    title: `⚠️ ${tabName}操作确认`,
    content: warningMessages[activeTab.value] || '请确认操作无误后继续',
    positiveText: '确认执行',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('execute', currentSQL.value)
    }
  })
}

// 仅生成
function handleGenerateOnly() {
  if (!currentSQL.value || !currentSQL.value.trim()) {
    message.warning('请先生成 SQL 语句')
    return
  }
  emit('generate', currentSQL.value)
  message.success('SQL 已生成到编辑器')
}
</script>

<style scoped>
.sql-builder-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

/* 可视化生成器内容区域 */
:deep(.n-tabs .n-tabs-pane-wrapper) {
  max-height: 220px;
  overflow-y: auto;
}

:deep(.n-space) {
  padding: 8px;
}

.action-buttons {
  margin-top: 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-end;
}

.sql-preview {
  margin-top: 8px;
  flex: 1;
  overflow: hidden; /* 禁止内部滚动，由父容器控制 */
}

.sql-code {
  margin: 4px 0 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}
</style>
