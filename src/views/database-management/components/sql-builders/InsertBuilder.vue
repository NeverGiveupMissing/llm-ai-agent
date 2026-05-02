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

    <!-- 字段输入区 -->
    <div v-if="selectedTable && tableFields.length > 0">
      <div style="font-weight: 500; margin-bottom: 6px; font-size: 13px;">字段值</div>
      <n-space vertical :size="12">
        <n-space
          v-for="field in tableFields"
          :key="field.column_name"
          align="center"
          :wrap="false"
        >
          <n-text strong style="width: 180px; flex-shrink: 0;">
            {{ field.column_name }}
            <n-tag size="small" type="info" style="margin-left: 8px;">
              {{ field.data_type }}
            </n-tag>
            <n-tag
              v-if="field.is_nullable === 'NO'"
              size="small"
              type="error"
              style="margin-left: 4px;"
            >
              必填
            </n-tag>
          </n-text>
          <n-input
            v-model:value="fieldValues[field.column_name]"
            :placeholder="`请输入 ${field.column_name} 的值`"
            style="flex: 1;"
          />
        </n-space>
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
const fieldValues = ref({})

// 表选项
const tableOptions = computed(() => 
  props.tables.map(table => ({
    label: table,
    value: table
  }))
)

// 监听表变化，加载字段
watch(selectedTable, async (newTable) => {
  if (newTable) {
    console.log('📊 加载表结构:', newTable)
    try {
      const fields = await props.getStructure(newTable)
      console.log('✅ 获取到字段:', fields)
      tableFields.value = fields || []
      // 初始化字段值
      fieldValues.value = {}
      if (fields) {
        fields.forEach(field => {
          fieldValues.value[field.column_name] = ''
        })
      }
    } catch (error) {
      console.error('❌ 获取表结构失败:', error)
      tableFields.value = []
      fieldValues.value = {}
    }
  } else {
    tableFields.value = []
    fieldValues.value = {}
  }
})

// 生成 SQL
watch([selectedTable, fieldValues], 
  () => {
    generateSQL()
  },
  { deep: true }
)

function generateSQL() {
  if (!selectedTable.value || tableFields.value.length === 0) {
    emit('generate', '')
    return
  }

  // 过滤有值的字段
  const validFields = tableFields.value.filter(
    field => fieldValues.value[field.column_name] !== ''
  )

  if (validFields.length === 0) {
    emit('generate', '')
    return
  }

  const columns = validFields.map(f => f.column_name).join(', ')
  const values = validFields
    .map(f => {
      const value = fieldValues.value[f.column_name]
      // 判断是否为数字类型
      if (f.data_type.includes('int') || f.data_type.includes('numeric') || f.data_type.includes('decimal')) {
        return value
      }
      return `'${value}'`
    })
    .join(', ')

  const sql = `INSERT INTO ${selectedTable.value} (${columns})\nVALUES (${values});`
  emit('generate', sql)
}

function handleTableChange() {
  fieldValues.value = {}
}
</script>
