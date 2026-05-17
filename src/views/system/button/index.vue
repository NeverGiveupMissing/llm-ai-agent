<template>
  <div class="button-management-container">
    <!-- ✅ 完全由 BaseTable 控制搜索区域和工具栏按钮 -->
    <BaseTable
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :checkable="true"
      toolbar-title="权限按钮列表"
      row-key="button_id"
      show-search-toggle
      v-model:show-search="showSearch"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @selection-change="handleSelectionChange"
      @refresh="fetchData"
      @action-click="handleActionClick"
      @search="handleSearchClick"
      @reset="handleResetClick"
    >
      <!-- ✅ 搜索表单（由 BaseTable 内部的 BaseForm 渲染） -->
      <template #search>
        <BaseForm
          ref="searchFormRef"
          v-model="searchForm"
          :fields="searchFields"
          inline
          :show-feedback="false"
          label-width="auto"
          @search="handleSearchClick"
          @reset="handleResetClick"
        />
      </template>
    </BaseTable>

    <!-- 弹窗组件 -->
    <ButtonFormModal
      v-model:show="showFormModal"
      :row="currentRow"
      :menu-options="menuOptions"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup name="ButtonManagement">
/**
 * 权限按钮管理页面
 * @description 管理 sys_button 表中的按钮权限数据，支持增删改查、批量删除
 * @author System
 * @date 2026-05-13
 */
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useMessage, useDialog, NSpace, NTag } from 'naive-ui'
import { useTable } from '@/components/BaseTable/useTable'
import { getButtonList, deleteButton, batchDeleteButtons } from '@/api/button'
import { getMenuList } from '@/api/menu'
import ButtonFormModal from './components/ButtonFormModal.vue'

const message = useMessage()
const dialog = useDialog()

// 搜索表单 ref
const searchFormRef = ref(null)

// 显示/隐藏搜索区域
const showSearch = ref(true)

// 搜索表单
const searchForm = reactive({
  button_name: '',
  parent_id: null, // ✅ tree-select 值为数字类型，初始为 null
  perms: '',
  status: null, // ✅ 下拉框初始值为 null，确保显示 placeholder
  show_location: null, // ✅ 展现位置初始值为 null，确保显示 placeholder
})

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

// 展现位置选项
const locationOptions = [
  { label: '工具栏', value: '0' },
  { label: '行内', value: '1' },
  { label: '搜索', value: '2' },
  { label: '隐藏', value: '3' },
]

// 菜单选项（用于所属菜单选择）
const menuOptions = ref([])

// 搜索字段配置
const searchFields = ref([
  {
    key: 'button_name',
    label: '按钮名称',
    type: 'input',
    placeholder: '请输入按钮名称',
    width: '180px',
  },
  {
    key: 'parent_id',
    label: '所属菜单',
    type: 'tree-select',
    placeholder: '请选择所属菜单',
    width: '200px',
    options: [], // ✅ 初始为空，由 loadMenuOptions 异步更新
    // ✅ Naive UI NTreeSelect 字段映射（首字母大写）
    labelField: 'label',
    keyField: 'value',
    childrenField: 'children',
    filterable: true,
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
    label: '状态',
    type: 'select',
    placeholder: '请选择状态',
    width: '120px',
    options: statusOptions,
  },
  {
    key: 'show_location',
    label: '展现位置',
    type: 'select',
    placeholder: '请选择展现位置',
    width: '140px',
    options: locationOptions,
  },
])

// 使用 useTable 组合式函数
const {
  tableData,
  pagination,
  selectedKeys,
  selectedRows,
  fetchData,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange,
} = useTable(getButtonList)

// 表格列配置
const columns = [
  {
    title: '按钮ID',
    key: 'button_id',
    width: 100,
    align: 'center',
  },
  {
    title: '按钮名称',
    key: 'button_name',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '所属菜单',
    key: 'parent_menu_name',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.parent_menu_name || '-',
  },
  {
    title: '权限标识',
    key: 'perms',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row) => row.perms || '-',
  },
  {
    title: '展现位置',
    key: 'show_location',
    width: 150,
    align: 'center',
    render: (row) => {
      const loc = row.show_location || ''
      const locationMap = {
        0: { text: '工具栏', type: 'success' },
        1: { text: '行内', type: 'info' },
        2: { text: '搜索', type: 'warning' },
        3: { text: '隐藏', type: 'default' },
      }

      // 支持多选逗号分隔（如 "0,1"）
      if (!loc) return h('span', '-')

      const locations = loc.split(',').filter(Boolean)
      return h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            locations
              .map((l) => {
                const config = locationMap[l]
                return config
                  ? h(NTag, { type: config.type, size: 'small' }, { default: () => config.text })
                  : null
              })
              .filter(Boolean),
        },
      )
    },
  },
  {
    title: '排序',
    key: 'order_num',
    width: 80,
    align: 'center',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    align: 'center',
    type: 'tag',
    tagMap: {
      0: { text: '正常', type: 'success' },
      1: { text: '停用', type: 'error' },
    },
  },
  {
    title: '备注',
    key: 'remark',
    minWidth: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.remark || '-',
  },
  {
    title: '创建时间',
    key: 'create_time',
    type: 'datetime',
    width: 180,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    title: '操作',
    key: 'actions',
    type: 'actions',
    align: 'center',
    actionsWidth: 100,
    fixed: 'right',
  },
]

