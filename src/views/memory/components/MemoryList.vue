<template>
  <div class="memory-list-container">
    <div class="list-header">
      <div class="filter-group">
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
          placeholder="搜索记忆内容..."
          style="width: 240px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-button type="primary" @click="handleSearch">搜索</n-button>

        <!-- 使用公共导出组件 -->
        <MemoryExport :memories="exportMemories" filename-prefix="记忆管理" />
      </div>
    </div>

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
          <n-button size="small" type="primary" text @click="emit('edit', row)">编辑</n-button>
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button size="small" type="error" text>删除</n-button>
            </template>
            确定要删除这条记忆吗？
          </n-popconfirm>
        </n-space>
      </template>
    </BaseTable>
  </div>
</template>

<script setup name="MemoryList">
import { ref, h, onMounted } from 'vue'
import { useMessage, useDialog, NTag, NButton, NSpace, NPopconfirm, NIcon } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { getMemoryList, deleteMemory } from '@/api/memory'
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
const searchKeyword = ref('')
const typeFilter = ref(null)
const exportMemories = ref([]) // 用于导出的记忆数据
const tableRef = ref(null)

// ✅ 分页配置（全链路统一下划线）
const pagination = ref({
  page_num: 1,
  page_size: 10,
  total: 0,
})

const typeOptions = [
  { label: '事实', value: 'fact' },
  { label: '偏好', value: 'preference' },
  { label: '目标', value: 'goal' },
  { label: '经历', value: 'event' },
  { label: '观点', value: 'opinion' },
]

const typeMap = {
  fact: { label: '事实', type: 'info' },
  preference: { label: '偏好', type: 'error' },
  goal: { label: '目标', type: 'success' },
  event: { label: '经历', type: 'warning' },
  opinion: { label: '观点', type: 'default' },
}

const columns = [
  {
    title: '内容',
    key: 'content',
    minWidth: 300,
    ellipsis: { tooltip: true },
  },
  {
    title: '类型',
    key: 'memory_type',
    width: 80,
    render: (row) => {
      const config = typeMap[row.memory_type] || { label: row.memory_type, type: 'default' }
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.label })
    },
  },
  {
    title: '重要性',
    key: 'importance',
    width: 100,
    render: (row) => {
      const color = row.importance >= 8 ? '#ff4d4f' : row.importance >= 6 ? '#faad14' : '#52c41a'
      return h('span', { style: { color, fontWeight: 'bold' } }, `${row.importance}/10`)
    },
  },
  {
    title: '来源',
    key: 'source',
    width: 100,
    render: (row) => {
      const isAuto = row.source === 'auto_extract'
      return h(
        NTag,
        { type: isAuto ? 'info' : 'default', size: 'small' },
        { default: () => (isAuto ? '自动提取' : '手动创建') },
      )
    },
  },
  {
    title: '标签',
    key: 'tags',
    width: 150,
    render: (row) => {
      if (!row.tags || row.tags.length === 0) return '-'
      return h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            row.tags
              .slice(0, 3)
              .map((tag) => h(NTag, { size: 'tiny', type: 'info' }, { default: () => tag })),
        },
      )
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render: (row) => {
      if (!row.created_at) return '-'
      return new Date(row.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    type: ColumnTypes.ACTIONS,
    width: 160,
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

    // 第一页时更新导出数据
    if (pagination.value.page_num === 1) {
      exportMemories.value = result.list
    }
  } catch (error) {
    message.error(error.message || '获取记忆列表失败')
  } finally {
    loading.value = false
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
      await deleteMemory(id) // 自动显示成功/失败消息
      fetchMemories()
      emit('refresh')
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
