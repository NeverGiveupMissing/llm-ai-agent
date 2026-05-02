<template>
  <n-modal
    :show="visible"
    @update:show="handleVisibleChange"
    preset="card"
    :title="isEditMode ? '编辑权限' : '新增权限'"
    style="width: 600px"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100"
    >
      <n-form-item label="父级权限" path="parentId">
        <n-tree-select
          v-model:value="formData.parentId"
          :options="parentPermissionOptions"
          placeholder="选择父级权限（不选则为根节点）"
          clearable
          filterable
          :multiple="false"
          :cascade="false"
          :checkable="false"
        />
      </n-form-item>

      <!-- 权限类型单选 -->
      <n-form-item label="权限类型" path="type">
        <n-radio-group v-model:value="formData.type">
          <n-radio value="menu">菜单</n-radio>
          <n-radio value="button">按钮</n-radio>
          <n-radio value="api">接口</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="权限名称" path="name">
        <n-input v-model:value="formData.name" placeholder="请输入权限名称" />
      </n-form-item>

      <n-form-item label="权限代码" path="code">
        <n-input
          v-model:value="formData.code"
          placeholder="例如：user:create"
          :disabled="isEditMode"
        />
      </n-form-item>

      <n-form-item label="路由路径" path="path" v-if="formData.type === 'menu'">
        <n-input v-model:value="formData.path" placeholder="例如：/user-management" />
      </n-form-item>

      <n-form-item label="图标" path="icon" v-if="formData.type === 'menu'">
        <n-input v-model:value="formData.icon" placeholder="例如：people" />
      </n-form-item>

      <n-form-item label="排序" path="sortOrder">
        <n-input-number
          v-model:value="formData.sortOrder"
          placeholder="数字越小越靠前"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="状态" path="status">
        <n-switch
          v-model:value="formData.status"
          :checked-value="'active'"
          :unchecked-value="'inactive'"
        >
          <template #checked>启用</template>
          <template #unchecked>禁用</template>
        </n-switch>
      </n-form-item>

      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="请输入权限描述"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
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
import { ref, reactive, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadio,
  NTreeSelect,
  NSwitch,
  NSpace,
  NButton,
} from 'naive-ui'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  permissionData: {
    type: Object,
    default: null,
  },
  parentPermissionOptions: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['update:visible', 'submit'])

// 表单引用
const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  parentId: null,
  type: 'menu',
  name: '',
  code: '',
  path: '',
  icon: '',
  sortOrder: 0,
  status: 'active',
  description: '',
})

// 表单验证规则
const formRules = {
  name: { required: true, message: '请输入权限名称', trigger: 'blur' },
  code: {
    required: true,
    trigger: 'blur',
    validator(rule, value) {
      if (!value) {
        return new Error('请输入权限代码')
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*:[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        return new Error('格式错误：模块:操作（例如：user:create）')
      }
      return true
    },
  },
}

// 监听弹窗显示状态，初始化表单
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && !props.isEditMode) {
      // 新增模式，重置表单
      resetForm()
    } else if (newVal && props.isEditMode && props.permissionData) {
      // 编辑模式，填充数据
      Object.assign(formData, {
        parentId: props.permissionData.parent_id,
        type: props.permissionData.type,
        name: props.permissionData.name,
        code: props.permissionData.code,
        path: props.permissionData.path || '',
        icon: props.permissionData.icon || '',
        sortOrder: props.permissionData.sort_order || 0,
        status: props.permissionData.status || 'active',
        description: props.permissionData.description || '',
      })
    }
  },
)

// 监听父节点变化
watch(
  () => props.permissionData,
  (newVal) => {
    if (newVal && !props.isEditMode) {
      formData.parentId = newVal.id
    }
  },
  { immediate: true },
)

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    parentId: null,
    type: 'menu',
    name: '',
    code: '',
    path: '',
    icon: '',
    sortOrder: 0,
    status: 'active',
    description: '',
  })
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
}

// 处理弹窗显示状态变化
const handleVisibleChange = (value) => {
  emit('update:visible', value)
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      parentId: formData.parentId,
      path: formData.type === 'menu' ? formData.path : null,
      icon: formData.type === 'menu' ? formData.icon : null,
      sortOrder: formData.sortOrder,
      status: formData.status,
      description: formData.description,
    }

    emit('submit', data)
  } catch (error) {
    // ✅ 验证失败时，Naive UI 会自动显示错误提示，这里只需阻止提交
    console.log('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>
