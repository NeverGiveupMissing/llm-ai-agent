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
  </div>
</template>

<script setup>
import { h, computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { NTag } from 'naive-ui'
import { getMenuList } from '@/api/menu'

const props = defineProps({
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

const message = useMessage()
const menuTreeData = ref([])

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
  return filterButtons(menuTreeData.value)
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

/**
 * 从勾选列表中提取真正的"末端权限"
 * 规则：只保留 C(菜单) 类型，彻底剔除 M(目录) 和虚拟分组节点
 */
const getPureLeafKeys = (keys, treeData) => {
  const leafKeys = []
  const keySet = new Set(keys.map((id) => Number(id)).filter((id) => !isNaN(id)))

  console.log('[MenuTab] getPureLeafKeys 输入:', {
    checkedKeys: keys,
    keySet: Array.from(keySet),
    treeDataLength: treeData.length,
  })

  const traverse = (nodes) => {
    nodes.forEach((node) => {
      const nodeId = Number(node.menu_id)

      // 跳过虚拟分组节点（menu_id 不是数字）
      if (isNaN(nodeId)) {
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
        return
      }

      if (keySet.has(nodeId)) {
        // 只保留 C 类型的菜单节点
        if (node.menu_type === 'C') {
          console.log('[MenuTab] 添加节点:', nodeId, node.menu_name)
          leafKeys.push(nodeId)
        } else {
          console.log('[MenuTab] 跳过节点:', nodeId, '类型:', node.menu_type)
        }
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(treeData)
  console.log('[MenuTab] getPureLeafKeys 输出:', leafKeys)
  return leafKeys
}

// 加载菜单树(M目录和C菜单)
const loadMenuTree = async () => {
  try {
    const res = await getMenuList()

    console.log('[MenuTab] 📦 获取菜单列表响应:', res)

    // ✅ 菜单列表接口返回树形结构数组：res.data
    const menuData = Array.isArray(res.data) ? res.data : []

    console.log('[MenuTab] 📊 菜单数据数量:', menuData.length, '条')
    console.log('[MenuTab] 📋 菜单数据示例:', menuData.slice(0, 3))

    // 过滤出菜单类型的节点(M目录和C菜单)
    menuTreeData.value = filterMenuType(menuData, ['M', 'C'])

    console.log('[MenuTab] ✅ 菜单树加载完成,节点数:', menuTreeData.value.length)
  } catch (error) {
    console.error('[MenuTab] 获取菜单列表失败:', error)
    message.error(error.message || '获取菜单列表失败')
  }
}

// 过滤指定类型的菜单（展平为一层结构，按父级菜单名称分组）
const filterMenuType = (menus, types) => {
  const groupMap = new Map()

  // 递归收集所有按钮节点及其父级路径
  const collectButtons = (items, parentPath = []) => {
    for (const menu of items) {
      const menu_type = menu.menu_type
      const menu_name = menu.menu_name
      const menu_id = Number(menu.menu_id)

      if (types.includes(menu_type)) {
        // 是目标类型节点
        let groupKey

        if (parentPath.length > 0) {
          // 有父级路径，使用父级路径作为分组键
          groupKey = parentPath.join(' / ')
        } else if (menu_type === 'M') {
          // 顶级M目录节点，自身作为分组标题
          groupKey = menu_name
        } else {
          // 顶级C菜单节点，归入"其他"组
          groupKey = '其他'
        }

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            menu_id: `group-${groupKey}`,
            menu_name: groupKey,
            menu_type: 'M', // 虚拟目录节点
            is_group: true,
            children: [],
          })
        }

        // 只有当不是顶级M目录时，才作为子节点添加到组里
        // 顶级M目录自身就是分组标题，不需要添加到children
        if (!(parentPath.length === 0 && menu_type === 'M')) {
          groupMap.get(groupKey).children.push({
            ...menu,
            menu_id: menu_id,
          })
        }
      }

      // 递归处理子节点
      if (menu.children && menu.children.length > 0) {
        const newParentPath =
          menu_type === 'M' || menu_type === 'C' ? [...parentPath, menu_name] : parentPath
        collectButtons(menu.children, newParentPath)
      }
    }
  }

  collectButtons(menus)

  return Array.from(groupMap.values())
}

// 递归查找菜单 ID 是否匹配
const matchMenuId = (menu, targetId) => {
  // ✅ 严格使用下划线命名
  const menu_id = Number(menu.menu_id)
  if (menu_id === targetId) return true
  if (menu.children && menu.children.length > 0) {
    return menu.children.some((child) => matchMenuId(child, targetId))
  }
  return false
}

// 清空数据
const clearData = () => {
  menuTreeData.value = []
  emit('update:checkedKeys', [])
}

// 获取提交数据（供父组件调用）
const getSubmitData = () => {
  console.log('[MenuTab] ========== 提交数据开始 ==========')
  console.log('[MenuTab] props.checkedKeys:', props.checkedKeys)
  console.log('[MenuTab] menuTreeData 节点数:', menuTreeData.value.length)
  
  const pureMenuIds = getPureLeafKeys(props.checkedKeys, menuTreeData.value)
  
  console.log('[MenuTab] 最终提交 menu_ids:', pureMenuIds)
  console.log('[MenuTab] ========== 提交数据结束 ==========')
  return { menu_ids: pureMenuIds }
}

// 暴露方法给父组件
defineExpose({
  loadMenuTree,
  clearData,
  getPureLeafKeys,
  getSubmitData,
  menuTreeData,
})
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
