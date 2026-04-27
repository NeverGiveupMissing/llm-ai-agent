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
    <div v-if="props.show" class="search-section">
      <n-input v-model:value="searchKeyword" placeholder="搜索会话..." clearable size="small" round>
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
    </div>

    <!-- 列表区 -->
    <div class="session-list" v-if="props.show">
      <!-- 分组区域 -->
      <div class="groups-section">
        <!-- 遍历分组 -->
        <div v-for="group in groups" :key="group.id" class="group-item">
          <div class="group-header">
            <div class="group-title" @click="toggleGroupCollapse(group.id)">
              <!-- 置顶标识 -->
              <n-icon v-if="group.is_pinned" size="14" color="#ff9800" title="已置顶">
                <PinOutline />
              </n-icon>

              <n-icon size="14">
                <component
                  :is="collapsedGroups[group.id] ? ChevronForwardOutline : ChevronDownOutline"
                />
              </n-icon>
              <n-icon size="16">
                <FolderOutline />
              </n-icon>
              <span>{{ group.name }}</span>
              <span class="group-count">({{ getGroupSessionCount(group.id) }})</span>
            </div>

            <!-- 分组操作按钮 -->
            <div class="group-actions">
              <n-button
                text
                size="tiny"
                @click.stop="handlePinGroup(group)"
                :title="group.is_pinned ? '取消置顶' : '置顶'"
              >
                <template #icon>
                  <n-icon><PinOutline /></n-icon>
                </template>
              </n-button>

              <n-dropdown
                trigger="click"
                :options="[
                  { label: '重命名', key: 'rename' },
                  { label: '删除', key: 'delete' },
                ]"
                @select="(key) => handleGroupMenuSelect(key, group)"
              >
                <n-button text size="tiny" @click.stop title="更多操作">
                  <template #icon>
                    <n-icon><EllipsisHorizontalOutline /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>

          <!-- 分组下的会话列表 -->
          <div v-show="!collapsedGroups[group.id]" class="group-sessions">
            <div
              v-for="session in getGroupSessions(group.id)"
              :key="session.id"
              class="session-item"
              :class="{ active: session.id === currentSessionId }"
              @click="handleSelect(session)"
            >
              <div class="item-content">
                <!-- 置顶标志 -->
                <n-icon
                  v-if="session.is_pinned"
                  class="pin-icon"
                  size="14"
                  color="#ff9800"
                  title="已置顶"
                >
                  <PinOutline />
                </n-icon>
                <n-icon class="icon" size="16">
                  <ChatbubbleEllipsesOutline />
                </n-icon>
                <span class="text">{{ session.title }}</span>
              </div>

              <!-- 更多操作按钮 -->
              <n-dropdown
                trigger="click"
                :options="getSessionMenuOptions(session)"
                @select="(key) => handleSessionMenuSelect(key, session)"
                placement="right-start"
              >
                <button class="more-btn" @click.stop title="更多操作">
                  <n-icon size="16"><EllipsisHorizontalOutline /></n-icon>
                </button>
              </n-dropdown>
            </div>

            <div v-if="getGroupSessionCount(group.id) === 0" class="empty-group-hint">暂无会话</div>
          </div>
        </div>

        <!-- 未分组会话 -->
        <div v-if="getUngroupedSessions().length > 0" class="ungrouped-section">
          <div class="group-header">
            <div class="group-title">
              <n-icon size="16">
                <FolderOutline />
              </n-icon>
              <span>未分组</span>
              <span class="group-count">({{ getUngroupedSessions().length }})</span>
            </div>
          </div>

          <div
            v-for="session in getUngroupedSessions()"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="handleSelect(session)"
          >
            <div class="item-content">
              <!-- 置顶标志 -->
              <n-icon
                v-if="session.is_pinned"
                class="pin-icon"
                size="14"
                color="#ff9800"
                title="已置顶"
              >
                <PinOutline />
              </n-icon>
              <n-icon class="icon" size="16">
                <ChatbubbleEllipsesOutline />
              </n-icon>
              <span class="text">{{ session.title }}</span>
            </div>

            <!-- 更多操作按钮 -->
            <n-dropdown
              trigger="click"
              :options="getSessionMenuOptions(session)"
              @select="(key) => handleSessionMenuSelect(key, session)"
              placement="right-start"
            >
              <button class="more-btn" @click.stop title="更多操作">
                <n-icon size="16"><EllipsisHorizontalOutline /></n-icon>
              </button>
            </n-dropdown>
          </div>
        </div>
      </div>

      <n-empty v-if="sessions.length === 0" description="暂无会话" />
    </div>

    <!-- 创建分组模态框 -->
    <n-modal v-model:show="groupModalVisible" preset="card" title="新建分组" style="width: 500px">
      <n-space vertical>
        <n-input-group>
          <n-input-group-label>分组名称：</n-input-group-label>
          <n-input v-model:value="newGroupName" placeholder="请输入分组名称" />
        </n-input-group>

        <div>
          <div style="margin-bottom: 8px; font-size: 14px; color: #666">选择图标：</div>
          <n-space wrap>
            <n-button
              v-for="icon in presetIcons"
              :key="icon.key"
              :type="selectedGroupIcon === icon.component ? 'primary' : 'default'"
              @click="selectedGroupIcon = icon.component"
            >
              <template #icon>
                <n-icon><component :is="icon.component" /></n-icon>
              </template>
              {{ icon.label }}
            </n-button>
          </n-space>
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="groupModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleCreateGroup">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 重命名分组模态框 -->
    <n-modal
      v-model:show="renameGroupModalVisible"
      preset="card"
      title="重命名分组"
      style="width: 400px"
    >
      <n-space vertical>
        <n-input-group>
          <n-input-group-label>分组名称：</n-input-group-label>
          <n-input v-model:value="newGroupName" placeholder="请输入新的分组名称" />
        </n-input-group>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="renameGroupModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmRenameGroup">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 移动到分组模态框 -->
    <n-modal
      v-model:show="moveToGroupModalVisible"
      preset="card"
      title="移动到分组"
      style="width: 400px"
    >
      <n-space vertical>
        <div style="font-size: 14px; color: #666">选择目标分组：</div>
        <n-space vertical>
          <n-button
            v-for="group in groups"
            :key="group.id"
            :type="moveTargetGroup === group.id ? 'primary' : 'default'"
            block
            @click="moveTargetGroup = group.id"
          >
            <template #icon>
              <n-icon><FolderOutline /></n-icon>
            </template>
            {{ group.name }}
          </n-button>
        </n-space>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="moveToGroupModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleMoveToGroup">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 分享模态框 -->
    <n-modal v-model:show="shareModalVisible" preset="card" title="分享对话" style="width: 500px">
      <n-space vertical>
        <n-input :value="shareLink" readonly>
          <template #suffix>
            <n-button text type="primary" @click="copyShareLink">
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              复制
            </n-button>
          </template>
        </n-input>
      </n-space>
    </n-modal>

    <!-- 重命名会话模态框 -->
    <n-modal
      v-model:show="renameModalVisible"
      preset="card"
      title="重命名会话"
      style="width: 400px"
    >
      <n-input
        v-model:value="renameTitle"
        placeholder="请输入新的会话名称"
        @keydown.enter="handleConfirmRename"
      />

      <template #footer>
        <n-space justify="end">
          <n-button @click="renameModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmRename">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup name="SessionList">
