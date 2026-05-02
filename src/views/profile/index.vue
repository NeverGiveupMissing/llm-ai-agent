<template>
  <div class="profile-container">
    <n-card title="个人中心" :bordered="false">
      <n-space vertical :size="24">
        <!-- 用户信息卡片 -->
        <UserInfoCard
          :avatar="userInfo.avatar"
          :username="userInfo.username"
          :email="userInfo.email"
          @upload-success="handleAvatarUploadSuccess"
        />

        <!-- 个人资料表单 -->
        <ProfileForm
          :user-data="userData"
          @update-success="handleProfileUpdateSuccess"
          @reset="handleResetProfile"
        />

        <!-- 修改密码表单 -->
        <ChangePasswordForm
          @password-changed="handlePasswordChanged"
        />

        <!-- 退出登录 -->
        <LogoutSection
          @logout="handleLogout"
        />
      </n-space>
    </n-card>
  </div>
</template>

<script setup name="Profile">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import { getCurrentUser } from '@/api/auth'
import UserInfoCard from './components/UserInfoCard.vue'
import ProfileForm from './components/ProfileForm.vue'
import ChangePasswordForm from './components/ChangePasswordForm.vue'
import LogoutSection from './components/LogoutSection.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 用户详细数据
const userData = ref({})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getCurrentUser()
    // ✅ 拦截器已返回 data.data，直接使用
    const data = res
    // 更新 store 中的用户信息
    userStore.setUserInfo(data)
    // 保存详细数据
    userData.value = data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error(error.message || '获取用户信息失败')
  }
}

// 头像上传成功
const handleAvatarUploadSuccess = () => {
  fetchUserInfo()
}

// 个人资料更新成功
const handleProfileUpdateSuccess = () => {
  fetchUserInfo()
}

// 重置个人资料
const handleResetProfile = () => {
  fetchUserInfo()
}

// 密码修改成功
const handlePasswordChanged = () => {
  // 延迟退出登录
  setTimeout(() => {
    handleLogout()
  }, 1500)
}

// 退出登录
const handleLogout = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出登录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      // 调用 store 的 logout 方法
      userStore.logout()
      
      // 跳转到登录页
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
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
</style>
