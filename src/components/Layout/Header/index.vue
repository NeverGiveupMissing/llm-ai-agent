<template>
  <div class="header">
    <div class="header-left">
      <!-- 折叠按钮 -->
      <n-button text @click="toggleCollapse">
        <template #icon>
          <span class="icon">{{ appStore.collapsed ? '☰' : '☰' }}</span>
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
            <template #icon>🔄</template>
          </n-button>
        </template>
        刷新页面
      </n-tooltip>

      <!-- 通知 -->
      <n-dropdown :options="notificationOptions" @select="handleNotification">
        <n-badge :count="unreadCount">
          <n-button text>
            <template #icon>🔔</template>
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

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  return matched.map((item) => ({
    path: item.path,
    title: item.meta?.title,
  }))
})

// 折叠菜单
const toggleCollapse = () => {
  appStore.toggleCollapsed()
}

// 刷新页面
const refreshPage = () => {
  window.location.reload()
}

// 通知
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

.icon {
  font-size: 20px;
}
</style>
