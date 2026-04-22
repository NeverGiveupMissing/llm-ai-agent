<template>
  <div class="settings-container">
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
      <p class="page-description">配置系统参数、API 密钥和个性化选项。</p>
    </div>

    <div class="settings-content">
      <n-card title="API 配置" :bordered="false" class="settings-card">
        <n-form label-placement="left" label-width="120">
          <n-form-item label="API Base URL">
            <n-input placeholder="https://api.openai.com" />
          </n-form-item>
          <n-form-item label="API Key">
            <n-input type="password" placeholder="sk-..." show-password-on="click" />
          </n-form-item>
          <n-form-item label="模型选择">
            <n-select :options="modelOptions" placeholder="选择模型" style="width: 300px" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-button type="primary">保存配置</n-button>
        </template>
      </n-card>

      <n-card title="对话设置" :bordered="false" class="settings-card">
        <n-form label-placement="left" label-width="120">
          <n-form-item label="打字机效果">
            <n-switch />
          </n-form-item>
          <n-form-item label="最大上下文长度">
            <n-input-number :min="1000" :max="128000" style="width: 200px" />
          </n-form-item>
          <n-form-item label="温度参数">
            <n-slider :min="0" :max="2" :step="0.1" style="width: 300px" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-button type="primary">保存设置</n-button>
        </template>
      </n-card>

      <n-card title="记忆配置" :bordered="false" class="settings-card">
        <n-form label-placement="left" label-width="120">
          <n-form-item label="自动记忆提取">
            <n-switch />
          </n-form-item>
          <n-form-item label="记忆相似度阈值">
            <n-input-number :min="0.5" :max="1" :step="0.05" style="width: 200px" />
          </n-form-item>
          <n-form-item label="最大记忆数量">
            <n-input-number :min="10" :max="1000" style="width: 200px" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-button type="primary">保存配置</n-button>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup name="Settings">
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NInputNumber,
  NSlider,
  NButton,
} from 'naive-ui'

const modelOptions = [
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
]
</script>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d0d0d;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  line-height: 1.6;
  color: #6e6e80;
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

:deep(.settings-card .n-card-header) {
  border-bottom: 1px solid #e5e5e5;
  padding: 16px 24px;
}

:deep(.settings-card .n-card-header__title) {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
}

:deep(.settings-card .n-card__content) {
  padding: 24px;
}

:deep(.settings-card .n-card-footer) {
  border-top: 1px solid #e5e5e5;
  padding: 16px 24px;
}
</style>
