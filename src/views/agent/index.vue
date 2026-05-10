<template>
  <div class="agent-container">
    <n-card :bordered="false" class="content-card">
      <n-empty description="智能体功能开发中..." size="large">
        <template #icon>
          <n-icon><ConstructOutline /></n-icon>
        </template>
        <template #extra>
          <n-button type="primary" size="large"> 即将上线 </n-button>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<script setup name="Agent">
import { NEmpty, NIcon, NButton } from 'naive-ui'
import { ConstructOutline } from '@vicons/ionicons5'
</script>

<style scoped>
.content-card {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
