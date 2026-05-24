<template>
  <div class="table-data-editor">
    <!-- ✅ 调试信息 -->
    <div style="margin-bottom: 8px; padding: 8px; background: #f0f0f0">
      数据条数: {{ tableDataList.length }}, 列数: {{ tableColumns.length }}
    </div>

    <n-data-table
      :columns="tableColumns"
      :data="tableDataList"
      :bordered="true"
      :single-line="false"
      size="small"
      :row-class-name="rowClassName"
      :max-height="500"
    />
  </div>
</template>

<script setup>
import { ref, h, computed, watch } from 'vue'
import { NButton, NInput, NPopconfirm, useMessage } from 'naive-ui'
import { CheckmarkOutline, CloseOutline, TrashOutline } from '@vicons/ionicons5'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  primaryKey: {
    type: String,
    default: 'id',
  },
  tableName: {
    type: String,
    default: '',
  },
  scrollX: {
    type: Number,
    default: 0,
  },
})

const tableDataList = computed(() => props.data)
const emit = defineEmits(['update', 'delete', 'cancel'])

const message = useMessage()

// 编辑状态管理
const editingCells = ref(new Map())
const modifiedRows = ref(new Set())
const rowEdits = ref(new Map())

// ✅ 添加调试日志
watch(
  () => props.data,
  (newData) => {
    console.log('📊 TableDataEditor 接收到数据:', {
      length: newData?.length,
      isArray: Array.isArray(newData),
      firstRow: newData?.[0],
      columns: props.columns,
    })
  },
  { immediate: true },
)

// 创建表格列配置
const tableColumns = computed(() => {
  console.log('🔧 tableColumns computed 执行', {
    columnsLength: props.columns.length,
    dataLength: props.data.length,
  })

  if (props.columns.length === 0) {
    console.warn('⚠️ columns 为空数组')
    return []
  }

  const cols = props.columns.map((col) => ({
    title: col,
    key: col,
    width: col === props.primaryKey ? 280 : undefined,
    minWidth: col === props.primaryKey ? 280 : 120,
    render: (row, rowIndex) => {
      const cellKey = `${rowIndex}_${col}`
      const isEditing = editingCells.value.has(cellKey)
      const isModified = modifiedRows.value.has(rowIndex)
      const originalValue = row[col]
      const editedRow = rowEdits.value.get(rowIndex) || {}
      const currentValue = isEditing
        ? editingCells.value.get(cellKey).newValue
        : editedRow.hasOwnProperty(col)
          ? editedRow[col]
          : originalValue

      // 检查是否为敏感字段
      const isSensitiveField = (fieldName) => {
        const sensitiveKeys = ['password', 'hash', 'secret', 'token', 'key']
        return sensitiveKeys.some((key) => fieldName.toLowerCase().includes(key))
      }

      // 编辑状态
      if (isEditing) {
        return h(NInput, {
          value: currentValue,
          onUpdateValue: (val) => {
            const editState = editingCells.value.get(cellKey)
            if (editState) {
              editState.newValue = val
            }
          },
          onBlur: () => handleCellBlur(cellKey, rowIndex, col),
          onKeydown: (e) => handleCellKeydown(e, cellKey, rowIndex, col),
          autofocus: true,
          size: 'small',
        })
      }

      // 显示状态 - 敏感字段显示 ******
      return h(
        'div',
        {
          style: {
            cursor: 'pointer',
            padding: '4px 8px',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            'background-color': isModified ? '#fff3cd' : 'transparent',
            borderRadius: '4px',
          },
          onClick: () => handleCellClick(cellKey, rowIndex, originalValue),
        },
        isSensitiveField(col)
          ? h('span', { style: { color: '#999' } }, '******')
          : currentValue === null
            ? h('span', { style: { color: '#999' } }, 'NULL')
            : String(currentValue),
      )
    },
  }))

  // 操作列
  cols.push({
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row, rowIndex) => {
      const isModified = modifiedRows.value.has(rowIndex)

      return h('div', { style: { display: 'flex', gap: '4px' } }, [
        isModified &&
          h(
            NButton,
            {
              type: 'success',
              size: 'tiny',
              secondary: true,
              onClick: () => handleSaveRow(rowIndex, row),
            },
            () => h('span', null, '保存'),
          ),

        isModified &&
          h(
            NButton,
            {
              type: 'warning',
              size: 'tiny',
              secondary: true,
              onClick: () => handleCancelRow(rowIndex),
            },
            () => h('span', null, '取消'),
          ),

        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDeleteRow(rowIndex, row),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  type: 'error',
                  size: 'tiny',
                  secondary: true,
                },
                () => h('span', null, '删除'),
              ),
            default: () => '确认删除该行数据？此操作不可恢复！',
          },
        ),
      ])
    },
  })

  return cols
})

