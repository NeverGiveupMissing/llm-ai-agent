<template>
  <div class="pagination-wrapper">
    <n-pagination
      v-model:page="internalPage"
      v-model:page-size="internalPageSize"
      :item-count="pagination.itemCount"
      :page-sizes="pagination.pageSizes"
      :show-size-picker="pagination.showSizePicker"
      :show-quick-jumper="pagination.showQuickJumper"
      @update:page="$emit('page-change', $event)"
      @update:page-size="$emit('page-size-change', $event)"
    >
      <template #prefix="{ itemCount }">
        <span class="pagination-total">共 {{ itemCount }} 条</span>
      </template>
    </n-pagination>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagination: Object,
})

const emit = defineEmits(['page-change', 'page-size-change'])

// 使用计算属性实现 v-model 的代理
const internalPage = computed({
  get: () => props.pagination.page,
  set: (val) => emit('page-change', val),
})

const internalPageSize = computed({
  get: () => props.pagination.pageSize,
  set: (val) => emit('page-size-change', val),
})
</script>

<style scoped>
/* 分页容器 */
.pagination-wrapper {
  margin-top: 16px;
  padding: 8px 0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* 分页总数样式 */
.pagination-total {
  font-size: 14px;
  color: #666;
  margin-right: 12px;
}
</style>
