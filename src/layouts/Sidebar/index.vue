<template>
  <div class="sidebar">
    <SidebarLogo />
    <SidebarMenu />
  </div>
</template>

<script setup name="Sidebar">
import SidebarLogo from './SidebarLogo.vue'
import SidebarMenu from './SidebarMenu.vue'
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #001529;
  transition: width 0.3s ease;
  overflow: hidden;
}
</style>
