<template>
  <n-grid :cols="4" :x-gap="16" :y-gap="16">
    <n-grid-item>
      <n-statistic label="总记忆数">
        <template #prefix>📊</template>
        <template #default>{{ stats.total || 0 }}</template>
      </n-statistic>
    </n-grid-item>
    <n-grid-item>
      <n-statistic label="事实类">
        <template #prefix>📋</template>
        <template #default>{{ stats.facts || 0 }}</template>
      </n-statistic>
    </n-grid-item>
    <n-grid-item>
      <n-statistic label="偏好类">
        <template #prefix>❤️</template>
        <template #default>{{ stats.preferences || 0 }}</template>
      </n-statistic>
    </n-grid-item>
    <n-grid-item>
      <n-statistic label="平均重要性">
        <template #prefix>⭐</template>
        <template #default>{{
          stats.avg_importance ? stats.avg_importance.toFixed(1) : 0
        }}</template>
      </n-statistic>
    </n-grid-item>
  </n-grid>
</template>
<script setup name="MemoryStats">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getMemoryStats } from '@/api/memory'

const props = defineProps({
  userId: { type: String, required: true },
})

const message = useMessage()
const stats = ref({})

const fetchStats = async () => {
  try {
    const res = await getMemoryStats({ userId: props.userId })
    if (res.success) {
      stats.value = res.data || {}
      // 确保 avg_importance 是数字
      const result = res.data
      stats.value = {
        ...result,
        avg_importance:
          typeof result.avg_importance === 'number'
            ? result.avg_importance
            : parseFloat(result.avg_importance) || 0,
      }
    }
  } catch (error) {
    message.error(error.message || '获取记忆统计失败')
  }
}

const refresh = () => {
  fetchStats()
}

defineExpose({ refresh })

onMounted(() => {
  fetchStats()
})
</script>
