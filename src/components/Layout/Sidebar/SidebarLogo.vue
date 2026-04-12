<template>
  <div class="logo" :class="{ collapsed: appStore.collapsed }">
    <!-- <img src="/assets/logo.svg" alt="logo" class="logo-img" /> -->
    <img
      src="https://statics.moonshot.cn/kimi-web-seo/assets/kimi-logo-CegIMkbU.png"
      alt="logo"
      class="logo-img"
    />
    <span v-if="!appStore.collapsed" class="logo-text">AI Agent</span>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid #eee;
}

.logo.collapsed {
  padding: 0 12px;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