import { ref, watch, onMounted, computed, h, reactive } from 'vue'
import {
  useMessage,
  useDialog,
  NButton,
  NIcon,
  NEmpty,
  NInput,
  NDropdown,
  NModal,
  NCard,
  NSpace,
  NInputGroup,
  NInputGroupLabel,
} from 'naive-ui'
import {
  AddOutline,
  CloseOutline,
  ChatbubbleEllipsesOutline,
  SearchOutline,
  EllipsisHorizontalOutline,
  CreateOutline,
  ArrowUpOutline,
  PinOutline,
  ShareSocialOutline,
  FolderOutline,
  AddCircleOutline,
  DownloadOutline,
  DocumentTextOutline,
  DocumentOutline,
  FileTrayFullOutline,
  CodeSlashOutline,
  TrashOutline,
  CopyOutline,
  ChevronDownOutline,
  ChevronForwardOutline,
  // 预设图标
  AirplaneOutline as TravelIcon,
  TrendingUpOutline as InvestmentIcon,
  BriefcaseOutline as WorkIcon,
  HeartOutline as HealthIcon,
  CodeSlashOutline as CodeIcon,
} from '@vicons/ionicons5'
import {
  getSessionList,
  createSession,
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

const props = defineProps({
  show: { type: Boolean, default: false },
  currentSessionId: { type: String, default: '' },
})

const emit = defineEmits(['update:show', 'select', 'create'])

const msgApi = useMessage()
const dialogApi = useDialog()

const sessions = ref([])
const groups = ref([]) // 分组列表
const searchKeyword = ref('')
const renameModalVisible = ref(false)
const renameSessionId = ref(null)
const renameTitle = ref('')
const shareModalVisible = ref(false)
const shareLink = ref('')

// 分组相关
const groupModalVisible = ref(false)
const moveToGroupModalVisible = ref(false)
const renameGroupModalVisible = ref(false) // 重命名分组模态框
const newGroupName = ref('')
const selectedGroupIcon = ref(null)
const currentMoveSession = ref(null) // 当前要移动的会话
const moveTargetGroup = ref(null) // 目标分组ID
const currentRenameGroup = ref(null) // 当前要重命名的分组
const collapsedGroups = reactive({}) // 记录折叠的分组状态

// 预设图标列表
const presetIcons = [
  { key: 'travel', label: '旅行', component: TravelIcon },
  { key: 'investment', label: '投资', component: InvestmentIcon },
  { key: 'work', label: '作业', component: WorkIcon },
  { key: 'health', label: '健康', component: HealthIcon },
  { key: 'code', label: '代码', component: CodeIcon },
  { key: 'folder', label: '其他', component: FolderOutline },
]

// 过滤后的会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return sessions.value
  }

  const keyword = searchKeyword.value.toLowerCase().trim()
  return sessions.value.filter((session) => {
    return session.title && session.title.toLowerCase().includes(keyword)
  })
})

