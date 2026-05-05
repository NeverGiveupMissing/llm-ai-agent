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

    <!-- 选择字段 -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">选择字段</div>
      <n-checkbox-group v-model:value="selectedFields">
        <n-space item-style="display: flex;">
          <n-checkbox
            v-for="field in tableFields"
            :key="field.column_name"
            :value="field.column_name"
            :label="`${field.column_name} (${field.data_type})`"
          />
        </n-space>
      </n-checkbox-group>
      <n-button text type="primary" size="small" @click="selectAllFields" style="margin-top: 8px;">
        全选
      </n-button>
    </div>

    <!-- WHERE 条件 -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">WHERE 条件</div>
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

    <!-- ORDER BY -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">ORDER BY</div>
      <n-space>
        <n-select
          v-model:value="orderByField"
          :options="fieldOptions"
          placeholder="选择排序字段"
          style="width: 180px"
        />
        <n-radio-group v-model:value="orderByDirection">
          <n-radio-button value="ASC">升序 (ASC)</n-radio-button>
          <n-radio-button value="DESC">降序 (DESC)</n-radio-button>
        </n-radio-group>
      </n-space>
    </div>

    <!-- LIMIT -->
    <div v-if="selectedTable">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">LIMIT</div>
      <n-input-number
        v-model:value="limitCount"
        :min="1"
        :max="10000"
        placeholder="限制返回行数"
        style="width: 200px"
      />
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
const selectedFields = ref([])
const tableFields = ref([])
const whereConditions = ref([{ field: '', operator: '=', value: '' }])
const orderByField = ref('')
const orderByDirection = ref('ASC')
const limitCount = ref(100)

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
      selectedFields.value = fields ? fields.map(f => f.column_name) : []
    } catch (error) {
      console.error('❌ 获取表结构失败:', error)
      tableFields.value = []
      selectedFields.value = []
    }
  } else {
    tableFields.value = []
    selectedFields.value = []
  }
})

// 生成 SQL 并发送
watch([selectedTable, selectedFields, whereConditions, orderByField, orderByDirection, limitCount], 
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

  // SELECT 字段
  const fields = selectedFields.value.length > 0 
    ? selectedFields.value.join(', ') 
    : '*'
  
  let sql = `SELECT ${fields}\nFROM ${selectedTable.value}`

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
  }

  // ORDER BY
  if (orderByField.value) {
    sql += `\nORDER BY ${orderByField.value} ${orderByDirection.value}`
  }

  // LIMIT
  if (limitCount.value) {
    sql += `\nLIMIT ${limitCount.value}`
  }

  sql += ';'
  emit('generate', sql)
}

function handleTableChange() {
  whereConditions.value = [{ field: '', operator: '=', value: '' }]
  orderByField.value = ''
}

function addWhereCondition() {
  whereConditions.value.push({ field: '', operator: '=', value: '' })
}

function removeWhereCondition(index) {
  if (whereConditions.value.length > 1) {
    whereConditions.value.splice(index, 1)
  }
}

function selectAllFields() {
  selectedFields.value = tableFields.value.map(f => f.column_name)
}
</script>
