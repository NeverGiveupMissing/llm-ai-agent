<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
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

// 自定义主题覆盖 - 侧边栏菜单样式
const themeOverrides = {
  Menu: {
    itemHeight: '50px',
    fontSize: '14px',
    color: '#b0b0b0',
    itemColorHover: 'rgba(255, 255, 255, 0.08)',
    itemColorActive: '#1890ff',
    itemColorActiveHover: '#1890ff',
    itemTextColor: '#b0b0b0',
    itemTextColorHover: '#fff',
    itemTextColorActive: '#fff',
    itemTextColorActiveHover: '#fff',
    itemIconColor: '#b0b0b0',
    itemIconColorHover: '#fff',
    itemIconColorActive: '#fff',
    itemIconColorActiveHover: '#fff',
    itemBorderRadius: '4px',
    itemMargin: '4px 8px',
    itemPadding: '0 16px',
  },
}
</script>
