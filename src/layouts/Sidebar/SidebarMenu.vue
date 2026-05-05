<template>
  <div class="sidebar-menu-container">
    <!-- 直接使用 store 状态判断 -->
    <div
      v-if="!permissionStore.isLoaded"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: white;
      "
    >
      权限加载中...
    </div>
    <div
      v-else-if="menuStore.menuOptions?.length === 0"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: white;
      "
    >
      菜单数据为空
    </div>
    <n-menu
      v-else
      :value="activeMenu"
      :collapsed="appStore.collapsed"
      :options="menuStore.menuOptions"
      :default-value="activeMenu"
      @update:value="handleMenuClick"
    />
  </div>
</template>

<script setup name="SidebarMenu">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { usePermissionStore } from '@/stores/modules/permission'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()
const permissionStore = usePermissionStore()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

const handleMenuClick = (key) => {
  router.push(key)
}

// 组件挂载时调试
onMounted(() => {
  console.log(' [侧边栏组件] SidebarMenu 已挂载')
  console.log(' [调试] permissionStore.isLoaded:', permissionStore.isLoaded)
  console.log(' [调试] menuStore.menuOptions:', menuStore.menuOptions)
  console.log(' [调试] menuStore.menuOptions?.length:', menuStore.menuOptions?.length)

  if (menuStore.menuOptions && menuStore.menuOptions.length > 0) {
    console.log('✅ [侧边栏] 菜单数据正常！')
    console.log('📋 [侧边栏] 第一个菜单:', menuStore.menuOptions[0])
  } else {
    console.error('❌ [侧边栏] 菜单数据为空！')
  }
})
</script>

<style scoped>
.sidebar-menu-container {
  flex: 1;
  min-height: 0;
  overflow: hidden; /* 禁止菜单容器自身滚动 */
  background: #001529;
}

/* 菜单容器背景色 */
:deep(.n-menu) {
  background: #001529 !important;
  height: 100%;
  overflow-y: auto !important; /* 让 Naive UI 内部处理滚动 */
  overflow-x: hidden;
}

/* 自定义滚动条样式 - 修改 .n-menu 的滚动条 */
:deep(.n-menu::-webkit-scrollbar) {
  width: 6px;
}

:deep(.n-menu::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.n-menu::-webkit-scrollbar-thumb) {
  background: #001529; /* 测试用红色 */
  border-radius: 3px;
}

:deep(.n-menu::-webkit-scrollbar-thumb:hover) {
  background: #001529;
}

/* 子菜单样式 */
:deep(.n-menu-item-children) {
  background: rgba(0, 0, 0, 0.2) !important;
  margin: 0 8px;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.n-menu-item-children .n-menu-item .n-menu-item-content) {
  padding-left: 48px !important;
  margin: 2px 0;
}

/* 折叠状态样式 */
:deep(.n-menu--collapsed .n-menu-item-content) {
  justify-content: center !important;
  margin: 4px 0 !important;
  padding: 0 !important;
}

:deep(.n-menu--collapsed .n-menu-item-content__label) {
  display: none;
}
</style>
