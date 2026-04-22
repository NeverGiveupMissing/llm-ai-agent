<template>
  <div class="quick-actions">
    <div class="section-header">
      <h3 class="section-title">快速操作</h3>
    </div>

    <div class="section-content">
      <div class="actions-grid">
        <div class="action-item" @click="$emit('browse')">
          <div class="action-icon">
            <n-icon :size="24"><ListOutline /></n-icon>
          </div>
          <div class="action-info">
            <h4>浏览记忆</h4>
            <p>查看和管理所有已保存的记忆</p>
          </div>
        </div>

        <div class="action-item" @click="$emit('test-retrieval')">
          <div class="action-icon">
            <n-icon :size="24"><SearchOutline /></n-icon>
          </div>
          <div class="action-info">
            <h4>测试检索</h4>
            <p>测试记忆相似度检索效果</p>
          </div>
        </div>

        <div class="action-item" @click="$emit('clear-all')">
          <div class="action-icon warning">
            <n-icon :size="24"><TrashOutline /></n-icon>
          </div>
          <div class="action-info">
            <h4>清空所有记忆</h4>
            <p>永久删除所有已保存的记忆</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="QuickActions">
import { NIcon } from 'naive-ui'
import { ListOutline, SearchOutline, TrashOutline } from '@vicons/ionicons5'

defineEmits(['browse', 'test-retrieval', 'clear-all'])
</script>

<style scoped>
.quick-actions {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.section-content {
  min-height: 120px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  border-color: #e5e5e5;
  background: #fafafa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #f0f9ff;
  color: #0284c7;
  border-radius: 8px;
  flex-shrink: 0;
}

.action-icon.warning {
  background: #fef2f2;
  color: #dc2626;
}

.action-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0 0 4px 0;
}

.action-info p {
  font-size: 13px;
  color: #6e6e80;
  margin: 0;
  line-height: 1.4;
}
</style>