// 获取未分组的会话
const getUngroupedSessions = () => {
  return sessions.value.filter((session) => !session.group_id)
}

// 获取指定分组的会话
const getGroupSessions = (groupId) => {
  return sessions.value.filter((session) => session.group_id === groupId)
}

// 获取分组下的会话数量
const getGroupSessionCount = (groupId) => {
  return getGroupSessions(groupId).length
}

// 获取会话菜单选项
const getSessionMenuOptions = (session) => {
  // 构建移动到分组的子菜单
  const moveToGroupChildren = [
    {
      label: '新建分组',
      key: 'new-group',
      icon: () => h(NIcon, null, { default: () => h(AddCircleOutline) }),
    },
  ]

  // 添加现有分组选项
  if (groups.value.length > 0) {
    groups.value.forEach((group) => {
      moveToGroupChildren.push({
        label: group.name,
        key: `group-${group.id}`,
        icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
      })
    })
  }

  return [
    {
      label: '重命名',
      key: 'rename',
      icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
    },
    {
      label: session.is_pinned ? '取消置顶' : '置顶此对话',
      key: 'pin',
      icon: () => h(NIcon, null, { default: () => h(PinOutline) }),
    },
    {
      label: '分享此对话',
      key: 'share',
      icon: () => h(NIcon, null, { default: () => h(ShareSocialOutline) }),
    },
    {
      type: 'divider',
      key: 'd1',
    },
    {
      label: '移动到分组',
      key: 'move-to-group',
      icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
      children: moveToGroupChildren,
    },
    {
      label: '导出对话',
      key: 'export',
      icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }),
      children: [
        {
          label: 'Markdown',
          key: 'export-markdown',
          icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) }),
        },
        {
          label: 'Word',
          key: 'export-word',
          icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) }),
        },
        {
          label: 'PDF',
          key: 'export-pdf',
          icon: () => h(NIcon, null, { default: () => h(DocumentOutline) }),
        },
        {
          label: 'TXT',
          key: 'export-txt',
          icon: () => h(NIcon, null, { default: () => h(FileTrayFullOutline) }),
        },
        {
          label: 'JSON',
          key: 'export-json',
          icon: () => h(NIcon, null, { default: () => h(CodeSlashOutline) }),
        },
      ],
    },
    {
      type: 'divider',
      key: 'd2',
    },
    {
      label: '删除此对话',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      props: {
        style: { color: '#ff4d4f' },
      },
    },
  ]
}

