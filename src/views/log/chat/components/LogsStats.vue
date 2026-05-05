<template>
  <div v-if="stats" class="logs-stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <n-icon :size="20"><ChatbubbleEllipsesOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">总对话数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">
          <n-icon :size="20"><CheckmarkCircleOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.success || 0 }}</div>
          <div class="stat-label">成功数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon error">
          <n-icon :size="20"><CloseCircleOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.failed || 0 }}</div>
          <div class="stat-label">失败数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon duration">
          <n-icon :size="20"><TimeOutline /></n-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatDuration }}s</div>
          <div class="stat-label">平均耗时</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="LogsStats">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  stats: {
    type: Object,
    default: null,
  },
})

const formatDuration = computed(() => {
  const duration = Number(props.stats?.avg_duration) || 0
  return duration.toFixed(2)
})
</script>

<style scoped>
.logs-stats {
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

.stat-icon.success {
  background: #f0fdf4;
  color: #10a37f;
}

.stat-icon.error {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.duration {
  background: #f5f3ff;
  color: #7c3aed;
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
