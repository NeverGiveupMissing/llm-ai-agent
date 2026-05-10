<template>
  <div class="base-table-wrapper">
    <!-- 搜索区域 -->
    <SearchArea v-if="$slots.search" @search="handleSearchClick" @reset="handleResetClick">
      <slot name="search"></slot>
    </SearchArea>

    <!-- 表格卡片 -->
    <TableCard
      ref="tableCardRef"
      :columns="computedColumns"
      :data="data"
      :loading="loading"
      :row-key="getRowKey"
      :checked-row-keys="internalCheckedKeys"
      @update:checked-row-keys="internalCheckedKeys = $event"
      :scroll-x="scrollX"
      :children-key="childrenKey"
      :expanded-row-keys="expandedRowKeys"
      :show-column-control="showColumnControl"
      :configurable-columns="configurableColumns"
      :visible-keys="visibleColumnKeys"
      :show-search-toggle="showSearchToggle"
      :show-search="showSearch"
      :show-pagination="showPagination"
      :pagination="pagination"
      :page-size="pagination.page_size"
      @refresh="handleRefresh"
      @column-change="handleColumnChange"
      @update:show-search="handleShowSearchUpdate"
      @page-change="handlePageChange"
      @page-size-change="handlepage_sizeChange"
      @update:expanded-row-keys="handleExpandedRowKeysChange"
    >
      <template #toolbar-left>
        <slot name="toolbar-left"></slot>
      </template>
      <template #toolbar-right>
        <slot name="toolbar-right"></slot>
      </template>
    </TableCard>
  </div>
</template>

