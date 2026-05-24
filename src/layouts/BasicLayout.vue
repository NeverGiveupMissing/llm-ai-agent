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
        class="layout-sider"
      >
        <Sidebar />
      </n-layout-sider>

      <!-- 主内容区 (滚动容器) -->
      <n-layout class="main-layout">
        <!-- 头部 (粘性定位) -->
        <n-layout-header class="layout-header">
          <LayoutHeader />
        </n-layout-header>

        <!-- 内容区 -->
        <n-layout-content class="layout-content">
          <div class="content-wrapper">
            <div class="router-view-wrapper">
              <router-view v-slot="{ Component }">
                <transition name="fade-slide" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </div>

            <!-- 底部版权 -->
            <div v-if="!isChatPage" class="copyright-footer">
              <CopyrightFooter class="page-copyright" />
            </div>
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup name="BasicLayout">
import { onMounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { usePermissionStore } from '@/stores/modules/permission'
import { useMenuStore } from '@/stores/modules/menu'
import Sidebar from './Sidebar/index.vue'
import LayoutHeader from './Header/index.vue'
import CopyrightFooter from '@/components/CopyrightFooter.vue'

const route = useRoute()

// 常量
const SIDEBAR_WIDTH = 210
const COLLAPSED_SIDEBAR_WIDTH = 61

const appStore = useAppStore()
const permissionStore = usePermissionStore()
const menuStore = useMenuStore()

// 判断是否为聊天页面
const isChatPage = computed(() => {
  return route.path === '/chat' || route.path.startsWith('/chat/')
})

// 【已恢复】原有的权限和菜单加载逻辑
onMounted(() => {
  if (permissionStore.isNotLoaded) {
    permissionStore.fetchUserPermissions()
  } else if (
    permissionStore.isLoaded &&
    permissionStore.menuTree?.length > 0 &&
    menuStore.menuOptions?.length === 0
  ) {
    menuStore.setMenuFromTree(permissionStore.menuTree)
  }
})

watch(
  () => permissionStore.isLoaded,
  async (loaded) => {
    if (loaded && permissionStore.menuTree?.length > 0) {
      await nextTick()
      menuStore.setMenuFromTree(permissionStore.menuTree)
    }
  },
  { immediate: true },
)

const handleCollapse = (collapsed) => {
  appStore.setCollapsed(collapsed)
}
</script>

<style scoped>
.basic-layout {
  height: 100vh;
  width: 100%;
  display: flex;
}

.layout-sider {
  height: 100vh;
  overflow-y: auto;
}

/* 
  核心布局：
  1. height: 100vh 撑满视口高度。
  2. overflow-y: auto 使其成为唯一的滚动容器。
*/
.main-layout {
  height: 100vh;
  overflow-y: auto;
}

/*
  核心：粘性定位
  1. position: sticky 使其在滚动到顶部时固定。
  2. top: 0 定义其固定的位置。
  3. z-index 确保它在内容之上。
  4. background: #fff 确保它在滚动时有背景色，不会变透明。
*/
.layout-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #eee;
  height: 61px;
}

.layout-content {
  background: #f0f2f5;
}

.content-wrapper {
  padding: 15px;
  box-sizing: border-box;
}

.copyright-footer {
  padding-top: 15px;
}

.page-copyright {
  margin-bottom: 0;
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

.n-layout-sider-trigger {
  background: #001529 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #bfcbd9 !important;
}

.n-layout-sider-trigger:hover {
  color: #fff !important;
  background: #000c17 !important;
}
</style>
