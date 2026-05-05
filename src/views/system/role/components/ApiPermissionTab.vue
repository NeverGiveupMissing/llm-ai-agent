<template>
  <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
    为角色分配接口访问权限，勾选后点击确定保存
  </n-alert>
          
  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="apiTreeData.length > 0">
    <n-button size="small" @click="handleSelectAllApis">
      全选
    </n-button>
    <n-button size="small" @click="handleUnselectAllApis">
      取消全选
    </n-button>
  </div>
          
  <!-- 接口权限列表 -->
  <div class="tree-wrapper">
    <n-spin :show="apiPermissionLoading">
      <n-tree
        v-if="apiTreeData.length > 0"
        :data="apiTreeData"
        :checked-keys="checkedApiKeys"
        :render-label="renderApiLabel"
        checkable
        cascade
        expand-on-click
        block-line
        show-irrelevant-nodes
        default-expand-all
        key-field="path"
        label-field="name"
        children-field="children"
        @update:checked-keys="handleApiCheckedChange"
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
  checkedApiKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checked-keys'])

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
    return h('span', { class: 'api-module-name' }, option.name)
  }
  
  // API节点显示：描述 + 方法标签 + 路径标签
  return h('div', { class: 'api-tree-node' }, [
    h('span', { class: 'api-name' }, option.name),
    h(
      NTag,
      {
        type: getMethodType(option.method),
        size: 'small',
        class: 'method-tag',
      },
      { default: () => option.method }
    ),
    h(
      NTag,
      {
        type: 'info',
        size: 'small',
        class: 'path-tag',
      },
      { default: () => option.path }
    ),
  ])
}

// 全选接口
const handleSelectAllApis = () => {
  const allKeys = getAllApiPaths(props.apiTreeData)
  emit('update:checked-keys', allKeys)
}

// 取消全选接口
const handleUnselectAllApis = () => {
  emit('update:checked-keys', [])
}

// 递归获取所有接口路径
const getAllApiPaths = (apis) => {
  const paths = []
  const traverse = (items) => {
    items.forEach((item) => {
      if (!item.isModule && item.path) {
        paths.push(item.path)
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(apis)
  return paths
}

// 接口权限勾选变化
const handleApiCheckedChange = (keys) => {
  emit('update:checked-keys', keys)
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
