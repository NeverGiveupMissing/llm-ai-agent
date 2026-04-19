<template>
  <n-card title="🔍 记忆检索测试" :bordered="false" size="small">
    <n-input-group>
      <n-input
        v-model:value="queryText"
        placeholder="输入问题，如：我喜欢什么编程语言"
        @keyup.enter="handleRetrieve"
      />
      <n-button type="primary" :loading="retrieving" @click="handleRetrieve">检索</n-button>
    </n-input-group>

    <n-divider v-if="retrievedMemories.length > 0" />

    <n-space v-if="retrievedMemories.length > 0" vertical :size="12">
      <div style="color: #999; font-size: 12px">找到 {{ retrievedMemories.length }} 条相关记忆</div>
      <n-card
        v-for="item in retrievedMemories"
        :key="item.id"
        size="small"
        :bordered="false"
        :segmented="{ content: true }"
      >
        <template #header>
          <n-space align="center">
            <n-tag :type="getTypeTag(item.memoryType)" size="small">{{
              getTypeLabel(item.memoryType)
            }}</n-tag>
            <n-tag v-if="item.similarity" type="success" size="small"
              >相似度: {{ (item.similarity * 100).toFixed(1) }}%</n-tag
            >
            <n-tag type="warning" size="small">重要性: {{ item.importance }}</n-tag>
          </n-space>
        </template>
        <div style="white-space: pre-wrap">{{ item.content }}</div>
        <template #footer v-if="item.tags?.length">
          <n-space size="small">
            <n-tag v-for="tag in item.tags" :key="tag" size="tiny" type="info">{{ tag }}</n-tag>
          </n-space>
        </template>
      </n-card>
    </n-space>

    <n-empty
      v-else-if="queryText && !retrieving"
      description="暂无相关记忆"
      style="padding: 40px 0"
    />
  </n-card>
</template>

<script setup name="MemoryRetrieval">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { retrieveMemories } from '@/api/memory'

const props = defineProps({
  userId: { type: String, required: true },
})

const message = useMessage()

const queryText = ref('')
const retrieving = ref(false)
const retrievedMemories = ref([])

const typeMap = {
  fact: { label: '事实', type: 'info' },
  preference: { label: '偏好', type: 'success' },
  goal: { label: '目标', type: 'warning' },
  event: { label: '事件', type: 'error' },
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
      userId: props.userId,
      query: queryText.value,
      limit: 5,
    })

    if (res.success) {
      retrievedMemories.value = res.data || []
      if (retrievedMemories.value.length === 0) {
        message.info('未找到相关记忆')
      }
    }
  } catch (error) {
    message.error(error.message || '检索失败')
  } finally {
    retrieving.value = false
  }
}
</script>