// 单元格点击
function handleCellClick(cellKey, rowIndex, originalValue) {
  // 如果已经处于编辑状态，不重复创建
  if (editingCells.value.has(cellKey)) return

  editingCells.value.set(cellKey, {
    originalValue,
    newValue: originalValue,
  })
}

// 单元格失焦
function handleCellBlur(cellKey, rowIndex, col) {
  const editState = editingCells.value.get(cellKey)
  if (!editState) return

  if (editState.originalValue !== editState.newValue) {
    modifiedRows.value.add(rowIndex)
    const edits = rowEdits.value.get(rowIndex) || {}
    edits[col] = editState.newValue
    rowEdits.value.set(rowIndex, edits)
  }

  editingCells.value.delete(cellKey)
}

// 按键处理
function handleCellKeydown(e, cellKey, rowIndex, col) {
  if (e.key === 'Escape') {
    // 取消编辑，恢复原值
    editingCells.value.delete(cellKey)
  } else if (e.key === 'Enter') {
    // 失焦保存
    handleCellBlur(cellKey, rowIndex, col)
  }
}

// 保存行
function handleSaveRow(rowIndex, row) {
  const updates = {}

  props.columns.forEach((col) => {
    const cellKey = `${rowIndex}_${col}`
    const editState = editingCells.value.get(cellKey)
    const rowEdit = rowEdits.value.get(rowIndex) || {}

    if (editState && editState.originalValue !== editState.newValue) {
      updates[col] = editState.newValue
    } else if (rowEdit.hasOwnProperty(col)) {
      updates[col] = rowEdit[col]
    }
  })

  if (Object.keys(updates).length === 0) {
    message.warning('没有修改的数据')
    return
  }

  // 立即清除该行的编辑状态
  clearRowEditState(rowIndex)

  emit('update', {
    primaryKey: props.primaryKey,
    primaryValue: row[props.primaryKey],
    updates,
  })
}

// 清除单行编辑状态
function clearRowEditState(rowIndex) {
  // 清除该行所有编辑中的单元格
  const keysToDelete = []
  editingCells.value.forEach((_, key) => {
    if (key.startsWith(`${rowIndex}_`)) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach((key) => editingCells.value.delete(key))

  // 从修改列表中移除
  modifiedRows.value.delete(rowIndex)
  rowEdits.value.delete(rowIndex)
}

// 取消行编辑
function handleCancelRow(rowIndex) {
  // 清除该行所有编辑状态
  clearRowEditState(rowIndex)

  emit('cancel', rowIndex)
}

// 删除行
function handleDeleteRow(rowIndex, row) {
  emit('delete', {
    primaryKey: props.primaryKey,
    primaryValue: row[props.primaryKey],
  })
}

// 行样式
function rowClassName(row, rowIndex) {
  return modifiedRows.value.has(rowIndex) ? 'modified-row' : ''
}

// 暴露数据供父组件使用
defineExpose({
  tableColumns,
  clearAllEditStates: () => {
    editingCells.value.clear()
    modifiedRows.value.clear()
    rowEdits.value.clear()
  },
})
</script>

<style scoped>
.table-data-editor {
  width: 100%;
  min-height: 250px;
}

:deep(.modified-row) {
  background-color: #fff3cd !important;
}

:deep(.n-data-table-td) {
  padding: 4px 6px !important;
  font-size: 12px;
}

:deep(.n-data-table-th) {
  padding: 6px 8px !important;
  font-size: 12px;
}

/* 横向滚动条样式 */
:deep(.n-data-table-wrapper) {
  overflow-x: auto !important;
}
</style>
