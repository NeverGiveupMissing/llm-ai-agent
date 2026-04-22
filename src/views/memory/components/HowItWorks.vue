<template>
  <div class="how-it-works">
    <div class="section-header">
      <h3 class="section-title">工作原理</h3>
    </div>

    <div class="section-content">
      <div class="workflow-steps">
        <div class="workflow-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>自动检索</h4>
            <p>
              每次对话前，系统会根据你的问题自动检索相关记忆，通过向量相似度搜索找到最匹配的信息。
            </p>
          </div>
        </div>

        <div class="workflow-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>上下文注入</h4>
            <p>检索到的记忆会被注入到 AI 的上下文中，使 AI 能够提供个性化和基于记忆的回答。</p>
          </div>
        </div>

        <div class="workflow-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>记忆提取</h4>
            <p>对话结束后，AI 会自动分析对话内容，提取有价值的新信息并保存为长期记忆。</p>
          </div>
        </div>
      </div>

      <n-alert type="info" :show-icon="false" class="pro-tip">
        <template #header>
          <strong>💡 使用提示</strong>
        </template>
        在聊天界面点击右上角的 ✨ 图标，可以实时查看当前对话使用的记忆。
      </n-alert>
    </div>
  </div>
</template>

<script setup name="HowItWorks">
import { NAlert } from 'naive-ui'
</script>

<style scoped>
.how-it-works {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1px solid #e0f2fe;
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

.workflow-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.workflow-step {
  display: flex;
  gap: 16px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #0d0d0d;
  color: #ffffff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0 0 8px 0;
}

.step-content p {
  font-size: 13px;
  line-height: 1.6;
  color: #6e6e80;
  margin: 0;
}

.pro-tip {
  margin-top: 20px;
  background: #ffffff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

:deep(.pro-tip .n-alert-header) {
  padding: 12px 16px;
}

:deep(.pro-tip .n-alert-body) {
  padding: 0 16px 16px;
}
</style>
