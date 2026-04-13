<template>
  <n-dropdown :options="userOptions" @select="handleSelect">
    <div class="user-dropdown">
      <n-avatar :size="32" color="#667eea">
        {{ userInfo.name?.charAt(0) || '张' }}
      </n-avatar>
      <span class="user-name">{{ userInfo.name }}</span>
    </div>
  </n-dropdown>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)

const userOptions = ref([
  { label: '系统设置', key: 'settings' },
  { type: 'divider', key: 'divider' },
  { label: '退出登录', key: 'logout' },
])

const handleSelect = (key) => {
  switch (key) {
    case 'settings':
      router.push({ name: 'Settings' })
      break
    case 'logout':
      userStore.logout()
      router.push({ name: 'Login' })
      break
  }
}
</script>

<style scoped>
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: #f5f5f5;
}

.user-name {
  font-size: 14px;
}
</style>
