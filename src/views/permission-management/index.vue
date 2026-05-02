<template>
  <div class="permission-management-container">
    <n-card title="菜单权限管理" :bordered="false">
      <!-- 操作按钮区域 -->
      <div class="action-section">
        <n-space>
          <n-button type="success" @click="showAddModal(null)" v-permission="'permission:create'">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新增根节点
          </n-button>
          <n-button @click="fetchPermissionTree">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </n-space>
      </div>

      <!-- 树形表格组件 -->
      <PermissionTable
        :permission-tree-data="permissionTreeData"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </n-card>

    <!-- 新增/编辑弹窗组件 -->
    <PermissionFormModal
      v-model:visible="addEditModalVisible"
      :is-edit-mode="isEditMode"
      :permission-data="currentPermission"
      :parent-permission-options="parentPermissionOptions"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup name="PermissionManagement">
import { ref, computed, onMounted } from 'vue'
import { useMessage, NIcon, NButton, NSpace } from 'naive-ui'
import { AddOutline, RefreshOutline } from '@vicons/ionicons5'
import { getPermissionTree, createPermission, updatePermission, deletePermission } from '@/api/permission'
import PermissionTable from './components/PermissionTable.vue'
import PermissionFormModal from './components/PermissionFormModal.vue'

const message = useMessage()

// 数据状态
const permissionTreeData = ref([])
const addEditModalVisible = ref(false)
const isEditMode = ref(false)
const currentPermission = ref(null)

// 父级权限选项（用于下拉选择）
const parentPermissionOptions = computed(() => {
  const convert = (perms) => {
    return (perms || [])
      .filter(p => p.type === 'menu')
      .map(p => ({
        key: p.id, // ✅ n-tree-select 默认使用 key 作为唯一标识
        label: p.name,
        value: p.id,
        children: p.children?.length > 0 ? convert(p.children) : undefined,
      }))
  }
  return convert(permissionTreeData.value)
})

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const res = await getPermissionTree()
    // ✅ 拦截器已返回 data.data，直接使用
    permissionTreeData.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取权限树失败:', error)
    message.error(error.message || '获取权限树失败')
  }
}

// 显示新增弹窗
const showAddModal = (parent) => {
  isEditMode.value = false
  currentPermission.value = parent
  addEditModalVisible.value = true
}

// 显示编辑弹窗
const handleEdit = (perm) => {
  isEditMode.value = true
  currentPermission.value = perm
  addEditModalVisible.value = true
}

// 提交表单
const handleSubmit = async (data) => {
  try {
    const res = isEditMode.value
      ? await updatePermission(currentPermission.value.id, data)
      : await createPermission(data)
    
    message.success(res.message || (isEditMode.value ? '更新成功' : '创建成功'))
    addEditModalVisible.value = false
    fetchPermissionTree()
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

// 删除权限
const handleDelete = async (id) => {
  try {
    const res = await deletePermission(id)
    message.success(res.message || '删除成功')
    fetchPermissionTree()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

onMounted(() => fetchPermissionTree())
</script>

<style scoped>
.permission-management-container { padding: 20px; }
.action-section { margin-bottom: 20px; }
</style>
