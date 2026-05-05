<template>
  <div class="sql-editor-container">
    <n-input
      v-model:value="sqlContent"
      type="textarea"
      placeholder="请输入 SQL 语句... (Ctrl+Enter 执行)"
      :autosize="{ minRows: 5, maxRows: 8 }"
      @keydown="handleKeydown"
      size="small"
    />
    
    <div class="editor-footer">
      <n-text depth="3" style="font-size: 12px;">
        Ctrl+Enter 快速执行
      </n-text>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const sqlContent = ref('')

const emit = defineEmits(['execute'])

// 执行 SQL
const handleExecute = () => {
  if (!sqlContent.value.trim()) {
    return
  }
  emit('execute', sqlContent.value)
}

// 处理键盘事件
const handleKeydown = (e) => {
  // Ctrl+Enter 或 Cmd+Enter 执行
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleExecute()
  }
}

// 暴露方法供父组件调用
defineExpose({
  sqlContent,
  setSql: (sql) => {
    sqlContent.value = sql
  }
})
</script>

<style scoped>
.sql-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.editor-footer {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
