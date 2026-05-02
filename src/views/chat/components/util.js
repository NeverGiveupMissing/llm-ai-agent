// 说明：聊天流式请求工具 - 处理 SSE 流式通信和记忆参数传递

import { sendChatMessage } from '@/api/chat'
import { stream } from '@/utils/http'
import { CHAT_CONFIG } from '@/utils/constants'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 生成默认 userId（实际项目中应从登录信息获取）
const DEFAULT_USER_ID =
  'user_' + (localStorage.getItem('userId') || Math.random().toString(36).substr(2, 9))
localStorage.setItem('userId', DEFAULT_USER_ID.replace('user_', ''))

/**
 * 构建 SSE 回调处理器
 * @param {Object} callbacks - 业务层回调
 * @returns {Object} SSE 层回调
 */
function buildSSECallbacks(callbacks) {
  return {
    onMessage: (data) => {
      const content = typeof data === 'string' ? data : data.content
      // 修复：只过滤 null/undefined，保留空格和换行符
      if (content != null && content !== '' && callbacks.onChunk) {
        callbacks.onChunk(content)
      }
    },
    onComplete: () => {
      callbacks.onDone?.()
    },
    onError: (error) => {
      callbacks.onError?.(error)
    },
  }
}

/**
 * 创建流式聊天控制器
 */
export function createChatStream() {
  const sseController = stream.controller()

  return {
    send: (messages, callbacks, sessionId) => {
      // 获取 sessionId
      const currentSessionId = sessionId || localStorage.getItem('current_session_id') || 'default'

      // 获取 userId
      const currentUserId = localStorage.getItem('userId') || 'anonymous'

      return stream.sse({
        url: `${CHAT_CONFIG.API_PREFIX}/chat`,
        data: {
          messages,
          stream: true,
          sessionId: currentSessionId,
          userId: currentUserId,
        },
        useTypewriter:
          callbacks.useTypewriter !== undefined
            ? callbacks.useTypewriter
            : CHAT_CONFIG.TYPEWRITER_ENABLED,
        typewriterDelay:
          callbacks.typewriterDelay !== undefined
            ? callbacks.typewriterDelay
            : CHAT_CONFIG.TYPEWRITER_DELAY,
        callbacks: buildSSECallbacks(callbacks),
        signal: sseController.signal,
      })
    },

    abort: () => {
      sseController.abort()
    },

    isAborted: () => sseController.isAborted(),
  }
}

// ========== Markdown 渲染相关 ==========

let copyId = 0
let tableId = 0

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    const highlighted = hljs.highlight(str, { language }).value
    const id = `code-${++copyId}`

    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${language}</span>
          <button class="code-copy-btn" onclick="window.copyCode('${id}')" data-code-id="${id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            复制
          </button>
        </div>
        <pre class="hljs" id="${id}"><code class="language-${language}">${highlighted}</code></pre>
      </div>
    `
  },
})

// 自定义表格渲染：添加复制和下载CSV功能
md.renderer.rules.table_open = (tokens, idx) => {
  const id = `table-${++tableId}`
  return `<div class="table-wrapper"><div class="table-header"><button class="table-copy-btn" onclick="window.copyTable('${id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制</button><button class="table-download-btn" onclick="window.downloadTableCSV('${id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>下载CSV</button></div><table id="${id}">`
}

md.renderer.rules.table_close = () => '</table></div>'

// Copy functionality
if (typeof window !== 'undefined') {
  window.copyCode = function (id) {
    const code = document.getElementById(id)?.innerText || ''
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector(`[data-code-id="${id}"]`)
      if (btn) {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>已复制`
        btn.style.color = '#10a37f'
        setTimeout(() => {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制`
          btn.style.color = ''
        }, 2000)
      }
    })
  }

  // 复制表格
  window.copyTable = function (id) {
    const table = document.getElementById(id)
    if (!table) return

    // 提取表格文本（制表符分隔）
    const rows = Array.from(table.querySelectorAll('tr'))
    const text = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells.map((cell) => cell.textContent.trim()).join('\t')
      })
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      const btn = table.parentElement.querySelector('.table-copy-btn')
      if (btn) {
        const originalHTML = btn.innerHTML
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>已复制`
        btn.style.color = '#10a37f'
        setTimeout(() => {
          btn.innerHTML = originalHTML
          btn.style.color = ''
        }, 2000)
      }
    })
  }

  // 下载表格为CSV
  window.downloadTableCSV = function (id) {
    const table = document.getElementById(id)
    if (!table) return

    // 提取表格数据
    const rows = Array.from(table.querySelectorAll('tr'))
    const csvContent = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells
          .map((cell) => {
            let text = cell.textContent.trim()
            // 如果内容包含逗号或引号,需要转义
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
              text = '"' + text.replace(/"/g, '""') + '"'
            }
            return text
          })
          .join(',')
      })
      .join('\n')

    // 添加BOM以支持中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `table_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }
}

// Export markdown utility
export { md }
