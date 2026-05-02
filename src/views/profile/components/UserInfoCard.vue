<template>
  <n-card size="small" :bordered="false" style="background: #f5f5f5">
    <n-space align="center" :size="16">
      <n-upload
        :show-file-list="false"
        :custom-request="handleUploadAvatar"
        accept="image/*"
      >
        <n-avatar
          :size="80"
          :src="avatar"
          style="cursor: pointer"
        >
          {{ username?.charAt(0)?.toUpperCase() || 'U' }}
        </n-avatar>
      </n-upload>
      <div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px">
          {{ username || '未设置用户名' }}
        </div>
        <div style="color: #999; font-size: 14px">
          {{ email || '未设置邮箱' }}
        </div>
        <n-text depth="3" style="font-size: 12px; margin-top: 4px; display: block">
          点击头像可更换
        </n-text>
      </div>
    </n-space>
  </n-card>
</template>

<script setup>
import { useMessage } from 'naive-ui'
import { uploadAvatar } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'

const message = useMessage()
const userStore = useUserStore()

// Props
const props = defineProps({
  avatar: {
    type: String,
    default: '',
  },
  username: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['upload-success'])

// 上传头像
const handleUploadAvatar = async ({ file, onFinish, onError }) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file.file)
    
    const res = await uploadAvatar(formData)
    
    if (res.code === 200) {
      message.success('头像上传成功')
      // 更新 store 中的头像
      userStore.setUserInfo({ avatar: res.data.avatar })
      emit('upload-success', res.data.avatar)
      onFinish()
    } else {
      message.error(res.message || '头像上传失败')
      onError()
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    message.error('头像上传失败')
    onError()
  }
}
</script>