// 处理会话菜单选择
const handleSessionMenuSelect = async (key, session) => {
  console.log('选中菜单项:', key, session)

  // 处理移动到分组
  if (key.startsWith('group-')) {
    const groupId = key.replace('group-', '')
    await moveSessionToGroupAPI(session.id, groupId)
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
      // 打开移动到分组对话框
      currentMoveSession.value = session
      moveTargetGroup.value = session.group_id || null
      moveToGroupModalVisible.value = true
      break
    case 'export-markdown':
      await handleExport(session, 'export-markdown')
      break
    case 'export-word':
      await handleExport(session, 'word')
      break
    case 'export-pdf':
      await handleExport(session, 'pdf')
      break
    case 'export-txt':
      await handleExport(session, 'txt')
      break
    case 'export-json':
      await handleExport(session, 'json')
      break
    case 'delete':
      await handleDelete(session.id)
      break
  }
}

// 重命名会话
const handleRename = (session) => {
  renameSessionId.value = session.id
  renameTitle.value = session.title
  renameModalVisible.value = true
}

// 确认重命名
const handleConfirmRename = async () => {
  if (!renameTitle.value || !renameTitle.value.trim()) {
    msgApi.warning('会话名称不能为空')
    return
  }

  try {
    await updateSession(renameSessionId.value, { title: renameTitle.value.trim() })
    msgApi.success('重命名成功')
    renameModalVisible.value = false
    fetchSessions()
  } catch (error) {
    console.error('重命名失败:', error)
    msgApi.error('重命名失败')
  }
}

// 置顶会话
const handlePin = async (session) => {
  try {
    // 保存原始置顶状态
    const originalPinnedState = session.is_pinned
    
    // 先切换本地状态（优化用户体验）
    session.is_pinned = !originalPinnedState
    
    // 调用后端 API
    await pinSession(session.id)
    msgApi.success(originalPinnedState ? '已取消置顶' : '已置顶')
    
    // 同时刷新会话列表和分组列表（确保 group_id 数据完整）
    await Promise.all([
      fetchSessions(),
      fetchGroups()
    ])
  } catch (error) {
    console.error('置顶操作失败:', error)
    // 如果失败，恢复原状态
    const sessionToRestore = sessions.value.find(s => s.id === session.id)
    if (sessionToRestore) {
      sessionToRestore.is_pinned = session.is_pinned
    }
    msgApi.error('操作失败')
  }
}

// 分享会话
const handleShare = async (session) => {
  try {
    const res = await getShareInfo(session.id)
    const shareToken = res.data?.share_token
    if (shareToken) {
      shareLink.value = `${window.location.origin}/share/${shareToken}`
      shareModalVisible.value = true
    }
  } catch (error) {
    console.error('获取分享链接失败:', error)
    msgApi.error('获取分享链接失败')
  }
}

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard
    .writeText(shareLink.value)
    .then(() => {
      msgApi.success('链接已复制到剪贴板')
    })
    .catch(() => {
      msgApi.error('复制失败，请手动复制')
    })
}

// 打开创建分组模态框
const handleOpenCreateGroupModal = () => {
  currentMoveSession.value = null
  newGroupName.value = ''
  selectedGroupIcon.value = FolderOutline
  groupModalVisible.value = true
  moveToGroupModalVisible.value = false
}

// 创建分组
const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }

  try {
    const userId = localStorage.getItem('userId') || 'anonymous'

    // 调用后端 API 创建分组
    const res = await createGroup({
      name: newGroupName.value.trim(),
      icon: selectedGroupIcon.value?.name || 'FolderOutline',
      user_id: userId,
    })

    if (res.code === 200) {
      const newGroup = res.data

      // 刷新分组列表
      await fetchGroups()

      // 如果是从移动会话时创建分组，直接移动到新分组
      if (currentMoveSession.value) {
        await moveSessionToGroupAPI(currentMoveSession.value.id, newGroup.id)
      }

      msgApi.success(`分组 "${newGroup.name}" 创建成功`)
      groupModalVisible.value = false
      newGroupName.value = ''
      selectedGroupIcon.value = null
    } else {
      msgApi.error(res.message || '创建分组失败')
    }
  } catch (error) {
    console.error('创建分组失败:', error)
    msgApi.error('创建分组失败')
  }
}

