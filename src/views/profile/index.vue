<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 左侧：用户信息卡片 -->
      <div class="profile-left">
        <UserInfoCard
          :user="userInfo"
          :roles="userRoles"
          @logout="handleLogout"
          @avatar-change="handleAvatarChange"
        />
      </div>

      <!-- 右侧：操作面板 -->
      <div class="profile-right">
        <n-card :bordered="false" class="profile-card">
          <n-tabs v-model:value="activeTab" type="line" animated size="large">
            <!-- 基本资料 -->
            <n-tab-pane name="basic" tab="基本资料">
              <BasicInfoTab :user="userInfo" @success="fetchUserInfo" />
            </n-tab-pane>

            <!-- 修改密码 -->
            <n-tab-pane name="password" tab="修改密码">
              <ChangePasswordTab />
            </n-tab-pane>

            <!-- 登录日志 -->
            <n-tab-pane name="logs" tab="登录日志">
              <LoginLogTab />
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup name="Profile">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import { getCurrentUser } from '@/api/auth'
import UserInfoCard from './components/UserInfoCard.vue'
import BasicInfoTab from './components/BasicInfoTab.vue'
import ChangePasswordTab from './components/ChangePasswordTab.vue'
import LoginLogTab from './components/LoginLogTab.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

// 状态管理
const activeTab = ref('basic')
const userInfo = ref({})
const userRoles = ref([])

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getCurrentUser()
    userInfo.value = res.data
    userRoles.value = res.data.roles || []

    // 同步更新 store
    userStore.setUserInfo(res.data)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error(error.message || '获取用户信息失败')
  }
}

// 处理头像变更
const handleAvatarChange = (newAvatar) => {
  console.log('🔄 handleAvatarChange 被调用:', newAvatar)
  
  // 统一使用 avatar_url 字段与后端保持一致
  // 使用 Object.assign 确保响应式更新
  Object.assign(userInfo.value, {
    avatar_url: newAvatar
  })
  
  console.log(' 更新后的 userInfo:', userInfo.value)
  
  userStore.setUserInfo({ avatar_url: newAvatar })
  message.success('头像更新成功')
}

// 退出登录
const handleLogout = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出登录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      userStore.logout()
      router.push('/login')
      message.success('已退出登录')
    },
  })
}

// 初始化
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 20px;
  padding-left: 360px;
}

.profile-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* 左侧固定定位 */
.profile-left {
  position: fixed;
  left: 240px;
  top: 80px;
  width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 10;
}

/* 左侧卡片 */
.profile-left .profile-card {
  position: static;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 右侧自适应剩余空间 */
.profile-right {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.profile-right .profile-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.n-card__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.n-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tab-pane) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 移动端优化 */
@media (max-width: 767px) {
  .profile-page {
    padding: 12px;
  }

  .profile-container {
    padding-left: 0;
  }

  .profile-left {
    position: static;
    width: 100%;
    margin-bottom: 20px;
  }
}
</style>
