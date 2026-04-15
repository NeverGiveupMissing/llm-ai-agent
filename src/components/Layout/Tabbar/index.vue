<template>
  <div class="tabbar">
    <n-tabs
      :value="activeTab"
      type="card"
      closable
      @update:value="handleTabChange"
      @close="handleTabClose"
    >
      <n-tab-pane v-for="tab in visitedTabs" :key="tab.path" :name="tab.path" :tab="tab.title" />
    </n-tabs>
  </div>
</template>

<script setup name="Tabbar">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const visitedTabs = ref([])
const activeTab = ref('')

// 添加当前路由到标签页
const addTab = (route) => {
  const existing = visitedTabs.value.find((tab) => tab.path === route.path)
  if (!existing && route.meta?.title) {
    visitedTabs.value.push({
      path: route.path,
      title: route.meta.title,
    })
  }
  activeTab.value = route.path
}

// 监听路由变化
watch(
  route,
  (newRoute) => {
    addTab(newRoute)
  },
  { immediate: true },
)

// 切换标签页
const handleTabChange = (path) => {
  router.push(path)
}

// 关闭标签页
const handleTabClose = (path) => {
  const index = visitedTabs.value.findIndex((tab) => tab.path === path)
  if (index !== -1) {
    visitedTabs.value.splice(index, 1)
  }
  if (path === activeTab.value && visitedTabs.value.length > 0) {
    router.push(visitedTabs.value[visitedTabs.value.length - 1].path)
  }
}
</script>

<style scoped>
.tabbar {
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
