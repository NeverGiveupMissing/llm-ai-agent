<template>
  <div
    v-if="isShareMode"
    class="message-checkbox"
    :class="`role-${role}`"
    @click="handleToggle"
  >
    <div class="checkbox-icon" :class="{ checked: isSelected }">
      <svg
        v-if="isSelected"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup name="MessageCheckbox">
const props = defineProps({
  isShareMode: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['toggle'])

const handleToggle = () => {
  emit('toggle', !props.isSelected)
}
</script>

<style scoped>
.message-checkbox {
  position: absolute;
  top: 28px;
  left: -40px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.message-checkbox.role-user {
  left: auto;
  right: -40px;
}

.checkbox-icon {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.checkbox-icon:hover {
  border-color: #10a37f;
}

.checkbox-icon.checked {
  background: linear-gradient(135deg, #10a37f 0%, #0ea5e9 100%);
  border-color: #10a37f;
  color: white;
}
</style>