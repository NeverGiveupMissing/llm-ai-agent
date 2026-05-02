<template>
  <n-breadcrumb>
    <!-- 首页固定项 -->
    <n-breadcrumb-item @click="handleClick('/dashboard')">
      工作台
    </n-breadcrumb-item>
    
    <!-- 动态面包屑项 -->
    <n-breadcrumb-item
      v-for="(item, index) in breadcrumbs"
      :key="item.path"
      :class="{ 'is-active': index === breadcrumbs.length - 1 }"
      @click="handleClick(item.path)"
    >
      {{ item.title }}
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 根据当前路由生成面包屑（排除 Layout 和首页）
const breadcrumbs = computed(() => {
  return route.matched
    .filter(item => item.meta?.title && item.path !== '/dashboard')
    .map(item => ({
      path: item.path,
      title: item.meta.title,
    }))
})

// 点击面包屑项
const handleClick = (path) => {
  if (path && path !== route.path) {
    router.push(path)
  }
}
</script>

<style scoped>
.n-breadcrumb {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

/* 最后一项（当前页）不可点击，样式高亮 */
.is-active {
  color: #18a058;
  font-weight: 600;
  cursor: default;
}

.is-active:hover {
  color: #18a058;
}
</style>
