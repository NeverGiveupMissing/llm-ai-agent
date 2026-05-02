<template>
  <n-card size="small" :bordered="false">
    <n-alert type="warning" :bordered="false" style="margin-bottom: 16px">
      退出登录后，需要重新登录才能继续使用系统。
    </n-alert>
    <n-button type="error" @click="handleLogoutClick">
      <template #icon>
        <n-icon><LogOutOutline /></n-icon>
      </template>
      退出登录
    </n-button>
  </n-card>
</template>

<script setup>
import { NIcon } from 'naive-ui'
import { LogOutOutline } from '@vicons/ionicons5'

// Emits
const emit = defineEmits(['logout'])

// 点击退出登录
const handleLogoutClick = () => {
  emit('logout')
}
</script>
