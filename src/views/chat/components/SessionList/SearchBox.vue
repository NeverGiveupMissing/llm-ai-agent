<template>
  <div class="search-section">
    <n-input v-model:value="keyword" placeholder="搜索会话..." clearable size="small" round>
      <template #prefix>
        <n-icon :component="SearchOutline" />
      </template>
    </n-input>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NInput, NIcon } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const keyword = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<style scoped>
.search-section {
  padding: 8px 12px;
}

/* Naive UI 输入框覆盖 - 青蓝发光 */
:deep(.n-input) {
  background: rgba(16, 22, 42, 0.6) !important;
  border: 1px solid rgba(0, 242, 254, 0.3) !important;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.1) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.n-input:hover) {
  border-color: rgba(0, 242, 254, 0.5) !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.2) !important;
}

:deep(.n-input:focus) {
  border-color: rgba(0, 242, 254, 0.8) !important;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.3) !important;
}

:deep(.n-input .n-input__input-el) {
  color: #e0e0e0 !important;
}

:deep(.n-input .n-input__input-el::placeholder) {
  color: rgba(224, 224, 224, 0.5) !important;
}

:deep(.n-input .n-icon) {
  color: #00f2fe !important;
}

:deep(.n-input .n-input__clear) {
  color: rgba(224, 224, 224, 0.6) !important;
}

:deep(.n-input .n-input__clear:hover) {
  color: #ff4d4f !important;
}
</style>
