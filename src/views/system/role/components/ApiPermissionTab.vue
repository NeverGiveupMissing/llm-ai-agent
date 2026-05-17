<template>
  <!-- 全选/取消全选按钮 -->
  <div class="tree-actions" v-if="apiTreeData.length > 0">
    <n-button size="small" @click="$emit('update:checkedKeys', getAllApiPaths(filteredApiTreeData))"> 全选 </n-button>
    <n-button size="small" @click="$emit('update:checkedKeys', [])"> 取消全选 </n-button>
    <n-divider vertical />
    <span class="filter-label">筛选:</span>
    <n-button 
      size="small" 
      :type="methodFilter === 'ALL' ? 'primary' : 'default'"
      @click="methodFilter = 'ALL'"
    >
      全部
    </n-button>
    <n-button 
      size="small" 
      :type="methodFilter === 'GET' ? 'primary' : 'default'"
      @click="methodFilter = 'GET'"
    >
      GET
    </n-button>
    <n-button 
      size="small" 
      :type="methodFilter === 'POST' ? 'primary' : 'default'"
      @click="methodFilter = 'POST'"
    >
      POST
    </n-button>
    <n-button 
      size="small" 
      :type="methodFilter === 'PUT' ? 'primary' : 'default'"
      @click="methodFilter = 'PUT'"
    >
      PUT
    </n-button>
    <n-button 
      size="small" 
      :type="methodFilter === 'DELETE' ? 'primary' : 'default'"
      @click="methodFilter = 'DELETE'"
    >
      DELETE
    </n-button>
  </div>
          
  <!-- 接口权限列表 -->
  <div class="tree-wrapper">
    <n-tree
      v-if="filteredApiTreeData.length > 0"
      :data="filteredApiTreeData"
      :checked-keys="checkedKeys"
      :render-label="renderApiLabel"
      checkable
      cascade
      expand-on-click
      block-line
      show-irrelevant-nodes
      default-expand-all
      virtual-scroll
      :key-field="'interface_id'"
      :label-field="'interface_name'"
      :children-field="'children'"
      @update:checked-keys="$emit('update:checkedKeys', $event)"
    />
    <n-empty v-else description="暂无接口权限数据" />
  </div>
</template>

<script setup>
import { h, ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NTag } from 'naive-ui'
import { getInterfaceList } from '@/api/interface'

const props = defineProps({
  checkedKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:checkedKeys'])

const message = useMessage()
const apiTreeData = ref([])
const methodFilter = ref('ALL') // 筛选条件：ALL/GET/POST/PUT/DELETE

// 根据筛选条件过滤接口树数据
const filteredApiTreeData = computed(() => {
  if (methodFilter.value === 'ALL') {
    return apiTreeData.value
  }
  
  // 过滤子节点，只保留匹配的接口
  return apiTreeData.value
    .map(module => {
      if (!module.children) return module
      
      const filteredChildren = module.children.filter(api => {
        return (api.interface_method || 'GET').toUpperCase() === methodFilter.value
      })
      
      return {
        ...module,
        children: filteredChildren
      }
    })
    .filter(module => {
      // 保留有子节点的模块，或者是模块节点本身
      return module.isModule ? module.children?.length > 0 : true
    })
})

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
    return h('span', { class: 'api-module-name' }, option.interface_name)
  }
  
  // API节点显示：描述 + 方法标签 + 路径标签
  return h('div', { class: 'api-tree-node' }, [
    h('span', { class: 'api-name' }, option.interface_name),
    // ✅ 修复：后端返回的是 interface_method 字段，不是 method
    h(
      NTag,
      {
        type: getMethodType(option.interface_method),
        size: 'small',
        class: 'method-tag',
      },
      { default: () => option.interface_method || 'GET' }
    ),
    h(
      NTag,
      {
        type: 'info',
        size: 'small',
        class: 'path-tag',
      },
      { default: () => option.interface_url }
    ),
  ])
}

// 递归获取所有接口 ID（用于全选，只选中当前筛选显示的接口）
const getAllApiPaths = (apis) => {
  const ids = []
  apis.forEach((item) => {
    // 只收集实际接口节点的 interface_id（排除模块节点）
    if (!item.isModule && item.interface_id) {
      ids.push(item.interface_id)
    }
    if (item.children && item.children.length > 0) {
      ids.push(...getAllApiPaths(item.children))
    }
  })
  return ids
}

// 加载接口权限列表（按模块分类）
const loadApiPermissions = async () => {
  try {
    console.log('[ApiTab]  开始加载接口权限列表...')

    const res = await getInterfaceList({ page: 1, page_size: 1000 })

    console.log('[ApiTab] 📦 后端完整响应:', res)

    // ✅ 使用统一的分页响应格式：res.data.list
    const interfaceData = res.data?.list || []

    console.log('[ApiTab] 📊 接口数据数量:', interfaceData.length)
    console.log('[ApiTab] 📋 接口数据示例:', interfaceData.slice(0, 3))

    // 转换为接口权限树格式
    apiTreeData.value = transformInterfaceToTree(interfaceData)

    console.log('[ApiTab] ✅ 接口权限树数据:', apiTreeData.value)
    console.log('[ApiTab] 📊 树节点数量:', apiTreeData.value.length)
  } catch (error) {
    console.error('[ApiTab] ❌ 获取接口权限列表失败:', error)
    // ✅ 403 错误已经在响应拦截器中处理过了，不需要重复提示
    if (!error._403Handled) {
      message.error(error.message || '获取接口权限列表失败')
    }
  }
}

// 将接口数据转换为树形结构（按 interface_category 分组）
const transformInterfaceToTree = (interfaces) => {
  const modules = {}

  interfaces.forEach((item) => {
    // ✅ 统一使用下划线命名
    const category = item.interface_category || '其他'
    const interface_id = item.interface_id
    const interface_name = item.interface_name
    const interface_url = item.interface_url
    const interface_method = item.interface_method
    const status = item.status
    const remark = item.remark

    if (!modules[category]) {
      modules[category] = {
        interface_id: `category-${category}`,
        interface_name: category,
        isModule: true,
        children: [],
      }
    }

    // ✅ 添加接口节点
    modules[category].children.push({
      interface_id,
      interface_name,
      interface_url,
      interface_method,
      status,
      remark,
    })
  })

  return Object.values(modules)
}

// 清空数据
const clearData = () => {
  apiTreeData.value = []
  emit('update:checkedKeys', [])
}

// 获取提交数据（供父组件调用）
const getSubmitData = () => {
  const apiPaths = checkedKeys.value.filter(
    (key) => typeof key === 'number' || !String(key).startsWith('module-'),
  )
  console.log('[ApiTab]  提交接口数据:', apiPaths)
  return { api_paths: apiPaths }
}

// 暴露方法给父组件
defineExpose({
  loadApiPermissions,
  clearData,
  getSubmitData,
  apiTreeData,
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
