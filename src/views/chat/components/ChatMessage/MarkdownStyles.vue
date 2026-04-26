<template>
  <!-- 这是一个纯样式组件,用于提供Markdown渲染的公共样式 -->
</template>

<script setup name="MarkdownStyles">
// 无需逻辑
</script>

<style scoped>
/* ===== Markdown 渲染样式 ===== */
/* 代码块 - 配合 highlight.js */
:deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
  border: 1px solid #333;
  position: relative;
}

:deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

:deep(.code-lang) {
  font-size: 0.85em;
  color: #9cdcfe;
  font-weight: 500;
  text-transform: lowercase;
}

:deep(.code-actions) {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.code-action-btn) {
  position: relative;
  z-index: 10; /* 确保按钮在代码块内容之上 */
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #999;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto; /* 确保按钮本身可以接收点击事件 */
}

:deep(.code-action-btn:hover) {
  background: #3d3d3d;
  color: #fff;
}

:deep(.code-action-btn svg) {
  width: 16px;
  height: 16px;
  pointer-events: none; /* 防止SVG拦截点击事件 */
}

:deep(.code-action-btn span) {
  pointer-events: none; /* 防止文本拦截点击事件 */
}

:deep(.code-block-wrapper pre) {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: auto;
  background: transparent !important;
  border: none !important;
}

:deep(.code-content) {
  display: block !important;
  overflow: hidden;
}

:deep(.code-block-wrapper code) {
  display: block !important;
  padding: 12px 16px !important;
  margin: 0 !important;
  background: transparent !important;
  color: #d4d4d4 !important;
  font-size: 0.85em;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre !important;
}

/* 代码编辑器 */
:deep(.code-editor) {
  width: 100%;
  min-height: 200px;
  padding: 12px 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  font-size: 0.85em;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

/* 代码块收起状态 */
:deep(.code-block-wrapper.collapsed .code-content) {
  display: none;
}

:deep(.code-block-wrapper.collapsed .code-action-btn:first-child svg) {
  transform: rotate(-90deg);
}

/* 深色主题 (默认) */
:deep(.code-block-wrapper.dark-theme) {
  background: #1e1e1e;
  border-color: #333;
}

:deep(.code-block-wrapper.dark-theme .code-header) {
  background: #2d2d2d;
  border-bottom-color: #3d3d3d;
}

:deep(.code-block-wrapper.dark-theme .code-lang) {
  color: #9cdcfe;
}

:deep(.code-block-wrapper.dark-theme .code-action-btn) {
  color: #999;
}

:deep(.code-block-wrapper.dark-theme .code-action-btn:hover) {
  background: #3d3d3d;
  color: #fff;
}

:deep(.code-block-wrapper.dark-theme code) {
  color: #d4d4d4;
}

:deep(.code-block-wrapper.dark-theme .code-editor) {
  background: #1e1e1e;
  color: #d4d4d4;
}

/* 浅色主题 */
:deep(.code-block-wrapper.light-theme) {
  background: #f6f8fa;
  border-color: #d0d7de;
}

:deep(.code-block-wrapper.light-theme .code-header) {
  background: #f0f0f0;
  border-bottom-color: #d0d7de;
}

:deep(.code-block-wrapper.light-theme .code-lang) {
  color: #57606a;
}

:deep(.code-block-wrapper.light-theme .code-action-btn) {
  color: #57606a;
}

:deep(.code-block-wrapper.light-theme .code-action-btn:hover) {
  background: #e0e0e0;
  color: #1f2328;
}

:deep(.code-block-wrapper.light-theme code) {
  color: #24292f;
}

:deep(.code-block-wrapper.light-theme .code-editor) {
  background: #ffffff;
  color: #24292f;
}

/* 引用块 */
:deep(.message-rendered blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #10a37f;
  background: #f9f9f9;
  color: #555;
  border-radius: 0 6px 6px 0;
}

:deep(.message-rendered blockquote p) {
  margin: 0;
}

/* 链接 */
:deep(.message-rendered a) {
  color: #10a37f;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

:deep(.message-rendered a:hover) {
  border-bottom-color: #10a37f;
}

/* 表格容器 */
:deep(.table-wrapper) {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

:deep(.table-header) {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.table-copy-btn),
:deep(.table-download-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  color: #666;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.table-copy-btn:hover),
:deep(.table-download-btn:hover) {
  background: #f0f0f0;
  color: #333;
  border-color: #b0b0b0;
}

/* 表格 */
:deep(.table-wrapper table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0;
  font-size: 0.95em;
  background: #fff;
}

:deep(.table-wrapper th),
:deep(.table-wrapper td) {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

:deep(.table-wrapper th) {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

:deep(.table-wrapper tr:nth-child(even)) {
  background: #fafafa;
}

/* 分隔线 */
:deep(.message-rendered hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 16px 0;
}

/* 图片 */
:deep(.message-rendered img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 8px 0;
}

/* 标题 */
:deep(.message-rendered h1),
:deep(.message-rendered h2),
:deep(.message-rendered h3),
:deep(.message-rendered h4),
:deep(.message-rendered h5),
:deep(.message-rendered h6) {
  margin: 16px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.message-rendered h1) {
  font-size: 1.8em;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}
:deep(.message-rendered h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 6px;
}
:deep(.message-rendered h3) {
  font-size: 1.3em;
}
:deep(.message-rendered h4) {
  font-size: 1.1em;
}

/* 段落 */
:deep(.message-rendered p) {
  margin: 8px 0;
  line-height: 1.8;
}

/* 列表 */
:deep(.message-rendered ul),
:deep(.message-rendered ol) {
  margin: 8px 0;
  padding-left: 24px;
}

:deep(.message-rendered li) {
  margin: 4px 0;
  line-height: 1.6;
}

/* 行内代码 */
:deep(.message-rendered code:not(pre code)) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #e83e8c;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>