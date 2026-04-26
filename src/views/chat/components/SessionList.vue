<template>
  <div class="session-panel" :class="{ collapsed: !props.show }">
    <!-- 标题区 -->
    <div class="panel-header">
      <template v-if="props.show">
        <span class="title">会话历史</span>
        <n-button text size="tiny" type="primary" @click="handleCreateNew" class="new-btn">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建
        </n-button>
      </template>
      <n-button v-else text size="tiny" type="primary" @click="handleCreateNew" class="new-btn-collapsed" title="新建会话">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <!-- 列表区 -->
    <div class="session-list" v-if="props.show">
      <n-tooltip
        v-for="session in sessions"
        :key="session.id"
        trigger="hover"
        placement="right"
        :show-arrow="true"
        :style="{ maxWidth: '800px' }"
      >
        <template #trigger>
          <div
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="handleSelect(session)"
          >
            <div class="item-content">
              <n-icon class="icon" size="16">
                <ChatbubbleEllipsesOutline />
              </n-icon>
              <span class="text">{{ session.title }}</span>
            </div>
            <button class="delete-btn" @click.stop="handleDelete(session.id)" title="删除">
              <n-icon size="14"><CloseOutline /></n-icon>
            </button>
          </div>
        </template>
        {{ session.title }}
      </n-tooltip>

      <n-empty v-if="sessions.length === 0" description="暂无会话" />
    </div>
  </div>
</template>

<script setup name="SessionList">
import { ref, watch, onMounted } from 'vue'
import { useMessage, useDialog, NButton, NIcon, NEmpty } from 'naive-ui'
import { AddOutline, CloseOutline, ChatbubbleEllipsesOutline } from '@vicons/ionicons5'
import { getSessionList, createSession, deleteSession } from '@/api/session'

const props = defineProps({
  show: { type: Boolean, default: false },
  currentSessionId: { type: String, default: '' },
})

const emit = defineEmits(['update:show', 'select', 'create'])

const msgApi = useMessage()
const dialogApi = useDialog()

const sessions = ref([])

// 组件挂载时加载会话列表
onMounted(() => {
  fetchSessions()
})

watch(
  () => props.show,
  (val) => {
    if (val) fetchSessions()
  },
)

const fetchSessions = async () => {
  try {
    const userId = localStorage.getItem('userId') || 'anonymous'
    const res = await getSessionList(userId)
    console.log('获取会话列表成功:', res.data)
    sessions.value = res.data || []
  } catch (error) {
    console.error('获取会话列表失败:', error)
    sessions.value = []
  }
}

// 暴露方法给父组件
defineExpose({
  fetchSessions,
})

const handleCreateNew = () => {
  emit('create')
}

const handleSelect = (session) => {
  emit('select', session)
}

const handleDelete = (id) => {
  dialogApi.warning({
    title: '确认删除',
    content: '删除后将无法恢复此会话，确定要删除吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSession(id)
        msgApi.success('删除成功')
        fetchSessions()
      } catch (error) {
        msgApi.error('删除失败')
      }
    },
  })
}
</script>

<style scoped>
.session-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.session-panel.collapsed {
  width: 48px !important;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
  transition: all 0.3s ease;
}

.session-panel.collapsed .panel-header {
  padding: 12px 8px;
  justify-content: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.new-btn {
  font-size: 13px;
}

.new-btn-collapsed {
  padding: 8px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  background: #f0f0f0;
}

.session-item.active {
  background: #e6f4ea;
  color: #10a37f;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.icon {
  color: inherit;
  flex-shrink: 0;
}

.text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
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
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: white;
}

/* 滚动条样式 */
.session-list::-webkit-scrollbar {
  width: 6px;
}

.session-list::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* Tooltip 样式 - 确保完整显示内容 */
:deep(.n-tooltip) {
  max-width: 800px !important;
  word-break: break-all !important;
  white-space: normal !important;
}

:deep(.n-tooltip__body) {
  word-break: break-all !important;
  white-space: normal !important;
  overflow-wrap: break-word !important;
}
</style>