// 移动会话到分组
const moveSessionToGroupAPI = async (sessionId, groupId) => {
  try {
    // 调用后端专用 API
    const res = await moveSessionToGroupApi(sessionId, groupId)

    if (res.code === 200) {
      // 更新本地状态
      const session = sessions.value.find((s) => s.id === sessionId)
      if (session) {
        session.group_id = groupId || null
      }

      // 同时刷新会话列表和分组列表（确保 group_id 数据完整）
      await Promise.all([
        fetchSessions(),
        fetchGroups()
      ])

      msgApi.success('已移动到分组')
    } else {
      msgApi.error(res.message || '移动失败')
    }
  } catch (error) {
    console.error('移动会话失败:', error)
    msgApi.error('移动失败')
  }
}

// 处理移动到分组确认
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

// 新建分组（从会话菜单触发）
const handleNewGroup = async (session) => {
  currentMoveSession.value = session
  newGroupName.value = ''
  selectedGroupIcon.value = FolderOutline
  groupModalVisible.value = true
}

// 导出会话对话
const handleExport = async (session, format) => {
  try {
    // 获取会话详情（包含消息列表）
    const res = await getSessionDetail(session.id)

    if (res.code !== 200 || !res.data) {
      msgApi.error('获取会话详情失败')
      return
    }

    const sessionData = res.data
    const messages = sessionData.messages || []

    if (messages.length === 0) {
      msgApi.warning('该会话没有消息，无法导出')
      return
    }

    // 根据格式执行不同的导出逻辑
    switch (format) {
      case 'export-markdown':
        exportAsMarkdown(sessionData, messages)
        break
      case 'txt':
        exportAsTXT(sessionData, messages)
        break
      case 'json':
        exportAsJSON(sessionData, messages)
        break
      case 'word':
        exportAsWord(sessionData, messages)
        break
      case 'pdf':
        exportAsPDF(sessionData, messages)
        break
      default:
        msgApi.warning(`暂不支持 ${format} 格式`)
    }
  } catch (error) {
    console.error('导出失败:', error)
    msgApi.error('导出失败，请稍后重试')
  }
}

// 导出为 Markdown 格式
const exportAsMarkdown = (session, messages) => {
  let markdown = `# ${session.title}\n\n`
  markdown += `> **创建时间**：${new Date(session.created_at).toLocaleString('zh-CN')}  \n`
  markdown += `> **消息数量**：${messages.length} 条\n\n`
  markdown += `---\n\n`

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 AI助手'
    const time = new Date(msg.created_at).toLocaleString('zh-CN')

    markdown += `## ${index + 1}. ${role}\n\n`
    markdown += `*${time}*\n\n`

    // 处理消息内容，保持 Markdown 格式
    const content = msg.content.trim()
    if (content) {
      // 如果内容本身包含 Markdown，直接保留
      markdown += `${content}\n\n`
    } else {
      markdown += `*(空消息)*\n\n`
    }

    markdown += `---\n\n`
  })

  // 添加导出信息
  markdown += `---\n\n`
  markdown += `*本文档由 AI 对话系统导出于 ${new Date().toLocaleString('zh-CN')}*\n`

  downloadFile(markdown, `${session.title || '会话'}.md`, 'text/markdown')
  msgApi.success('已导出为 Markdown 格式')
}

// 导出为 TXT 格式
const exportAsTXT = (session, messages) => {
  let content = `会话标题：${session.title}\n`
  content += `创建时间：${new Date(session.created_at).toLocaleString('zh-CN')}\n`
  content += `消息数量：${messages.length}\n`
  content += '='.repeat(50) + '\n\n'

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '用户' : 'AI助手'
    const time = new Date(msg.created_at).toLocaleString('zh-CN')
    content += `[${index + 1}] ${role} (${time})\n`
    content += `${msg.content}\n\n`
    content += '-'.repeat(30) + '\n\n'
  })

  downloadFile(content, `${session.title || '会话'}.txt`, 'text/plain')
  msgApi.success('已导出为 TXT 格式')
}

// 导出为 JSON 格式
const exportAsJSON = (session, messages) => {
  const exportData = {
    session: {
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      message_count: messages.length,
    },
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
    })),
    export_time: new Date().toISOString(),
  }

  const content = JSON.stringify(exportData, null, 2)
  downloadFile(content, `${session.title || '会话'}.json`, 'application/json')
  msgApi.success('已导出为 JSON 格式')
}

