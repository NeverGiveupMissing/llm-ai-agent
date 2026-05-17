<!-- 
/**
 * BaseForm 公共表单组件
 * @description 基于 Naive UI NForm 封装的通用表单组件，支持动态字段配置、多种表单类型、内联/网格布局等
 * @author System
 * @date 2026-05-13
 * 
 * ✅ Loading 状态管理规范：
 * - 项目已配置全局 Loading（路由守卫/请求拦截器），默认无需手动处理 loading
 * - 本组件为纯 UI 表单渲染组件，不包含 loading 状态逻辑
 * - 表单提交时的 loading 控制应由调用方（如弹窗/页面）通过全局 loading 或按钮级 loading 实现
 */
-->
<template>
  <n-form
    ref="formRef"
    :model="modelValue"
    :rules="mergedRules"
    :label-width="labelWidth"
    :label-placement="labelPlacement"
    :disabled="disabled"
    :size="size"
    :inline="inline"
    :show-feedback="showFeedback"
  >
    <!-- inline 模式：使用 Grid 布局（非 Flex）实现一行排列自然换行 -->
    <template v-if="inline">
      <div class="form-grid-layout">
        <!-- ✅ 方式1：如果传入了 fields，使用 fields 渲染 -->
        <template v-if="fields && fields.length > 0">
          <n-form-item
            v-for="field in visibleFields"
            :key="field.key"
            :path="field.key"
            :style="{ width: field.width || 'auto', minWidth: '180px' }"
          >
            <template #label>
              <span v-if="!field.helpContent">{{ field.label }}</span>
              <div v-else style="display: inline-flex; align-items: center; white-space: nowrap">
                <FieldHelp
                  :content="field.helpContent"
                  :size="field.helpSize || 14"
                  style="margin-right: 4px"
                />
                <span>{{ field.label }}</span>
              </div>
            </template>
            <!-- radio -->
            <n-radio-group
              v-if="field.type === 'radio'"
              v-model:value="modelValue[field.key]"
              :disabled="getDisabled(field)"
            >
              <n-space>
                <n-radio v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </n-radio>
              </n-space>
            </n-radio-group>

            <!-- checkbox -->
            <n-checkbox-group
              v-else-if="field.type === 'checkbox'"
              v-model:value="modelValue[field.key]"
              :disabled="getDisabled(field)"
            >
              <n-space>
                <n-checkbox
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </n-checkbox>
              </n-space>
            </n-checkbox-group>

            <!-- switch with slots -->
            <n-switch
              v-else-if="field.type === 'switch'"
              v-model:value="modelValue[field.key]"
              :checked-value="field.checkedValue"
              :unchecked-value="field.uncheckedValue"
              :disabled="getDisabled(field)"
            >
              <template #checked>{{ field.checkedText }}</template>
              <template #unchecked>{{ field.uncheckedText }}</template>
            </n-switch>

            <!-- custom slot -->
            <slot
              v-else-if="field.type === 'custom'"
              :name="`field-${field.key}`"
              :field="field"
              :form-data="modelValue"
            />

            <!-- 其他类型使用动态组件 -->
            <component
              v-else
              :is="getComponent(field.type)"
              v-model:value="modelValue[field.key]"
              v-bind="getFieldProps(field)"
            />
          </n-form-item>
        </template>

        <!-- ✅ 方式2：如果有插槽，使用插槽内容（如 BaseTable 传递的搜索表单） -->
        <slot v-else name="search" />

        <!-- ✅ 按钮区域：查询/重置始终显示，数据库动态按钮可选 -->
        <n-form-item label="" class="action-buttons">
          <CommonButton type="query" @click="emit('search')">查询</CommonButton>
          <CommonButton type="reset" @click="emit('reset')">重置</CommonButton>
          <!-- 数据库动态搜索区按钮（可选） -->
          <CommonButton
            v-for="action in searchActions"
            :key="action.permission"
            :type="action.type"
            :text="action.label"
            perms="action.permission"
            @click="action.onClick(null)"
          />
        </n-form-item>
      </div>
    </template>

    <!-- 网格模式：使用 n-grid -->
    <template v-else>
      <n-grid :cols="cols" :x-gap="12" :y-gap="0">
        <n-form-item-gi
          v-for="field in visibleFields"
          :key="field.key"
          :span="field.span || 1"
          :path="field.key"
        >
          <template #label>
            <span v-if="!field.helpContent">{{ field.label }}</span>
            <div v-else style="display: inline-flex; align-items: center; white-space: nowrap">
              <FieldHelp
                :content="field.helpContent"
                :size="field.helpSize || 14"
                style="margin-right: 4px"
              />
              <span>{{ field.label }}</span>
            </div>
          </template>
          <!-- radio -->
          <n-radio-group
            v-if="field.type === 'radio'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-radio v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>

          <!-- checkbox -->
          <n-checkbox-group
            v-else-if="field.type === 'checkbox'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-checkbox v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-checkbox>
            </n-space>
          </n-checkbox-group>

          <!-- switch with slots -->
          <n-switch
            v-else-if="field.type === 'switch'"
            v-model:value="modelValue[field.key]"
            :checked-value="field.checkedValue"
            :unchecked-value="field.uncheckedValue"
            :disabled="getDisabled(field)"
          >
            <template #checked>{{ field.checkedText }}</template>
            <template #unchecked>{{ field.uncheckedText }}</template>
          </n-switch>

          <!-- custom slot -->
          <slot
            v-else-if="field.type === 'custom'"
            :name="`field-${field.key}`"
            :field="field"
            :form-data="modelValue"
          />

          <!-- 其他类型使用动态组件 -->
          <component
            v-else
            :is="getComponent(field.type)"
            v-model:value="modelValue[field.key]"
            v-bind="getFieldProps(field)"
          />
        </n-form-item-gi>

        <!-- 按钮区域插槽（占据整行） -->
        <n-form-item-gi v-if="$slots.actions" :span="cols">
          <slot name="actions" />
        </n-form-item-gi>
      </n-grid>
    </template>
  </n-form>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  NInput,
  NInputNumber,
  NSelect,
  NRadioGroup,
  NRadio,
  NSpace,
  NCheckboxGroup,
  NCheckbox,
  NSwitch,
  NDatePicker,
  NTreeSelect,
  NFormItem,
} from 'naive-ui'
import FieldHelp from '@/components/FieldHelp/index.vue'
import IconPicker from '@/components/IconPicker/index.vue'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  rules: { type: Object, default: () => ({}) },
  labelWidth: { type: String, default: '80px' },
  labelPlacement: { type: String, default: 'left' },
  cols: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'medium' },
  inline: { type: Boolean, default: false },
  showFeedback: { type: Boolean, default: true },
  // ✅ 数据库动态搜索区按钮（show_location === '2'）
  searchActions: { type: Array, default: () => [] },
})

