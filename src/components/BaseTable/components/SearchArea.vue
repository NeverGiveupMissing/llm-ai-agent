<template>
  <n-card title="搜索条件" :bordered="false" size="small" class="search-card">
    <n-form inline :label-width="80">
      <slot></slot>
      <n-form-item>
        <n-space>
          <CommonButton type="query" @click="$emit('search')">搜索</CommonButton>
          <CommonButton type="reset" @click="$emit('reset')">重置</CommonButton>
        </n-space>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
import CommonButton from '@/components/CommonButton.vue'

defineEmits(['search', 'reset'])
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
  flex-shrink: 0;
}

/* 修复搜索表单布局 */
:deep(.n-form) {
  flex-wrap: wrap;
}

:deep(.n-form-item) {
  margin-right: 16px;
  margin-bottom: 12px;
  min-width: 200px;
}

:deep(.n-form-item .n-form-item-label) {
  width: 70px !important;
}
</style>
