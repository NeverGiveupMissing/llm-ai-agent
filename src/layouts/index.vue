<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="layout-wrapper" style="min-height: 100vh; background: yellow;">
    <BasicLayout />
  </div>
</template>

<script setup name="Layout">
import BasicLayout from './BasicLayout.vue'

console.log('🏠 [Layout] 组件 script setup 执行')
console.log('🏠 [Layout] BasicLayout 组件:', BasicLayout)
</script>
