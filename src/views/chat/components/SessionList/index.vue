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
      <n-button
        v-else
        text
        size="tiny"
        type="primary"
        @click="handleCreateNew"
        class="new-btn-collapsed"
        title="新建会话"
      >
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <!-- 搜索区 -->
    <SearchBox v-if="props.show" v-model="searchKeyword" />

    <!-- 列表区 -->
    <div class="session-list" v-if="props.show">
      <!-- 分组区域 -->
      <div class="groups-section">
        <div v-for="group in groups" :key="group.id" class="group-item">
          <GroupHeader
            :group="group"
            :is-collapsed="collapsedGroups[group.id]"
            :session-count="getGroupSessionCount(group.id)"
            @toggle-collapse="toggleGroupCollapse(group.id)"
            @pin="handlePinGroup(group)"
            @menu-select="(key) => handleGroupMenuSelect(key, group)"
          />

          <div v-show="!collapsedGroups[group.id]" class="group-sessions">
            <SessionItem
              v-for="session in getGroupSessions(group.id)"
              :key="session.id"
              :session="session"
              :current-session-id="currentSessionId"
              :groups="groups"
              @select="handleSelect"
              @menu-select="(key, session) => handleSessionMenuSelect(key, session)"
            />
            <div v-if="getGroupSessionCount(group.id) === 0" class="empty-group-hint">暂无会话</div>
          </div>
        </div>

        <div v-if="getUngroupedSessions().length > 0" class="ungrouped-section">
          <div class="group-header">
            <div class="group-title">
              <n-icon size="16"><FolderOutline /></n-icon>
              <span>未分组</span>
              <span class="group-count">({{ getUngroupedSessions().length }})</span>
            </div>
          </div>

          <SessionItem
            v-for="session in getUngroupedSessions()"
            :key="session.id"
            :session="session"
            :current-session-id="currentSessionId"
            :groups="groups"
            @select="handleSelect"
            @menu-select="(key, session) => handleSessionMenuSelect(key, session)"
          />
        </div>
      </div>

      <n-empty v-if="sessions.length === 0" description="暂无会话" />
    </div>

    <!-- 模态框组件 -->
    <CreateGroupModal v-model:visible="groupModalVisible" @confirm="handleCreateGroup" />
    <RenameGroupModal
      v-model:visible="renameGroupModalVisible"
      :initial-name="newGroupName"
      @confirm="handleConfirmRenameGroup"
    />
    <MoveToGroupModal
      v-model:visible="moveToGroupModalVisible"
      :groups="groups"
      @confirm="handleMoveToGroup"
    />
    <ShareModal v-model:visible="shareModalVisible" :share-link="shareLink" @copy="copyShareLink" />
    <RenameSessionModal
      v-model:visible="renameModalVisible"
      :initial-title="renameTitle"
      @confirm="handleConfirmRename"
    />
  </div>
</template>

<script setup name="SessionList">
import { ref, watch, onMounted, reactive } from 'vue'
import { useMessage, useDialog, NEmpty } from 'naive-ui'
import { AddOutline, FolderOutline } from '@vicons/ionicons5'

// 导入拆分的子组件
import SearchBox from './SearchBox.vue'
import SessionItem from './SessionItem.vue'
import GroupHeader from './GroupHeader.vue'
import CreateGroupModal from './CreateGroupModal.vue'
import RenameGroupModal from './RenameGroupModal.vue'
import MoveToGroupModal from './MoveToGroupModal.vue'
import ShareModal from './ShareModal.vue'
import RenameSessionModal from './RenameSessionModal.vue'

import {
  getSessionList,
  deleteSession,
  updateSession,
  pinSession,
  getShareInfo,
  getSessionDetail,
} from '@/api/session'
import {
  getGroupList,
  createGroup,
  updateGroup,
  deleteGroup,
  pinGroup,
  moveSessionToGroup as moveSessionToGroupApi,
} from '@/api/session-group'
import { handleExport } from './exportUtils.js'

const props = defineProps({
  show: { type: Boolean, default: true },
  currentSessionId: { type: String, default: '' },
})

const emit = defineEmits(['update:show', 'select', 'create'])

const msgApi = useMessage()
const dialogApi = useDialog()

const sessions = ref([])
const groups = ref([])
const searchKeyword = ref('')
const renameModalVisible = ref(false)
const renameSessionId = ref(null)
const renameTitle = ref('')
const shareModalVisible = ref(false)
const shareLink = ref('')

const groupModalVisible = ref(false)
const moveToGroupModalVisible = ref(false)
const renameGroupModalVisible = ref(false)
const newGroupName = ref('')
const selectedGroupIcon = ref(null)
const currentMoveSession = ref(null)
const moveTargetGroup = ref(null)
const currentRenameGroup = ref(null)
const collapsedGroups = reactive({})

