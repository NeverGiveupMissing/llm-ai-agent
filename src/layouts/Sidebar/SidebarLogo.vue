<template>
  <div class="sidebar-logo" @click="handleGoHome">
    <img
      src="https://foruda.gitee.com/avatar/1677076439957229279/7411783_satisfied_with_1586339682.png!avatar30"
      alt="logo"
      class="logo-img"
    />
    <transition name="logo-fade">
      <span v-if="!appStore.collapsed" class="logo-text">AI Agent</span>
    </transition>
  </div>
</template>

<script setup name="SidebarLogo">
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'

const router = useRouter()
const appStore = useAppStore()

const handleGoHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  background: #001529;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid #1e1e1e;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-logo:hover {
  background: #000c17;
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  color: #fff;
  transition: opacity 0.3s ease;
}

/* Logo 文字过渡动画 */
.logo-fade-enter-active,
.logo-fade-leave-active {
  transition: opacity 0.3s ease;
}

.logo-fade-enter-from,
.logo-fade-leave-to {
  opacity: 0;
}
</style>
