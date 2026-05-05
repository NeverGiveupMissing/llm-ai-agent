<template>
  <div class="avatar-upload">
    <n-upload :show-file-list="false" :custom-request="handleUpload" accept="image/*">
      <div class="avatar-wrapper" :style="{ width: size + 'px', height: size + 'px' }">
        <!-- 有图片且加载成功时显示图片 -->
        <img
          v-if="displaySrc"
          :src="displaySrc"
          :style="{ width: size + 'px', height: size + 'px', objectFit: 'cover' }"
          style="border-radius: 50%"
          @error="handleImageError"
          @load="handleImageLoad"
          alt="头像"
        />
        <!-- 没有图片或加载失败时显示默认头像 -->
        <n-avatar v-else :size="size" round>
          {{ getInitials }}
        </n-avatar>

        <!-- 悬停遮罩 -->
        <div class="avatar-overlay">
          <n-icon size="24" color="#fff">
            <CameraOutline />
          </n-icon>
          <span class="overlay-text">更换头像</span>
        </div>
      </div>
    </n-upload>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { CameraOutline } from '@vicons/ionicons5'
import { uploadFile } from '@/api/common'
import { updateUser } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'

const message = useMessage()
const userStore = useUserStore()

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 120,
  },
})

// 图片加载状态
const imageLoaded = ref(false)
const imageError = ref(false)

// 最终显示的图片 URL
const displaySrc = computed(() => {
  // 如果图片加载失败或没有 src，返回空字符串显示默认头像
  if (imageError.value || !props.src) {
    return ''
  }
  return props.src
})

// 🔍 使用 watch 监听 src 变化
watch(
  () => props.src,
  (newSrc) => {
    console.log('🔍 AvatarUpload src 变化:', newSrc)
    // 重置状态
    imageLoaded.value = false
    imageError.value = false
  },
  { immediate: true },
)

const emit = defineEmits(['update:avatar'])

// 获取用户名首字母
const getInitials = computed(() => {
  const username = userStore.userInfo?.username || ''
  return username.charAt(0).toUpperCase() || 'U'
})

// 图片加载成功
const handleImageLoad = () => {
  console.log('✅ 头像图片加载成功:', props.src)
  imageLoaded.value = true
  imageError.value = false
}

// 图片加载失败
const handleImageError = (e) => {
  console.error('❌ 头像图片加载失败:', props.src)
  console.error('错误事件:', e)
  imageError.value = true
  imageLoaded.value = false
}

// 处理上传
const handleUpload = async ({ file, onFinish, onError, onProgress }) => {
  try {
    console.log('Naive UI file 对象:', file)

    // Naive UI 的 file 对象结构：
    // - file.file: 实际的 File 对象（浏览器原生）
    // - 但有时可能直接是 file 对象本身
    const actualFile = file.file || file

    if (!actualFile || !(actualFile instanceof File)) {
      throw new Error('无效的文件对象')
    }

    console.log('实际文件对象:', actualFile)

    // 使用统一上传接口
    const res = await uploadFile(actualFile, 'avatar', (percent) => {
      onProgress({ percent })
    })

    if (res.code === 200) {
      // 🔧 修复：清理 URL 中的换行符和空格
      const cleanUrl = res.data.url.trim().replace(/[\r\n]/g, '')

      console.log('📤 上传成功，原始 URL:', res.data.url)
      console.log(' 清理后的 URL:', cleanUrl)

      // 更新用户头像到数据库
      const user_id = userStore.userInfo?.id
      if (user_id) {
        await updateUser(user_id, { avatarUrl: cleanUrl })
      }

      message.success('头像上传成功')
      // 传递清理后的 URL
      emit('update:avatar', cleanUrl)
      onFinish()
    } else {
      message.error(res.message || '头像上传失败')
      onError()
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    message.error(error.message || '头像上传失败')
    onError()
  }
}
</script>

<style scoped>
.avatar-upload {
  position: relative;
}

.avatar-wrapper {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.overlay-text {
  color: #fff;
  font-size: 12px;
  margin-top: 4px;
}
</style>
