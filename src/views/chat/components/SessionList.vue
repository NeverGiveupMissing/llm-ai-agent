<template>
  <n-drawer
    v-model:show="visible"
    :width="320"
    placement="right"
    :mask="false"
    :z-index="100"
    style="border-left: 1px solid #e5e5e5; box-shadow: -4px 0 20px rgba(0, 0, 0, 0.05)"
  >
    <n-drawer-content :body-style="{ padding: '0', display: 'flex', flexDirection: 'column' }">
      <!-- 标题区 -->
      <template #header>
        <div class="drawer-header">
          <span class="title">会话历史</span>
          <n-button text size="tiny" type="primary" @click="handleCreateNew" class="new-btn">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            新建
          </n-button>
        </div>
      </template>

      <!-- 列表区 -->
      <div class="session-list">
        <n-spin :show="loading">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="handleSelect(session)"
          >
            <div class="item-content">
              <n-icon class="icon" size="16">
                <ChatbubbleEllipsesOutline />
              </n-icon>
              <span class="text" :title="session.title">{{ session.title }}</span>
            </div>
            <button class="delete-btn" @click.stop="handleDelete(session.id)" title="删除">
              <n-icon size="14"><CloseOutline /></n-icon>
            </button>
          </div>

          <n-empty v-if="sessions.length === 0" description="暂无会话" />
        </n-spin>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup name="SessionList">
import { ref, watch } from 'vue'
import {
  useMessage,
  useDialog,
  NDrawer,
  NDrawerContent,
  NButton,
  NIcon,
  NSpin,
  NEmpty,
} from 'naive-ui'
import { AddOutline, CloseOutline, ChatbubbleEllipsesOutline } from '@vicons/ionicons5'
import { getSessionList, createSession, deleteSession } from '@/api/session'

const props = defineProps({
  show: { type: Boolean, default: false },
  currentSessionId: { type: String, default: '' },
})

const emit = defineEmits(['update:show', 'select', 'create'])

const msgApi = useMessage()
const dialogApi = useDialog()

const visible = ref(false)
const loading = ref(false)
const sessions = ref([])

watch(
  () => props.show,
  (val) => {
    visible.value = val
    if (val) fetchSessions()
  },
)

watch(visible, (val) => emit('update:show', val))

const fetchSessions = async () => {
  loading.value = true
  try {
    const userId = localStorage.getItem('userId') || 'anonymous'
    const res = await getSessionList(userId)
    sessions.value = res.data || res || []
  } catch (error) {
    msgApi.error('获取会话列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreateNew = () => {
  emit('create')
  visible.value = false
}

const handleSelect = (session) => {
  emit('select', session)
  visible.value = false
}

const handleDelete = (id) => {
  dialogApi.warning({
    title: '删除会话',
    content: '确定要删除此会话吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSession(id)
        msgApi.success('已删除')
        fetchSessions()
      } catch (error) {
        msgApi.error('删除失败')
      }
    },
  })
}

defineExpose({ refresh: fetchSessions })
</script>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: #0d0d0d;
}

.new-btn :deep(.n-button__content) {
  font-size: 12px;
  gap: 4px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 8px;
}

.session-item:hover {
  background: #f7f7f8;
}

.session-item.active {
  background: #f0fdf4;
  border-right: 2px solid #10a37f;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.icon {
  flex-shrink: 0;
  color: #888;
}

.text {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #999;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}
</style>
