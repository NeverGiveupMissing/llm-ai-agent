/**
 * 会话导出工具函数
 * 支持多种格式导出：Markdown, TXT, JSON, Word, PDF
 */

import { downloadFile } from '@/utils'

/**
 * 导出为 Markdown 格式
 */
export const exportAsMarkdown = (session, messages) => {
  let md = `# ${session.title}\n\n> **创建时间**：${new Date(session.created_at).toLocaleString('zh-CN')}\n> **消息数量**：${messages.length} 条\n\n---\n\n`
  messages.forEach((msg, i) => {
    md += `## ${i + 1}. ${msg.role === 'user' ? '👤 用户' : ' AI助手'}\n*${new Date(msg.created_at).toLocaleString('zh-CN')}*\n\n${msg.content.trim() || '*(空消息)*'}\n\n---\n\n`
  })
  downloadFile(md, `${session.title || '会话'}.md`, 'text/markdown')
}

/**
 * 导出为 TXT 格式
 */
export const exportAsTXT = (session, messages) => {
  let txt = `会话标题：${session.title}\n创建时间：${new Date(session.created_at).toLocaleString('zh-CN')}\n消息数量：${messages.length}\n${'='.repeat(50)}\n\n`
  messages.forEach((msg, i) => {
    txt += `[${i + 1}] ${msg.role === 'user' ? '用户' : 'AI助手'} (${new Date(msg.created_at).toLocaleString('zh-CN')})\n${msg.content}\n\n${'-'.repeat(30)}\n\n`
  })
  downloadFile(txt, `${session.title || '会话'}.txt`, 'text/plain')
}

/**
 * 导出为 JSON 格式
 */
export const exportAsJSON = (session, messages) => {
  const data = {
    session: {
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      message_count: messages.length,
    },
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
    export_time: new Date().toISOString(),
  }
  downloadFile(JSON.stringify(data, null, 2), `${session.title || '会话'}.json`, 'application/json')
}

/**
 * 导出为 Word 格式 (HTML)
 */
export const exportAsWord = (session, messages) => {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${session.title}</title><style>body{font-family:Microsoft YaHei;padding:20px}h1{border-bottom:2px solid #409eff}.message{margin:10px 0;padding:10px;border-radius:5px}.user{background:#f0f9ff}.assistant{background:#f5f7fa}</style></head><body><h1>${session.title}</h1>`
  messages.forEach((m) => {
    html += `<div class="message ${m.role}"><b>${m.role === 'user' ? '用户' : 'AI'}</b><br>${m.content}</div>`
  })
  html += '</body></html>'
  downloadFile(html, `${session.title || '会话'}.html`, 'text/html')
}

/**
 * 导出为 PDF 格式 (通过浏览器打印)
 */
export const exportAsPDF = (session, messages) => {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${session.title}</title><style>body{font-family:Microsoft YaHei;padding:20px}.message{margin:10px 0;padding:10px;border:1px solid #ddd}</style></head><body><h1>${session.title}</h1>`
  messages.forEach((m) => {
    html += `<div class="message"><b>${m.role}</b><br>${m.content}</div>`
  })
  html += '<script>setTimeout(()=>window.print(),500)<\/script></body></html>'
  window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank')
}

/**
 * 主导出函数 - 根据格式调用对应的导出方法
 */
export const handleExport = async (session, format, getSessionDetailApi, msgApi) => {
  try {
    const res = await getSessionDetailApi(session.id)
    if (res.code !== 200 || !res.data) {
      msgApi.error('获取会话详情失败')
      return
    }
    const messages = res.data.messages || []
    if (messages.length === 0) {
      msgApi.warning('该会话没有消息，无法导出')
      return
    }

    switch (format) {
      case 'export-markdown':
        exportAsMarkdown(res.data, messages)
        msgApi.success('已导出为 Markdown 格式')
        break
      case 'txt':
        exportAsTXT(res.data, messages)
        msgApi.success('已导出为 TXT 格式')
        break
      case 'json':
        exportAsJSON(res.data, messages)
        msgApi.success('已导出为 JSON 格式')
        break
      case 'word':
        exportAsWord(res.data, messages)
        msgApi.success('已导出为 Word 格式')
        break
      case 'pdf':
        exportAsPDF(res.data, messages)
        msgApi.info('已在新窗口打开，请使用浏览器打印为 PDF')
        break
      default:
        msgApi.warning(`暂不支持 ${format} 格式`)
    }
  } catch (error) {
    msgApi.error('导出失败，请稍后重试')
  }
}
