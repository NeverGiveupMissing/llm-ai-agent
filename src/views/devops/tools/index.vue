<template>
  <div class="tools-container">
    <!-- 顶部操作栏 -->
    <n-card :bordered="false" class="header-card">
      <n-space align="center" justify="space-between">
        <n-space align="center">
          <span style="font-size: 16px; font-weight: 600">🔧 系统工具</span>
          <n-tag type="info" size="small">实用功能集合</n-tag>
        </n-space>
        <n-space>
          <CommonButton type="default" @click="handleRefresh" text="刷新" />
        </n-space>
      </n-space>
    </n-card>

    <!-- 内容区域 -->
    <n-card :bordered="false" class="content-card">
      <div class="tools-grid">
        <div class="tool-card">
          <div class="tool-icon">
            <n-icon :size="32"><BuildOutline /></n-icon>
          </div>
          <div class="tool-content">
            <h3>API 测试</h3>
            <p>测试 API 接口功能和性能</p>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <n-icon :size="32"><DocumentOutline /></n-icon>
          </div>
          <div class="tool-content">
            <h3>日志分析</h3>
            <p>分析系统日志和运行数据</p>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <n-icon :size="32"><RefreshOutline /></n-icon>
          </div>
          <div class="tool-content">
            <h3>数据同步</h3>
            <p>同步和备份数据</p>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <n-icon :size="32"><PulseOutline /></n-icon>
          </div>
          <div class="tool-content">
            <h3>系统监控</h3>
            <p>监控系统运行状态</p>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup name="Tools">
import { NIcon } from 'naive-ui'
import { BuildOutline, DocumentOutline, RefreshOutline, PulseOutline } from '@vicons/ionicons5'
import CommonButton from '@/components/CommonButton.vue'

const handleRefresh = () => {
  // 刷新逻辑
}
</script>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-card:hover {
  border-color: #d0d0d0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #f0f9ff;
  color: #0284c7;
  border-radius: 12px;
  flex-shrink: 0;
}

.tool-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0 0 4px 0;
}

.tool-content p {
  font-size: 13px;
  color: #6e6e80;
  margin: 0;
}
</style>
