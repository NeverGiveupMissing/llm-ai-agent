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
    :user_id="user_id"
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
  user_id: { type: String, default: '' },
})

const emit = defineEmits(['update:show'])

const msgApi = useMessage()
const dialogApi = useDialog()

const visible = ref(false)
const usedMemories = ref([])
const extractedMemories = ref([])
const allMemories = ref([])
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
  if (!props.user_id) {
    console.warn('⚠️ user_id 为空，无法获取使用的记忆')
    return
  }

  try {
    console.log('🔍 获取使用的记忆（用户全局记忆）...', { user_id: props.user_id })

    const res = await getMemoryList({
      user_id: props.user_id,
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
const fetchExtractedMemories = async (messages, options = {}) => {
  if (!props.sessionId || !props.user_id || !messages) {
    console.warn('⚠️ 参数不完整，无法提取记忆', {
      sessionId: props.sessionId,
      user_id: props.user_id,
      hasMessages: !!messages,
    })
    return
  }

  try {
    console.log(' 开始提取记忆...', {
      sessionId: props.sessionId,
      user_id: props.user_id,
      messageCount: messages.length,
    })

    const res = await autoExtractMemories(
      {
        sessionId: props.sessionId,
        user_id: props.user_id,
        messages,
      },
      options,
    )

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
      console.warn('️ 提取记忆失败:', res)
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
  if (!props.user_id) {
    console.warn('⚠️ user_id 为空，无法获取全部记忆')
    return
  }

  try {
    console.log('🔍 获取全部记忆...', { user_id: props.user_id })
    const res = await getMemoryList({
      user_id: props.user_id,
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
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.memory-panel {
  width: 600px;
  max-width: 90vw;
  height: 80vh;
  max-height: 700px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
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
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-nav) {
  padding: 0 20px;
}

:deep(.n-tabs-tab-pane) {
  height: 100%;
  overflow: hidden;
}
</style>
