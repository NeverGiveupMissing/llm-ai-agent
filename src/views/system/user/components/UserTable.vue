<template>
  <n-data-table
    :columns="columns"
    :data="userList"
    :pagination="pagination"
    :row-key="(row) => row.id"
    @update:page="handlePageChange"
    @update:page-size="handlePageSizeChange"
  />
</template>

<script setup>
import { h } from 'vue'
import { NTag, NButton, NSpace, NPopconfirm } from 'naive-ui'
import { usePermissionStore } from '@/stores/modules/permission'

const props = defineProps({
  userList: {
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
  'update:pageSize',
  'edit',
  'assign-role',
  'reset-password',
  'delete',
])

const permissionStore = usePermissionStore()

// 状态映射
const statusMap = {
  active: { label: '正常', type: 'success' },
  inactive: { label: '禁用', type: 'error' },
}

// 表格列定义
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
  },
  {
    title: '昵称',
    key: 'nickname',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    title: '邮箱',
    key: 'email',
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row) {
      const statusInfo = statusMap[row.status] || { label: row.status, type: 'default' }
      return h(NTag, { type: statusInfo.type }, { default: () => statusInfo.label })
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
      if (permissionStore.hasPermission('user:update')) {
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

      // 分配角色按钮
      if (permissionStore.hasPermission('user:assign-role')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => emit('assign-role', row),
            },
            { default: () => '分配角色' },
          ),
        )
      }

      // 重置密码按钮
      if (permissionStore.hasPermission('user:reset-password')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'warning',
              onClick: () => emit('reset-password', row),
            },
            { default: () => '重置密码' },
          ),
        )
      }

      // 删除按钮
      if (permissionStore.hasPermission('user:delete')) {
        buttons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => emit('delete', row.id),
            },
            {
              default: () => '确定要删除此用户吗？',
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

const handlePageSizeChange = (pageSize) => {
  emit('update:pageSize', pageSize)
}
</script>
