<template>
  <div
    class="session-item"
    :class="{ active: session.id === currentSessionId }"
    @click="$emit('select', session)"
  >
    <div class="item-content">
      <!-- 置顶标志 -->
      <n-icon
        v-if="session.is_pinned"
        class="pin-icon"
        size="14"
        color="#ff9800"
        title="已置顶"
      >
        <PinOutline />
      </n-icon>
      <n-icon class="icon" size="16">
        <ChatbubbleEllipsesOutline />
      </n-icon>
      <span class="text">{{ session.title }}</span>
    </div>

    <!-- 更多操作按钮 -->
    <n-dropdown
      trigger="click"
      :options="menuOptions"
      @select="(key) => $emit('menu-select', key, session)"
      placement="right-start"
    >
      <button class="more-btn" @click.stop title="更多操作">
        <n-icon size="16"><EllipsisHorizontalOutline /></n-icon>
      </button>
    </n-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NIcon, NDropdown } from 'naive-ui'
import {
  PinOutline,
  ChatbubbleEllipsesOutline,
  EllipsisHorizontalOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  currentSessionId: {
    type: String,
    default: '',
  },
  menuOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select', 'menu-select'])
</script>

<style scoped>
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background-color: #f5f5f5;
}

.session-item.active {
  background-color: #e6f7ff;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.pin-icon {
  flex-shrink: 0;
}

.icon {
  flex-shrink: 0;
  color: #666;
}

.text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>
