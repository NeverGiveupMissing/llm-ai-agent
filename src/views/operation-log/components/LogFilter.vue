<template>
  <div class="log-filter">
    <n-space :size="12" :wrap="true">
      <!-- 用户名搜索 -->
      <n-input
        v-model:value="localFilterData.username"
        placeholder="搜索操作人"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>

      <!-- 日期范围选择 -->
      <n-date-picker
        v-model:value="dateRange"
        type="daterange"
        placeholder="选择日期范围"
        clearable
        style="width: 240px"
        @update:value="handleDateChange"
      />

      <!-- 操作按钮 -->
      <n-button type="primary" @click="handleSearch">
        <template #icon>
          <n-icon><SearchOutline /></n-icon>
        </template>
        搜索
      </n-button>

      <n-button @click="handleReset">
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
        重置
      </n-button>
    </n-space>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'

// Props
const props = defineProps({
  filterData: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits(['search', 'reset'])

// 本地筛选数据
const localFilterData = ref({
  username: props.filterData.username || '',
})

// 日期范围
const dateRange = ref(
  props.filterData.startDate && props.filterData.endDate
    ? [props.filterData.startDate, props.filterData.endDate]
    : null
)

// 监听父组件数据变化
watch(
  () => props.filterData,
  (newData) => {
    localFilterData.value.username = newData.username || ''
    if (newData.startDate && newData.endDate) {
      dateRange.value = [newData.startDate, newData.endDate]
    } else {
      dateRange.value = null
    }
  },
  { deep: true }
)

// 日期变化
const handleDateChange = (value) => {
  if (value && value.length === 2) {
    props.filterData.startDate = new Date(value[0]).toISOString()
    props.filterData.endDate = new Date(value[1]).toISOString()
  } else {
    props.filterData.startDate = null
    props.filterData.endDate = null
  }
}

// 搜索
const handleSearch = () => {
  props.filterData.username = localFilterData.value.username
  emit('search')
}

// 重置
const handleReset = () => {
  localFilterData.value.username = ''
  dateRange.value = null
  props.filterData.username = ''
  props.filterData.startDate = null
  props.filterData.endDate = null
  emit('reset')
}
</script>

<style scoped>
.log-filter {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
