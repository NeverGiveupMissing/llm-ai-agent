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
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { usePermissionStore } from '@/stores/modules/permission'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)

// const menuOptions = computed(() => menuStore.menuOptions || [])
const menuOptions = computed(() => menuStore.menuOptions || [])

const handleMenuClick = (key) => {
  router.push(key)
}

watch(
  () => menuStore.menuOptions,
  (newOptions) => {
    console.log(' [侧边栏] 菜单数据变化:', newOptions)
    console.log(' [侧边栏] 菜单数量:', newOptions?.length)
    console.log(' [侧边栏] permissionStore.isLoaded:', permissionStore.isLoaded)

    if (newOptions && newOptions.length > 0) {
      console.log('✅ [侧边栏] 菜单数据已更新！')
      console.log('📋 [侧边栏] 第一个菜单:', newOptions[0])
    }
  },
  { deep: true, immediate: true },
)

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
  overflow: hidden;
  background: #001529;
}

/* 菜单容器背景色 */
:deep(.n-menu) {
  background: #001529 !important;
  height: 100%;
  overflow-y: auto !important;
  overflow-x: hidden;
}

/* 自定义滚动条样式 */
:deep(.n-menu::-webkit-scrollbar) {
  width: 6px;
}

:deep(.n-menu::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.n-menu::-webkit-scrollbar-thumb) {
  background: #001529;
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
:deep(.n-menu--collapsed .n-menu-item-content__icon) {
  margin-left: 15px !important;
  color: #fff !important;
}
:deep(.n-menu--collapsed .n-menu-item-content__label) {
  margin-left: 15px !important;
  display: none;
}
</style>
