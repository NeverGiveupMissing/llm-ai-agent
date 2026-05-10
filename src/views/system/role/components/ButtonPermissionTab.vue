<template>
  <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
    为角色分配按钮操作权限，勾选后点击确定保存
  </n-alert>

  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="buttonTreeData.length > 0">
    <n-button size="small" @click="$emit('update:checkedKeys', getAllmenu_ids(buttonTreeData))"> 全选 </n-button>
    <n-button size="small" @click="$emit('update:checkedKeys', [])"> 取消全选 </n-button>
  </div>

  <!-- 按钮树 -->
  <div class="tree-wrapper">
    <n-spin :show="buttonTreeLoading">
      <n-tree
        v-if="buttonTreeData.length > 0"
        :data="buttonTreeData"
        :checked-keys="checkedKeys"
        :render-label="renderButtonLabel"
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
      <n-empty v-else description="暂无按钮权限数据" />
    </n-spin>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { NTag } from 'naive-ui'

const props = defineProps({
  buttonTreeData: {
    type: Array,
    default: () => [],
  },
  buttonTreeLoading: {
    type: Boolean,
    default: false,
  },
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

// 渲染按钮标签
const renderButtonLabel = ({ option }) => {
  // 只有按钮类型（F）才显示权限代码
  if (option.menu_type === 'F') {
    return h('div', { class: 'button-tree-node' }, [
      h('span', { class: 'button-name' }, option.menu_name),
      h('div', { class: 'perms-wrapper' }, [
        option.perms && option.perms !== ''
          ? h(
              NTag,
              {
                type: 'info',
                size: 'small',
                class: 'perms-tag',
              },
              { default: () => option.perms },
            )
          : h(
              NTag,
              {
                type: 'default',
                size: 'small',
                class: 'perms-tag',
              },
              { default: () => '无权限代码' },
            ),
      ]),
    ])
  }

  // 非按钮类型只显示名称
  return h('span', { class: 'button-name' }, option.menu_name)
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
:deep(.button-tree-node) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

:deep(.button-tree-node .button-name) {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.button-tree-node .perms-wrapper) {
  flex-shrink: 0;
  margin-left: 0;
}

:deep(.button-tree-node .perms-tag) {
  font-family: monospace;
  font-size: 11px;
}
</style>
