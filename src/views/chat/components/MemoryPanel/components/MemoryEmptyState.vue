<template>
  <div class="memory-empty-state">
    <n-icon :size="size" :depth="depth">
      <component :is="icon" />
    </n-icon>
    <p>{{ text }}</p>
  </div>
</template>

<script setup name="MemoryEmptyState">
import { NIcon } from 'naive-ui'

const props = defineProps({
  icon: { type: Object, required: true },
  text: { type: String, required: true },
  size: { type: Number, default: 48 },
  depth: { type: Number, default: 3 },
})
</script>

<style scoped>
.memory-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6e6e80;
}

.memory-empty-state p {
  margin-top: 16px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
