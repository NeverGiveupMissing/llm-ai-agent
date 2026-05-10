<template>
  <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
    为角色分配菜单访问权限，勾选后点击确定保存
  </n-alert>

  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="filteredMenuData.length > 0">
    <n-button size="small" @click="$emit('update:checkedKeys', getAllmenu_ids(filteredMenuData))">
      全选
    </n-button>
    <n-button size="small" @click="$emit('update:checkedKeys', [])"> 取消全选 </n-button>
  </div>

  <!-- 菜单树 -->
  <div class="tree-wrapper">
    <n-spin :show="menuTreeLoading">
      <n-tree
        v-if="filteredMenuData.length > 0"
        :data="filteredMenuData"
        :checked-keys="checkedKeys"
        :render-label="renderMenuLabel"
        checkable
        cascade
        expand-on-click
        block-line
        show-irrelevant-nodes
        default-expand-all
        virtual-scroll
        :key-field="'menu_id'"
        :label-field="'menu_name'"
        :children-field="'children'"
        @update:checked-keys="$emit('update:checkedKeys', $event)"
      />
      <n-empty v-else description="暂无菜单数据" />
    </n-spin>
  </div>
</template>

<script setup>
import { h, computed } from 'vue'
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
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

// ✅ 过滤掉按钮类型（F），保持原有层级结构
const filteredMenuData = computed(() => {
  const filterButtons = (menus) => {
    const filtered = []
    for (const menu of menus) {
      // 跳过按钮类型
      if (menu.menu_type === 'F') {
        continue
      }

      // 递归处理子节点
      const filteredChildren = menu.children ? filterButtons(menu.children) : []

      // 保留所有非按钮节点，不管有没有子节点
      filtered.push({
        ...menu,
        children: filteredChildren,
      })
    }
    return filtered
  }
  return filterButtons(props.menuTreeData)
})

// 渲染菜单标签
const renderMenuLabel = ({ option }) => {
  return h('div', { class: 'menu-tree-node' }, [
    h('span', { class: 'menu-name' }, option.menu_name),
    option.path && option.path !== ''
      ? h('div', { class: 'path-wrapper' }, [
          h(
            NTag,
            {
              type: 'success',
              size: 'small',
              class: 'path-tag',
            },
            { default: () => option.path },
          ),
        ])
      : null,
  ])
}

// 递归获取所有菜单ID
const getAllmenu_ids = (menus) => {
  const ids = []
  menus.forEach((menu) => {
    ids.push(menu.menu_id)
    if (menu.children && menu.children.length > 0) {
      ids.push(...getAllmenu_ids(menu.children))
    }
  })
  return ids
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
