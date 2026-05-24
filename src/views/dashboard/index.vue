<template>
  <div class="dashboard-container">
    <n-card :bordered="false" class="content-card">
      <div class="page-header">
        <h1 class="page-title">工作台</h1>
        <p class="page-description">欢迎使用 AI Agent 平台。快速访问常用功能，查看系统概览。</p>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card" @click="$router.push('/chat')">
          <div class="card-icon chat">
            <n-icon :size="32"><ChatbubbleEllipsesOutline /></n-icon>
          </div>
          <div class="card-content">
            <h3>AI 对话</h3>
            <p>与 AI 助手进行智能对话，支持长期记忆和上下文理解</p>
          </div>
          <div class="card-arrow">
            <n-icon :size="20"><ChevronForwardOutline /></n-icon>
          </div>
        </div>

        <div class="dashboard-card" @click="$router.push('/memory')">
          <div class="card-icon memory">
            <n-icon :size="32"><LayersOutline /></n-icon>
          </div>
          <div class="card-content">
            <h3>记忆管理</h3>
            <p>管理 AI 的长期记忆，查看和优化记忆数据</p>
          </div>
          <div class="card-arrow">
            <n-icon :size="20"><ChevronForwardOutline /></n-icon>
          </div>
        </div>

        <div class="dashboard-card" @click="$router.push('/log/chat-logs')">
          <div class="card-icon logs">
            <n-icon :size="32"><DocumentTextOutline /></n-icon>
          </div>
          <div class="card-content">
            <h3>对话日志</h3>
            <p>查看历史对话记录，分析系统运行状态</p>
          </div>
          <div class="card-arrow">
            <n-icon :size="20"><ChevronForwardOutline /></n-icon>
          </div>
        </div>

        <div class="dashboard-card" @click="$router.push('/system/settings')">
          <div class="card-icon settings">
            <n-icon :size="32"><SettingsOutline /></n-icon>
          </div>
          <div class="card-content">
            <h3>系统设置</h3>
            <p>配置系统参数和个性化选项</p>
          </div>
          <div class="card-arrow">
            <n-icon :size="20"><ChevronForwardOutline /></n-icon>
          </div>
        </div>
      </div>

      <div class="quick-stats">
        <h2 class="section-title">系统概览</h2>
        <div class="stats-info">
          <n-alert type="info" :show-icon="false"> 当前系统运行正常，所有服务状态良好。 </n-alert>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup name="Dashboard">
import { NIcon, NAlert } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline,
  LayersOutline,
  DocumentTextOutline,
  SettingsOutline,
  ChevronForwardOutline,
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.dashboard-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard-card:hover {
  border-color: #d0d0d0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.card-icon.chat {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0284c7;
}

.card-icon.memory {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  color: #7c3aed;
}

.card-icon.logs {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
}

.card-icon.settings {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #10a37f;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0 0 6px 0;
}

.card-content p {
  font-size: 13px;
  line-height: 1.5;
  color: #6e6e80;
  margin: 0;
}

.card-arrow {
  color: #999;
  flex-shrink: 0;
}

.quick-stats {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0 0 16px 0;
}

.stats-info {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 16px;
}
</style>
