<template>
  <div class="basic-layout">
    <n-layout has-sider>
      <!-- 侧边栏 -->
      <n-layout-sider
        :collapsed="appStore.collapsed"
        :width="SIDEBAR_WIDTH"
        :collapsed-width="COLLAPSED_SIDEBAR_WIDTH"
        show-trigger
        bordered
        collapse-mode="width"
        @update:collapsed="handleCollapse"
      >
        <Sidebar />
      </n-layout-sider>

      <!-- 主内容区 -->
      <n-layout class="main-layout">
        <!-- 头部 -->
        <n-layout-header bordered>
          <LayoutHeader />
        </n-layout-header>

        <!-- 标签页（可选） -->
        <LayoutTabbar v-if="showTabbar" />

        <!-- 内容区 -->
        <n-layout-content class="layout-content">
          <div class="content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade-slide" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/stores/modules/app'
import Sidebar from './Sidebar/index.vue'
import LayoutHeader from './Header/index.vue'
import LayoutTabbar from './Tabbar/index.vue'

// 常量
const SIDEBAR_WIDTH = 220
const COLLAPSED_SIDEBAR_WIDTH = 64
const showTabbar = ref(false) // 是否显示标签页

const appStore = useAppStore()

const handleCollapse = (collapsed) => {
  appStore.setCollapsed(collapsed)
}
</script>

<style scoped>
.basic-layout {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-content {
  flex: 1;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
