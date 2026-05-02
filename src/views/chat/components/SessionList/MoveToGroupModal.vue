<template>
  <n-modal v-model:show="visible" preset="card" title="移动到分组" style="width: 400px">
    <n-space vertical>
      <div style="font-size: 14px; color: #666">选择目标分组：</div>
      <n-space vertical>
        <n-button
          v-for="group in groups"
          :key="group.id"
          :type="targetGroupId === group.id ? 'primary' : 'default'"
          block
          @click="targetGroupId = group.id"
        >
          <template #icon>
            <n-icon><FolderOutline /></n-icon>
          </template>
          {{ group.name }}
        </n-button>
      </n-space>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('update:visible', false)">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { NModal, NSpace, NButton, NIcon } from 'naive-ui'
import { FolderOutline } from '@vicons/ionicons5'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const targetGroupId = ref(null)

const handleConfirm = () => {
  if (!targetGroupId.value) {
    return
  }
  emit('confirm', targetGroupId.value)
  targetGroupId.value = null
}
</script>
