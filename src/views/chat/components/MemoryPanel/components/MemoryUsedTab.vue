<template>
  <div class="tab-content">
    <MemoryEmptyState
      v-if="memories.length === 0"
      :icon="EyeOffOutline"
      text="本次对话未使用历史记忆"
    />

    <div v-else class="memory-list">
      <MemoryItem
        v-for="memory in memories"
        :key="memory.id"
        :memory="memory"
        :type-label="getMemoryTypeLabel(memory.memory_type)"
        :similarity="parseFloat((memory.similarity * 100).toFixed(0))"
      />
    </div>
  </div>
</template>

<script setup name="MemoryUsedTab">
import { EyeOffOutline } from '@vicons/ionicons5'
import MemoryEmptyState from './MemoryEmptyState.vue'
import MemoryItem from './MemoryItem.vue'

const props = defineProps({
  memories: { type: Array, default: () => [] },
})

const getMemoryTypeLabel = (type) => {
  const labels = {
    fact: 'Fact',
    preference: 'Preference',
    goal: 'Goal',
    event: 'Event',
    opinion: 'Opinion',
  }
  return labels[type] || type
}
</script>

<style scoped>
.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
