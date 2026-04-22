<template>
  <div class="tab-content">
    <div class="search-box">
      <n-input v-model:value="searchKeyword" placeholder="搜索记忆..." size="small" round clearable>
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
    </div>

    <div v-if="loading" class="loading-state">
      <n-spin :size="24" />
    </div>

    <MemoryEmptyState
      v-else-if="filteredMemories.length === 0"
      :icon="BookmarkOutline"
      text="暂无记忆"
    />

    <div v-else class="memory-list">
      <MemoryItem
        v-for="memory in filteredMemories"
        :key="memory.id"
        :memory="memory"
        :type-label="getMemoryTypeLabel(memory.memory_type)"
        :date="formatDate(memory.created_at)"
      >
        <template #actions>
          <div class="memory-actions">
            <button class="action-btn" @click="handleEdit(memory)" title="编辑">
              <n-icon :size="16"><CreateOutline /></n-icon>
            </button>
            <button class="action-btn delete" @click="handleDelete(memory.id)" title="Delete">
              <n-icon :size="16"><TrashOutline /></n-icon>
            </button>
          </div>
        </template>
      </MemoryItem>
    </div>
  </div>
</template>

<script setup name="MemoryAllTab">
import { ref, computed } from 'vue'
import { NIcon, NInput, NSpin } from 'naive-ui'
import { BookmarkOutline, SearchOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import MemoryEmptyState from './MemoryEmptyState.vue'
import MemoryItem from './MemoryItem.vue'

const props = defineProps({
  memories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

const searchKeyword = ref('')

const filteredMemories = computed(() => {
  if (!searchKeyword.value) return props.memories
  const keyword = searchKeyword.value.toLowerCase()
  return props.memories.filter(
    (m) =>
      m.content.toLowerCase().includes(keyword) ||
      m.tags?.some((tag) => tag.toLowerCase().includes(keyword)),
  )
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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const handleEdit = (memory) => {
  emit('edit', memory)
}

const handleDelete = (memoryId) => {
  emit('delete', memoryId)
}
</script>

<style scoped>
.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.search-box {
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #6e6e80;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #0d0d0d;
}

.action-btn.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

:deep(.n-input) {
  background: #f5f5f5;
  border: 1px solid transparent;
}

:deep(.n-input:hover) {
  background: #f0f0f0;
}

:deep(.n-input--focus) {
  background: #ffffff;
  border-color: #10a37f;
}
</style>
