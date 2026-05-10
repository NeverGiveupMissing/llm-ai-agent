<template>
  <div class="menu-management-container">
    <!-- 搜索区域 -->
    <n-card :bordered="false" class="search-card" v-show="showSearch">
      <BaseForm
        ref="searchFormRef"
        v-model="searchForm"
        :fields="searchFields"
        inline
        :show-feedback="false"
        label-width="auto"
      >
        <template #actions>
          <CommonButton type="query" @click="handleSearchClick">搜索</CommonButton>
          <CommonButton type="reset" @click="handleResetClick">重置</CommonButton>
        </template>
      </BaseForm>
    </n-card>

    <!-- 表格区域 -->
    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :show-pagination="false"
      toolbar-title="菜单列表"
      row-key="menu_id"
      children-key="children"
      :expanded-row-keys="expandedRowKeys"
      show-search-toggle
      v-model:show-search="showSearch"
      @refresh="fetchData"
      @update:expanded-row-keys="handleExpandChange"
      @action-click="handleActionClick"
    >
      <!-- 工具栏左侧按钮 -->
      <template #toolbar-left>
        <CommonButton type="add" perms="system:menu:add" @click="handleAdd" />
        <CommonButton type="reset" :button-props="{ secondary: true }" @click="toggleExpand">
          {{ isExpanded ? '折叠' : '展开' }}
        </CommonButton>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <MenuFormModal
      :show="showFormModal"
      :row="currentRow"
      :menu-options="menuOptions"
      @update:show="showFormModal = $event"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup name="MenuManagement">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, useDialog, NTag } from 'naive-ui'
import BaseForm from '@/components/BaseForm/index.vue'
import MenuFormModal from './components/MenuFormModal.vue'
import { getMenuList, deleteMenu } from '@/api/menu'

const message = useMessage()
const dialog = useDialog()

// 搜索表单 ref
const searchFormRef = ref(null)

// 搜索区域显示/隐藏
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  menu_id: '',
  menu_name: '',
  menu_type: '',
  perms: '',
  status: '', // ✅ 空字符串而不是 null，确保字段始终传递
})

const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
]

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

// 搜索字段配置
const searchFields = [
  {
    key: 'menu_id',
    label: '菜单ID',
    type: 'input',
    placeholder: '请输入菜单ID',
    width: '160px',
  },
  {
    key: 'menu_name',
    label: '菜单名称',
    type: 'input',
    placeholder: '请输入菜单名称',
    width: '200px',
  },
  {
    key: 'menu_type',
    label: '菜单类型',
    type: 'select',
    placeholder: '请选择菜单类型',
    width: '140px',
    options: menuTypeOptions,
  },
  {
    key: 'perms',
    label: '权限标识',
    type: 'input',
    placeholder: '请输入权限标识',
    width: '200px',
  },
  {
    key: 'status',
    label: '菜单状态',
    type: 'select',
    placeholder: '请选择菜单状态',
    width: '140px',
    options: statusOptions,
  },
]

// 表格数据
const tableData = ref([])
const loading = ref(false)
const expandedRowKeys = ref([])
const isExpanded = ref(false)
const tableRef = ref(null)

// 菜单选项（用于上级菜单选择）
const menuOptions = ref([])

// 表单弹窗
const showFormModal = ref(false)
const currentRow = ref(null)

