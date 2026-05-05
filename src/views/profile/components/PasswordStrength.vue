<template>
  <div class="password-strength" v-if="password">
    <div class="strength-header">
      <span class="strength-label">密码强度：</span>
      <span class="strength-text" :style="{ color: strengthColor }">
        {{ strengthText }}
      </span>
    </div>
    
    <n-progress
      type="line"
      :percentage="(strength / 4) * 100"
      :color="strengthColor"
      :show-indicator="false"
      :height="6"
      :border-radius="3"
    />
    
    <div class="strength-tips">
      <n-text depth="3" style="font-size: 12px">
        提示：密码应包含大小写字母、数字和特殊字符，长度至少8位
      </n-text>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: {
    type: String,
    default: '',
  },
})

// 计算密码强度 (0-4)
const strength = computed(() => {
  const pwd = props.password
  if (!pwd) return 0
  
  let score = 0
  
  // 长度检查
  if (pwd.length >= 8) score++
  
  // 包含数字
  if (/[0-9]/.test(pwd)) score++
  
  // 包含字母
  if (/[a-zA-Z]/.test(pwd)) score++
  
  // 包含特殊字符
  if (/[^0-9a-zA-Z]/.test(pwd)) score++
  
  return score
})

// 强度文本
const strengthText = computed(() => {
  return ['', '弱', '中', '强', '非常强'][strength.value]
})

// 强度颜色
const strengthColor = computed(() => {
  return ['', '#ff4d4f', '#faad14', '#52c41a', '#1677ff'][strength.value]
})
</script>

<style scoped>
.password-strength {
  margin-top: 8px;
}

.strength-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.strength-label {
  font-size: 14px;
  color: #666;
}

.strength-text {
  font-size: 14px;
  font-weight: 500;
}

.strength-tips {
  margin-top: 8px;
}
</style>
