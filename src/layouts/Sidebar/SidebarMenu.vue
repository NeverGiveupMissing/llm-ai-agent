<template>
  <div class="sidebar-menu-container">
    <n-menu
      :value="activeMenu"
      :collapsed="appStore.collapsed"
      :options="menuOptions"
      :default-value="activeMenu"
      @update:value="handleMenuClick"
    />
  </div>
</template>

<script setup name="SidebarMenu">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 菜单选项（从 store 获取）
const menuOptions = computed(() => menuStore.menuOptions)

const handleMenuClick = (key) => {
  router.push(key)
}
</script>

<style scoped>
.sidebar-menu-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #001529;
}

/* 自定义滚动条样式 */
.sidebar-menu-container::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-menu-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.sidebar-menu-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 菜单容器背景色 */
:deep(.n-menu) {
  background: #001529 !important;
}

/* 子菜单样式（themeOverrides 未覆盖的部分）*/
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