// 表格列配置
const columns = [
  {
    title: '菜单ID',
    key: 'menu_id',
    width: 100,
    align: 'center',
  },
  {
    title: '菜单类型',
    key: 'menu_type',
    width: 100,
    align: 'center',
    render: (row) => {
      const typeMap = {
        M: { text: '目录', type: 'info' },
        C: { text: '菜单', type: 'success' },
        F: { text: '按钮', type: 'warning' },
      }
      const config = typeMap[row.menu_type] || { text: row.menu_type, type: 'default' }
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.text })
    },
  },
  {
    title: '菜单名称',
    key: 'menu_name',
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: '图标',
    key: 'icon',
    width: 80,
    align: 'center',
    render: (row) => {
      if (!row.icon) return '-'
      return h('i', { class: row.icon, style: { fontSize: '18px' } })
    },
  },
  {
    title: '排序',
    key: 'order_num',
    width: 80,
    align: 'center',
  },
  {
    title: '权限标识',
    key: 'perms',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row) => row.perms || '-',
  },
  {
    title: '组件路径',
    key: 'component',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => row.component || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    align: 'center',
    render: (row) => {
      const config =
        row.status === '0' ? { text: '正常', type: 'success' } : { text: '停用', type: 'error' }
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.text })
    },
  },
  {
    title: '创建时间',
    key: 'create_time',
    width: 180,
    render: (row) => {
      if (!row.create_time) return ''
      const date = new Date(row.create_time)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    type: 'actions',
    align: 'center',
    actionsWidth: 100, // ✅ 明确指定操作列宽度
    fixed: 'right',
    // ✅ 不再手动定义 actions，由 BaseTable 根据数据库权限动态生成
  },
]

// 搜索
const handleSearchClick = () => {
  // ✅ 直接使用页面的 searchForm 进行搜索
  fetchData()
}

// 重置
const handleResetClick = () => {
  searchForm.menu_id = ''
  searchForm.menu_name = ''
  searchForm.menu_type = ''
  searchForm.perms = ''
  searchForm.status = '' // ✅ 重置为空字符串而不是 null
  fetchData()
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMenuList(searchForm)
    const data = res.data || res || []
    tableData.value = data

    // 构建菜单选项（用于上级菜单选择）
    menuOptions.value = buildMenuOptions(data)
  } catch (error) {
    message.error(error.message || '获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 构建菜单选项（树形结构）
const buildMenuOptions = (menus) => {
  const options = [{ menu_id: 0, menu_name: '主类目', children: [] }]

  const convert = (items) => {
    return items.map((item) => {
      const node = {
        menu_id: item.menu_id,
        menu_name: item.menu_name,
        perms: item.perms || '',
        path: item.path || '',
        disabled: item.menu_type === 'F',
      }

      if (item.children && item.children.length > 0) {
        node.children = convert(item.children)
      }

      return node
    })
  }

  options[0].children = convert(menus)
  return options
}

// 展开/折叠所有
const toggleExpand = () => {
  if (isExpanded.value) {
    expandedRowKeys.value = []
    isExpanded.value = false
  } else {
    const getAllKeys = (data) => {
      let keys = []
      for (const item of data) {
        if (item.children && item.children.length > 0) {
          keys.push(item.menu_id)
          keys = keys.concat(getAllKeys(item.children))
        }
      }
      return keys
    }
    expandedRowKeys.value = getAllKeys(tableData.value)
    isExpanded.value = true
  }
}

// 处理展开变化
const handleExpandChange = (keys) => {
  expandedRowKeys.value = keys
  isExpanded.value = keys.length > 0
}

// 新增
const handleAdd = () => {
  currentRow.value = null
  showFormModal.value = true
}

// 编辑
const handleEdit = (row) => {
  currentRow.value = row
  showFormModal.value = true
}

// 新增子菜单
const handleAddChild = (row) => {
  // 传递父菜单信息，由子组件处理
  currentRow.value = {
    parent_id: row.menu_id,
    parent_menu_type: row.menu_type,
  }
  showFormModal.value = true
}

// 删除（CommonButton 已内置二次确认）
const handleDelete = async (row) => {
  try {
    await deleteMenu(row.menu_id)
    message.success('删除成功')
    fetchData()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

// 表单提交成功回调
const handleFormSuccess = () => {
  showFormModal.value = false
  fetchData()
}

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  // ✅ 兼容多种权限后缀命名
  if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (perms.endsWith(':add') || perms.endsWith(':create')) {
    handleAddChild(row)
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除菜单「${row.menu_name}」吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteMenu(row.menu_id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.search-card {
  margin-bottom: 12px;
}

.table-card {
  margin-bottom: 12px;
}

/* ✅ 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-content {
  overflow-x: auto;
}

/* 若依风格操作链接 */
.action-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  transition: opacity 0.2s;
}

.action-link:hover {
  opacity: 0.8;
}
</style>