const emit = defineEmits(['search', 'reset'])

// 过滤隐藏字段
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    // 支持 show 函数
    if (typeof field.show === 'function') {
      return field.show(props.modelValue)
    }
    // 支持 hidden 函数
    if (typeof field.hidden === 'function') {
      return !field.hidden(props.modelValue)
    }
    // 支持 show 布尔值
    if (field.show !== undefined) {
      return field.show
    }
    // 支持 hidden 布尔值
    return !field.hidden
  })
})

// 获取禁用状态
const getDisabled = (field) => {
  if (props.disabled) return true
  if (typeof field.disabled === 'function') {
    return field.disabled(props.modelValue)
  }
  return !!field.disabled
}

// 自动生成必填规则
const mergedRules = computed(() => {
  const rules = { ...props.rules }
  props.fields.forEach((field) => {
    if (field.required && !rules[field.key]) {
      rules[field.key] = {
        required: true,
        message: `请${
          ['select', 'radio', 'checkbox', 'tree-select'].includes(field.type) ? '选择' : '输入'
        }${field.label}`,
        trigger: ['select', 'radio', 'checkbox'].includes(field.type) ? 'change' : 'blur',
      }
    }
    if (field.rules) {
      rules[field.key] = field.rules
    }
  })
  return rules
})

// 暴露验证方法
const formRef = ref(null)
defineExpose({
  validate: () => formRef.value?.validate(),
  restoreValidation: () => formRef.value?.restoreValidation(),
})