const getUngroupedSessions = () => sessions.value.filter((s) => !s.group_id)
const getGroupSessions = (groupId) => sessions.value.filter((s) => s.group_id === groupId)
const getGroupSessionCount = (groupId) => getGroupSessions(groupId).length

const handleSessionMenuSelect = async (key, session) => {
  if (key.startsWith('group-')) {
    await moveSessionToGroupAPI(session.id, key.replace('group-', ''))
    return
  }

  switch (key) {
    case 'rename':
      handleRename(session)
      break
    case 'pin':
      await handlePin(session)
      break
    case 'share':
      await handleShare(session)
      break
    case 'new-group':
      await handleNewGroup(session)
      break
    case 'move-to-group':
      currentMoveSession.value = session
      moveTargetGroup.value = session.group_id || null
      moveToGroupModalVisible.value = true
      break
    case 'export-markdown':
      await handleExportSession(session, 'export-markdown')
      break
    case 'export-word':
      await handleExportSession(session, 'word')
      break
    case 'export-pdf':
      await handleExportSession(session, 'pdf')
      break
    case 'export-txt':
      await handleExportSession(session, 'txt')
      break
    case 'export-json':
      await handleExportSession(session, 'json')
      break
    case 'delete':
      await handleDelete(session)
      break
  }
}

const handleRename = (session) => {
  renameSessionId.value = session.id
  renameTitle.value = session.title
  renameModalVisible.value = true
}

const handleConfirmRename = async (newTitle) => {
  // 💡 使用子组件传来的新标题，而不是父组件的 renameTitle
  if (!newTitle?.trim()) {
    msgApi.warning('会话名称不能为空')
    return
  }
  try {
    await updateSession(renameSessionId.value, { title: newTitle.trim() })
    msgApi.success('重命名成功')
    renameModalVisible.value = false
    fetchSessions()
    // 🔥 向父组件发出 rename 事件，传递 sessionId 和 newTitle
    emit('rename', renameSessionId.value, newTitle.trim())
  } catch (error) {
    msgApi.error('重命名失败')
  }
}

const handlePin = async (session) => {
  try {
    const originalPinnedState = session.is_pinned
    session.is_pinned = !originalPinnedState
    await pinSession(session.id)
    msgApi.success(originalPinnedState ? '已取消置顶' : '已置顶')
    await Promise.all([fetchSessions(), fetchGroups()])
  } catch (error) {
    const sessionToRestore = sessions.value.find((s) => s.id === session.id)
    if (sessionToRestore) sessionToRestore.is_pinned = session.is_pinned
    msgApi.error('操作失败')
  }
}

const handleShare = async (session) => {
  try {
    const res = await getShareInfo(session.id)
    const shareToken = res.data?.share_token
    if (shareToken) {
      shareLink.value = `${window.location.origin}/share/${shareToken}`
      shareModalVisible.value = true
    }
  } catch (error) {
    msgApi.error('获取分享链接失败')
  }
}

const copyShareLink = () => {
  navigator.clipboard
    .writeText(shareLink.value)
    .then(() => msgApi.success('链接已复制到剪贴板'))
    .catch(() => msgApi.error('复制失败，请手动复制'))
}

const handleCreateGroup = async (groupData) => {
  // 💡 接收子组件传来的参数，而不是使用独立的 newGroupName
  if (!groupData?.name?.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }
  try {
    const user_id = localStorage.getItem('user_id') || 'anonymous'
    const res = await createGroup({
      name: groupData.name.trim(),
      icon: groupData.icon?.name || 'FolderOutline',
      user_id,
    })
    if (res.code === 200) {
      await fetchGroups()
      if (currentMoveSession.value)
        await moveSessionToGroupAPI(currentMoveSession.value.id, res.data.id)
      msgApi.success(`分组 "${res.data.name}" 创建成功`)
      groupModalVisible.value = false
      currentMoveSession.value = null
    } else {
      msgApi.error(res.message || '创建分组失败')
    }
  } catch (error) {
    msgApi.error('创建分组失败')
  }
}

const moveSessionToGroupAPI = async (sessionId, groupId) => {
  try {
    const res = await moveSessionToGroupApi(sessionId, groupId)
    if (res.code === 200) {
      const session = sessions.value.find((s) => s.id === sessionId)
      if (session) session.group_id = groupId || null
      await Promise.all([fetchSessions(), fetchGroups()])
      msgApi.success('已移动到分组')
    } else {
      msgApi.error(res.message || '移动失败')
    }
  } catch (error) {
    msgApi.error('移动失败')
  }
}

const handleMoveToGroup = async () => {
  if (!moveTargetGroup.value || !currentMoveSession.value) {
    msgApi.warning('请选择目标分组')
    return
  }
  await moveSessionToGroupAPI(currentMoveSession.value.id, moveTargetGroup.value)
  moveToGroupModalVisible.value = false
  currentMoveSession.value = null
  moveTargetGroup.value = null
}

