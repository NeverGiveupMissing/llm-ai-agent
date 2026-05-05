<template>
  <div class="log-filter">
    <BaseForm
      ref="formRef"
      v-model="filterForm"
      :fields="filterFields"
      inline
      :show-feedback="false"
    >
      <template #actions>
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
      </template>
    </BaseForm>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'

const emit = defineEmits(['search', 'reset'])

// 筛选表单
const filterForm = reactive({
  username: '',
  dateRange: null,
})

// 筛选字段配置
const filterFields = [
  {
    key: 'username',
    label: '操作人',
    type: 'input',
    placeholder: '搜索操作人',
    width: '200px',
  },
  {
    key: 'dateRange',
    label: '日期范围',
    type: 'date-range',
    width: '240px',
  },
]

// 搜索
const handleSearch = () => {
  emit('search', { ...filterForm })
}

// 重置
const handleReset = () => {
  filterForm.username = ''
  filterForm.dateRange = null
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
