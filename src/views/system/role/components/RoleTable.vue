<template>
  <n-data-table
    :columns="columns"
    :data="roleList"
    :pagination="pagination"
    :row-key="(row) => row.id"
    @update:page="handlePageChange"
    @update:page-size="handlepage_sizeChange"
  />
</template>

<script setup>
import { h } from 'vue'
import { NTag, NButton, NSpace, NPopconfirm } from 'naive-ui'
import { usePermissionStore } from '@/stores/modules/permission'

const props = defineProps({
  roleList: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'update:page',
  'update:page_size',
  'edit',
  'assign-permissions',
  'toggle-status',
  'delete',
])

const permissionStore = usePermissionStore()

// 表格列定义
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    title: '角色名',
    key: 'display_name',
    width: 150,
  },
  {
    title: '角色编码',
    key: 'name',
    width: 150,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'is_system',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.is_system ? 'warning' : 'success' },
        { default: () => (row.is_system ? '系统' : '正常') },
      )
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render(row) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render(row) {
      const buttons = []

      // 编辑按钮
      if (permissionStore.hasPermission('role:update')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => emit('edit', row),
            },
            { default: () => '编辑' },
          ),
        )
      }

      // 分配权限按钮
      if (permissionStore.hasPermission('role:assign-permission')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => emit('assign-permissions', row),
            },
            { default: () => '分配权限' },
          ),
        )
      }

      // 启用/禁用按钮
      if (permissionStore.hasPermission('role:update') && !row.is_system) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              type: row.status === 'active' ? 'warning' : 'success',
              onClick: () => emit('toggle-status', row),
            },
            { default: () => (row.status === 'active' ? '禁用' : '启用') },
          ),
        )
      }

      // 删除按钮
      if (permissionStore.hasPermission('role:delete') && !row.is_system) {
        buttons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => emit('delete', row.id),
            },
            {
              default: () => '确定要删除此角色吗？',
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                  },
                  { default: () => '删除' },
                ),
            },
          ),
        )
      }

      return h(NSpace, {}, { default: () => buttons })
    },
  },
]

// 分页变化处理
const handlePageChange = (page) => {
  emit('update:page', page)
}

const handlepage_sizeChange = (page_size) => {
  emit('update:page_size', page_size)
}
</script>
