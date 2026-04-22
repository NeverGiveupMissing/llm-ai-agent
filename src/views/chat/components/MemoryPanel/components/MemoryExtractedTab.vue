<template>
  <div class="tab-content">
    <MemoryEmptyState
      v-if="memories.length === 0"
      :icon="DocumentTextOutline"
      text="本次对话未提取新记忆"
    />

    <div v-else class="memory-list">
      <div class="extracted-summary">
        <n-alert type="success" :show-icon="false" size="small">
          已自动过滤低重要性记忆，共提取 {{ memories.length }} 条有价值记忆
        </n-alert>
      </div>

      <MemoryItem
        v-for="(memory, index) in memories"
        :key="index"
        :memory="memory"
        :type-label="getMemoryTypeLabel(memory.memory_type || memory.memoryType)"
        :importance="memory.importance"
        :confirmed="memory.confirmed"
      >
        <template #actions>
          <button v-if="!memory.confirmed" class="confirm-btn" @click="handleConfirm(index)">
            <n-icon :size="16"><CheckmarkOutline /></n-icon>
            确认
          </button>
        </template>
      </MemoryItem>
    </div>
  </div>
</template>

<script setup name="MemoryExtractedTab">
import { NIcon, NAlert } from 'naive-ui'
import { DocumentTextOutline, CheckmarkOutline } from '@vicons/ionicons5'
import MemoryEmptyState from './MemoryEmptyState.vue'
import MemoryItem from './MemoryItem.vue'

const props = defineProps({
  memories: { type: Array, default: () => [] },
})

const emit = defineEmits(['confirm'])

const getMemoryTypeLabel = (type) => {
  const labels = {
    fact: 'Fact',
    preference: 'Preference',
    goal: 'Goal',
    event: 'Event',
    opinion: 'Opinion',
  }
  return labels[type] || type || 'Unknown'
}

const handleConfirm = (index) => {
  emit('confirm', index)
}
</script>

<style scoped>
.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.extracted-summary {
  margin-bottom: 16px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #10a37f;
  background: #10a37f;
  color: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.confirm-btn:hover {
  background: #0d8f6f;
  border-color: #0d8f6f;
}
</style>
