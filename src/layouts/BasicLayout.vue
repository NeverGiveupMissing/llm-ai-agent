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
        style="display: flex; flex-direction: column; height: 100%"
      >
        <Sidebar />
      </n-layout-sider>

      <!-- 主内容区 -->
      <n-layout class="main-layout">
        <!-- 头部 -->
        <n-layout-header
          bordered
          :style="headerStyle"
          style="position: fixed; z-index: 999; overflow: visible"
        >
          <LayoutHeader />
        </n-layout-header>
        <div style="clear: both; overflow: visible; height: 46px" />

        <!-- 面包屑 -->
        <!-- <Breadcrumb /> -->

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
            <div class="copyright-footer">
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
import { useAppStore } from '@/stores/modules/app'
import { usePermissionStore } from '@/stores/modules/permission'
import { useMenuStore } from '@/stores/modules/menu'
import Sidebar from './Sidebar/index.vue'
import LayoutHeader from './Header/index.vue'
import Breadcrumb from './Breadcrumb/index.vue'
import CopyrightFooter from '@/components/CopyrightFooter.vue'

// 常量
const SIDEBAR_WIDTH = 210
const COLLAPSED_SIDEBAR_WIDTH = 64

const appStore = useAppStore()
const permissionStore = usePermissionStore()
const menuStore = useMenuStore()

// 计算 Header 样式，根据侧边栏折叠状态动态调整
const headerStyle = computed(() => ({
  left: appStore.collapsed ? `${COLLAPSED_SIDEBAR_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
  width: `calc(100% - ${appStore.collapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH}px)`,
}))

// 组件挂载时检查权限是否加载
onMounted(() => {
  // console.log('🏗️ [BasicLayout] 组件已挂载')
  // console.log('️ [BasicLayout] isLoaded:', permissionStore.isLoaded)
  // console.log('️ [BasicLayout] menuTree:', permissionStore.menuTree?.length)
  // console.log('️ [BasicLayout] menuOptions:', menuStore.menuOptions?.length)

  // 如果权限未加载，手动触发加载
  if (permissionStore.isNotLoaded) {
    // console.log('🔄 [BasicLayout] 权限未加载，手动触发...')
    permissionStore.fetchUserPermissions()
  } else if (
    permissionStore.isLoaded &&
    permissionStore.menuTree?.length > 0 &&
    menuStore.menuOptions?.length === 0
  ) {
    // ✅ 权限已加载但菜单未生成（缓存加载情况），强制重新生成
    // console.log(' [BasicLayout] 权限已加载但菜单为空，强制重新生成...')
    menuStore.setMenuFromTree(permissionStore.menuTree)
    // console.log('✅ [BasicLayout] 菜单生成完成:', menuStore.menuOptions?.length, '个')
  }
})

// 监听权限加载状态
watch(
  () => permissionStore.isLoaded,
  async (loaded) => {
    // console.log('👀 [BasicLayout] 权限加载状态变化:', loaded)
    // console.log('👀 [BasicLayout] menuTree 长度:', permissionStore.menuTree?.length)
    // console.log('👀 [BasicLayout] menuOptions 长度:', menuStore.menuOptions?.length)

    if (loaded === true) {
      // console.log('✅ [BasicLayout] 权限已加载，菜单数据已就绪')
      // console.log('🔍 [BasicLayout] permissionStore.menuTree:', permissionStore.menuTree)
      // console.log('🔍 [BasicLayout] menuStore.menuOptions:', menuStore.menuOptions)

      // ✅ 关键修复：权限加载完成后，强制重新生成菜单
      await nextTick()
      if (permissionStore.menuTree?.length > 0) {
        // console.log('🔄 [BasicLayout] 重新生成菜单...')
        menuStore.setMenuFromTree(permissionStore.menuTree)
        // console.log('✅ [BasicLayout] 菜单重新生成完成:', menuStore.menuOptions)
        // console.log('✅ [BasicLayout] 菜单选项数量:', menuStore.menuOptions?.length)
      } else {
        // console.error('❌ [BasicLayout] permissionStore.menuTree 为空！')
      }
    }
  },
  { immediate: true }, // ✅ 立即执行一次，防止加载竞态
)

const handleCollapse = (collapsed) => {
  appStore.setCollapsed(collapsed)
}
</script>

<style scoped>
.basic-layout {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
}

.n-layout {
  height: 100%;
  flex: 1;
  overflow: hidden; /* 禁止 n-layout 自身滚动 */
}

.main-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  /* ✅ 允许 content-wrapper 滚动 */
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 15px;
  padding-bottom: 15px;
  background: #f0f2f5; /* ✅ 显式设置灰色背景 */
}

.copyright-footer {
  margin: 0 15px;
}
/* ✅ 确保版权组件可见，宽度与表格一致 */
.page-copyright {
  margin-bottom: 0;
  /* ✅ 移除 width: 100%，让自然流式布局控制宽度 */
  position: relative;
  z-index: 10;
}

/* 页面内容区域自然占据空间 */
.content-wrapper > .router-view-wrapper {
  width: 100%;
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
  overflow: hidden !important; /* 禁止侧边栏外层滚动 */
}

/* ✅ 只隐藏滚动条，不禁止滚动 */
.n-layout-scroll-container {
  /* ✅ 移除 overflow: hidden，允许内容滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.n-layout-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
  width: 0;
  height: 0;
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
