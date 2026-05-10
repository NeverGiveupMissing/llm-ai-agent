<template>
  <n-card title=" 记忆列表" :bordered="false" size="small">
    <template #header-extra>
      <n-space>
        <ImportanceFilter v-model="minImportance" />
        <n-select
          v-model:value="typeFilter"
          :options="typeOptions"
          placeholder="类型筛选"
          style="width: 120px"
          clearable
          @update:value="handleFilterChange"
        />
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索记忆内容"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>🔍</template>
        </n-input>
        <n-button type="primary" @click="handleSearch">搜索</n-button>
        <n-button type="error" secondary @click="handleClearAll">清空所有</n-button>
      </n-space>
    </template>

    <!-- ✅ 使用 BaseTable 公共组件 -->
    <BaseTable
      ref="tableRef"
      :columns="columns"
      :data="memoryList"
      :loading="loading"
      :pagination="pagination"
      :show-column-control="false"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #actions="{ row }">
        <n-space>
          <n-button text type="primary" size="small" @click="emit('edit', row)">编辑</n-button>
          <n-button text type="error" size="small" @click="handleDelete(row.id)">删除</n-button>
        </n-space>
      </template>
    </BaseTable>
  </n-card>
</template>

<script setup name="MemoryList">
import { ref, computed, onMounted, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { getMemoryList, deleteMemory } from '@/api/memory'
import ImportanceFilter from '@/views/chat/components/MemoryPanel/components/ImportanceFilter.vue'
import BaseTable from '@/components/BaseTable/index.vue'
import { ColumnTypes } from '@/components/BaseTable/types'

const props = defineProps({
  user_id: { type: String, required: true },
})

const emit = defineEmits(['refresh', 'edit'])

const message = useMessage()
const dialog = useDialog()

const memoryList = ref([])
const loading = ref(false)
const typeFilter = ref(null)
const searchKeyword = ref('')
const exportMemories = ref([]) // 用于导出的记忆数据
const minImportance = ref(4)
const tableRef = ref(null)

// ✅ 记忆类型选项
const typeOptions = [
  { label: '事实', value: 'fact' },
  { label: '偏好', value: 'preference' },
  { label: '目标', value: 'goal' },
  { label: '经历', value: 'event' },
  { label: '观点', value: 'opinion' },
]

// ✅ 分页配置（全链路统一下划线）
const pagination = ref({
  page_num: 1,
  page_size: 10,
  total: 0,
})

const columns = [
  {
    title: '内容',
    key: 'content',
    ellipsis: { tooltip: true },
    width: 300,
  },
  {
    title: '类型',
    key: 'memory_type',
    width: 100,
    render(row) {
      const typeMap = {
        fact: { label: '事实', type: 'info' },
        preference: { label: '偏好', type: 'error' },
        goal: { label: '目标', type: 'success' },
        event: { label: '经历', type: 'warning' },
        opinion: { label: '观点', type: 'default' },
      }
      const typeInfo = typeMap[row.memory_type] || { label: row.memory_type, type: 'default' }
      return h('n-tag', { type: typeInfo.type, size: 'small' }, () => typeInfo.label)
    },
  },
  {
    title: '重要性',
    key: 'importance',
    width: 100,
    render(row) {
      const importance = row.importance || 5
      let type = 'default'
      if (importance >= 8) type = 'error'
      else if (importance >= 6) type = 'warning'
      else if (importance >= 4) type = 'success'

      return h('n-tag', { type, size: 'small' }, () => `${importance}/10`)
    },
  },
  {
    title: '标签',
    key: 'tags',
    width: 200,
    render(row) {
      if (!row.tags || row.tags.length === 0) return '-'
      return h(
        'div',
        { style: 'display: flex; gap: 4px; flex-wrap: wrap' },
        row.tags.map((tag) => h('n-tag', { size: 'tiny', type: 'info' }, () => tag)),
      )
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render(row) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    type: ColumnTypes.ACTIONS,
    width: 120,
    fixed: 'right',
    actions: [],
  },
]

const fetchMemories = async () => {
  try {
    loading.value = true
    const params = {
      page_num: pagination.value.page_num,
      page_size: pagination.value.page_size,
    }

    if (props.user_id) {
      params.user_id = props.user_id
    }

    if (typeFilter.value) {
      params.type = typeFilter.value
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const res = await getMemoryList(params)

    const result = res.data
    memoryList.value = result.list
    pagination.value.total = result.total

    // 如果是第一页且有搜索关键词，加载所有匹配的记忆用于导出
    if (pagination.value.page_num === 1 && searchKeyword.value) {
      await fetchAllMemories()
    } else if (pagination.value.page_num === 1 && !searchKeyword.value) {
      // 没有搜索时，只加载当前页数据用于导出（避免加载过多数据）
      exportMemories.value = result.list
    }
  } catch (error) {
    message.error(error.message || '获取记忆列表失败')
  } finally {
    loading.value = false
  }
}

// 获取所有记忆（用于导出）
const fetchAllMemories = async () => {
  try {
    const params = {
      user_id: props.user_id,
      limit: 1000,
      offset: 0,
    }

    if (typeFilter.value) {
      params.type = typeFilter.value
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const res = await getMemoryList(params)
    exportMemories.value = res.data.list || []
  } catch (error) {
    console.error('获取所有记忆失败:', error)
  }
}

const handlePageChange = (page) => {
  pagination.value.page_num = page
  fetchMemories()
}

const handlePageSizeChange = (pageSize) => {
  pagination.value.page_size = pageSize
  pagination.value.page_num = 1
  fetchMemories()
}

const handleFilterChange = () => {
  pagination.value.page_num = 1
  fetchMemories()
}

const handleSearch = () => {
  pagination.value.page_num = 1
  fetchMemories()
}

const handleDelete = async (id) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条记忆吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await deleteMemory(id)
        if (res) {
          message.success(res.message || '删除成功')
          fetchMemories()
          emit('refresh')
        }
      } catch (error) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

const handleClearAll = () => {
  dialog.warning({
    title: '确认清空',
    content: '确定要清空所有记忆吗？此操作不可恢复！',
    positiveText: '确定清空',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      try {
        // TODO: 调用批量删除 API
        message.info('批量删除功能开发中...')
        // await clearAllMemories(props.user_id)
        // message.success('清空成功')
        // fetchMemories()
        // emit('refresh')
      } catch (error) {
        message.error(error.message || '清空失败')
      }
    },
  })
}

const refresh = () => {
  fetchMemories()
}

defineExpose({ refresh })

onMounted(() => {
  fetchMemories()
})
</script>
