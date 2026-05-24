<template>
  <div class="ai-message-wrapper">
    <div class="message-icon ai-icon">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="12" fill="url(#aiGradient)"/>
        <rect x="8" y="8" width="2.5" height="8" rx="1.25" fill="white"/>
        <rect x="13.5" y="8" width="2.5" height="8" rx="1.25" fill="white"/>
        <defs>
          <linearGradient id="aiGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="message-content assistant-content">
      <!-- 思考中动画 -->
      <div v-if="isThinking" class="thinking-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <!-- 消息内容 -->
      <div v-else ref="messageTextRef" class="message-text markdown-rendered" v-html="displayContent" />
      <span v-if="isStreaming" class="typing-cursor"></span>

      <!-- ✅ 操作按钮组 - 绝对定位在气泡内部右下角 -->
      <div class="action-buttons-wrapper">
        <n-button text circle size="tiny" class="action-btn" @click="$emit('copy')" title="复制">
          <template #icon>
            <n-icon><CopyOutline /></n-icon>
          </template>
        </n-button>
        <n-button text circle size="tiny" class="action-btn" @click="$emit('regenerate')" title="重新生成">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>

      <!-- 操作按钮 -->
      <MessageActions
        v-if="showActions"
        @copy="handleCopy"
        @regenerate="handleRegenerate"
        @share="handleShare"
        @feedback="handleFeedback"
      />
    </div>
  </div>
</template>

<script setup name="AIMessage">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { CopyOutline, RefreshOutline } from '@vicons/ionicons5'
import { md, fixBrokenCodeBlocks } from '@/utils/markdown'
import MessageActions from './MessageActions.vue'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  isStreaming: {
    type: Boolean,
    default: false,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['copy', 'regenerate', 'share', 'feedback'])

const msgApi = useMessage()
const displayContent = ref('')
const isThinking = ref(false)

// 实时渲染 Markdown(带防抖优化)
let renderTimer = null
function renderMarkdown(content) {
  if (!content) {
    displayContent.value = ''
    return
  }

  if (renderTimer) {
    clearTimeout(renderTimer)
  }

  if (props.isStreaming) {
    renderTimer = setTimeout(() => {
      const fixedContent = fixBrokenCodeBlocks(content)
      displayContent.value = md.render(fixedContent)
    }, 50)
  } else {
    const fixedContent = fixBrokenCodeBlocks(content)
    displayContent.value = md.render(fixedContent)
  }
}

// 监听消息内容变化
watch(
  () => props.content,
  (newContent) => {
    renderMarkdown(newContent)
  },
  { immediate: true },
)

// 事件处理
const handleCopy = () => {
  emit('copy', props.content)
}

const handleRegenerate = () => {
  emit('regenerate')
}

const handleShare = () => {
  emit('share')
}

const handleFeedback = (type) => {
  emit('feedback', type)
  //  提示由父组件 ChatMessage 统一处理，避免重复提示
}

// 事件委托：处理代码块工具栏按钮点击
const messageTextRef = ref(null)

const handleClick = (event) => {
  const btn = event.target.closest('[data-action]')
  if (!btn) return

  const action = btn.dataset.action
  console.log('🔘 按钮点击事件触发:', action)

  switch (action) {
    case 'copy':
      handleCodeCopy(btn)
      break
    case 'edit':
      handleCodeEdit(btn)
      break
    case 'theme':
      handleCodeTheme(btn)
      break
    case 'collapse':
      handleCodeCollapse(btn)
      break
    case 'copy-table':
      handleTableCopy(btn)
      break
    case 'download-table':
      handleTableDownload(btn)
      break
  }
}

