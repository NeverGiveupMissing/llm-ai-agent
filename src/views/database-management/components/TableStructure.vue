<template>
  <div class="table-structure-container">
    <n-card title="📊 数据库表结构" :bordered="false">
      <n-space vertical :size="16">
        <!-- 搜索框 -->
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索表名..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <!-- 表名列表和结构展示 -->
        <n-grid :cols="24" :x-gap="16">
          <!-- 左侧：表名列表 -->
          <n-gi :span="6">
            <n-card title="表名列表" size="small" :bordered="false" class="table-list-card">
              <n-spin :show="loadingTables">
                <n-empty v-if="filteredTables.length === 0" description="暂无表数据" />
                
                <n-scrollbar style="max-height: 500px">
                  <n-list hoverable clickable>
                    <n-list-item
                      v-for="table in filteredTables"
                      :key="table"
                      @click="handleSelectTable(table)"
                      :class="{ 'selected-table': selectedTable === table }"
                    >
                      <n-thing :title="table">
                        <template #description>
                          <n-tag size="small" type="info">点击查看详情</n-tag>
                        </template>
                      </n-thing>
                    </n-list-item>
                  </n-list>
                </n-scrollbar>
              </n-spin>
            </n-card>
          </n-gi>

          <!-- 右侧：表结构详情 -->
          <n-gi :span="18">
            <n-card title="表结构详情" size="small" :bordered="false">
              <n-spin :show="loadingStructure">
                <n-empty v-if="!selectedTable" description="请从左侧选择表查看结构" />
                
                <template v-else>
                  <div class="table-header">
                    <n-tag type="primary" size="large">{{ selectedTable }}</n-tag>
                    <n-button size="small" @click="loadTableStructure(selectedTable)">
                      <template #icon>
                        <n-icon><RefreshOutline /></n-icon>
                      </template>
                      刷新
                    </n-button>
                  </div>

                  <n-data-table
                    :columns="structureColumns"
                    :data="tableStructure"
                    :pagination="pagination"
                    striped
                    :scroll-x="800"
                  />
                </template>
              </n-spin>
            </n-card>
          </n-gi>
        </n-grid>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import { NTag } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { getTableList, getTableStructure } from '@/api/database'

const message = useMessage()

// 状态
const loadingTables = ref(false)
const loadingStructure = ref(false)
const allTables = ref([])
const searchKeyword = ref('')
const selectedTable = ref(null)
const tableStructure = ref([])

// 过滤后的表列表
const filteredTables = computed(() => {
  if (!searchKeyword.value) return allTables.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return allTables.value.filter(table => 
    table.toLowerCase().includes(keyword)
  )
})

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
    key: 'character_maximum_length',
    width: 100,
    render: (row) => {
      return row.character_maximum_length || '-'
    },
  },
  {
    title: '可空',
    key: 'is_nullable',
    width: 80,
    render: (row) => {
      const isNullable = row.is_nullable === '是'
      return h(NTag, { type: isNullable ? 'warning' : 'success', size: 'small' }, {
        default: () => row.is_nullable,
      })
    },
  },
  {
    title: '默认值',
    key: 'column_default',
    minWidth: 150,
    ellipsis: { tooltip: true },
  },
]

// 分页配置
const pagination = {
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
}

// 加载表列表
async function loadTableList() {
  loadingTables.value = true
  try {
    const res = await getTableList()
    if (res.code === 200) {
      allTables.value = res.data || []
      message.success(`共找到 ${allTables.value.length} 个表`)
    } else {
      message.error(res.message || '获取表列表失败')
    }
  } catch (error) {
    message.error(`获取表列表失败: ${error.message}`)
  } finally {
    loadingTables.value = false
  }
}

// 加载表结构
async function loadTableStructure(tableName) {
  if (!tableName) return
  
  loadingStructure.value = true
  selectedTable.value = tableName
  
  try {
    const res = await getTableStructure(tableName)
    if (res.code === 200) {
      tableStructure.value = res.data || []
      message.success(`已加载表 [${tableName}] 的结构`)
    } else {
      message.error(res.message || '获取表结构失败')
    }
  } catch (error) {
    message.error(`获取表结构失败: ${error.message}`)
  } finally {
    loadingStructure.value = false
  }
}

// 选择表
function handleSelectTable(tableName) {
  loadTableStructure(tableName)
}

// 搜索处理
function handleSearch() {
  // 搜索时自动过滤，无需额外操作
}

// 组件挂载时加载表列表
onMounted(() => {
  loadTableList()
})
</script>

<style scoped>
.table-structure-container {
  padding: 20px;
  overflow: hidden;  /* 禁止内部滚动，由父容器控制 */
}

.table-list-card {
  height: 100%;
}

.selected-table {
  background-color: #e6f7ff !important;
  border-left: 3px solid #1890ff;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
