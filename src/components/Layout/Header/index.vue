<template>
  <div class="header">
    <div class="header-left">
      <!-- 折叠按钮 -->
      <n-button text class="collapse-btn" @click="toggleCollapse">
        <template #icon>
          <!-- 展开状态：显示三横线 (Menu Icon) -->
          <svg
            v-if="!appStore.collapsed"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <!-- 折叠状态：显示右箭头/收缩图标 (Fold Icon) -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </template>
      </n-button>

      <!-- 面包屑 -->
      <n-breadcrumb>
        <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.title }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 刷新按钮 -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button text @click="refreshPage">
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
                <path d="M3 3v9h9" />
              </svg>
            </template>
          </n-button>
        </template>
        刷新页面
      </n-tooltip>

      <!-- 通知 -->
      <n-dropdown :options="notificationOptions" @select="handleNotification">
        <n-badge :count="unreadCount">
          <n-button text>
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </template>
          </n-button>
        </n-badge>
      </n-dropdown>

      <!-- 用户下拉 -->
      <UserDropdown />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import UserDropdown from './UserDropdown.vue'

const route = useRoute()
const appStore = useAppStore()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  return matched.map((item) => ({
    path: item.path,
    title: item.meta?.title,
  }))
})

const toggleCollapse = () => {
  appStore.toggleCollapsed()
}

const refreshPage = () => {
  window.location.reload()
}

const notificationOptions = ref([
  { label: '系统通知', key: 'system' },
  { label: 'AI 任务完成', key: 'ai' },
])
const unreadCount = ref(3)

const handleNotification = (key) => {
  console.log('通知点击:', key)
}
</script>

<style scoped>
.header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn :deep(svg) {
  transition: transform 0.3s;
}
</style>
