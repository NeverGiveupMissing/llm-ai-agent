<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider>
          <router-view />
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup name="App">
import { ref } from 'vue'
import { zhCN, dateZhCN } from 'naive-ui'

const theme = ref(null) // null 为亮色主题，可切换 darkTheme
</script>
