<template>
  <n-card :bordered="false" class="table-card" ref="containerRef">
    <!-- 工具栏 -->
    <div
      class="toolbar"
      v-if="$slots['toolbar-left'] || $slots['toolbar-right'] || showColumnControl"
    >
      <!-- 左侧工具栏：强制纯文字按钮 -->
      <div class="toolbar-left">
        <slot name="toolbar-left"></slot>
      </div>

      <!-- 右侧工具栏：固定纯图标模式 -->
      <div class="toolbar-right">
        <slot name="toolbar-right"></slot>
        <RightToolbar
          v-if="showColumnControl"
          :columns="configurableColumns"
          :visible-keys="visibleKeys"
          :show-search-toggle="showSearchToggle"
          :show-search="showSearch"
          @refresh="$emit('refresh')"
          @column-change="$emit('column-change', $event)"
          @update:show-search="$emit('update:show-search', $event)"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <div
      class="table-body-wrapper"
      data-test="table-wrapper"
      :class="{ 'overflow-auto': data.length > page_size }"
    >
      <n-data-table
        ref="tableRef"
        :key="columns.length"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="rowKey"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="$emit('update:checked-row-keys', $event)"
        :scroll-x="scrollX"
        :children-key="childrenKey"
        :expanded-row-keys="expandedRowKeys"
        @update:expanded-row-keys="$emit('update:expanded-row-keys', $event)"
      />
    </div>

    <!-- 独立分页组件（封装在 BaseTable 内部） -->
    <PaginationArea
      v-if="showPagination && pagination.total > 0"
      :pagination="pagination"
      @page-change="$emit('page-change', $event)"
      @page-size-change="$emit('page-size-change', $event)"
    />
  </n-card>
</template>

<script setup>
import { ref } from 'vue'
import RightToolbar from '@/components/RightToolbar.vue'
import PaginationArea from './PaginationArea.vue'

const props = defineProps({
  columns: Array,
  configurableColumns: Array,
  visibleKeys: Array,
  showColumnControl: Boolean,
  showSearchToggle: Boolean,
  showSearch: Boolean,
  data: Array,
  loading: Boolean,
  rowKey: [String, Function],
  checkedRowKeys: Array,
  scrollX: Number,
  childrenKey: String,
  expandedRowKeys: Array,
  showPagination: Boolean,
  pagination: Object,
  page_size: Number,
})

defineEmits([
  'refresh',
  'column-change',
  'update:show-search',
  'page-change',
  'page-size-change',
  'update:expanded-row-keys',
  'update:checked-row-keys', // ✅ 新增：选中变化事件
])

const tableRef = ref(null)
const containerRef = ref(null)

defineExpose({ tableRef, containerRef })
</script>

<style scoped>
/* 表格卡片 - 占据剩余空间 */
.table-card {
  display: flex;
  flex-direction: column;
}

/* n-card 内容区 - 也使用 flex 布局 */
:deep(.n-card > .n-card__content) {
  display: flex;
  flex-direction: column;
  padding: 16px !important;
  margin-bottom: 0 !important;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 表格滚动容器 */
.table-body-wrapper {
  overflow-y: visible;
  overflow-x: auto;
}

.table-body-wrapper.overflow-auto {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* 自定义滚动条样式 - 与菜单滚动条一致 */
.table-body-wrapper::-webkit-scrollbar {
  width: 6px;
}

.table-body-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.table-body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.table-body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #ddd;
}

/* 调整表格行高和字体大小 */
:deep(.n-data-table) {
  font-size: 14px;
}

:deep(.n-data-table-td) {
  padding: 10px 12px !important;
}
</style>