const handleCodeCopy = async (btn) => {
  console.log('📋 复制按钮被点击')
  const wrapper = btn.closest('.code-block-wrapper')
  const codeElement = wrapper.querySelector('code')
  const text = codeElement.innerText

  console.log('📋 准备复制的代码长度:', text.length)

  const originalHTML = btn.innerHTML

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      throw new Error('Clipboard API 不可用')
    }
    
    console.log('✅ 代码复制成功')
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>已复制!</span>
    `
    setTimeout(() => {
      btn.innerHTML = originalHTML
    }, 2000)
  } catch (err) {
    console.error('❌ 代码复制失败:', err)
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      console.log('✅ 降级复制成功')
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>已复制!</span>
      `
      setTimeout(() => {
        btn.innerHTML = originalHTML
      }, 2000)
    } catch (e) {
      console.error('❌ 降级复制也失败:', e)
      msgApi.error('复制失败，请手动选择代码复制')
    }
    document.body.removeChild(textarea)
  }
}

const handleCodeEdit = (btn) => {
  console.log('✏️ 编辑按钮被点击')
  const wrapper = btn.closest('.code-block-wrapper')
  const codeContent = wrapper.querySelector('.code-content')
  const pre = codeContent.querySelector('pre')
  const editor = codeContent.querySelector('.code-editor')

  if (editor.style.display === 'none') {
    // 切换到编辑模式
    pre.style.display = 'none'
    editor.style.display = 'block'
    btn.querySelector('span').textContent = '保存'
    btn.querySelector('svg').innerHTML = `
      <polyline points="20 6 9 17 4 12"></polyline>
    `
    btn.title = '保存'
  } else {
    // 保存并切换回预览模式
    const newCode = editor.value
    const lang = wrapper.dataset.lang || 'plaintext'
    
    console.log('📝 保存代码,语言:', lang)
    
    try {
      let highlightedCode
      if (lang === 'plaintext' || lang === 'text') {
        highlightedCode = newCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      } else if (typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
        highlightedCode = hljs.highlight(newCode, { 
          language: lang,
          ignoreIllegals: true 
        }).value
      } else {
        highlightedCode = typeof hljs !== 'undefined' ? hljs.highlightAuto(newCode).value : newCode
      }

      const codeElement = pre.querySelector('code')
      codeElement.className = `hljs ${lang ? `language-${lang}` : ''}`
      codeElement.innerHTML = highlightedCode

      pre.style.display = 'block'
      editor.style.display = 'none'
      btn.querySelector('span').textContent = '编辑'
      btn.querySelector('svg').innerHTML = `
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      `
      btn.title = '编辑'
      
      console.log('✅ 代码保存成功')
    } catch (error) {
      console.error('❌ 代码高亮失败:', error)
      const codeElement = pre.querySelector('code')
      codeElement.className = 'hljs'
      codeElement.textContent = newCode
      
      pre.style.display = 'block'
      editor.style.display = 'none'
      btn.querySelector('span').textContent = '编辑'
      btn.querySelector('svg').innerHTML = `
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      `
      btn.title = '编辑'
    }
  }
}

const handleCodeTheme = (btn) => {
  const wrapper = btn.closest('.code-block-wrapper')
  wrapper.classList.toggle('light-theme')
}

const handleCodeCollapse = (btn) => {
  const wrapper = btn.closest('.code-block-wrapper')
  wrapper.classList.toggle('collapsed')
}

const handleTableCopy = async (btn) => {
  const wrapper = btn.closest('.table-wrapper')
  const table = wrapper.querySelector('table')

  const rows = Array.from(table.querySelectorAll('tr')).map((row) => {
    return Array.from(row.querySelectorAll('th, td'))
      .map((cell) => cell.innerText.trim().replace(/\|/g, '\\|'))
      .join('\t')
  })

  const text = rows.join('\n')
  
  try {
    await navigator.clipboard.writeText(text)
    const originalText = btn.querySelector('span').textContent
    btn.querySelector('span').textContent = '已复制!'
    setTimeout(() => {
      btn.querySelector('span').textContent = originalText
    }, 2000)
  } catch (err) {
    console.error('❌ 表格复制失败:', err)
    msgApi.error('复制失败')
  }
}

