<template>
  <div class="tab-pane-content">
    <LoginLogTable />
  </div>
</template>

<script setup>
import LoginLogTable from './LoginLogTable.vue'
</script>

<style scoped>
.tab-pane-content {
  padding-top: 16px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}
</style>
