<template>
  <div class="header">
    <div class="header-left">
      <!-- 左侧：折叠按钮 -->
      <button class="cyber-collapse-btn" @click="toggleCollapse">
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
          class="cyber-icon"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>

        <!-- 折叠状态：显示右箭头 -->
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
          class="cyber-icon"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      <!-- 面包屑导航 -->
      <n-breadcrumb class="cyber-breadcrumb">
        <n-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="`${index}-${item.path}`">
          <span class="breadcrumb-text">{{ item.title }}</span>
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 刷新按钮 -->
      <button class="cyber-icon-btn" @click="refreshPage">
        <n-icon size="20">
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
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
          </svg>
        </n-icon>
      </button>

      <!-- 通知中心 -->
      <n-dropdown trigger="click" :options="notificationOptions" @select="handleNotification">
        <n-badge :value="unreadCount" class="cyber-badge">
          <button class="cyber-icon-btn">
            <n-icon size="20">
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
            </n-icon>
          </button>
        </n-badge>
      </n-dropdown>

      <!-- 用户下拉 -->
      <UserDropdown />
    </div>
  </div>
</template>

<script setup name="LayoutHeader">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import UserDropdown from './UserDropdown.vue'

const route = useRoute()
const appStore = useAppStore()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  
  console.log('🔍 [Breadcrumbs] route.matched:', matched.map(m => ({
    path: m.path,
    title: m.meta?.title,
    name: m.name
  })))
  
  // ✅ 去重策略：
  // 1. 如果只有一个层级，直接返回（不需要面包屑分隔）
  // 2. 如果有多个层级，按 path 去重（移除完全相同的路径）
  if (matched.length <= 1) {
    return matched.map((item) => ({
      path: item.path,
      title: item.meta?.title,
    }))
  }
  
  // 多层级：按 path 去重，保留不同的路径
  const uniqueBreadcrumbs = []
  const seenPaths = new Set()
  
  for (const item of matched) {
    if (!seenPaths.has(item.path)) {
      seenPaths.add(item.path)
      uniqueBreadcrumbs.push({
        path: item.path,
        title: item.meta?.title,
      })
    }
  }
  
  console.log('✅ [Breadcrumbs] 去重后:', uniqueBreadcrumbs)
  return uniqueBreadcrumbs
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
@import './header-styles.css';
</style>