const handleTableDownload = (btn) => {
  const wrapper = btn.closest('.table-wrapper')
  const table = wrapper.querySelector('table')

  const rows = Array.from(table.querySelectorAll('tr')).map((row) => {
    return Array.from(row.querySelectorAll('th, td'))
      .map((cell) => `"${cell.innerText.trim().replace(/"/g, '""')}"`)
      .join(',')
  })

  const csv = rows.join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'table.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

// 在组件挂载后设置事件委托
onMounted(() => {
  // 使用 ref 直接获取元素，不需要 setTimeout
  if (messageTextRef.value) {
    messageTextRef.value.addEventListener('click', handleClick)
    console.log('✅ 事件委托已设置')
  } else {
    console.warn('⚠️ messageTextRef 未找到元素')
  }
})

// 在组件卸载前移除事件监听器
onUnmounted(() => {
  if (messageTextRef.value) {
    messageTextRef.value.removeEventListener('click', handleClick)
    console.log('🗑️ 事件委托已移除')
  }
})

</script>

<style scoped>
/* ✅ AI 消息容器 - 靠左对齐 */
.ai-message-wrapper {
  display: flex;
  flex-direction: row; /* ✅ 头像在左，气泡在右 */
  gap: 16px;
  align-self: flex-start; /* ✅ 靠左对齐 */
}

/* ✅ AI 消息气泡 - 毛玻璃深紫色 + 相对定位 */
.assistant-content {
  position: relative; /* ✅ 为绝对定位按钮提供参照 */
  max-width: 85%;
  flex: 1;
  background: rgba(32, 22, 54, 0.45); /* ✅ 半透明深紫色 */
  backdrop-filter: blur(12px); /* ✅ 毛玻璃模糊 */
  -webkit-backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(177, 134, 255, 0.3); /* ✅ 极光紫边框 */
  box-shadow: 0 4px 15px rgba(177, 134, 255, 0.08); /* ✅ 紫色外发光 */
  transition: all 0.3s ease; /* ✅ 平滑过渡 */
}

/* ✅ 鼠标悬浮时的全息亮化特效 */
.assistant-content:hover {
  background: rgba(42, 32, 74, 0.65); /* ✅ 背景变亮 */
  border-color: rgba(177, 134, 255, 0.5); /* ✅ 边框加亮 */
  box-shadow: 0 6px 25px rgba(177, 134, 255, 0.2); /* ✅ 增强紫色外发光 */
}

.assistant-content .message-text {
  color: white; /* ✅ 白色文字 */
  line-height: 1.7;
  word-break: break-word;
  font-size: 15px;
}

/* ✅ 操作按钮组 - 绝对定位在气泡内部右下角 */
.action-buttons-wrapper {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0; /* ✅ 默认隐藏 */
  transform: translateY(6px); /* ✅ 默认向下偏移 */
  transition: all 0.25s ease-in-out; /* ✅ 淡入动画 */
  pointer-events: none; /* ✅ 隐藏时不响应鼠标 */
}

/* ✅ 悬浮时显示按钮组 */
.assistant-content:hover .action-buttons-wrapper {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* ✅ 操作按钮样式 */
.action-btn {
  color: rgba(255, 255, 255, 0.4) !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: rgba(255, 255, 255, 1) !important;
  background: rgba(177, 134, 255, 0.15) !important;
  box-shadow: 0 0 10px rgba(177, 134, 255, 0.3);
}

/* ✅ 删除按钮特殊样式 */
.action-btn.danger:hover {
  background: rgba(255, 77, 79, 0.2) !important;
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.3);
}

/* ✅ AI 头像 - 精致圆形 + 微光圆环 */
.ai-icon {
  flex-shrink: 0; /* ✅ 防止被挤压 */
  width: 40px; /* ✅ 固定大小 */
  height: 40px; /* ✅ 固定大小 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* ✅ 圆形 */
  margin-top: 2px;
  background: white;
  box-shadow: 0 0 0 1px rgba(177, 134, 255, 0.2), /* ✅ 极细微光圆环 */
              0 2px 8px rgba(59, 130, 246, 0.3);
  padding: 0;
}

/* 思考动画 */
.thinking-animation {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 打字光标 */
.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #10a37f;
  font-weight: 500;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>