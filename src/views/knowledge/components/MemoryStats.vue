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

    // ✅ 拦截器已返回 data 字段内容 { total, facts, preferences, ... }
    if (res) {
      stats.value = {
        total: Number(res.total) || 0,
        facts: Number(res.facts) || 0,
        preferences: Number(res.preferences) || 0,
        goals: Number(res.goals) || 0,
        events: Number(res.events) || 0,
        avg_importance: Number(res.avg_importance) || 0,
      }
    }
  } catch (error) {
    console.error('获取记忆统计失败:', error)
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
