<template>
  <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
    为角色分配菜单访问权限，勾选后点击确定保存
  </n-alert>
  
  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="menuTreeData.length > 0">
    <n-button size="small" @click="handleSelectAllMenus">
      全选
    </n-button>
    <n-button size="small" @click="handleUnselectAllMenus">
      取消全选
    </n-button>
  </div>
  
  <!-- 菜单树 -->
  <div class="tree-wrapper">
    <n-spin :show="menuTreeLoading">
      <n-tree
        v-if="menuTreeData.length > 0"
        :data="menuTreeData"
        :checked-keys="checkedMenuKeys"
        :render-label="renderMenuLabel"
        checkable
        cascade
        expand-on-click
        block-line
        show-irrelevant-nodes
        default-expand-all
        key-field="menuId"
        label-field="menuName"
        children-field="children"
        @update:checked-keys="handleMenuCheckedChange"
      />
      <n-empty v-else description="暂无菜单数据" />
    </n-spin>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { NTag } from 'naive-ui'

const props = defineProps({
  menuTreeData: {
    type: Array,
    default: () => [],
  },
  menuTreeLoading: {
    type: Boolean,
    default: false,
  },
  checkedMenuKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checked-keys'])

// 渲染菜单标签
const renderMenuLabel = ({ option }) => {
  return h('div', { class: 'menu-tree-node' }, [
    h('span', { class: 'menu-name' }, option.menuName),
    option.path && option.path !== ''
      ? h(
          'div',
          { class: 'path-wrapper' },
          [
            h(
              NTag,
              {
                type: 'success',
                size: 'small',
                class: 'path-tag',
              },
              { default: () => option.path }
            ),
          ]
        )
      : null,
  ])
}

// 全选菜单
const handleSelectAllMenus = () => {
  const allKeys = getAllMenuIds(props.menuTreeData)
  emit('update:checked-keys', allKeys)
}

// 取消全选菜单
const handleUnselectAllMenus = () => {
  emit('update:checked-keys', [])
}

// 递归获取所有菜单ID
const getAllMenuIds = (menus) => {
  const ids = []
  menus.forEach((menu) => {
    ids.push(menu.menuId)
    if (menu.children && menu.children.length > 0) {
      ids.push(...getAllMenuIds(menu.children))
    }
  })
  return ids
}

// 菜单权限勾选变化
const handleMenuCheckedChange = (keys) => {
  emit('update:checked-keys', keys)
}
</script>

<style scoped>
:deep(.menu-tree-node) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

:deep(.menu-tree-node .menu-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.menu-tree-node .path-wrapper) {
  flex-shrink: 0;
}

:deep(.menu-tree-node .path-tag) {
  font-family: monospace;
  font-size: 11px;
}
</style>
