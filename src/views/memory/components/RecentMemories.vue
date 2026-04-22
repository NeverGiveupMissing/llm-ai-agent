<template>
  <div class="recent-memories">
    <div class="section-header">
      <h3 class="section-title">最近记忆</h3>
      <n-button text size="tiny" @click="$emit('view-all')">
        查看全部
        <template #icon>
          <n-icon><ChevronForwardOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <div class="section-content">
      <n-spin :show="loading">
        <n-empty v-if="memories.length === 0 && !loading" description="暂无记忆">
          <template #icon>
            <n-icon><BookmarkOutline /></n-icon>
          </template>
        </n-empty>

        <div v-else class="recent-list">
          <div v-for="memory in memories" :key="memory.id" class="recent-item">
            <div class="recent-content">
              <p>{{ memory.content }}</p>
            </div>
            <div class="recent-meta">
              <n-tag size="small" :type="getMemoryTypeColor(memory.memory_type)">
                {{ getMemoryTypeLabel(memory.memory_type) }}
              </n-tag>
              <span class="memory-time">{{ formatRelativeTime(memory.created_at) }}</span>
              <n-tag v-if="memory.source === 'auto_extract'" size="small" type="info">
                自动提取
              </n-tag>
            </div>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup name="RecentMemories">
import { ref, onMounted } from 'vue'
import { NTag, NButton, NIcon, NSpin, NEmpty } from 'naive-ui'
import { ChevronForwardOutline, BookmarkOutline } from '@vicons/ionicons5'
import { getMemoryList } from '@/api/memory'

const props = defineProps({
  userId: { type: String, required: true },
})

const emit = defineEmits(['view-all'])

const memories = ref([])
const loading = ref(false)

const fetchMemories = async () => {
  loading.value = true
  try {
    const res = await getMemoryList({
      userId: props.userId,
      limit: 5,
    })

    if (res.success && res.data) {
      memories.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取最近记忆失败:', error)
  } finally {
    loading.value = false
  }
}

const getMemoryTypeLabel = (type) => {
  const labels = {
    fact: '事实',
    preference: '偏好',
    goal: '目标',
    event: '经历',
    opinion: '观点',
  }
  return labels[type] || type
}

const getMemoryTypeColor = (type) => {
  const colors = {
    fact: 'info',
    preference: 'error',
    goal: 'success',
    event: 'warning',
    opinion: 'default',
  }
  return colors[type] || 'default'
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchMemories()
})

defineExpose({
  refresh: fetchMemories,
})
</script>

<style scoped>
.recent-memories {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.section-content {
  min-height: 120px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.recent-item:hover {
  border-color: #e5e5e5;
  background: #fafafa;
}

.recent-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  line-height: 1.5;
  color: #0d0d0d;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.memory-time {
  font-size: 12px;
  color: #999;
}
</style>