// 搜索点击
const handleSearchClick = () => {
  // ✅ 只传递有实际值的字段，避免空字符串干扰后端查询
  const searchParams = {}

  if (searchForm.button_name) searchParams.button_name = searchForm.button_name
  // ✅ 确保 parent_id 是数字类型（PostgreSQL 类型匹配）
  if (searchForm.parent_id !== null && searchForm.parent_id !== '') {
    searchParams.parent_id = Number(searchForm.parent_id)
  }
  if (searchForm.perms) searchParams.perms = searchForm.perms
  if (searchForm.status) searchParams.status = searchForm.status
  if (searchForm.show_location) searchParams.show_location = searchForm.show_location

  console.log('[ButtonManagement] 搜索参数:', searchParams)
  handleSearch(searchParams)
}

// 重置点击
const handleResetClick = () => {
  searchForm.button_name = ''
  searchForm.parent_id = null // ✅ 重置为 null，与 tree-select 类型一致
  searchForm.perms = ''
  searchForm.status = ''
  searchForm.show_location = ''
  handleReset()
}

// 弹窗状态
const showFormModal = ref(false)
const currentRow = ref(null)

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

// 批量删除（CommonButton 已内置二次确认）
const handleBatchDelete = async () => {
  try {
    // 将字符串ID转换为数字类型
    const numericIds = selectedKeys.value.map((id) => Number(id))
    await batchDeleteButtons(numericIds)
    message.success('批量删除成功')
    fetchData()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

// 表单提交成功
const handleFormSuccess = () => {
  // ✅ 弹窗内部已处理 API 调用和提示，这里仅刷新列表
  fetchData()
}

// ✅ 统一处理动态按钮点击
const handleActionClick = ({ perms, row }) => {
  // ✅ 兼容多种权限后缀命名
  if (perms.endsWith(':add') || perms.endsWith(':create')) {
    handleAdd()
  } else if (perms.endsWith(':edit') || perms.endsWith(':update')) {
    handleEdit(row)
  } else if (perms.endsWith(':export')) {
    // 按钮管理暂时不支持导出（可选）
    message.info('导出功能开发中...')
  } else if (perms.endsWith(':remove') || perms.endsWith(':delete')) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除按钮「${row.button_name}」吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteButton(row.button_id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }
}

// 加载菜单选项
const loadMenuOptions = async () => {
  try {
    const res = await getMenuList()
    const menus = res.data || res || []

    console.log('[ButtonManagement] 加载菜单数据:', menus)

    // 构建菜单选项（只展示目录和菜单类型）
    const buildOptions = (items) => {
      return items.map((item) => {
        const node = {
          label: item.menu_name,
          value: item.menu_id,
          disabled: item.menu_type === 'F', // 禁用按钮类型
        }
        if (item.children && item.children.length > 0) {
          node.children = buildOptions(item.children)
        }
        return node
      })
    }

    const builtOptions = [{ label: '主类目', value: 0, children: buildOptions(menus) }]
    menuOptions.value = builtOptions

    // ✅ 直接更新 searchFields 中的 options 引用
    const parentIdField = searchFields.value.find((f) => f.key === 'parent_id')
    if (parentIdField) {
      parentIdField.options = builtOptions
    }

    console.log('[ButtonManagement] 菜单选项构建完成:', menuOptions.value)
  } catch (error) {
    console.error('加载菜单选项失败:', error)
  }
}

// 初始化
onMounted(() => {
  loadMenuOptions()
  // 不需要手动调用 fetchData()，useTable 的 onMounted 会自动调用
})
</script>

<style scoped>
.search-card {
  margin-bottom: 12px;
}

:deep(.base-table-wrapper) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.n-data-table-td) {
  padding: 8px 12px !important;
}
</style>
