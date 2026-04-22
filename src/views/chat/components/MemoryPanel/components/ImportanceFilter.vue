<template>
  <div class="importance-filter">
    <n-space align="center" :size="8">
      <n-icon :size="16" color="#faad14"><StarOutline /></n-icon>
      <span class="filter-label">最低重要性:</span>
      <n-select v-model:value="modelValue" :options="options" size="small" style="width: 120px" />
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-icon :size="16" color="#999" style="cursor: help"><HelpCircleOutline /></n-icon>
        </template>
        仅显示重要性 ≥ {{ modelValue }} 的记忆
      </n-tooltip>
    </n-space>
  </div>
</template>

<script setup name="ImportanceFilter">
import { NIcon, NSelect, NSpace, NTooltip } from 'naive-ui'
import { StarOutline, HelpCircleOutline } from '@vicons/ionicons5'

const modelValue = defineModel({ type: Number, default: 4 })

const options = [
  { label: '全部 (≥1)', value: 1 },
  { label: '低价值 (≥4)', value: 4 },
  { label: '中等 (≥6)', value: 6 },
  { label: '高价值 (≥8)', value: 8 },
]
</script>

<style scoped>
.importance-filter {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
</style>