/**
 * 获取组件
 */
const getComponent = (type) => {
  const componentMap = {
    input: NInput,
    password: NInput,
    textarea: NInput,
    number: NInputNumber,
    'input-number': NInputNumber, // ✅ 兼容两种写法
    select: NSelect,
    radio: NRadioGroup,
    checkbox: NCheckboxGroup,
    switch: NSwitch,
    date: NDatePicker,
    datetime: NDatePicker,
    'date-range': NDatePicker,
    'tree-select': NTreeSelect,
    'icon-picker': IconPicker, // ✅ 新增图标选择器
  }
  return componentMap[type] || NInput
}

/**
 * 获取字段属性
 */
const getFieldProps = (field) => {
  const baseProps = {
    placeholder:
      field.placeholder ||
      `请${['select', 'radio', 'checkbox', 'tree-select'].includes(field.type) ? '选择' : '输入'}${field.label}`,
    disabled: getDisabled(field),
    clearable: field.clearable !== false,
  }

  // 根据类型添加特定属性
  switch (field.type) {
    case 'password':
      return {
        ...baseProps,
        type: 'password',
        showPasswordOn: 'click',
        maxlength: field.maxlength,
      }
    case 'textarea':
      return {
        ...baseProps,
        type: 'textarea',
        rows: field.rows || 3,
        showCount: field.showCount,
        maxlength: field.maxlength,
      }
    case 'number':
      return {
        ...baseProps,
        style: { width: '100%' },
      }
    case 'select':
    case 'tree-select':
      return {
        ...baseProps,
        options: field.options,
        placeholder: baseProps.placeholder,
        clearable: field.clearable !== false,
        // ✅ 透传多选、可搜索等属性
        multiple: field.multiple,
        filterable: field.filterable,
        // ✅ 透传 tree-select 专用属性
        labelField: field.labelField,
        keyField: field.keyField,
        childrenField: field.childrenField,
      }
    case 'radio':
      return {
        ...baseProps,
      }
    case 'checkbox':
      return {
        ...baseProps,
      }
    case 'switch':
      return {
        ...baseProps,
        checkedValue: field.checkedValue,
        uncheckedValue: field.uncheckedValue,
      }
    case 'date':
      return {
        ...baseProps,
        type: 'date',
        style: { width: '100%' },
      }
    case 'datetime':
      return {
        ...baseProps,
        type: 'datetime',
        style: { width: '100%' },
      }
    case 'date-range':
      return {
        ...baseProps,
        type: 'datetimerange', // ✅ 支持选择时分秒
        startPlaceholder: '开始日期时间',
        endPlaceholder: '结束日期时间',
        style: { width: '100%' },
      }
    case 'icon-picker':
      return {
        ...baseProps,
        placeholder: field.placeholder || '请选择图标',
        iconList: field.iconList, // ✅ 支持自定义图标列表
      }
    default:
      return {
        ...baseProps,
        maxlength: field.maxlength,
      }
  }
}
</script>

<style scoped>
/* ✅ 覆盖 Naive UI 默认 inline 模式的 flex 布局 */
.n-form.n-form--inline {
  display: block !important;
}

.form-grid-layout {
  overflow: hidden; /* 清除浮动 */
}

.form-grid-layout > .n-form-item {
  float: left;
  margin-right: 8px;
  margin-bottom: 8px;
  display: inline-grid !important;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 8px;
  width: auto !important;
  min-width: auto !important;
  min-width: 70px !important;
}

/* ✅ 调整 label 样式 */
.form-grid-layout > .n-form-item .n-form-item-label {
  white-space: nowrap;
  min-width: fit-content;
}

/* ✅ 输入框根据内容自适应 */
.form-grid-layout > .n-form-item :deep(.n-input),
.form-grid-layout > .n-form-item :deep(.n-select),
.form-grid-layout > .n-form-item :deep(.n-date-picker) {
  width: auto !important;
  min-width: 120px; /* 最小宽度 120px */
}

/* ✅ 特殊处理：下拉框的下拉框需要更宽 */
.form-grid-layout > .n-form-item :deep(.n-base-selection),
.form-grid-layout > .n-form-item :deep(.n-select) {
  min-width: 150px;
}
</style>