const handleNewGroup = async (session) => {
  currentMoveSession.value = session
  groupModalVisible.value = true
}

const handleExportSession = async (session, format) => {
  await handleExport(session, format, getSessionDetail, msgApi)
}

onMounted(() => {
  fetchSessions()
  fetchGroups()
})
watch(
  () => props.show,
  (val) => {
    if (val) {
      fetchSessions()
      fetchGroups()
    }
  },
)

const fetchSessions = async () => {
  try {
    const res = await getSessionList(localStorage.getItem('user_id') || 'anonymous')
    sessions.value = res.data || []
  } catch (error) {
    sessions.value = []
  }
}

const fetchGroups = async () => {
  try {
    const res = await getGroupList()
    groups.value = res.code === 200 ? res.data || [] : []
  } catch (error) {
    groups.value = []
  }
}

defineExpose({ fetchSessions })
const handleCreateNew = () => emit('create')
const handleSelect = (session) => emit('select', session)

const handleDelete = (session) => {
  dialogApi.warning({
    title: '确认删除',
    content: '删除后将无法恢复此会话，确定要删除吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSession(session.id)
        msgApi.success('删除成功')
        fetchSessions()
        if (props.currentSessionId === session.id) emit('select', null)
      } catch (error) {
        msgApi.error('删除失败')
      }
    },
  })
}

const toggleGroupCollapse = (groupId) => {
  collapsedGroups[groupId] = !collapsedGroups[groupId]
}

const handlePinGroup = async (group) => {
  try {
    await pinGroup(group.id)
    msgApi.success(group.is_pinned ? '已取消置顶' : '已置顶')
    fetchGroups()
  } catch (error) {
    msgApi.error('操作失败')
  }
}

const handleGroupMenuSelect = (key, group) => {
  if (key === 'rename') handleRenameGroup(group)
  else if (key === 'delete') handleDeleteGroup(group)
}

const handleRenameGroup = (group) => {
  currentRenameGroup.value = group
  newGroupName.value = group.name //  设置初始名称，传递给子组件
  renameGroupModalVisible.value = true
}

const handleConfirmRenameGroup = async (newName) => {
  // 💡 接收子组件传来的参数
  if (!newName?.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }
  try {
    const res = await updateGroup(currentRenameGroup.value.id, { name: newName.trim() })
    if (res.code === 200) {
      msgApi.success('重命名成功')
      renameGroupModalVisible.value = false
      currentRenameGroup.value = null
      await fetchGroups()
    } else {
      msgApi.error(res.message || '重命名失败')
    }
  } catch (error) {
    msgApi.error('重命名失败')
  }
}

const handleDeleteGroup = async (group) => {
  dialogApi.warning({
    title: '确认删除分组',
    content: `删除分组后，该分组下的 ${getGroupSessionCount(group.id)} 个会话将移动到未分组。确定要删除吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await deleteGroup(group.id)
        if (res.code === 200) {
          await fetchGroups()
          await fetchSessions()
          msgApi.success('分组已删除')
        } else msgApi.error(res.message || '删除失败')
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
  background: transparent;
}

.session-panel.collapsed {
  width: 48px !important;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 242, 254, 0.2);
  background: rgba(16, 22, 42, 0.3);
  transition: all 0.3s ease;
  padding: 10px 30px 10px 5px;
}

.title {
  color: #00f2fe;
  font-size: 16px;
  font-weight: 600;
}

/* Naive UI 按钮覆盖 */
:deep(.n-button) {
  color: #00f2fe !important;
}

:deep(.n-button:hover) {
  color: #00f2fe !important;
  background: rgba(0, 242, 254, 0.1) !important;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-list::-webkit-scrollbar {
  width: 6px;
}

.session-list::-webkit-scrollbar-track {
  background: rgba(16, 22, 42, 0.2);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-thumb {
  background: rgba(0, 242, 254, 0.3);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 242, 254, 0.5);
}

.groups-section {
  margin-bottom: 16px;
}

.group-item {
  margin-bottom: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.15);
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-header:hover {
  background: rgba(0, 242, 254, 0.12);
  border-color: rgba(0, 242, 254, 0.3);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.1);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  flex: 1;
}

.group-title .n-icon {
  color: #00f2fe;
}

.group-count {
  font-size: 12px;
  color: rgba(224, 224, 224, 0.6);
  font-weight: normal;
}

.group-sessions {
  padding-left: 20px;
}

.empty-group-hint {
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(224, 224, 224, 0.5);
  text-align: center;
}

.ungrouped-section {
  margin-top: 8px;
}

/* 空状态 */
:deep(.n-empty) {
  color: rgba(224, 224, 224, 0.6);
}

:deep(.n-empty .n-empty__description) {
  color: rgba(224, 224, 224, 0.5);
}
</style>
