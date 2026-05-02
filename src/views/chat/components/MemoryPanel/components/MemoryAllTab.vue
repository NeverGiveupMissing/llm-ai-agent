<template>
  <div class="tab-content">
    <MemoryEmptyState
      v-if="filteredMemories.length === 0"
      :icon="BookmarkOutline"
      text="暂无记忆"
    />

    <div v-else class="memory-list">
      <div class="filter-bar">
        <n-input
          v-model:value="searchKeyword"
          placeholder="输入问题，测试记忆检索效果，如：我喜欢什么编程语言"
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
import { NIcon, NInput } from 'naive-ui'
import { BookmarkOutline, SearchOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import MemoryEmptyState from './MemoryEmptyState.vue'
import MemoryItem from './MemoryItem.vue'
import ImportanceFilter from './ImportanceFilter.vue'

const props = defineProps({
  memories: { type: Array, default: () => [] },
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
</script>