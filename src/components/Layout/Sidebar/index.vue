<template>
  <div class="sidebar">
    <SidebarLogo />
    <SidebarMenu />
  </div>
</template>

<script setup>
import SidebarLogo from './SidebarLogo.vue'
import SidebarMenu from './SidebarMenu.vue'
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
