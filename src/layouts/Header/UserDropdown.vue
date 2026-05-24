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
      <span>{{ userInfo.user_name || userInfo.nick_name || '用户' }}</span>
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
  const name = userInfo.value.user_name || userInfo.value.nick_name || '用户'
  // 取第一个字符，如果是中文取第一个字，如果是英文取第一个字母并大写
  const firstChar = name.charAt(0)
  return /[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar
}

const userOptions = ref([
  { label: '个人资料', key: 'profile' },
  { label: '系统设置', key: 'settings' },
  { type: 'divider', key: 'divider' },
  { label: '退出登录', key: 'logout' },
])

const handleSelect = (key) => {
  switch (key) {
    case 'profile':
      // ✅ 直接跳转，不检查路由（路由应该始终存在）
      router.push('/profile')
      break
    case 'settings':
      // ✅ 检查路由是否存在，而不是硬编码的权限标识
      const settingsRoute = router.getRoutes().find((r) => r.path === '/system/settings')
      if (settingsRoute) {
        router.push('/system/settings')
      } else {
        message.warning('您没有权限访问系统设置')
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
/* ✅ 用户下拉容器 - 赛博朋克全息风格 */
.user-dropdown {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  border: 1px solid transparent;
}
</style>
