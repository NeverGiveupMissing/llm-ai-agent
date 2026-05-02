<template>
  <n-data-table
    :columns="columns"
    :data="permissionTreeData"
    :loading="loading"
    :row-key="(row) => row.id"
    :default-expand-all="true"
  />
</template>

<script setup>
import { h } from 'vue'
import { NTag, NButton, NSpace, NPopconfirm } from 'naive-ui'
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// Props
const props = defineProps({
  permissionTreeData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['edit', 'delete'])

// 表格列定义
const columns = [
  { title: '权限名称', key: 'name', width: 200 },
  { 
    title: '编码', 
    key: 'code', 
    width: 180,
    render: (row) => h(NTag, { type: 'info', size: 'small' }, { default: () => row.code })
  },
  { 
    title: '类型', 
    key: 'type', 
    width: 100,
    render: (row) => {
      const map = { menu: ['菜单', 'success'], button: ['按钮', 'warning'], api: ['接口', 'error'] }
      const [text, type] = map[row.type] || [row.type, 'default']
      return h(NTag, { type }, { default: () => text })
    }
  },
  { title: '路径', key: 'path', width: 180, render: (row) => row.path || '-' },
  { title: '排序', key: 'sort_order', width: 80 },
  { 
    title: '状态', 
    key: 'status', 
    width: 100,
    render: (row) => h(NTag, { type: row.status === 'active' ? 'success' : 'default' }, { default: () => row.status === 'active' ? '启用' : '禁用' })
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => {
      const buttons = []
      
      // 编辑按钮
      if (permissionStore.hasPermission('permission:update')) {
        buttons.push(h(NButton, { size: 'small', onClick: () => emit('edit', row) }, { default: () => '编辑' }))
      }
      
      // 删除按钮 - 有子节点不允许删除
      if (permissionStore.hasPermission('permission:delete')) {
        const hasChildren = row.children && row.children.length > 0
        buttons.push(
          h(NPopconfirm, {
            onPositiveClick: () => emit('delete', row.id),
            disabled: hasChildren,
          }, {
            default: () => hasChildren ? '有子节点，不能删除' : '确定要删除吗？',
            trigger: () => h(NButton, { size: 'small', type: 'error', disabled: hasChildren }, { default: () => '删除' }),
          })
        )
      }
      
      return h(NSpace, {}, { default: () => buttons })
    },
  },
]
</script>
