<template>
  <div class="memory-item" :class="{ confirmed }">
    <div class="memory-content">
      <p>{{ memory.content }}</p>
    </div>
    <div class="memory-meta">
      <span class="memory-type">{{ typeLabel }}</span>
      <span v-if="similarity !== undefined" class="memory-similarity">
        {{ similarity }}% match
      </span>
      <span v-if="importance !== undefined" class="memory-importance">
        Importance: {{ importance }}/10
      </span>
      <span v-if="date" class="memory-date">{{ date }}</span>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup name="MemoryItem">
const props = defineProps({
  memory: { type: Object, required: true },
  typeLabel: { type: String, required: true },
  similarity: { type: Number, default: undefined },
  importance: { type: Number, default: undefined },
  date: { type: String, default: '' },
  confirmed: { type: Boolean, default: false },
})
</script>

<style scoped>
.memory-item {
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  transition: all 0.2s;
}

.memory-item:hover {
  border-color: #d0d0d0;
  background: #fafafa;
}

.memory-item.confirmed {
  border-color: #10a37f;
  background: #f0fdf4;
}

.memory-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #0d0d0d;
}

.memory-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #6e6e80;
}

.memory-type {
  font-weight: 500;
  color: #10a37f;
}

.memory-similarity,
.memory-importance,
.memory-date {
  color: #999;
}
</style>
