<template>
  <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
    为角色分配按钮操作权限，勾选后点击确定保存
  </n-alert>

  <!-- 全选/取消全选按钮 + 筛选 -->
  <div class="tree-actions" v-if="buttonTreeData.length > 0">
    <n-button size="small" @click="$emit('update:checkedKeys', getAllButtonIds(filteredButtonTreeData))"> 全选 </n-button>
    <n-button size="small" @click="$emit('update:checkedKeys', [])"> 取消全选 </n-button>
    <n-divider vertical />
    <n-checkbox v-model:checked="enableFilter" size="small">筛选</n-checkbox>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(!enableFilter || locationFilter === 'ALL') ? 'primary' : 'default'"
      @click="locationFilter = 'ALL'"
    >
      全部
    </n-button>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(enableFilter && locationFilter === '0') ? 'primary' : 'default'"
      @click="enableFilter = true; locationFilter = '0'"
    >
      工具栏
    </n-button>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(enableFilter && locationFilter === '1') ? 'primary' : 'default'"
      @click="enableFilter = true; locationFilter = '1'"
    >
      行内
    </n-button>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(enableFilter && locationFilter === '2') ? 'primary' : 'default'"
      @click="enableFilter = true; locationFilter = '2'"
    >
      搜索
    </n-button>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(enableFilter && locationFilter === '3') ? 'primary' : 'default'"
      @click="enableFilter = true; locationFilter = '3'"
    >
      隐藏
    </n-button>
    <n-button 
      size="small" 
      :disabled="!enableFilter"
      :type="(enableFilter && locationFilter === 'OTHER') ? 'primary' : 'default'"
      @click="enableFilter = true; locationFilter = 'OTHER'"
    >
      其他
    </n-button>
  </div>

  <!-- 按钮树 -->
  <div class="tree-wrapper">
    <n-tree
      v-if="filteredButtonTreeData.length > 0"
      :data="filteredButtonTreeData"
      :checked-keys="checkedKeys"
      :render-label="renderButtonLabel"
      checkable
      :check-strategy="'child'"
      expand-on-click
      block-line
      show-irrelevant-nodes
      default-expand-all
      virtual-scroll
      :key-field="'button_id'"
      :label-field="'button_name'"
      :children-field="'children'"
      @update:checked-keys="$emit('update:checkedKeys', $event)"
    />
    <n-empty v-else description="暂无按钮权限数据" />
  </div>
</template>

<script setup>
import { h, ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NTag } from 'naive-ui'
import { getButtonList } from '@/api/button'

