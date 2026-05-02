<template>
  <n-modal
    :show="visible"
    @update:show="handleUpdateVisible"
    preset="card"
    title="分配角色"
    style="width: 500px"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="80"
    >
      <n-form-item label="用户" path="userId">
        <n-input :value="user?.username" disabled />
      </n-form-item>
      
      <n-form-item label="角色" path="roleIds">
        <n-select
          v-model:value="formData.roleIds"
          :options="roleOptions"
          multiple
          placeholder="请选择角色"
          filterable
        />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          分配
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
  user: {
    type: Object,
    default: null,
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  roleIds: [],
})

// 表单验证规则
const formRules = {
  roleIds: {
    type: 'array',
    required: true,
    message: '请至少选择一个角色',
    trigger: 'change',
  },
}

// 监听弹窗显示和用户数据变化
watch(
  () => [props.visible, props.user],
  ([newVisible, newUser]) => {
    if (newVisible && newUser) {
      // 如果有用户的角色信息，可以在这里填充
      formData.roleIds = newUser.role_ids || []
    }
  },
  { immediate: true }
)

// 处理弹窗显示状态更新
const handleUpdateVisible = (value) => {
  emit('update:visible', value)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    emit('submit', formData.roleIds)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
  formData.roleIds = []
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
}
</script>
