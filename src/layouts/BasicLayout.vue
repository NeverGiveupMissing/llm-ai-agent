<template>
  <div class="basic-layout">
    <n-layout has-sider>
      <!-- 侧边栏 -->
      <n-layout-sider
        :collapsed="appStore.collapsed"
        :width="SIDEBAR_WIDTH"
        :collapsed-width="COLLAPSED_SIDEBAR_WIDTH"
        show-trigger
        collapse-mode="width"
        @update:collapsed="handleCollapse"
      >
        <Sidebar />
      </n-layout-sider>

      <!-- 主内容区 -->
      <n-layout class="main-layout">
        <!-- 头部 -->
        <n-layout-header bordered style="position: fixed; z-index: 999; overflow: visible">
          <LayoutHeader />
        </n-layout-header>
        <div style="clear: both; overflow: visible; height: 46px" />

        <!-- 面包屑 -->
        <!-- <Breadcrumb /> -->

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

<script setup name="BasicLayout">
import { useAppStore } from '@/stores/modules/app'
import Sidebar from './Sidebar/index.vue'
import LayoutHeader from './Header/index.vue'
import Breadcrumb from './Breadcrumb/index.vue'

// 常量
const SIDEBAR_WIDTH = 210
const COLLAPSED_SIDEBAR_WIDTH = 64

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
  padding: 15px;
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

<style>
/* 全局样式 - 侧边栏深色主题 */
.n-layout-sider {
  background: #001529 !important;
  transition: width 0.3s ease !important;
}

/* 侧边栏折叠按钮样式 */
.n-layout-sider-trigger {
  background: #001529 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #bfcbd9 !important;
}

.n-layout-sider-trigger:hover {
  color: #fff !important;
  background: #000c17 !important;
}

/* 折叠状态下菜单图标颜色增强 */
.n-menu--collapsed .n-menu-item-content__icon {
  color: rgba(255, 255, 255, 0.85) !important;
}

.n-menu--collapsed .n-menu-item-content:hover .n-menu-item-content__icon {
  color: #fff !important;
}

/* 激活状态的菜单图标 */
.n-menu--collapsed .n-menu-item-content--selected .n-menu-item-content__icon {
  color: #1890ff !important;
}
</style>
