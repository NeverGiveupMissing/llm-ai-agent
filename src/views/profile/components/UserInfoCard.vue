<template>
  <n-card :bordered="false" class="profile-card">
    <div class="card-header">个人信息</div>

    <!-- 头像区 -->
    <div class="avatar-section">
      <AvatarUpload :src="userAvatarUrl" :size="110" @update:avatar="handleAvatarUpdate" />
      <h3 class="username">{{ user.nickname || user.username || '未设置昵称' }}</h3>

      <!-- 角色标签 -->
      <div class="roles" v-if="roles && roles.length > 0">
        <n-tag v-for="role in roles" :key="role.id" type="info" size="small" round>
          {{ role.name || role.display_name }}
        </n-tag>
      </div>
    </div>

    <!-- 信息列表 -->
    <div class="info-list">
      <div class="info-item">
        <span class="info-label">
          <n-icon><PersonOutline /></n-icon> 用户名称
        </span>
        <span class="info-value">{{ user.username || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <n-icon><PhonePortraitOutline /></n-icon> 手机号码
        </span>
        <span class="info-value">{{ user.phone || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <n-icon><MailOutline /></n-icon> 用户邮箱
        </span>
        <span class="info-value">{{ user.email || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <n-icon><CalendarOutline /></n-icon> 注册日期
        </span>
        <span class="info-value">{{ formatDate(user.created_at) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <n-icon><TimeOutline /></n-icon> 最后登录
        </span>
        <span class="info-value">{{ formatDate(user.last_login_at) }}</span>
      </div>
    </div>

    <!-- 退出登录按钮 -->
    <n-button type="error" ghost block @click="handleLogoutClick" class="logout-btn">
      <template #icon>
        <n-icon><LogOutOutline /></n-icon>
      </template>
      退出登录
    </n-button>
  </n-card>
</template>

<script setup>
import { computed, watch } from 'vue'
import { NIcon } from 'naive-ui'
import {
  LogOutOutline,
  PersonOutline,
  PhonePortraitOutline,
  MailOutline,
  CalendarOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import AvatarUpload from './AvatarUpload.vue'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({}),
  },
  roles: {
    type: Array,
    default: () => [],
  },
})

// 使用 computed 确保响应式
const userAvatarUrl = computed(() => {
  const url = props.user?.avatar_url || ''
  console.log('🔍 userAvatarUrl computed 触发:')
  console.log('  props.user:', props.user)
  console.log('  avatar_url:', props.user?.avatar_url)
  console.log('  返回 URL:', url)
  return url
})

// 🔍 使用 watch 监听 user 变化
watch(
  () => props.user,
  (newUser) => {
    console.log('🔍 watch 监听到 user 变化:', newUser)
    console.log('🔍 user.avatar_url:', newUser?.avatar_url)
  },
  { deep: true, immediate: true }
)

const emit = defineEmits(['logout', 'avatar-change'])

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 处理头像更新
const handleAvatarUpdate = (newAvatar) => {
  emit('avatar-change', newAvatar)
}

// 处理退出登录
const handleLogoutClick = () => {
  emit('logout')
}
</script>

<style scoped>
.profile-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 0;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24px 0;
}

.username {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

/* 信息列表 */
.info-list {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.info-label :deep(.n-icon) {
  font-size: 16px;
  color: #9ca3af;
}

.info-value {
  color: #334155;
  font-weight: 500;
}

/* 退出按钮 */
.logout-btn {
  margin-top: 8px;
}

/* 移动端优化 */
@media (max-width: 767px) {
  .profile-card {
    position: static;
  }
}
</style>
