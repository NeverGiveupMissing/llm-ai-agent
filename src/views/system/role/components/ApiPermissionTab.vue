<template>
  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="apiTreeData.length > 0">
    <n-button size="small" @click="$emit('update:checkedKeys', getAllApiPaths(apiTreeData))"> 全选 </n-button>
    <n-button size="small" @click="$emit('update:checkedKeys', [])"> 取消全选 </n-button>
  </div>
          
  <!-- 接口权限列表 -->
  <div class="tree-wrapper">
    <n-spin :show="apiPermissionLoading">
      <n-tree
        v-if="apiTreeData.length > 0"
        :data="apiTreeData"
        :checked-keys="checkedKeys"
        :render-label="renderApiLabel"
        checkable
        cascade
        expand-on-click
        block-line
        show-irrelevant-nodes
        default-expand-all
        virtual-scroll
        :key-field="'api_id'"
        :label-field="'api_name'"
        :children-field="'children'"
        @update:checked-keys="$emit('update:checkedKeys', $event)"
      />
      <n-empty v-else description="暂无接口权限数据" />
    </n-spin>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { NTag } from 'naive-ui'

const props = defineProps({
  apiTreeData: {
    type: Array,
    default: () => [],
  },
  apiPermissionLoading: {
    type: Boolean,
    default: false,
  },
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

// 获取 HTTP 方法对应的标签类型
const getMethodType = (method) => {
  const typeMap = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
  }
  return typeMap[method?.toUpperCase()] || 'default'
}

// 渲染接口权限标签
const renderApiLabel = ({ option }) => {
  // 模块节点只显示名称
  if (option.isModule) {
    return h('span', { class: 'api-module-name' }, option.api_name)
  }
  
  // API节点显示：描述 + 方法标签 + 路径标签
  return h('div', { class: 'api-tree-node' }, [
    h('span', { class: 'api-name' }, option.api_name),
    // ✅ 修复：后端返回的是 api_method 字段，不是 method
    h(
      NTag,
      {
        type: getMethodType(option.api_method),
        size: 'small',
        class: 'method-tag',
      },
      { default: () => option.api_method || 'GET' }
    ),
    h(
      NTag,
      {
        type: 'info',
        size: 'small',
        class: 'path-tag',
      },
      { default: () => option.api_path }
    ),
  ])
}

// 递归获取所有接口 ID（用于全选，包括模块节点和接口节点）
const getAllApiPaths = (apis) => {
  const ids = []
  apis.forEach((item) => {
    // 收集所有节点的 api_id（包括模块节点）
    ids.push(item.api_id)
    if (item.children && item.children.length > 0) {
      ids.push(...getAllApiPaths(item.children))
    }
  })
  return ids
}
</script>

<style scoped>
.api-module-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

:deep(.api-tree-node) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

:deep(.api-tree-node .api-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.api-tree-node .method-tag) {
  font-family: monospace;
  font-weight: bold;
  flex-shrink: 0;
}

:deep(.api-tree-node .path-tag) {
  font-family: monospace;
  font-size: 11px;
  flex-shrink: 0;
}
</style>
