<template>
  <n-modal v-model:show="shareModalVisible" preset="card" title="分享对话" style="width: 500px">
    <n-space vertical>
      <n-input :value="shareLink" readonly>
        <template #suffix>
          <n-button text type="primary" @click="emit('copy')">
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
import { computed } from 'vue'
import { NModal, NSpace, NInput, NButton, NIcon } from 'naive-ui'
import { CopyOutline } from '@vicons/ionicons5'

const props = defineProps({
  visible: { type: Boolean, default: false },
  shareLink: { type: String, default: '' },
})

// 💡 遵循 RuoYi 规范，显式声明对外的双向绑定事件 update:visible
const emit = defineEmits(['update:visible', 'copy'])

// 💡 计算属性更名为 shareModalVisible，打通 Naive UI 的 v-model:show 与父组件传进来的 props.visible
const shareModalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})
</script>
