<template>
  <div class="tab-content">
    <MemoryEmptyState
      v-if="filteredMemories.length === 0 && !loading"
      :icon="BookmarkOutline"
      text="暂无记忆"
    />

    <div v-else-if="loading" class="loading-wrapper">
      <n-spin size="medium" />
    </div>

    <div v-else class="memory-list">
      <div class="filter-bar">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索记忆内容..."
          clearable
          size="small"
          style="flex: 1"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <ImportanceFilter v-model="minImportance" />

        <!-- 使用公共导出组件 -->
        <MemoryExport :memories="filteredMemories" filename-prefix="聊天记忆" />
      </div>

      <MemoryItem
        v-for="memory in filteredMemories"
        :key="memory.id"
        :memory="memory"
        :type-label="getMemoryTypeLabel(memory.memory_type)"
        :importance="memory.importance"
        :date="formatDate(memory.created_at)"
      >
        <template #actions>
          <button class="action-btn edit-btn" @click="handleEdit(memory)">
            <n-icon :size="16"><CreateOutline /></n-icon>
          </button>
          <button class="action-btn delete-btn" @click="handleDelete(memory.id)">
            <n-icon :size="16"><TrashOutline /></n-icon>
          </button>
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
import ImportanceFilter from './ImportanceFilter.vue'

const props = defineProps({
  memories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

const searchKeyword = ref('')
const minImportance = ref(4)

const filteredMemories = computed(() => {
  let result = props.memories

  // 重要性过滤
  result = result.filter((m) => {
    const importance = Number(m.importance) || 5
    return importance >= minImportance.value
  })

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (m) =>
        m.content?.toLowerCase().includes(keyword) ||
        m.tags?.some((tag) => tag.toLowerCase().includes(keyword)),
    )
  }

  return result
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

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

/* 搜索框样式优化 */
:deep(.filter-bar .n-input) {
  flex: 1;
  min-width: 0;
}

:deep(.filter-bar .n-input .n-input__input-el) {
  font-size: 13px;
}

/* 筛选器间距调整 */
:deep(.filter-bar .importance-filter) {
  padding: 0;
  border-bottom: none;
  margin-bottom: 0;
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
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  color: #1890ff;
}

.edit-btn:hover {
  background: #e6f7ff;
}

.delete-btn {
  color: #ff4d4f;
}

.delete-btn:hover {
  background: #fff1f0;
}
</style>
