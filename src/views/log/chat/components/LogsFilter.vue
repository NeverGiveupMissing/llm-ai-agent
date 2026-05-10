<template>
  <n-space>
    <n-date-picker
      :value="selectedDate"
      type="datetime"
      placeholder="选择日期时间"
      clearable
      @update:value="handleDateChange"
    />
    <n-select
      :value="filterStatus"
      :options="statusOptions"
      placeholder="状态筛选"
      clearable
      @update:value="handleStatusChange"
    />
    <n-input
      :value="keyword"
      placeholder="搜索关键词"
      clearable
      @update:value="handleKeywordChange"
      @keyup.enter="handleFilter"
    >
      <template #prefix>
        <n-icon><SearchOutline /></n-icon>
      </template>
    </n-input>
    <n-button @click="handleFilter">
      <template #icon>
        <n-icon><SearchOutline /></n-icon>
      </template>
      筛选
    </n-button>
    <n-button @click="handleReset">
      <template #icon>
        <n-icon><RefreshOutline /></n-icon>
      </template>
      重置
    </n-button>
  </n-space>
</template>

<script setup name="LogsFilter">
import { NDatePicker, NSelect, NInput, NIcon, NButton, NSpace } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'

const props = defineProps({
  selectedDate: {
    type: [Number, null],
    default: null,
  },
  filterStatus: {
    type: String,
    default: null,
  },
  keyword: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:selectedDate',
  'update:filterStatus',
  'update:keyword',
  'filter',
  'reset',
])

const statusOptions = [
  { label: '全部', value: null },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'error' },
]

const handleDateChange = (value) => {
  emit('update:selectedDate', value)
}

const handleStatusChange = (value) => {
  emit('update:filterStatus', value)
}

const handleKeywordChange = (value) => {
  emit('update:keyword', value)
}

const handleFilter = () => {
  emit('filter')
}

const handleReset = () => {
  emit('reset')
}

defineExpose({
  statusOptions,
})
</script>
