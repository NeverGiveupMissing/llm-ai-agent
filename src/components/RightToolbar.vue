<template>
  <div class="right-toolbar">
    <n-space>
      <!-- 搜索切换按钮 -->
      <n-tooltip v-if="showSearchToggle" trigger="hover">
        <template #trigger>
          <n-button quaternary circle @click="handleSearchToggle">
            <template #icon>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-button>
        </template>
        {{ localShowSearch ? '隐藏搜索' : '显示搜索' }}
      </n-tooltip>

      <!-- 刷新按钮 -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button quaternary circle @click="$emit('refresh')">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
        </template>
        刷新
      </n-tooltip>

      <!-- 列显隐控制 -->
      <n-popover trigger="click" placement="bottom-end" :width="200">
        <template #trigger>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary circle>
                <template #icon>
                  <n-icon><SettingsOutline /></n-icon>
                </template>
              </n-button>
            </template>
            列设置
          </n-tooltip>
        </template>
        
        <div class="column-control">
          <n-checkbox-group v-model:value="localVisibleKeys" @update:value="handleColumnChange">
            <n-space vertical>
              <n-checkbox
                v-for="col in visibleColumns"
                :key="col.key"
                :value="col.key"
                :disabled="!!col.fixed"
              >
                {{ col.title }}
              </n-checkbox>
            </n-space>
          </n-checkbox-group>
        </div>
      </n-popover>
    </n-space>
  </div>
</template>

<script setup name="RightToolbar">
import { ref, computed, watch } from 'vue'
import { NButton, NIcon, NSpace, NTooltip, NPopover, NCheckboxGroup, NCheckbox } from 'naive-ui'
import { SearchOutline, RefreshOutline, SettingsOutline } from '@vicons/ionicons5'

const props = defineProps({
  // 列配置
  columns: {
    type: Array,
    required: true,
  },
  // 当前可见的列 key 数组
  visibleKeys: {
    type: Array,
    default: () => [],
  },
  // 是否显示搜索切换按钮
  showSearchToggle: {
    type: Boolean,
    default: false,
  },
  // 搜索区域显示状态（支持 v-model）
  showSearch: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['refresh', 'column-change', 'update:showSearch'])

// 过滤掉不需要显示在设置中的列（如操作列、选择列、序号列）
const visibleColumns = computed(() => {
  return props.columns.filter((col) => {
    // 排除操作列、选择列、序号列
    const excludeTypes = ['actions', 'selection', 'index']
    if (excludeTypes.includes(col.type)) return false
    // 排除固定列（如果不需要在设置中显示）
    // if (col.fixed) return false
    return true
  })
})

// 本地搜索显示状态
const localShowSearch = ref(props.showSearch)

// 同步 props.showSearch 到本地
watch(
  () => props.showSearch,
  (newValue) => {
    localShowSearch.value = newValue
  },
  { immediate: true }
)

// 处理搜索切换
const handleSearchToggle = () => {
  localShowSearch.value = !localShowSearch.value
  emit('update:showSearch', localShowSearch.value)
}

// 当前显示的列 key（使用 props.visibleKeys）
const localVisibleKeys = ref([])

// 同步 props.visibleKeys 到本地
watch(
  () => props.visibleKeys,
  (newKeys) => {
    if (newKeys && newKeys.length > 0) {
      localVisibleKeys.value = [...newKeys]
    } else {
      localVisibleKeys.value = visibleColumns.value.map((col) => col.key)
    }
  },
  { immediate: true, deep: true }
)

// 列显隐变化
const handleColumnChange = (keys) => {
  localVisibleKeys.value = keys
  emit('column-change', keys)
}

// 暴露方法
defineExpose({
  localVisibleKeys,
  localShowSearch,
})
</script>

<style scoped>
.right-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.column-control {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}
</style>
