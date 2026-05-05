<template>
  <div class="tab-pane-content">
    <BasicInfoForm
      :user="user"
      @success="$emit('success')"
    />
  </div>
</template>

<script setup>
import BasicInfoForm from './BasicInfoForm.vue'

defineProps({
  user: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits(['success'])
</script>

<style scoped>
.tab-pane-content {
  padding-top: 16px;
}
</style>
