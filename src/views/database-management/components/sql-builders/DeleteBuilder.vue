<template>
  <n-space vertical :size="12">
    <!-- 选择表 -->
    <div>
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">选择表</div>
      <n-select
        v-model:value="selectedTable"
        :options="tableOptions"
        placeholder="请选择表"
        :loading="loading"
        filterable
        :menu-props="{ style: { maxHeight: '240px' } }"
        @update:value="handleTableChange"
      />
    </div>

    <!-- 警告提示 -->
    <n-alert type="error" v-if="selectedTable">
      ⚠️ 删除操作不可恢复，请谨慎操作！必须指定 WHERE 条件以防止误删全表数据。
    </n-alert>

    <!-- WHERE 条件 -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">WHERE 条件（必填）</div>
      <n-space vertical :size="8">
        <n-space v-for="(condition, index) in whereConditions" :key="index" align="center">
          <n-select
            v-model:value="condition.field"
            :options="fieldOptions"
            placeholder="字段"
            style="width: 180px"
          />
          <n-select
            v-model:value="condition.operator"
            :options="operatorOptions"
            placeholder="运算符"
            style="width: 100px"
          />
          <n-input
            v-model:value="condition.value"
            placeholder="值"
            style="width: 200px"
          />
          <n-button
            type="error"
            size="small"
            @click="removeWhereCondition(index)"
            :disabled="whereConditions.length === 1"
          >
            删除
          </n-button>
        </n-space>
        <n-button type="primary" size="small" @click="addWhereCondition">
          + 添加条件
        </n-button>
      </n-space>
    </div>

    <n-alert type="warning" v-if="selectedTable && tableFields.length === 0 && !loading">
      请先选择表，系统将自动加载字段列表
    </n-alert>
  </n-space>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  tables: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  getStructure: {
    type: Function,
    default: () => Promise.resolve([])
  }
})

const emit = defineEmits(['generate'])

// 状态
const selectedTable = ref('')
const tableFields = ref([])
const whereConditions = ref([{ field: '', operator: '=', value: '' }])

// 表选项
const tableOptions = computed(() => 
  props.tables.map(table => ({
    label: table,
    value: table
  }))
)

// 字段选项
const fieldOptions = computed(() =>
  tableFields.value.map(field => ({
    label: `${field.column_name} (${field.data_type})`,
    value: field.column_name
  }))
)

// 运算符选项
const operatorOptions = [
  { label: '=', value: '=' },
  { label: '!=', value: '!=' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' },
  { label: 'LIKE', value: 'LIKE' },
  { label: 'IN', value: 'IN' },
  { label: 'IS NULL', value: 'IS NULL' },
  { label: 'IS NOT NULL', value: 'IS NOT NULL' }
]

// 监听表变化，加载字段
watch(selectedTable, async (newTable) => {
  if (newTable) {
    console.log('📊 加载表结构:', newTable)
    try {
      const fields = await props.getStructure(newTable)
      console.log('✅ 获取到字段:', fields)
      tableFields.value = fields || []
    } catch (error) {
      console.error('❌ 获取表结构失败:', error)
      tableFields.value = []
    }
  } else {
    tableFields.value = []
  }
})

// 生成 SQL
watch([selectedTable, whereConditions], 
  () => {
    generateSQL()
  },
  { deep: true }
)

function generateSQL() {
  if (!selectedTable.value) {
    emit('generate', '')
    return
  }

  let sql = `DELETE FROM ${selectedTable.value}`

  // WHERE 条件
  const validConditions = whereConditions.value.filter(c => c.field && c.operator)
  if (validConditions.length > 0) {
    const whereClause = validConditions
      .map(c => {
        if (c.operator === 'IS NULL' || c.operator === 'IS NOT NULL') {
          return `${c.field} ${c.operator}`
        } else if (c.operator === 'IN') {
          const values = c.value.split(',').map(v => `'${v.trim()}'`).join(', ')
          return `${c.field} IN (${values})`
        } else if (c.operator === 'LIKE') {
          return `${c.field} LIKE '%${c.value}%'`
        } else {
          return `${c.field} ${c.operator} '${c.value}'`
        }
      })
      .join('\n  AND ')
    
    sql += `\nWHERE ${whereClause}`
  } else {
    // 如果没有 WHERE 条件，不生成 SQL（防止全表删除）
    emit('generate', '-- ⚠️ 请添加 WHERE 条件以防止删除全表数据')
    return
  }

  sql += ';'
  emit('generate', sql)
}

function handleTableChange() {
  whereConditions.value = [{ field: '', operator: '=', value: '' }]
}

function addWhereCondition() {
  whereConditions.value.push({ field: '', operator: '=', value: '' })
}

function removeWhereCondition(index) {
  if (whereConditions.value.length > 1) {
    whereConditions.value.splice(index, 1)
  }
}
</script>
