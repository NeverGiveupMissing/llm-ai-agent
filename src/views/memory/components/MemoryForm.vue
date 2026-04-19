<template>
  <n-modal
    v-model:show="showModal"
    :title="isEdit ? '✏️ 编辑记忆' : '➕ 创建记忆'"
    preset="card"
    style="width: 600px"
    :mask-closable="false"
  >
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
      <n-form-item label="记忆内容" path="content">
        <n-input
          v-model:value="formData.content"
          type="textarea"
          placeholder="请输入记忆内容，如：用户喜欢Python编程"
          :rows="4"
          :maxlength="2000"
          show-count
        />
      </n-form-item>

      <n-alert
        v-if="duplicateWarning"
        type="warning"
        :title="`⚠️ 发现相似记忆（相似度: ${duplicateWarning.similarityPercent}%）`"
        style="margin-bottom: 16px"
      >
        <div>{{ duplicateWarning.message }}</div>
        <n-button
          text
          type="primary"
          size="small"
          style="margin-top: 8px"
          @click="handleViewDuplicate"
        >
          查看相似记忆
        </n-button>
      </n-alert>

      <n-form-item label="记忆类型" path="memoryType">
        <n-select
          v-model:value="formData.memoryType"
          :options="typeOptions"
          placeholder="选择记忆类型"
        />
      </n-form-item>

      <n-form-item label="重要性" path="importance">
        <n-slider
          v-model:value="formData.importance"
          :min="1"
          :max="10"
          :step="1"
          :marks="{ 1: '1', 5: '5', 10: '10' }"
        />
        <div style="margin-top: 8px; color: #999; font-size: 12px">
          1-3: 低重要性 | 4-6: 中等 | 7-10: 高重要性
        </div>
      </n-form-item>

      <n-form-item label="标签">
        <n-dynamic-tags v-model:value="formData.tags" />
      </n-form-item>

      <n-form-item label="跳过去重">
        <n-switch v-model:value="formData.skipDeduplication">
          <template #checked>是</template>
          <template #unchecked>否</template>
        </n-switch>
        <span style="margin-left: 8px; color: #999; font-size: 12px"> 开启后将不检查重复记忆 </span>
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showDuplicateModal"
    title="📋 相似记忆详情"
    preset="card"
    style="width: 500px"
  >
    <n-descriptions label-placement="left" bordered>
      <n-descriptions-item label="相似度">
        {{ duplicateWarning?.similarityPercent }}%
      </n-descriptions-item>
      <n-descriptions-item label="记忆内容">
        {{ duplicateWarning?.content }}
      </n-descriptions-item>
      <n-descriptions-item label="创建时间">
        {{ duplicateWarning?.createdAt }}
      </n-descriptions-item>
    </n-descriptions>
  </n-modal>
</template>

<script setup name="MemoryForm">
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { createMemory, updateMemory } from '@/api/memory'

const props = defineProps({
  userId: { type: String, required: true },
  visible: { type: Boolean, default: false },
  editData: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'success'])

const message = useMessage()

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const isEdit = computed(() => !!props.editData)
const formRef = ref(null)
const submitting = ref(false)
const duplicateWarning = ref(null)
const showDuplicateModal = ref(false)

const formData = ref({
  content: '',
  memoryType: 'fact',
  importance: 5,
  tags: [],
  skipDeduplication: false,
})

const rules = {
  content: [
    { required: true, message: '请输入记忆内容', trigger: 'blur' },
    { max: 2000, message: '内容不能超过2000字符', trigger: 'blur' },
  ],
  memoryType: [{ required: true, message: '请选择记忆类型', trigger: 'change' }],
  importance: [{ type: 'number', required: true, message: '请设置重要性', trigger: 'change' }],
}

const typeOptions = [
  { label: '📋 事实 (fact)', value: 'fact' },
  { label: '❤️ 偏好 (preference)', value: 'preference' },
  { label: '🎯 目标 (goal)', value: 'goal' },
  { label: '📅 事件 (event)', value: 'event' },
  { label: '💭 观点 (opinion)', value: 'opinion' },
]

const resetForm = () => {
  formData.value = {
    content: '',
    memoryType: 'fact',
    importance: 5,
    tags: [],
    skipDeduplication: false,
  }
  duplicateWarning.value = null
  formRef.value?.restoreValidation()
}

const handleViewDuplicate = () => {
  showDuplicateModal.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true
    duplicateWarning.value = null

    const res = isEdit.value
      ? await updateMemory(props.editData.id, formData.value)
      : await createMemory({ userId: props.userId, ...formData.value })

    if (res.success) {
      if (res.extra?.isDuplicate) {
        const similarityPercent = (res.data.similarity * 100).toFixed(2)
        duplicateWarning.value = {
          similarityPercent,
          content: res.data.similarMemory?.content,
          createdAt: res.data.similarMemory?.created_at,
          message: '已存在相似记忆，建议先查看已有记忆，避免重复创建。',
        }
        message.warning(`发现相似记忆（相似度: ${similarityPercent}%）`)
        return
      }

      message.success(isEdit.value ? '更新成功' : '创建成功')
      showModal.value = false
      emit('success')
      resetForm()
    }
  } catch (error) {
    if (error?.errors) return
    message.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.editData,
  (val) => {
    if (val) {
      formData.value = {
        content: val.content,
        memoryType: val.memoryType,
        importance: val.importance,
        tags: val.tags || [],
        skipDeduplication: false,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)
</script>
