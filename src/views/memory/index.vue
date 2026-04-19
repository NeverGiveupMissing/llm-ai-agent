<template>
  <div class="memory-container">
    <n-card :bordered="false" size="small">
      <template #header>
        <n-space align="center">
          <span style="font-size: 18px; font-weight: 600">🧠 记忆管理</span>
          <n-tag type="success" size="small">PostgreSQL + pgvector</n-tag>
        </n-space>
      </template>
      <template #header-extra>
        <n-button type="primary" @click="handleCreate">
          <template #icon>➕</template>
          新建记忆
        </n-button>
      </template>

      <n-space vertical :size="16">
        <MemoryStats ref="statsRef" :userId="userId" />

        <n-tabs type="line" animated>
          <n-tab-pane name="list" tab="📚 记忆列表">
            <MemoryList
              ref="listRef"
              :userId="userId"
              @refresh="handleRefresh"
              @edit="handleEdit"
            />
          </n-tab-pane>
          <n-tab-pane name="retrieval" tab="🔍 检索测试">
            <MemoryRetrieval :userId="userId" />
          </n-tab-pane>
        </n-tabs>
      </n-space>
    </n-card>

    <MemoryForm
      v-model:visible="formVisible"
      :userId="userId"
      :editData="editData"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup name="Memory">
import { ref } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import MemoryStats from './components/MemoryStats.vue'
import MemoryList from './components/MemoryList.vue'
import MemoryRetrieval from './components/MemoryRetrieval.vue'
import MemoryForm from './components/MemoryForm.vue'

const userStore = useUserStore()
const userId = ref(userStore.userInfo?.id || 'user_001')

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
  statsRef.value?.refresh()
}
</script>

<style scoped>
.memory-container {
  padding: 16px;
}
</style>
