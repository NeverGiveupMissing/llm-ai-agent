<template>
  <div class="stats-row" v-if="stats">
    <div class="stat-item">
      <div class="stat-num text-blue">{{ stats.total || 0 }}</div>
      <div class="stat-title">总对话数</div>
    </div>
    <div class="stat-divider"></div>

    <div class="stat-item">
      <div class="stat-num text-green">{{ stats.success || 0 }}</div>
      <div class="stat-title">成功数</div>
    </div>
    <div class="stat-divider"></div>

    <div class="stat-item">
      <div class="stat-num text-red">{{ stats.error || 0 }}</div>
      <div class="stat-title">失败数</div>
    </div>
    <div class="stat-divider"></div>

    <div class="stat-item">
      <div class="stat-num text-purple">{{ (Number(stats.avgDuration) || 0).toFixed(2) }}s</div>
      <div class="stat-title">平均耗时</div>
    </div>
  </div>
</template>

<script setup name="LogsStats">
defineProps({
  stats: {
    type: Object,
    default: null,
  },
})
</script>

<style scoped>
.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 5px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.stat-item {
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  height: 20px;
  background-color: #e4e7ed;
}

.text-blue {
  color: #409eff;
}

.text-green {
  color: #67c23a;
}

.text-red {
  color: #f56c6c;
}

.text-purple {
  color: #909399;
}
</style>