<script setup>
import { ref, computed, h, useSlots, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NTag, NSpace, NButton, useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'
import { checkIsAdmin } from '@/utils/permission'
import { ColumnTypes } from './types'
import CommonButton from '@/components/CommonButton.vue'
import { getCurrentRouteButtons, mapPermsToType } from './utils'
import SearchArea from './components/SearchArea.vue'
import TableCard from './components/TableCard.vue'

const route = useRoute() // ✅ 定义 route

const props = defineProps({
  // 列配置（支持 v-model）
  columns: {
    type: Array,
    required: true,
  },
  // 额外操作按钮（无法通过数据库配置的特殊业务按钮）
  extraActions: {
    type: Array,
    default: () => [],
  },
  // 表格数据
  data: {
    type: Array,
    default: () => [],
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 分页配置
  pagination: {
    type: Object,
    default: () => ({}),
  },
  // 是否启用分页（默认启用）
  showPagination: {
    type: Boolean,
    default: true,
  },
  // 默认每页条数
  defaultpage_size: {
    type: Number,
    default: 10,
  },
  // 每页条数选项
  page_sizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  // 是否立即加载数据
  immediate: {
    type: Boolean,
    default: true,
  },
  // 行 key
  rowKey: {
    type: [String, Function],
    default: 'id',
  },
  // 是否可选
  checkable: {
    type: Boolean,
    default: false,
  },
  // 已选中的行
  selectedKeys: {
    type: Array,
    default: () => [],
  },
  // 工具栏标题
  toolbarTitle: {
    type: String,
    default: '',
  },
  // 是否显示列控制
  showColumnControl: {
    type: Boolean,
    default: true,
  },
  // 横向滚动宽度
  scrollX: {
    type: Number,
    default: undefined,
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
  // ✅ 树形表格：子节点 key
  childrenKey: {
    type: String,
    default: 'children',
  },
  // ✅ 树形表格：展开的行 keys
  expandedRowKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'page-change',
  'page-size-change',
  'selection-change',
  'refresh',
  'search',
  'reset',
  'action-click', // ✅ 新增：动态按钮点击事件
  'update:columns',
  'update:showSearch',
  'update:expandedRowKeys',
])

const slots = useSlots()
const message = useMessage()
const permissionStore = usePermissionStore()
const tableCardRef = ref(null)

// ✅ 内部维护的选中 keys（使用 v-model）
const internalCheckedKeys = ref([])

// ✅ 可见列的 key 数组（用于 RightToolbar）
const visibleColumnKeys = ref([])

// ✅ 初始化可见列
watch(
  () => props.columns,
  (newColumns) => {
    if (newColumns && newColumns.length > 0) {
      // 过滤出可配置的列（排除操作列、选择列、序号列）
      const configurableCols = newColumns.filter((col) => {
        const excludeTypes = ['actions', 'selection', 'index']
        return !excludeTypes.includes(col.type)
      })

      // ✅ 修复：只在可见列为空时初始化，避免覆盖用户的选择
      if (visibleColumnKeys.value.length === 0) {
        visibleColumnKeys.value = configurableCols.map((col) => col.key)
      }
    }
  },
  { immediate: true, deep: true },
)

/**
 * 可配置的列（用于 RightToolbar 显示）
 */
const configurableColumns = computed(() => {
  return props.columns.filter((col) => {
    const excludeTypes = ['actions', 'selection', 'index']
    return !excludeTypes.includes(col.type)
  })
})

/**
 * ✅ 生成动态 Actions 数组
 */
const dynamicActions = computed(() => {
  const routeButtons = getCurrentRouteButtons(permissionStore, route)
  console.log('🔵 BaseTable - 当前路由按钮:', routeButtons)

  // ✅ Label 映射：避免显示原始数据库菜单名
  const labelMap = {
    add: '新增',
    edit: '修改',
    delete: '删除',
    query: '查询',
    export: '导出',
    assign_role: '分配权限', // ✅ 角色管理-分配权限，用户管理-分配角色
    reset: '重置密码',
    import: '导入',
  }

  return routeButtons.map((btn) => {
    // ✅ 完全信任 mapPermsToType，移除冗余判断
    const actionType = mapPermsToType(btn.perms)

    return {
      label: labelMap[actionType] || btn.label,
      type: actionType,
      permission: btn.perms,
      onClick: (row) => emit('action-click', { perms: btn.perms, row }),
    }
  })
})

/**
 * 监听选中变化，通知父组件
 */
watch(internalCheckedKeys, (keys) => {
  // 获取每行的 key
  const getKey = (row) => {
    if (typeof props.rowKey === 'function') {
      return props.rowKey(row)
    }
    return row[props.rowKey]
  }

  // 根据 keys 找到对应的行数据
  const rows = props.data.filter((row) => {
    const key = getKey(row)
    return key !== undefined && keys.includes(key)
  })

  emit('selection-change', keys, rows)
})

/**
 * 监听数据变化，清空选择状态
 */
watch(
  () => props.data,
  () => {
    internalCheckedKeys.value = []
  },
  { deep: true },
)

/**
 * 获取行的唯一键（加空值保护）
 */
const getRowKey = (row) => {
  if (!row) return ''

  if (typeof props.rowKey === 'function') {
    const key = props.rowKey(row)
    return key !== undefined && key !== null ? key : ''
  }

  // 字符串类型，从 row 中获取对应字段
  const key = row[props.rowKey]

  // 如果找不到，尝试其他常见字段
  if (key !== undefined && key !== null) return key
  if (row.id !== undefined && row.id !== null) return row.id
  if (row._id !== undefined && row._id !== null) return row._id

  // 最后才使用 JSON.stringify（性能较差）
  return JSON.stringify(row)
}

// 计算最终显示的列（根据可见列过滤）
const computedColumns = computed(() => {
  let cols = []

  // 如果可选，添加选择列
  if (props.checkable) {
    cols.push({
      type: 'selection',
      fixed: 'left',
    })
  }

  // 处理用户配置的列（根据 visibleColumnKeys 过滤）
  const processedCols = props.columns
    .filter((col) => {
      // 跳过选择列（已单独处理）
      if (col.type === 'selection') return false

      // ✅ 特殊列（操作列、序号列）始终显示，不受列控制影响
      const specialTypes = ['actions', 'index']
      if (specialTypes.includes(col.type)) return true

      // 如果启用了列控制，检查是否在可见列中
      if (props.showColumnControl && !visibleColumnKeys.value.includes(col.key)) {
        return false
      }
      return true
    })
    .map((col) => processColumn(col))

  cols.push(...processedCols)
  return cols
})

/**
 * ✅ 处理操作列：合并动态 Actions 与用户自定义 Actions
 */
const processActionsColumn = (col) => {
  const column = { ...col, type: 'actions' }

  // 用户手动定义的 actions
  const userActions = col.actions || []

  console.log('🟢 BaseTable - 处理操作列:', {
    userActions: userActions.length,
    dynamicActions: dynamicActions.value.length,
    extraActions: props.extraActions?.length || 0,
  })

  // 合并策略：用户定义 + 数据库动态生成 + 额外按钮
  column.actions = [
    ...userActions, // 优先级最高：用户手动定义
    ...dynamicActions.value, // 中等优先级：数据库动态生成
    ...props.extraActions, // 最低优先级：额外业务按钮
  ]

  console.log('🟡 BaseTable - 合并后 actions 数量:', column.actions.length)

  return column
}

/**
 * 处理列配置，转换为 Naive UI 的列格式
 */
function processColumn(col) {
  // ✅ 操作列特殊处理：合并动态 Actions
  if (col.type === ColumnTypes.ACTIONS || col.key === 'actions') {
    col = processActionsColumn(col) // 合并 Actions 后继续处理渲染逻辑，避免递归
  }

  const column = {
    ...col,
  }

  // 检查是否有自定义插槽覆盖渲染
  const slotName = `column-${col.key}`
  if (slots[slotName]) {
    column.render = (row) => {
      return slots[slotName]({ row })
    }
    return column
  }

  // 序号列
  if (col.type === ColumnTypes.INDEX) {
    column.render = (_, index) => {
      const pageIndex = props.pagination.page_num || 1
      const page_size = props.pagination.page_size || 10
      return (pageIndex - 1) * page_size + index + 1
    }
  }

  // 标签列
  if (col.type === ColumnTypes.TAG && col.tagMap) {
    column.render = (row) => {
      const value = row[col.key]
      const tagConfig = col.tagMap[value]
      if (!tagConfig) return h('span', value)

      return h(NTag, { type: tagConfig.type }, { default: () => tagConfig.text })
    }
  }

  // 日期时间列
  if (col.type === ColumnTypes.DATETIME) {
    column.render = (row) => {
      const value = row[col.key]
      if (!value) return '-'
      const format = col.format || 'YYYY-MM-DD HH:mm:ss'
      return dayjs(value).format(format)
    }
  }

  // 操作列
  if (col.type === ColumnTypes.ACTIONS && col.actions) {
    column.width = col.actionsWidth || 200
    column.render = (row) => {
      const filteredActions = col.actions.filter((action) => {
        // ✅ 权限控制
        if (action.permission) {
          const userStore = useUserStore()
          const isAdmin = checkIsAdmin(userStore.userInfo.roles)
          if (!isAdmin) {
            const hasPerm = permissionStore.hasPermission(action.permission)
            if (!hasPerm) return false
          }
        }

        // 操作列过滤：只显示 edit、delete、assign_role 类型的按钮
        const allowedActionTypes = ['edit', 'delete', 'assign_role']
        if (action.type && !allowedActionTypes.includes(action.type)) {
          return false
        }

        // 自定义显示条件
        if (action.show && typeof action.show === 'function') {
          return action.show(row)
        }
        return true
      })

      const buttons = filteredActions.map((action) => {
        // ✅ action.type 是业务类型（由 mapPermsToType 返回）
        // CommonButton 内部会自动将其映射为 UI 类型
        const commonButtonType = action.type || 'primary'

        // ✅ 支持 confirmText 为函数或字符串
        const confirmMessage =
          typeof action.confirmText === 'function'
            ? action.confirmText(row)
            : action.confirmText || `确定要${action.label}吗？`

        // ✅ 使用 CommonButton，它会自动处理业务类型 → UI 类型的映射
        const button = h(CommonButton, {
          type: commonButtonType,
          text: action.label,
          size: 'small', // ✅ 表格内统一使用 small
          perms: action.permission,
          confirmMessage: confirmMessage,
          onClick: () => action.onClick(row),
          onConfirm: () => action.onClick(row), // delete 类型使用 onConfirm
        })

        return button
      })

      // ✅ 使用 NSpace 控制按钮间距，默认 8px，支持外部传递 actionGap
      return h(
        NSpace,
        { size: col.actionGap || 8 }, // 默认间距 8px
        { default: () => buttons },
      )
    }
  }

  // 复制功能
  if (col.copyable) {
    column.render = (row) => {
      const value = row[col.key]
      if (!value) return '-'

      return h(
        NSpace,
        { align: 'center' },
        {
          default: () => [
            h(
              'span',
              {
                style: col.ellipsis
                  ? {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                      display: 'inline-block',
                    }
                  : {},
              },
              value,
            ),
            h(
              NButton,
              {
                text: true,
                size: 'tiny',
                onClick: () => handleCopy(value),
              },
              { default: () => '复制' },
            ),
          ],
        },
      )
    }
  }

  return column
}

/**
 * 复制文本
 */
function handleCopy(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message.success('复制成功')
    })
    .catch(() => {
      message.error('复制失败')
    })
}

/**
 * 处理页码变化
 */
function handlePageChange(page) {
  // ✅ 通过 emit 将新值传回父组件，不直接修改 props
  emit('page-change', page)
}

/**
 * 处理每页条数变化
 */
function handlepage_sizeChange(page_size) {
  // ✅ 通过 emit 将新值传回父组件，不直接修改 props
  emit('page-size-change', page_size)
}

/**
 * 处理列显隐变化
 */
function handleColumnChange(keys) {
  visibleColumnKeys.value = keys

  // ✅ 触发 v-model:columns 更新
  const updatedColumns = props.columns.map((col) => ({
    ...col,
    hidden: !keys.includes(col.key),
  }))
  emit('update:columns', updatedColumns)
}

/**
 * 处理搜索区域显示状态更新
 */
function handleShowSearchUpdate(value) {
  emit('update:showSearch', value)
}

/**
 * 处理刷新
 */
function handleRefresh() {
  emit('refresh')
}

/**
 * 处理搜索点击
 */
function handleSearchClick() {
  emit('search')
}

/**
 * 处理重置点击
 */
function handleResetClick() {
  emit('reset')
}

/**
 * ✅ 处理树形表格展开变化
 */
function handleExpandedRowKeysChange(keys) {
  emit('update:expandedRowKeys', keys)
}

// 暴露方法给父组件
defineExpose({
  tableRef: computed(() => tableCardRef.value?.tableRef),
})
</script>

<style scoped>
/* BaseTable 容器 */
.base-table-wrapper {
  display: flex;
  flex-direction: column;
}
</style>
