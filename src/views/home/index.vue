<template>
  <div class="home-container">
    <!-- ✅ 账号停用提示 -->
    <n-alert
      v-if="isAccountDisabled"
      type="warning"
      :bordered="false"
      class="account-disabled-alert"
    >
      <template #icon>
        <n-icon><WarningOutline /></n-icon>
      </template>
      您的账号已被停用，请联系管理员处理
    </n-alert>

    <div class="welcome-card">
      <div class="welcome-icon">
        <n-icon :size="48" color="#18a058">
          <RocketOutline />
        </n-icon>
      </div>
      <h1 class="welcome-title">欢迎使用 AI Agent 平台</h1>
      <p class="welcome-desc">您的 AI 智能助手已准备就绪，随时为您提供服务</p>
      <div class="welcome-actions">
        <n-button type="primary" size="large" @click="handleNavigate('/chat')">
          <template #icon>
            <n-icon><ChatbubbleEllipsesOutline /></n-icon>
          </template>
          开始对话
        </n-button>
        <n-button size="large" @click="handleNavigate('/dashboard')">
          <template #icon>
            <n-icon><GridOutline /></n-icon>
          </template>
          进入工作台
        </n-button>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <n-icon :size="32" color="#2080f0"><ChatbubbleEllipsesOutline /></n-icon>
        <h3>智能对话</h3>
        <p>与 AI 助手进行自然流畅的对话</p>
      </div>
      <div class="feature-card">
        <n-icon :size="32" color="#f0a020"><LayersOutline /></n-icon>
        <h3>长期记忆</h3>
        <p>记住您的偏好和上下文信息</p>
      </div>
      <div class="feature-card">
        <n-icon :size="32" color="#d03050"><DocumentTextOutline /></n-icon>
        <h3>对话日志</h3>
        <p>随时回顾历史对话记录</p>
      </div>
      <div class="feature-card">
        <n-icon :size="32" color="#18a058"><SettingsOutline /></n-icon>
        <h3>个性设置</h3>
        <p>自定义您的 AI 助手</p>
      </div>
    </div>
  </div>
</template>

<script setup name="Home">
import { computed } from 'vue'
import { NIcon, NButton, NAlert, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import {
  RocketOutline,
  WarningOutline,
  ChatbubbleEllipsesOutline,
  GridOutline,
  LayersOutline,
  DocumentTextOutline,
  SettingsOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

// ✅ 检查账号是否被停用（status: '0' = 停用, '1' = 正常）
const isAccountDisabled = computed(() => {
  const userInfo = userStore.userInfo
  console.log('🔍 [首页] userInfo:', userInfo)
  console.log('🔍 [首页] userInfo.status:', userInfo?.status, 'typeof:', typeof userInfo?.status)
  const status = userInfo?.status
  return status === '0'
})

/**
 * 导航到指定页面
 * 检查路由是否已注册（用户是否有菜单权限）
 * @param {string} path - 目标路径
 */
const handleNavigate = (path) => {
  const route = router.getRoutes().find((r) => r.path === path)

  if (!route) {
    message.warning('该功能暂未开放，请联系管理员')
    return
  }

  router.push(path)
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 40px 20px;
}

.account-disabled-alert {
  max-width: 600px;
  margin-bottom: 24px;
  font-size: 15px;
  font-weight: 500;
}

.welcome-card {
  text-align: center;
  max-width: 600px;
  margin-bottom: 60px;
}

.welcome-icon {
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  color: #18a058;
  margin: 0 0 16px 0;
}

.welcome-desc {
  font-size: 16px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.welcome-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  max-width: 900px;
  width: 100%;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 8px 0;
}

.feature-card p {
  font-size: 13px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}
</style>
