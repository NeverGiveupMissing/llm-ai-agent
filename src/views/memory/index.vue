<template>
  <div class="memory-container">
    <div class="page-header">
      <h1 class="page-title">记忆管理</h1>
      <p class="page-description">
        管理 AI 记住的关于你的信息。记忆功能帮助 AI 提供更个性化和基于上下文的回答。
      </p>
    </div>

    <MemoryStats ref="statsRef" :userId="userId" />

    <div class="content-sections">
      <div class="section-grid">
        <RecentMemories ref="recentRef" :userId="userId" @view-all="activeTab = 'list'" />
        <MemoryDistribution :stats="statsData" />
      </div>

      <QuickActions
        @browse="activeTab = 'list'"
        @test-retrieval="activeTab = 'retrieval'"
        @clear-all="handleClearAll"
      />

      <HowItWorks />
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated class="detail-tabs">
      <n-tab-pane name="list" tab="记忆列表">
        <MemoryList ref="listRef" :userId="userId" @refresh="handleRefresh" @edit="handleEdit" />
      </n-tab-pane>
      <n-tab-pane name="retrieval" tab="检索测试">
        <MemoryRetrieval :userId="userId" />
      </n-tab-pane>
    </n-tabs>

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
import { useUserStore } from '@/stores/modules/user'
import MemoryStats from './components/MemoryStats.vue'
import MemoryList from './components/MemoryList.vue'
import MemoryRetrieval from './components/MemoryRetrieval.vue'
import MemoryForm from './components/MemoryForm.vue'
import RecentMemories from './components/RecentMemories.vue'
import MemoryDistribution from './components/MemoryDistribution.vue'
import QuickActions from './components/QuickActions.vue'
import HowItWorks from './components/HowItWorks.vue'
import { clearMemories } from '@/api/memory'

const msgApi = useMessage()
const dialogApi = useDialog()
const userStore = useUserStore()
const userId = ref(userStore.userInfo?.id || 'user_001')

const statsRef = ref(null)
const recentRef = ref(null)
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
  recentRef.value?.refresh()
}

const handleRefresh = () => {
  listRef.value?.refresh()
  statsRef.value?.refresh()
  recentRef.value?.refresh()
  msgApi.success('已刷新')
}

const handleClearAll = () => {
  dialogApi.warning({
    title: '清空所有记忆',
    content: '此操作将永久删除所有记忆，无法恢复。确定要继续吗？',
    positiveText: '确认清空',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      try {
        await clearMemories({ userId: userId.value })
        msgApi.success('已清空所有记忆')
        handleRefresh()
      } catch (error) {
        msgApi.error('清空失败')
      }
    },
  })
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

.content-sections {
  margin-bottom: 32px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
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
