<template>
  <n-dropdown
    :options="userOptions"
    @select="handleSelect"
    placement="bottom-end"
    :z-index="10000"
    trigger="click"
  >
    <div class="user-dropdown">
      <n-avatar :size="32" color="#667eea">
        {{ getUserInitial() }}
      </n-avatar>
      <span class="user-name">{{ userInfo.userName || userInfo.nickName || '用户' }}</span>
    </div>
  </n-dropdown>
</template>

<script setup name="UserDropdown">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useMessage } from 'naive-ui'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const userInfo = computed(() => userStore.userInfo)

// 获取用户名称首字母
const getUserInitial = () => {
  const name = userInfo.value.userName || userInfo.value.nickName || '用户'
  // 取第一个字符，如果是中文取第一个字，如果是英文取第一个字母并大写
  const firstChar = name.charAt(0)
  return /[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar
}

const userOptions = ref([
  { label: '个人中心', key: 'profile' },
  { label: '系统设置', key: 'settings' },
  { type: 'divider', key: 'divider' },
  { label: '退出登录', key: 'logout' },
])

const handleSelect = (key) => {
  switch (key) {
    case 'profile':
      // ✅ 优化：先检查路由是否存在，避免直接跳转导致死循环
      const profileRoute = router.getRoutes().find(r => r.path === '/profile')
      if (profileRoute) {
        router.push('/profile')
      } else {
        message.warning('个人中心功能暂未开放')
      }
      break
    case 'settings':
      // 检查用户是否有 system-access:view 权限
      if (permissionStore.hasPermission('system-access:view')) {
        router.push('/settings')
      } else {
        message.warning('您没有权限访问系统设置')
        router.push('/403')
      }
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
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
