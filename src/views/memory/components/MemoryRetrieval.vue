<template>
  <div class="retrieval-container">
    <div class="search-section">
      <n-input
        v-model:value="queryText"
        placeholder="输入问题，测试记忆检索效果，如：我喜欢什么编程语言"
        size="large"
        round
        clearable
        @keyup.enter="handleRetrieve"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
      <n-button
        type="primary"
        size="large"
        :loading="retrieving"
        @click="handleRetrieve"
        style="margin-top: 12px"
      >
        开始检索
      </n-button>
    </div>

    <div v-if="retrievedMemories.length > 0" class="results-section">
      <div class="results-header">
        <h3>检索结果</h3>
        <span class="results-count">找到 {{ retrievedMemories.length }} 条相关记忆</span>
      </div>

      <div class="results-list">
        <div v-for="item in retrievedMemories" :key="item.id" class="result-item">
          <div class="result-header">
            <n-tag :type="getTypeTag(item.memory_type)" size="small">
              {{ getTypeLabel(item.memory_type) }}
            </n-tag>
            <n-tag v-if="item.similarity" type="success" size="small">
              相似度: {{ (item.similarity * 100).toFixed(1) }}%
            </n-tag>
            <n-tag type="warning" size="small">重要性: {{ item.importance }}/10</n-tag>
          </div>
          <div class="result-content">{{ item.content }}</div>
          <div v-if="item.tags?.length" class="result-tags">
            <n-tag v-for="tag in item.tags" :key="tag" size="tiny" type="info">
              {{ tag }}
            </n-tag>
          </div>
        </div>
      </div>
    </div>

    <n-empty
      v-else-if="queryText && !retrieving"
      description="暂无相关记忆"
      style="padding: 60px 0"
    >
      <template #icon>
        <n-icon><SearchOutline /></n-icon>
      </template>
    </n-empty>
  </div>
</template>

<script setup name="MemoryRetrieval">
import { ref } from 'vue'
import { useMessage, NTag, NIcon, NEmpty } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { retrieveMemories } from '@/api/memory'

const props = defineProps({
  user_id: { type: String, required: true },
})

const message = useMessage()

const queryText = ref('')
const retrieving = ref(false)
const retrievedMemories = ref([])

const typeMap = {
  fact: { label: '事实', type: 'info' },
  preference: { label: '偏好', type: 'error' },
  goal: { label: '目标', type: 'success' },
  event: { label: '经历', type: 'warning' },
  opinion: { label: '观点', type: 'default' },
}

const getTypeLabel = (type) => typeMap[type]?.label || type
const getTypeTag = (type) => typeMap[type]?.type || 'default'

const handleRetrieve = async () => {
  if (!queryText.value.trim()) {
    message.warning('请输入检索内容')
    return
  }

  retrieving.value = true
  try {
    const res = await retrieveMemories({
      user_id: props.user_id,
      query: queryText.value,
      limit: 5,
    })

    if (res) {
      retrievedMemories.value = res.data || []
      if (retrievedMemories.value.length === 0) {
        message.info(res.message || '未找到相关记忆')
      }
    }
  } catch (error) {
    message.error(error.message || '检索失败')
  } finally {
    retrieving.value = false
  }
}
</script>

<style scoped>
.retrieval-container {
  min-height: 400px;
}

.search-section {
  margin-bottom: 24px;
}

.results-section {
  margin-top: 24px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.results-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.results-count {
  font-size: 13px;
  color: #6e6e80;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #d0d0d0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.result-content {
  font-size: 14px;
  line-height: 1.6;
  color: #0d0d0d;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.result-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
