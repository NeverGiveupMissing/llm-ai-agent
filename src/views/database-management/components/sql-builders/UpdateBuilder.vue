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

    <!-- SET 字段 -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">SET 字段（要更新的值）</div>
      <n-space vertical :size="8">
        <n-space v-for="(item, index) in setFields" :key="index" align="center">
          <n-select
            v-model:value="item.field"
            :options="fieldOptions"
            placeholder="字段"
            style="width: 180px"
          />
          <n-input
            v-model:value="item.value"
            placeholder="新值"
            style="width: 250px"
          />
          <n-button
            type="error"
            size="small"
            @click="removeSetField(index)"
            :disabled="setFields.length === 1"
          >
            删除
          </n-button>
        </n-space>
        <n-button type="primary" size="small" @click="addSetField">
          + 添加字段
        </n-button>
      </n-space>
    </div>

    <!-- WHERE 条件 -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">WHERE 条件（必填）</div>
      <n-alert type="error" style="margin-bottom: 12px;">
        ️ 更新操作必须指定 WHERE 条件，否则将更新全表数据！
      </n-alert>
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
const setFields = ref([{ field: '', value: '' }])
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
watch([selectedTable, setFields, whereConditions], 
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

  // SET 子句
  const validSetFields = setFields.value.filter(f => f.field && f.value !== '')
  if (validSetFields.length === 0) {
    emit('generate', '')
    return
  }

  const setClause = validSetFields
    .map(f => {
      const field = tableFields.value.find(tf => tf.column_name === f.field)
      // 判断是否为数字类型
      if (field && (field.data_type.includes('int') || field.data_type.includes('numeric') || field.data_type.includes('decimal'))) {
        return `${f.field} = ${f.value}`
      }
      return `${f.field} = '${f.value}'`
    })
    .join(',\n  ')

  let sql = `UPDATE ${selectedTable.value}\nSET ${setClause}`

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
    // 如果没有 WHERE 条件，不生成 SQL（防止全表更新）
    emit('generate', '-- ⚠️ 请添加 WHERE 条件以防止全表更新')
    return
  }

  sql += ';'
  emit('generate', sql)
}

function handleTableChange() {
  setFields.value = [{ field: '', value: '' }]
  whereConditions.value = [{ field: '', operator: '=', value: '' }]
}

function addSetField() {
  setFields.value.push({ field: '', value: '' })
}

function removeSetField(index) {
  if (setFields.value.length > 1) {
    setFields.value.splice(index, 1)
  }
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
