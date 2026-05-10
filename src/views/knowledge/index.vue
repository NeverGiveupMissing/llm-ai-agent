<template>
  <div class="knowledge-container">
    <!-- 顶部操作栏 -->
    <n-card :bordered="false" class="search-card">
      <n-space align="center" justify="space-between">
        <n-space align="center">
          <span style="font-size: 16px; font-weight: 600">📚 知识库</span>
          <n-tag type="success" size="small">AI 长期记忆</n-tag>
          <n-tag type="info" size="small">PostgreSQL + pgvector</n-tag>
        </n-space>
        <n-space>
          <CommonButton type="default" @click="handleRefresh" text="刷新" />
          <CommonButton type="add" @click="handleCreate" text="新建记忆" />
        </n-space>
      </n-space>
    </n-card>

    <!-- 内容区域 -->
    <n-card :bordered="false" class="content-card">
      <MemoryStats ref="statsRef" :user_id="user_id" />

      <n-tabs type="line" animated style="margin-top: 16px">
        <n-tab-pane name="list" tab="📋 记忆列表">
          <MemoryList
            ref="listRef"
            :user_id="user_id"
            @refresh="handleRefresh"
            @edit="handleEdit"
          />
        </n-tab-pane>
        <n-tab-pane name="retrieval" tab="🔍 检索测试">
          <MemoryRetrieval :user_id="user_id" />
        </n-tab-pane>
        <n-tab-pane name="usage" tab="📊 使用统计">
          <n-alert type="info" :show-icon="false">
            记忆在 AI 对话中自动使用，每次对话前会检索相关记忆注入上下文。
            <br />
            在聊天界面右上角 🧠 图标可查看本次对话使用的记忆。
          </n-alert>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <MemoryForm
      v-model:visible="formVisible"
      :user_id="user_id"
      :editData="editData"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup name="Memory">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import CommonButton from '@/components/CommonButton.vue'
import MemoryStats from './components/MemoryStats.vue'
import MemoryList from './components/MemoryList.vue'
import MemoryRetrieval from './components/MemoryRetrieval.vue'
import MemoryForm from './components/MemoryForm.vue'

const msgApi = useMessage()
const userStore = useUserStore()
const user_id = ref(userStore.userInfo?.id || 'user_001')

const statsRef = ref(null)
const listRef = ref(null)
const formVisible = ref(false)
const editData = ref(null)

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
