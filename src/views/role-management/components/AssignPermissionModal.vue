<template>
  <n-modal
    :show="visible"
    @update:show="handleUpdateVisible"
    preset="card"
    title="分配权限"
    style="width: 700px"
    :mask-closable="false"
  >
    <div class="permission-tree-container">
      <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
        当前角色：<strong>{{ role?.display_name || role?.name }}</strong>
      </n-alert>
      
      <!-- NTree 组件，支持半选状态 -->
      <n-tree
        :data="permissionTreeData"
        :checked-keys="checkedKeys"
        checkable
        cascade
        expand-on-click
        block-line
        show-irrelevant-nodes
        @update:checked-keys="handleCheckedKeysChange"
      />
    </div>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSave" :loading="saving">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object,
    default: null,
  },
  permissionTreeData: {
    type: Array,
    default: () => [],
  },
  checkedPermissionKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'save'])

const checkedKeys = ref([])
const saving = ref(false)

// 处理弹窗显示状态更新
const handleUpdateVisible = (value) => {
  emit('update:visible', value)
}

// 监听弹窗显示和权限数据变化
watch(
  () => [props.visible, props.checkedPermissionKeys],
  ([newVisible, newKeys]) => {
    if (newVisible) {
      checkedKeys.value = [...newKeys]
    }
  },
  { immediate: true }
)

// 处理权限勾选变化
const handleCheckedKeysChange = (keys) => {
  checkedKeys.value = keys
}

// 保存权限分配
const handleSave = async () => {
  try {
    saving.value = true
    emit('save', checkedKeys.value)
  } catch (error) {
    console.error('保存权限失败:', error)
  } finally {
    saving.value = false
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.permission-tree-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
</style>
