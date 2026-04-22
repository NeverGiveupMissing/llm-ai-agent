<template>
  <div class="memory-stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <n-icon :size="20"><LayersOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">总记忆数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon facts">
          <n-icon :size="20"><DocumentTextOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.facts || 0 }}</div>
          <div class="stat-label">事实类</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon preferences">
          <n-icon :size="20"><HeartOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.preferences || 0 }}</div>
          <div class="stat-label">偏好类</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon avg">
          <n-icon :size="20"><StarOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAvgImportance }}</div>
          <div class="stat-label">平均重要性</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="MemoryStats">
import { ref, computed, onMounted } from 'vue'
import { NIcon } from 'naive-ui'
import { LayersOutline, DocumentTextOutline, HeartOutline, StarOutline } from '@vicons/ionicons5'
import { getMemoryStats } from '@/api/memory'

const props = defineProps({
  userId: { type: String, required: true },
})

const stats = ref({
  total: 0,
  facts: 0,
  preferences: 0,
  goals: 0,
  events: 0,
  avg_importance: 0,
})

const formatAvgImportance = computed(() => {
  const avg = stats.value.avg_importance || 0
  return avg.toFixed(1)
})

const fetchStats = async () => {
  try {
    const res = await getMemoryStats({ userId: props.userId })
    if (res.success && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取记忆统计失败:', error)
  }
}

onMounted(() => {
  fetchStats()
})

defineExpose({
  refresh: fetchStats,
  stats,
})
</script>

<style scoped>
.memory-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #d0d0d0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.stat-icon.total {
  background: #f0f9ff;
  color: #0284c7;
}

.stat-icon.facts {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-icon.preferences {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.avg {
  background: #fefce8;
  color: #ca8a04;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0d0d0d;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6e6e80;
  font-weight: 500;
}
</style>
