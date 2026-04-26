import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

/**
 * Markdown 渲染工具
 * 基于 markdown-it + 插件体系 + 最小化修复策略
 */

// 创建 markdown-it 实例(模块级单例)
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(str).value
  },
})

// 自定义代码块渲染 - 添加复制按钮和高亮
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const code = token.content
  const lang = token.info.trim()

  // 使用 markdown-it 的高亮函数处理代码
  const highlightedCode = options.highlight 
    ? options.highlight(code, lang) 
    : hljs.highlightAuto(code).value

  // 转义 HTML 特殊字符用于 data 属性
  const escapedCode = code.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')

  // 添加代码块包装容器 - 默认深色主题
  return `<div class="code-block-wrapper dark-theme" data-lang="${lang || 'plaintext'}">
    <div class="code-header">
      <span class="code-lang">${lang || 'plaintext'}</span>
      <div class="code-actions">
        <button class="code-action-btn" data-action="edit" title="编辑">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>编辑</span>
        </button>
        <button class="code-action-btn" data-action="copy" title="复制">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>复制</span>
        </button>
        <button class="code-action-btn" data-action="theme" title="切换主题">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button class="code-action-btn" data-action="collapse" title="展开/收起">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>
    </div>
    <div class="code-content">
      <pre><code class="hljs ${lang ? `language-${lang}` : ''}">${highlightedCode}</code></pre>
      <textarea class="code-editor" style="display:none;" data-original-code="${escapedCode}">${code}</textarea>
    </div>
  </div>`
}

// 自定义表格渲染 - 添加复制和下载按钮
md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  return `<div class="table-wrapper"><div class="table-header">
    <button class="table-copy-btn" data-action="copy-table">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
        <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
      </svg>
      <span>复制</span>
    </button>
    <button class="table-download-btn" data-action="download-table">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 00.708 0l3-3a.5.5 0 00-.708-.708L8.5 10.293V1.5a.5.5 0 00-1 0v8.793L5.354 8.146a.5.5 0 10-.708.708l3 3z"/>
      </svg>
      <span>下载CSV</span>
    </button>
  </div><table>`
}

md.renderer.rules.table_close = function (tokens, idx, options, env, self) {
  return '</table></div>'
}

// 全局函数挂载
if (typeof window !== 'undefined') {
  // 删除所有 window 全局函数，改用事件委托方案
  // 这些函数将在 Vue 组件中通过事件委托调用
}

// 导出所有需要的函数、类和 markdown 实例
export { md, fixBrokenCodeBlocks, StreamMarkdownProcessor }

// 最小化修复:修复 Markdown 格式问题
function fixBrokenCodeBlocks(content) {
  if (!content) return content

  return content
    // 1. 修复断裂的代码块结束标记
    .replace(/```\n`+$/gm, '```')
    .replace(/```\n``?`?$/gm, '```')
    // 2. 修复标题格式: #后面必须有且仅有一个空格
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    // 3. 修复列表格式: -/*/+ 后面必须有且仅有一个空格(但不能匹配加粗的 **)
    .replace(/^(\s*[-*+])(?!\*\*)([^\s])/gm, '$1 $2')
    // 4. 修复数字列表格式: 1. 后面必须有且仅有一个空格
    .replace(/^(\s*\d+\.)([^\s])/gm, '$1 $2')
    // 5. 修复断裂的 Markdown 链接: [文字](链接) 或 [文字](
    .replace(/\[([^\]]+)\]\($/gm, '[$1]()')  // [文字]( → [文字]()
    .replace(/\[([^\]]+)\]\(([^)]*)$/gm, '[$1]($2)')  // 确保链接完整
}

// 流式 Markdown 处理器
class StreamMarkdownProcessor {
  constructor() {
    this.rawContent = ''
    this.isStreaming = true
    this.lastLength = 0 // 记录上次的内容长度
  }

  // 接收流式数据
  push(chunk) {
    // 只追加新增的内容,避免重复
    const newContent = chunk.slice(this.lastLength)
    this.rawContent += newContent
    this.lastLength = chunk.length

    if (this.isStreaming) {
      // 流式阶段:返回纯文本
      return this.rawContent
    }
  }

  // 完成流式输出
  complete() {
    this.isStreaming = false

    // 最小化修复:只修复断裂的代码块
    const fixedContent = fixBrokenCodeBlocks(this.rawContent)

    // 使用 markdown-it 渲染
    return md.render(fixedContent)
  }

  // 获取原始内容
  getRawContent() {
    return this.rawContent
  }

  // 重置
  reset() {
    this.rawContent = ''
    this.isStreaming = true
    this.lastLength = 0
  }
}

