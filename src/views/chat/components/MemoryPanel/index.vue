<template>
  <div v-if="visible" class="memory-panel-overlay" @click="handleClose">
    <div class="memory-panel" @click.stop>
      <div class="panel-header">
        <h2 class="panel-title">记忆中心</h2>
        <button class="close-btn" @click="handleClose">
          <n-icon :size="20"><CloseOutline /></n-icon>
        </button>
      </div>

      <div class="panel-content">
        <n-tabs type="segment" animated size="small">
          <n-tab-pane name="used" tab="本次使用">
            <MemoryUsedTab :memories="usedMemories" />
          </n-tab-pane>

          <n-tab-pane name="extracted" tab="新提取">
            <MemoryExtractedTab :memories="extractedMemories" @confirm="handleConfirmMemory" />
          </n-tab-pane>

          <n-tab-pane name="all" tab="全部记忆">
            <MemoryAllTab
              :memories="allMemories"
              :loading="loadingAll"
              @edit="handleEditMemory"
              @delete="handleDeleteMemory"
            />
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>
  </div>

  <MemoryForm
    v-model:visible="formVisible"
    :userId="userId"
    :editData="editMemory"
    @success="handleFormSuccess"
  />
</template>

<script setup name="MemoryPanel">
import { ref, watch } from 'vue'
import { useMessage, useDialog, NTabs, NTabPane, NIcon } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { getSessionMemoryContext, autoExtractMemories } from '@/api/chat-memory'
import { getMemoryList, deleteMemory } from '@/api/memory'
import MemoryUsedTab from './components/MemoryUsedTab.vue'
import MemoryExtractedTab from './components/MemoryExtractedTab.vue'
import MemoryAllTab from './components/MemoryAllTab.vue'
import MemoryForm from '@/views/memory/components/MemoryForm.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  sessionId: { type: String, default: '' },
  userId: { type: String, default: '' },
})

const emit = defineEmits(['update:show'])

const msgApi = useMessage()
const dialogApi = useDialog()

const visible = ref(false)
const usedMemories = ref([])
const extractedMemories = ref([])
const allMemories = ref([])
const loadingAll = ref(false)
const formVisible = ref(false)
const editMemory = ref(null)

watch(
  () => props.show,
  (val) => {
    visible.value = val
    if (val) {
      fetchUsedMemories()
      fetchAllMemories()
    }
  },
)

watch(visible, (val) => emit('update:show', val))

const handleClose = () => {
  visible.value = false
}

/**
 * 获取本次使用的记忆（用户全局记忆）
 * ChatGPT 逻辑：显示用户的所有记忆，AI 会从中检索相关内容
 */
const fetchUsedMemories = async () => {
  if (!props.userId) {
    console.warn('⚠️ userId 为空，无法获取使用的记忆')
    return
  }

  try {
    console.log('🔍 获取使用的记忆（用户全局记忆）...', { userId: props.userId })

    const res = await getMemoryList({
      userId: props.userId,
      limit: 10,
    })

    console.log('📊 使用的记忆响应:', res)

    if (res && res.data.list) {
      usedMemories.value = res.data.list
      console.log(`✅ 获取到 ${usedMemories.value.length} 条记忆`)
    } else {
      console.warn('⚠️ 获取使用的记忆失败:', res)
      usedMemories.value = []
    }
  } catch (error) {
    console.error('❌ 获取使用的记忆失败:', error)
    msgApi.error(error.message)
    usedMemories.value = []
  }
}

/**
 * 提取本次对话的记忆
 * ChatGPT 逻辑：提取的记忆属于用户，存入全局记忆库
 */
const fetchExtractedMemories = async (messages) => {
  if (!props.sessionId || !props.userId || !messages) {
    console.warn('⚠️ 参数不完整，无法提取记忆', {
      sessionId: props.sessionId,
      userId: props.userId,
      hasMessages: !!messages,
    })
    return
  }

  try {
    console.log('🔍 开始提取记忆...', {
      sessionId: props.sessionId,
      userId: props.userId,
      messageCount: messages.length,
    })

    const res = await autoExtractMemories({
      sessionId: props.sessionId,
      userId: props.userId,
      messages,
    })

    console.log('📊 提取记忆响应:', res)

    if (Array.isArray(res)) {
      extractedMemories.value = res
        .filter((m) => m.content || (m.data && m.data.content))
        .map((m) => ({
          ...(m.content ? m : m.data),
          confirmed: true,
        }))

      console.log(`✅ 提取完成: 创建 ${extractedMemories.value.length} 条记忆`)
    } else {
      console.warn('⚠️ 提取记忆失败:', res)
      extractedMemories.value = []
    }
  } catch (error) {
    console.error('❌ 提取记忆失败:', error)
    msgApi.error(error.message)
    extractedMemories.value = []
  }
}

/**
 * 获取用户全部记忆
 */
const fetchAllMemories = async () => {
  if (!props.userId) {
    console.warn('⚠️ userId 为空，无法获取全部记忆')
    return
  }

  loadingAll.value = true
  try {
    console.log('🔍 获取全部记忆...', { userId: props.userId })
    const res = await getMemoryList({
      userId: props.userId,
      limit: 50,
    })

    console.log('📊 全部记忆响应:', res)

    if (res && res.data.list) {
      allMemories.value = res.data.list
      console.log(`✅ 获取到 ${allMemories.value.length} 条记忆`)
    } else {
      console.warn('⚠️ 获取全部记忆失败:', res)
      allMemories.value = []
    }
  } catch (error) {
    console.error('❌ 获取全部记忆失败:', error)
    msgApi.error(error.message)
    allMemories.value = []
  } finally {
    loadingAll.value = false
  }
}

const handleConfirmMemory = (index) => {
  extractedMemories.value[index].confirmed = true
  msgApi.success('Memory confirmed')
}

const handleEditMemory = (memory) => {
  editMemory.value = memory
  formVisible.value = true
}

const handleDeleteMemory = (memoryId) => {
  dialogApi.warning({
    title: '删除 记忆',
    content: '确认删除记忆吗?',
    positiveText: '删除',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await deleteMemory(memoryId)
        msgApi.success('Memory deleted')
        fetchAllMemories()
      } catch (error) {
        msgApi.error('Failed to delete')
      }
    },
  })
}

const handleFormSuccess = () => {
  fetchAllMemories()
}

const handleRefresh = () => {
  fetchUsedMemories()
  fetchAllMemories()
  msgApi.success('Refreshed')
}

defineExpose({
  refresh: handleRefresh,
  fetchExtractedMemories,
})
</script>

<style scoped>
.memory-panel-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.memory-panel {
  width: 100%;
  max-width: 520px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6e6e80;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #0d0d0d;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.n-tabs-nav) {
  padding: 12px 20px 0;
  border-bottom: 1px solid #e5e5e5;
}

:deep(.n-tabs-tab) {
  font-size: 14px;
  color: #6e6e80;
  padding: 8px 16px;
}

:deep(.n-tabs-tab--active) {
  color: #0d0d0d;
  font-weight: 500;
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: scroll;
}
</style>