const props = defineProps({
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

const message = useMessage()
const buttonTreeData = ref([])
const locationFilter = ref('ALL') // 筛选条件：ALL/0(工具栏)/1(行内)/2(搜索)/3(隐藏)/OTHER(其他)
const enableFilter = ref(false) // 是否启用筛选功能

// 获取展现位置对应的标签类型
const getLocationType = (location) => {
  const typeMap = {
    '0': 'info',     // 工具栏
    '1': 'success',  // 行内
    '2': 'warning',  // 搜索
    '3': 'error',    // 隐藏
  }
  return typeMap[location] || 'default'
}

// 获取展现位置对应的文字
const getLocationText = (location) => {
  const textMap = {
    '0': '工具栏',
    '1': '行内',
    '2': '搜索',
    '3': '隐藏',
  }
  return textMap[location] || '其他'
}

// 根据筛选条件过滤按钮树数据
const filteredButtonTreeData = computed(() => {
  // 如果未启用筛选，显示全部数据
  if (!enableFilter.value || locationFilter.value === 'ALL') {
    return buttonTreeData.value
  }
  
  // 过滤子节点，只保留匹配的按钮
  return buttonTreeData.value
    .map(group => {
      if (!group.children) return group
      
      const filteredChildren = group.children.filter(btn => {
        const btnLocation = String(btn.show_location || '')
        if (locationFilter.value === 'OTHER') {
          // 其他：不在 0/1/2/3 范围内的
          return !['0', '1', '2', '3'].includes(btnLocation)
        }
        // ✅ 支持多选：检查筛选值是否在 show_location 中（逗号分隔）
        return btnLocation.includes(locationFilter.value)
      })
      
      return {
        ...group,
        children: filteredChildren
      }
    })
    .filter(group => {
      // 保留有子节点的分组
      return group.is_group ? group.children?.length > 0 : true
    })
})

// 渲染按钮标签
const renderButtonLabel = ({ option }) => {
  // 分组节点只显示名称
  if (option.is_group) {
    return h('span', { class: 'button-group-name' }, option.button_name || option.menu_name)
  }
  
  // 解析多选的位置值（逗号分隔）
  const locations = String(option.show_location || '').split(',').filter(Boolean)
  
  // 按钮节点显示：名称 + 权限代码标签 + 展现位置标签（支持多个）
  return h('div', { class: 'button-tree-node' }, [
    h('span', { class: 'button-name' }, option.button_name || option.menu_name),
    h('div', { class: 'tags-wrapper' }, [
      // 权限代码标签
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
      // ✅ 展现位置标签（支持多选，渲染多个标签）
      locations.map(location => 
        h(
          NTag,
          {
            type: getLocationType(location),
            size: 'small',
            class: 'location-tag',
          },
          { default: () => getLocationText(location) }
        )
      ),
    ]),
  ])
}

// 递归获取所有按钮ID
const getAllButtonIds = (groups) => {
  const ids = []
  groups.forEach((group) => {
    if (group.children && group.children.length > 0) {
      group.children.forEach((btn) => {
        ids.push(btn.button_id)
      })
    }
  })
  return ids
}

const getPureLeafKeys = (keys, treeData) => {
  const leafKeys = []
  const keySet = new Set(keys.map((id) => Number(id)))

  const traverse = (nodes) => {
    nodes.forEach((node) => {
      // 跳过分组节点
      if (node.is_group) {
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
        return
      }

      const nodeId = Number(node.button_id)
      if (keySet.has(nodeId)) {
        leafKeys.push(nodeId)
      }
    })
  }

  traverse(treeData)
  return leafKeys
}

// 加载按钮权限树
const loadButtonTree = async () => {
  try {
    console.log('[ButtonTab] 🔄 开始加载按钮权限列表...')

    // ✅ 调用按钮列表接口（不分页，获取全量数据）
    const res = await getButtonList({ page: 1, page_size: 10000 })

    console.log('[ButtonTab] 📦 后端完整响应:', res)

    // ✅ 使用统一的分页响应格式：res.data.list
    const buttonData = res.data?.list || []

    console.log('[ButtonTab] 📊 按钮数据数量:', buttonData.length)
    console.log('[ButtonTab] 📋 按钮数据示例:', buttonData.slice(0, 3))

    // 转换为按钮树形结构（按菜单分组）
    buttonTreeData.value = transformButtonToTree(buttonData)

    console.log('[ButtonTab] ✅ 按钮树加载完成，节点数:', buttonTreeData.value.length)
  } catch (error) {
    console.error('[ButtonTab] 获取按钮权限列表失败:', error)
    message.error(error.message || '获取按钮权限列表失败')
  }
}

// 将按钮数据转换为树形结构（按 parent_menu_name 分组）
const transformButtonToTree = (buttons) => {
  const groupMap = new Map()

  buttons.forEach((item) => {
    // ✅ 使用 parent_menu_name 作为分组键
    const groupName = item.parent_menu_name || '其他'
    const button_id = Number(item.button_id)
    const button_name = item.button_name
    const parent_id = Number(item.parent_id)
    const perms = item.perms
    const status = item.status
    const remark = item.remark

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        button_id: `group-${groupName}`,
        button_name: groupName,
        is_group: true,
        children: [],
      })
    }

    // 添加按钮节点
    groupMap.get(groupName).children.push({
      button_id,
      button_name,
      parent_id,
      perms,
      status,
      remark,
      show_location: item.show_location, // ✅ 添加展现位置字段
    })
  })

  return Array.from(groupMap.values())
}

// 清空数据
const clearData = () => {
  buttonTreeData.value = []
  emit('update:checkedKeys', [])
}

// 获取提交数据（供父组件调用）
const getSubmitData = () => {
  const pureButtonIds = getPureLeafKeys(props.checkedKeys, buttonTreeData.value)
  console.log('[ButtonTab] 📦 提交按钮数据:', pureButtonIds)
  return { button_ids: pureButtonIds }
}

// 暴露方法给父组件
defineExpose({
  loadButtonTree,
  clearData,
  getPureLeafKeys,
  getSubmitData,
  buttonTreeData,
})
</script>

<style scoped>
.tree-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #666;
  margin-right: 4px;
}

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

:deep(.button-tree-node .tags-wrapper) {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

:deep(.button-tree-node .perms-tag) {
  font-family: monospace;
  font-size: 11px;
}

:deep(.button-tree-node .location-tag) {
  font-size: 11px;
}
</style>
