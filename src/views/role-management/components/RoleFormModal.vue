<template>
  <n-modal
    :show="visible"
    @update:show="handleUpdateVisible"
    preset="card"
    :title="isEditMode ? '编辑角色' : '新增角色'"
    style="width: 500px"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100"
    >
      <n-form-item label="角色标识" path="name">
        <n-input 
          v-model:value="formData.name" 
          placeholder="请输入角色标识（英文）" 
          :disabled="isEditMode"
        />
      </n-form-item>
      
      <n-form-item label="显示名称" path="displayName">
        <n-input v-model:value="formData.displayName" placeholder="请输入显示名称" />
      </n-form-item>
      
      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="请输入角色描述"
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </n-form-item>
      
      <n-form-item label="系统角色" path="isSystem">
        <n-switch v-model:value="formData.isSystem">
          <template #checked>是</template>
          <template #unchecked>否</template>
        </n-switch>
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditMode ? '更新' : '创建' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  roleData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  displayName: '',
  description: '',
  isSystem: false,
})

// 表单验证规则
const formRules = {
  name: {
    required: true,
    message: '请输入角色标识',
    trigger: 'blur',
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    message: '角色标识必须以字母开头，只能包含字母、数字、下划线和横线',
  },
  displayName: {
    required: true,
    message: '请输入显示名称',
    trigger: 'blur',
  },
}

// 处理弹窗显示状态更新
const handleUpdateVisible = (value) => {
  emit('update:visible', value)
}

// 监听弹窗显示状态和数据变化
watch(
  () => [props.visible, props.roleData],
  ([newVisible, newRoleData]) => {
    if (newVisible) {
      if (props.isEditMode && newRoleData) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          name: newRoleData.name,
          displayName: newRoleData.display_name,
          description: newRoleData.description || '',
          isSystem: newRoleData.is_system,
        })
      } else {
        // 新增模式，重置表单
        resetForm()
      }
    }
  },
  { immediate: true }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    emit('submit', { ...formData })
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    displayName: '',
    description: '',
    isSystem: false,
  })
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
}
</script>
