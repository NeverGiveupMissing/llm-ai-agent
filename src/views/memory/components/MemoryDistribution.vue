<template>
  <div class="memory-distribution">
    <div class="section-header">
      <h3 class="section-title">记忆分布</h3>
    </div>

    <div class="section-content">
      <div class="distribution-chart">
        <div v-for="item in distributionData" :key="item.type" class="distribution-item">
          <div class="dist-label">
            <span class="dist-dot" :style="{ background: item.color }"></span>
            <span>{{ item.label }}</span>
          </div>
          <div class="dist-bar">
            <div
              class="dist-fill"
              :style="{
                width: getPercentage(item.count, stats.total) + '%',
                background: item.color,
              }"
            ></div>
          </div>
          <div class="dist-value">{{ item.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="MemoryDistribution">
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, default: () => ({}) },
})

const distributionData = computed(() => [
  {
    type: 'fact',
    label: '事实类',
    count: props.stats.facts || 0,
    color: '#0284c7',
  },
  {
    type: 'preference',
    label: '偏好类',
    count: props.stats.preferences || 0,
    color: '#dc2626',
  },
  {
    type: 'goal',
    label: '目标类',
    count: props.stats.goals || 0,
    color: '#10a37f',
  },
  {
    type: 'event',
    label: '经历类',
    count: props.stats.events || 0,
    color: '#ca8a04',
  },
])

const getPercentage = (value, total) => {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}
</script>

<style scoped>
.memory-distribution {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.section-content {
  min-height: 120px;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 90px;
  font-size: 13px;
  color: #333;
}

.dist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dist-bar {
  flex: 1;
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dist-value {
  min-width: 32px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #0d0d0d;
}
</style>
