<template>
  <div class="agent-container">
    <div class="page-header">
      <h1 class="page-title">智能体</h1>
      <p class="page-description">管理和配置 AI 智能体，定义角色、能力和行为模式。</p>
    </div>

    <div class="agent-content">
      <n-empty description="智能体功能开发中..." size="large">
        <template #icon>
          <n-icon><ConstructOutline /></n-icon>
        </template>
        <template #extra>
          <n-button type="primary" size="large"> 即将上线 </n-button>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup name="Agent">
import { NEmpty, NIcon, NButton } from 'naive-ui'
import { ConstructOutline } from '@vicons/ionicons5'
</script>

<style scoped>
.agent-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d0d0d;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  line-height: 1.6;
  color: #6e6e80;
  margin: 0;
}

.agent-content {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 48px 24px;
}
</style>
