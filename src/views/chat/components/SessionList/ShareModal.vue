<template>
  <n-modal v-model:show="visible" preset="card" title="分享对话" style="width: 500px">
    <n-space vertical>
      <n-input :value="shareLink" readonly>
        <template #suffix>
          <n-button text type="primary" @click="$emit('copy')">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            复制
          </n-button>
        </template>
      </n-input>
    </n-space>
  </n-modal>
</template>

<script setup>
import { NModal, NSpace, NInput, NButton, NIcon } from 'naive-ui'
import { CopyOutline } from '@vicons/ionicons5'

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  shareLink: {
    type: String,
    default: '',
  },
})

defineEmits(['update:visible', 'copy'])
</script>
