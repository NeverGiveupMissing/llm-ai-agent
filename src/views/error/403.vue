<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code">403</div>
      <h1 class="error-title">禁止访问</h1>
      <p class="error-description">抱歉，您没有权限访问该页面</p>
      <div v-if="missingPerms" class="error-details">
        <p>所需权限：{{ missingPerms.join(', ') }}</p>
      </div>
      <div class="error-actions">
        <n-button type="primary" size="large" @click="goBack">
          返回上一页
        </n-button>
        <n-button size="large" @click="goHome">
          返回首页
        </n-button>
      </div>
      
      <CopyrightFooter />
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import CopyrightFooter from '@/components/CopyrightFooter.vue'

const router = useRouter()
const route = useRoute()

// 从路由参数获取缺失的权限（可选）
const missingPerms = route.query.perms ? route.query.perms.split(',') : null

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.error-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.error-content {
  text-align: center;
  color: #fff;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 16px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
}

.error-description {
  font-size: 16px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.error-details {
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
}

.error-details p {
  margin: 0;
  color: #fff;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
