<!-- 文件路径：D:\WorkSpace\code\MyProject\llm-ai-agent\vite-vue3-NaïveUI-pinia\src\views\memory\index.vue -->
<template>
  <div class="memory-container">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">记忆管理</h1>
        <p class="page-description">
          管理 AI 记住的关于你的信息。这些记忆帮助 AI 提供更个性化的回答。
        </p>
      </div>
      <div class="page-header-actions">
        <n-button type="primary" @click="handleCreate">
          <template #icon
            ><n-icon><AddOutline /></n-icon
          ></template>
          添加记忆
        </n-button>
        <n-button @click="handleRefresh">
          <template #icon
            ><n-icon><RefreshOutline /></n-icon
          ></template>
          刷新
        </n-button>
      </div>
    </div>

    <!-- 记忆统计 -->
    <MemoryStats ref="statsRef" :userId="userId" />

    <!-- 记忆列表与检索 -->
    <n-tabs v-model:value="activeTab" type="line" animated class="detail-tabs">
      <n-tab-pane name="list" tab="记忆列表">
        <MemoryList ref="listRef" :userId="userId" @refresh="handleRefresh" @edit="handleEdit" />
      </n-tab-pane>
      <n-tab-pane name="retrieval" tab="检索测试">
        <MemoryRetrieval :userId="userId" />
      </n-tab-pane>
    </n-tabs>

    <!-- 添加/编辑记忆表单 -->
    <MemoryForm
      v-model:visible="formVisible"
      :userId="userId"
      :editData="editData"
      @success="handleFormSuccess"
    />
  </div>
</template>
<script setup name="Memory">
import { ref, computed } from 'vue'
import { useMessage, useDialog, NButton, NIcon } from 'naive-ui'
import { AddOutline, RefreshOutline } from '@vicons/ionicons5'
import MemoryStats from './components/MemoryStats.vue'
import MemoryList from './components/MemoryList.vue'
import MemoryRetrieval from './components/MemoryRetrieval.vue'
import MemoryForm from './components/MemoryForm.vue'
import { clearMemories } from '@/api/memory'

const msgApi = useMessage()
const dialogApi = useDialog()

// ✅ 使用与 AI 对话页面相同的 userId 获取逻辑
const initUserId = () => {
  const savedUserId = localStorage.getItem('userId')
  if (savedUserId) {
    return savedUserId
  }
  // 如果没有，生成一个新的并保存
  const newUserId = 'user_' + Date.now()
  localStorage.setItem('userId', newUserId)
  return newUserId
}

const userId = ref(initUserId())

const statsRef = ref(null)
const listRef = ref(null)
const formVisible = ref(false)
const editData = ref(null)
const activeTab = ref('list')

const statsData = computed(() => statsRef.value?.stats || {})

const handleCreate = () => {
  editData.value = null
  formVisible.value = true
}

const handleEdit = (row) => {
  editData.value = row
  formVisible.value = true
}

const handleFormSuccess = () => {
  listRef.value?.refresh()
  statsRef.value?.refresh()
}

const handleRefresh = () => {
  listRef.value?.refresh()
  statsRef.value?.refresh()
  msgApi.success('已刷新')
}
</script>

<style scoped>
.memory-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.page-header-left {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d0d0d;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  line-height: 1.6;
  color: #6e6e80;
  margin: 0;
  max-width: 600px;
}

.page-header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.detail-tabs {
  margin-top: 32px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
}

:deep(.detail-tabs .n-tabs-nav) {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 20px;
}

:deep(.detail-tabs .n-tabs-tab) {
  font-size: 14px;
  color: #6e6e80;
  padding: 12px 0;
  margin-right: 32px;
}

:deep(.detail-tabs .n-tabs-tab--active) {
  color: #0d0d0d;
  font-weight: 500;
}

:deep(.detail-tabs .n-tabs-tab-indicator) {
  background: #0d0d0d;
}
</style>
