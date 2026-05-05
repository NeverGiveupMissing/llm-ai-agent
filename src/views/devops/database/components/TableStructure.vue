<template>
  <div class="table-structure-container">
    <!-- 顶部面包屑 -->
    <div class="structure-header">
      <n-breadcrumb>
        <n-breadcrumb-item>数据表</n-breadcrumb-item>
        <n-breadcrumb-item v-if="selectedTable">
          {{ selectedTable }}
          <n-tag v-if="tableComment" type="info" size="small" style="margin-left: 8px">
            {{ tableComment }}
          </n-tag>
        </n-breadcrumb-item>
      </n-breadcrumb>
      <n-button size="small" @click="loadTableDetail(selectedTable)" :disabled="!selectedTable">
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
        刷新
      </n-button>
    </div>

    <!-- 空状态 -->
    <n-empty v-if="!selectedTable" description="请从左侧选择表查看结构" size="large" />

    <!-- 内容区 -->
    <n-tabs
      v-else
      v-model:value="activeSubTab"
      type="line"
      size="small"
      animated
      class="structure-tabs"
    >
      <!-- 子Tab1: 字段信息 -->
      <n-tab-pane name="columns" tab="字段信息">
        <n-spin :show="loadingStructure">
          <n-data-table
            :columns="structureColumns"
            :data="tableColumns"
            :pagination="pagination"
            striped
            :scroll-x="1000"
          />
        </n-spin>
      </n-tab-pane>

      <!-- 子Tab2: 索引信息 -->
      <n-tab-pane name="indexes" tab="索引信息">
        <n-spin :show="loadingStructure">
          <n-data-table
            :columns="indexColumns"
            :data="tableIndexes"
            :pagination="indexPagination"
            striped
          />
        </n-spin>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { useMessage } from 'naive-ui'
import { NTag } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { getTableDetail } from '@/api/database'

const props = defineProps({
  selectedTable: {
    type: String,
    default: null,
  },
})

const message = useMessage()

// 状态
const loadingStructure = ref(false)
const tableColumns = ref([])
const tableIndexes = ref([])
const tableComment = ref('') // 表注释
const activeSubTab = ref('columns') // 子Tab切换

// 表结构列定义
const structureColumns = [
  {
    title: '序号',
    key: 'ordinal_position',
    width: 70,
  },
  {
    title: '字段名',
    key: 'column_name',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: '数据类型',
    key: 'data_type',
    width: 150,
    render: (row) => {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.data_type })
    },
  },
  {
    title: '长度',
    key: 'maxLength',
    width: 100,
    render: (row) => {
      return row.maxLength || '-'
    },
  },
  {
    title: '可空',
    key: 'isNullable',
    width: 80,
    render: (row) => {
      const isNullable = row.isNullable === '是'
      return h(
        NTag,
        { type: isNullable ? 'warning' : 'success', size: 'small' },
        {
          default: () => row.isNullable,
        },
      )
    },
  },
  {
    title: '默认值',
    key: 'defaultValue',
    minWidth: 150,
    ellipsis: { tooltip: true },
    render: (row) => {
      return row.defaultValue || '-'
    },
  },
  {
    title: '注释',
    key: 'comment',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => {
      return row.comment || '-'
    },
  },
]

// 索引列定义
const indexColumns = [
  {
    title: '索引名称',
    key: 'indexName',
    width: 250,
    ellipsis: { tooltip: true },
  },
  {
    title: '类型',
    key: 'isPrimary',
    width: 120,
    render: (row) => {
      let type = '普通索引'
      let tagType = 'default'

      if (row.isPrimary) {
        type = '主键索引'
        tagType = 'warning'
      } else if (row.isUnique) {
        type = '唯一索引'
        tagType = 'info'
      }

      return h(NTag, { type: tagType, size: 'small' }, { default: () => type })
    },
  },
  {
    title: '包含字段',
    key: 'columns',
    render: (row) => {
      // 处理 PostgreSQL 数组格式
      let columnsArray = row.columns
      if (typeof columnsArray === 'string') {
        // 如果是字符串，尝试解析
        columnsArray = columnsArray.replace(/[{}]/g, '').split(',')
      } else if (Array.isArray(columnsArray)) {
        // 已经是数组
      } else {
        columnsArray = []
      }
      return columnsArray.join(', ') || '-'
    },
  },
]

// 分页配置
const pagination = {
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
}

const indexPagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
}

// 加载表详细信息（字段 + 注释 + 索引）
async function loadTableDetail(tableName) {
  if (!tableName) return

  loadingStructure.value = true

  try {
    const res = await getTableDetail(tableName)
    console.log('表详细信息返回数据:', res.data)
    if (res.code === 200) {
      tableColumns.value = res.data?.columns || []
      tableIndexes.value = res.data?.indexes || []
      tableComment.value = res.data?.tableComment || '' // 保存表注释
      console.log('字段数据:', tableColumns.value)
    } else {
      message.error(res.message || '获取表详细信息失败')
    }
  } catch (error) {
    message.error(`获取表详细信息失败: ${error.message}`)
  } finally {
    loadingStructure.value = false
  }
}

// 监听 selectedTable 变化，自动加载表结构
watch(
  () => props.selectedTable,
  (newTable) => {
    if (newTable) {
      loadTableDetail(newTable)
    } else {
      tableColumns.value = []
      tableIndexes.value = []
      tableComment.value = ''
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.table-structure-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.structure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.structure-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.structure-tabs :deep(.n-tabs .n-tab-pane) {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
}
</style>
