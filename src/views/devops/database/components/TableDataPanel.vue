<template>
  <div class="table-data-panel">
    <div v-if="props.selectedTable" style="height: 100%; display: flex; flex-direction: column">
      <!-- 顶部信息栏 -->
      <div class="table-header">
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <n-tag type="info" size="medium">
              {{ props.selectedTable }}
            </n-tag>
            <n-text depth="3" style="font-size: 12px"> 共 {{ pagination.total }} 行 </n-text>
          </n-space>
          <n-space>
            <n-button type="primary" size="tiny" @click="loadTableData" :loading="loading">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              刷新
            </n-button>
          </n-space>
        </n-space>
      </div>

      <!-- 数据表格 -->
      <div v-if="loading" style="display: flex; justify-content: center; align-items: center; min-height: 200px">
        <n-spin size="large" />
      </div>
      
      <div v-else-if="tableData.length > 0" class="table-wrapper">
        <!-- ✅ 添加调试信息 -->
        <div style="margin-bottom: 8px; padding: 8px; background: #f0f0f0; font-size: 12px;">
          调试信息：tableData.length = {{ tableData.length }}, columns.length = {{ columns.length }}
        </div>
        <TableDataEditor
          ref="tableEditorRef"
          :columns="columns"
          :data="tableData"
          :primary-key="primaryKey"
          :table-name="props.selectedTable"
          @update="handleUpdateRow"
          @delete="handleDeleteRow"
          @cancel="handleCancelEdit"
        />
      </div>

      <n-empty v-else style="margin-top: 40px">
        <template #description> 暂无数据 (tableData.length = {{ tableData.length }}) </template>
      </n-empty>

      <!-- 底部分页 -->
      <div class="pagination-wrapper" v-if="pagination.totalPages > 0">
        <n-text type="info" style="font-size: 13px"> 共 {{ pagination.total }} 条记录 </n-text>
        <n-pagination
          v-model:page="currentPage"
          :page-count="pagination.totalPages"
          :page-size="page_size"
          show-size-picker
          :page-sizes="[10, 20, 50, 100]"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <n-empty v-else style="margin-top: 200px">
      <template #description> 请从左侧选择表 </template>
    </n-empty>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { getTableData, updateTableRow, deleteTableRow } from '@/api/database'
import TableDataEditor from './TableDataEditor.vue'

const props = defineProps({
  selectedTable: {
    type: String,
    default: '',
  },
})

const message = useMessage()
const dialog = useDialog()

// 子组件 ref
const tableEditorRef = ref(null)

// 状态
const loading = ref(false)
const columns = ref([])
const tableData = ref([])
const primaryKey = ref('id')
const currentPage = ref(1)
const page_size = ref(50)
const pagination = ref({
  page: 1,
  page_size: 50,
  total: 0,
  totalPages: 0,
})

// 计算表格横向滚动宽度
const scrollX = computed(() => {
  if (columns.value.length === 0) return 0
  return columns.value.reduce((total, col) => {
    // 主键列宽度 280，其他列 120
    return total + (col === primaryKey.value ? 280 : 120)
  }, 0)
})

// 监听 selectedTable 变化，自动加载数据
watch(
  () => props.selectedTable,
  async (newTable) => {
    if (newTable) {
      currentPage.value = 1
      await loadTableData()
    }
  },
  { immediate: true },
)

// 加载表数据
async function loadTableData() {
  if (!props.selectedTable) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await getTableData(props.selectedTable, {
      page: currentPage.value,
      page_size: page_size.value,
    })

    if (res.code === 200) {
      // 后端返回的是嵌套格式：res.data.data
      const responseData = res.data.data || res.data

      columns.value = responseData.columns || []
      tableData.value = responseData.rows || []
      primaryKey.value = responseData.primaryKey || 'id'
      pagination.value = responseData.pagination
      
      console.log('数据加载完成:', {
        columns: columns.value,
        tableData: tableData.value,
        tableDataLength: tableData.value.length,
        primaryKey: primaryKey.value,
        pagination: pagination.value
      })

      // 刷新时清除所有编辑状态
      clearAllEditStates()
    }
  } catch (error) {
    console.error('❌ 加载数据失败:', error)
    message.error('加载表数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 清除所有编辑状态
function clearAllEditStates() {
  if (tableEditorRef.value && tableEditorRef.value.clearAllEditStates) {
    tableEditorRef.value.clearAllEditStates()
    console.log(' 已清除所有编辑状态')
  }
}

// 页码变化
function handlePageChange(page) {
  currentPage.value = page
  loadTableData()
}

// 每页条数变化
function handlePageSizeChange(size) {
  page_size.value = size
  currentPage.value = 1
  loadTableData()
}

// 更新行
function handleUpdateRow({ primaryKey: pk, primaryValue, updates }) {
  dialog.warning({
    title: '确认修改',
    content: `确认修改表 ${props.selectedTable} 中 ${pk}=${primaryValue} 的数据？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        console.log('📝 准备更新数据:', { table: props.selectedTable, pk, primaryValue, updates })
        const res = await updateTableRow(props.selectedTable, {
          primaryKey: pk,
          primaryValue,
          updates,
        })

        if (res.code === 200) {
          console.log('✅ 更新成功响应:', res)
          message.success(res.message)

          // 如果后端返回了更新后的数据，直接更新本地数据
          if (res.data && res.data.updatedRow) {
            console.log('🔄 使用后端返回的更新数据')
            const index = tableData.value.findIndex((row) => row[pk] === primaryValue)
            if (index !== -1) {
              tableData.value[index] = res.data.updatedRow
            }
          } else {
            // 否则重新加载数据，添加小延迟确保事务提交
            console.log('🔄 开始刷新数据...')
            setTimeout(async () => {
              await loadTableData()
              console.log('✅ 数据刷新完成')
            }, 100)
          }
        }
      } catch (error) {
        console.error('❌ 更新失败:', error)
        message.error('更新失败: ' + error.message)
      }
    },
  })
}

// 删除行
function handleDeleteRow({ primaryKey: pk, primaryValue }) {
  dialog.warning({
    title: '高风险操作',
    content: '确认删除该行数据？此操作不可恢复！',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await deleteTableRow(props.selectedTable, {
          primaryKey: pk,
          primaryValue,
        })

        if (res.code === 200) {
          message.success(res.message)
          // 延迟一小段时间再刷新，确保数据库事务已提交
          setTimeout(async () => {
            await loadTableData()
          }, 100)
        }
      } catch (error) {
        message.error('删除失败: ' + error.message)
      }
    },
  })
}

// 取消编辑
function handleCancelEdit(rowIndex) {
  // 刷新当前页数据
  loadTableData()
}
</script>

<style scoped>
.table-data-panel {
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.table-header {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
  margin-bottom: 0;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;
  border: 1px solid #e8e8e8;
  border-top: none;
  border-radius: 0 0 4px 4px;
  position: relative;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-top: 8px;
  flex-shrink: 0;
}
</style>
