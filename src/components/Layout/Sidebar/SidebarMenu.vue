<template>
  <n-menu
    :value="activeMenu"
    :collapsed="appStore.collapsed"
    :options="menuOptions"
    :default-value="activeMenu"
    @update:value="handleMenuClick"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()

// 当前激活的菜单
const activeMenu = computed(() => route.name)

// 菜单选项（从 store 获取）
const menuOptions = computed(() => menuStore.menuOptions)

const handleMenuClick = (key) => {
  router.push({ name: key })
}
</script>
