<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code">403</div>
      <h1 class="error-title">禁止访问</h1>
      <p class="error-description">抱歉，您没有权限访问该页面</p>
      <n-button type="primary" size="large" @click="goHome">
        返回首页
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
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
</style>
