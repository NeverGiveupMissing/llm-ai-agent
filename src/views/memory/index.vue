<!-- 文件路径：D:\WorkSpace\code\MyProject\llm-ai-agent\vite-vue3-NaïveUI-pinia\src\views\memory\index.vue -->
<template>
  <div class="memory-container">
    <!-- 顶部操作栏 -->
    <n-card :bordered="false" class="search-card">
      <n-space align="center" justify="space-between">
        <n-space align="center">
          <span style="font-size: 16px; font-weight: 600">🧠 记忆管理</span>
          <n-tag type="info" size="small">管理 AI 长期记忆</n-tag>
        </n-space>
        <n-space>
          <CommonButton type="default" @click="handleRefresh" text="刷新" />
          <CommonButton type="add" @click="handleCreate" text="添加记忆" />
        </n-space>
      </n-space>
    </n-card>

    <!-- 内容区域 -->
    <n-card :bordered="false" class="content-card">
      <!-- 记忆统计 -->
      <MemoryStats ref="statsRef" :user_id="user_id" />

      <!-- 记忆列表与检索 -->
      <n-tabs v-model:value="activeTab" type="line" animated style="margin-top: 16px">
        <n-tab-pane name="list" tab="记忆列表">
          <MemoryList
            ref="listRef"
            :user_id="user_id"
            @refresh="handleRefresh"
            @edit="handleEdit"
          />
        </n-tab-pane>
        <n-tab-pane name="retrieval" tab="检索测试">
          <MemoryRetrieval :user_id="user_id" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 添加/编辑记忆表单 -->
    <MemoryForm
      v-model:visible="formVisible"
      :user_id="user_id"
      :editData="editData"
      @success="handleFormSuccess"
    />
  </div>
</template>
<script setup name="Memory">
import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import CommonButton from '@/components/CommonButton.vue'
import MemoryStats from './components/MemoryStats.vue'
import MemoryList from './components/MemoryList.vue'
import MemoryRetrieval from './components/MemoryRetrieval.vue'
import MemoryForm from './components/MemoryForm.vue'
import { clearMemories } from '@/api/memory'

const msgApi = useMessage()
const dialogApi = useDialog()

// ✅ 使用与 AI 对话页面相同的 user_id 获取逻辑
const inituser_id = () => {
  const saveduser_id = localStorage.getItem('user_id')
  if (saveduser_id) {
    return saveduser_id
  }
  // 如果没有，生成一个新的并保存
  const newuser_id = 'user_' + Date.now()
  localStorage.setItem('user_id', newuser_id)
  return newuser_id
}

const user_id = ref(inituser_id())

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
.search-card {
  margin-bottom: 16px;
}
</style>