// 导出为 Word 格式（HTML）
const exportAsWord = (session, messages) => {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${session.title}</title>
  <style>
    body { font-family: Microsoft YaHei, Arial; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #409eff; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .message { margin: 15px 0; padding: 10px; border-radius: 5px; }
    .user { background-color: #f0f9ff; border-left: 3px solid #409eff; }
    .assistant { background-color: #f5f7fa; border-left: 3px solid #67c23a; }
    .role { font-weight: bold; margin-bottom: 5px; }
    .time { color: #999; font-size: 12px; }
    .content { margin-top: 5px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${session.title}</h1>
  <div class="meta">
    <p>创建时间：${new Date(session.created_at).toLocaleString('zh-CN')}</p>
    <p>消息数量：${messages.length}</p>
  </div>
`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '用户' : 'AI助手'
    const className = msg.role === 'user' ? 'user' : 'assistant'
    const time = new Date(msg.created_at).toLocaleString('zh-CN')

    html += `
  <div class="message ${className}">
    <div class="role">${role}</div>
    <div class="time">${time}</div>
    <div class="content">${escapeHtml(msg.content)}</div>
  </div>
`
  })

  html += `
</body>
</html>`

  downloadFile(html, `${session.title || '会话'}.html`, 'text/html')
  msgApi.success('已导出为 Word 格式（HTML）')
}

// 导出为 PDF 格式（提示用户使用浏览器打印）
const exportAsPDF = (session, messages) => {
  // 先导出为 HTML，然后提示用户使用浏览器打印为 PDF
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${session.title}</title>
  <style>
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
    body { font-family: Microsoft YaHei, Arial; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #409eff; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .message { margin: 15px 0; padding: 10px; border-radius: 5px; page-break-inside: avoid; }
    .user { background-color: #f0f9ff; border-left: 3px solid #409eff; }
    .assistant { background-color: #f5f7fa; border-left: 3px solid #67c23a; }
    .role { font-weight: bold; margin-bottom: 5px; }
    .time { color: #999; font-size: 12px; }
    .content { margin-top: 5px; white-space: pre-wrap; }
    .print-tip { background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="print-tip no-print">
    💡 提示：请使用浏览器的打印功能（Ctrl+P 或 Cmd+P），选择"另存为 PDF"即可保存为 PDF 文件
  </div>
  <h1>${session.title}</h1>
  <div class="meta">
    <p>创建时间：${new Date(session.created_at).toLocaleString('zh-CN')}</p>
    <p>消息数量：${messages.length}</p>
  </div>
`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '用户' : 'AI助手'
    const className = msg.role === 'user' ? 'user' : 'assistant'
    const time = new Date(msg.created_at).toLocaleString('zh-CN')

    html += `
  <div class="message ${className}">
    <div class="role">${role}</div>
    <div class="time">${time}</div>
    <div class="content">${escapeHtml(msg.content)}</div>
  </div>
`
  })

  // 使用字符串拼接避免 Vue 编译器误解析 script 标签
  const scriptTag = '<scr' + 'ipt>'
  const endScriptTag = '</scr' + 'ipt>'

  html += '\n  ' + scriptTag + '\n'
  html += '    // 自动打开打印对话框\n'
  html += '    setTimeout(() => window.print(), 500);\n'
  html += '  ' + endScriptTag + '\n'
  html += '</body>\n</html>'

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  msgApi.info('已在新窗口打开，请使用浏览器的打印功能保存为 PDF')
}

// HTML 转义函数
const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '\n': '<br>',
  }
  return text.replace(/[&<>"'\n]/g, (m) => map[m])
}

// 下载文件辅助函数
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 组件挂载时加载会话列表
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
    const userId = localStorage.getItem('userId') || 'anonymous'
    const res = await getSessionList(userId)
    console.log('获取会话列表成功:', res.data)
    sessions.value = res.data || []
  } catch (error) {
    console.error('获取会话列表失败:', error)
    sessions.value = []
  }
}

// 加载分组列表
const fetchGroups = async () => {
  try {
    const userId = localStorage.getItem('userId') || 'anonymous'
    const res = await getGroupList(userId)

    if (res.code === 200) {
      groups.value = res.data || []
    } else {
      console.error('获取分组列表失败:', res.message)
      groups.value = []
    }
  } catch (error) {
    console.error('获取分组列表失败:', error)
    groups.value = []
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

const handleDelete = (sessionId) => {
  dialogApi.warning({
    title: '确认删除',
    content: '删除后将无法恢复此会话，确定要删除吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSession(sessionId)
        msgApi.success('删除成功')
        fetchSessions()

        // 如果删除的是当前选中的会话，清空选择
        if (props.currentSessionId === sessionId) {
          emit('select', null)
        }
      } catch (error) {
        msgApi.error('删除失败')
      }
    },
  })
}

// 切换分组折叠状态
const toggleGroupCollapse = (groupId) => {
  collapsedGroups[groupId] = !collapsedGroups[groupId]
}

// 置顶/取消置顶分组
const handlePinGroup = async (group) => {
  try {
    await pinGroup(group.id)
    msgApi.success(group.is_pinned ? '已取消置顶' : '已置顶')
    fetchGroups()
  } catch (error) {
    console.error('置顶操作失败:', error)
    msgApi.error('操作失败')
  }
}

// 处理分组菜单选择
const handleGroupMenuSelect = (key, group) => {
  switch (key) {
    case 'rename':
      handleRenameGroup(group)
      break
    case 'delete':
      handleDeleteGroup(group)
      break
  }
}

// 打开重命名分组模态框
const handleRenameGroup = (group) => {
  currentRenameGroup.value = group
  newGroupName.value = group.name
  renameGroupModalVisible.value = true
}

// 确认重命名分组
const handleConfirmRenameGroup = async () => {
  if (!newGroupName.value.trim()) {
    msgApi.warning('分组名称不能为空')
    return
  }

  try {
    const res = await updateGroup(currentRenameGroup.value.id, {
      name: newGroupName.value.trim(),
    })

    if (res.code === 200) {
      msgApi.success('重命名成功')
      renameGroupModalVisible.value = false
      currentRenameGroup.value = null
      newGroupName.value = ''
      // 刷新分组列表
      await fetchGroups()
    } else {
      msgApi.error(res.message || '重命名失败')
    }
  } catch (error) {
    console.error('重命名分组失败:', error)
    msgApi.error('重命名失败')
  }
}

// 删除分组
const handleDeleteGroup = async (group) => {
  dialogApi.warning({
    title: '确认删除分组',
    content: `删除分组后，该分组下的 ${getGroupSessionCount(group.id)} 个会话将移动到未分组。确定要删除吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 调用后端 API 删除分组
        const res = await deleteGroup(group.id)

        if (res.code === 200) {
          // 刷新列表
          await fetchGroups()
          await fetchSessions()

          msgApi.success('分组已删除')
        } else {
          msgApi.error(res.message || '删除失败')
        }
      } catch (error) {
        console.error('删除分组失败:', error)
        msgApi.error('删除失败')
      }
    },
  })
}
</script>

<style scoped>
.session-panel {
  height: 80%;
  display: flex;
  flex-direction: column;
  background: white;
  max-height: 80%;
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

/* 搜索区域样式 */
.search-section {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.search-section :deep(.n-input) {
  background: #f5f5f5;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.search-section :deep(.n-input:hover) {
  background: #ebebeb;
}

.search-section :deep(.n-input:focus-within) {
  background: white;
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.2);
}

.search-section :deep(.n-input__input-el) {
  font-size: 13px;
}

.search-section :deep(.n-input__prefix) {
  color: #999;
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

/* 分组区域样式 */
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
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-header:hover {
  background: #ebebeb;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.group-count {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.group-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.group-header:hover .group-actions {
  opacity: 1;
}

.group-sessions {
  padding-left: 20px;
}

.empty-group-hint {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* 未分组会话区域 */
.ungrouped-section {
  margin-top: 8px;
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
  position: relative;
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

/* 置顶标志样式 */
.pin-icon {
  flex-shrink: 0;
}

.icon {
  flex-shrink: 0;
}

.text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

/* 更多操作按钮样式 */
.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #999;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.session-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background: #e0e0e0;
  color: #666;
}

.session-item.active .more-btn:hover {
  background: rgba(16, 163, 127, 0.1);
  color: #10a37f;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
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
  background: #ff4d4f;
  color: white;
}
</style>
